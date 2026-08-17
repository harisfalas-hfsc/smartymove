import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";
import { isAdminEmail } from "@/lib/admin";
import { FREE_ACCESS_BLOCK_MESSAGE, isFreeAccessMode } from "@/lib/free-access.server";

export const SCAN_PRICE_ID = "smartymove_scan_single";
export const SCAN_PRICE_EUR = 9.99;

type ScanAccessResult = {
  credits: number;
  scansPurchased: number;
  hasActiveSubscription: boolean;
  canScan: boolean;
};

type CheckoutResult = { clientSecret: string } | { error: string };
type ConsumeResult = { ok: boolean; credits: number; error?: string };

/**
 * Resolve the signed-in user's email. `claims.email` is populated by the
 * Supabase Auth JWT most of the time, but not on every provider / project
 * config. Fall back to the `profiles.email` row so admin bypass keeps
 * working regardless of how the token was minted.
 */
async function resolveEmail(
  supabase: any,
  claims: any,
  userId: string,
): Promise<string | undefined> {
  const claimEmail = claims?.email as string | undefined;
  if (claimEmail) return claimEmail;
  try {
    const { data } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
    return (data as any)?.email as string | undefined;
  } catch {
    return undefined;
  }
}

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

export const getScanAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ScanAccessResult> => {
    const { supabase, userId } = context;
    const email = await resolveEmail(supabase, context.claims, userId);
    // Global Free Access Mode: unlimited access granted in memory only.
    if (await isFreeAccessMode()) {
      return { credits: 9999, scansPurchased: 0, hasActiveSubscription: true, canScan: true };
    }
    if (isAdminEmail(email)) {
      return { credits: 9999, scansPurchased: 0, hasActiveSubscription: true, canScan: true };
    }
    const [{ data: profile }, { data: subs }] = await Promise.all([
      supabase.from("profiles").select("scan_credits,scans_purchased").eq("id", userId).maybeSingle(),
      supabase
        .from("subscriptions")
        .select("status,current_period_end")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);
    const credits = Number((profile as any)?.scan_credits ?? 0);
    const scansPurchased = Number((profile as any)?.scans_purchased ?? 0);
    const now = Date.now();
    // Strict pay-per-scan: access is based on credits only. Legacy monthly
    // subscribers no longer get unlimited scans — every scan consumes one credit.
    const hasActiveSubscription = !!(subs as any[])?.some((s) => {
      const future = !s.current_period_end || new Date(s.current_period_end).getTime() > now;
      if (["active", "trialing", "past_due"].includes(s.status) && future) return true;
      if (s.status === "canceled" && future) return true;
      return false;
    });
    return {
      credits,
      scansPurchased,
      hasActiveSubscription,
      canScan: credits > 0,
    };
  });

export const consumeScanCredit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConsumeResult> => {
    const { supabase, userId } = context;
    const email = await resolveEmail(supabase, context.claims, userId);
    // Global Free Access Mode: never consume a credit, never write.
    if (await isFreeAccessMode()) {
      return { ok: true, credits: 9999 };
    }
    if (isAdminEmail(email)) {
      return { ok: true, credits: 9999 };
    }
    const { data, error } = await (supabase as any).rpc("consume_scan_credit", { _user_id: userId });
    if (error) return { ok: false, credits: 0, error: error.message };
    const { data: profile } = await supabase.from("profiles").select("scan_credits").eq("id", userId).maybeSingle();
    return { ok: !!data, credits: Number((profile as any)?.scan_credits ?? 0) };
  });

export const createScanCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl: string; environment: StripeEnv; email?: string }) => data)
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    try {
      // Global Free Access Mode: no checkout may be created on any platform.
      if (await isFreeAccessMode()) {
        return { error: FREE_ACCESS_BLOCK_MESSAGE };
      }
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: [SCAN_PRICE_ID] });
      if (!prices.data.length) throw new Error("Scan price not found in Stripe");
      const price = prices.data[0];
      const productId = typeof price.product === "string" ? price.product : price.product.id;
      const product = await stripe.products.retrieve(productId);
      const customerId = await resolveOrCreateCustomer(stripe, {
        email: data.email,
        userId: context.userId,
      });
      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        metadata: {
          userId: context.userId,
          type: "scan_pack",
          credits: "1",
        },
        payment_intent_data: {
          description: product.name,
          metadata: {
            userId: context.userId,
            type: "scan_pack",
            credits: "1",
          },
        },
      } as any);
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });