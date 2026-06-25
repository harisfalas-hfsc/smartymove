import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

type CheckoutResult = { clientSecret: string } | { error: string };
type PortalResult = { url: string } | { error: string };
type CancelSubscriptionResult = { ok: true; currentPeriodEnd: string | null } | { error: string };

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

async function resolveExistingCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string | null; userId?: string },
): Promise<string | null> {
  if (options.userId && /^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    const found = await stripe.customers.search({ query: `metadata['userId']:'${options.userId}'`, limit: 1 });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) return existing.data[0].id;
  }
  return null;
}

export const createPremiumCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl: string; environment: StripeEnv; email?: string }) => data)
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    try {
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: ["smartymove_premium_monthly"] });
      if (!prices.data.length) throw new Error("Price not found");
      const price = prices.data[0];
      const customerId = await resolveOrCreateCustomer(stripe, { email: data.email, userId: context.userId });
      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        metadata: { userId: context.userId },
        subscription_data: { metadata: { userId: context.userId } },
      } as any);
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const createBillingPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PortalResult> => {
    const { supabase, userId } = context;
    const [{ data: sub }, { data: profile }] = await Promise.all([
      supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
      supabase.from("profiles").select("email").eq("id", userId).maybeSingle(),
    ]);
    try {
      const stripe = createStripeClient(data.environment);
      const customerId = sub?.stripe_customer_id as string | undefined ?? await resolveExistingCustomer(stripe, {
        userId,
        email: profile?.email as string | null | undefined,
      });
      if (!customerId) return { error: "No billing account found yet. If you just subscribed, wait a few seconds and try again." };
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        ...(data.returnUrl && { return_url: data.returnUrl }),
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const cancelPremiumSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<CancelSubscriptionResult> => {
    const { supabase, userId } = context;
    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("id,stripe_subscription_id,status,current_period_end")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subError) return { error: subError.message };
    if (!sub?.stripe_subscription_id) return { error: "No active billing subscription found." };
    if (["canceled", "incomplete_expired", "unpaid"].includes(sub.status as string)) {
      return { ok: true, currentPeriodEnd: (sub.current_period_end as string | null) ?? null };
    }

    try {
      const stripe = createStripeClient(data.environment);
      const updated = await stripe.subscriptions.update(sub.stripe_subscription_id as string, { cancel_at_period_end: true });
      const updatedSubscription = updated as any;
      const rawPeriodEnd = updatedSubscription.current_period_end ?? updatedSubscription.items?.data?.[0]?.current_period_end;
      const periodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000).toISOString() : (sub.current_period_end as string | null) ?? null;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("subscriptions")
        .update({ cancel_at_period_end: true, current_period_end: periodEnd, status: updated.status, updated_at: new Date().toISOString() })
        .eq("id", sub.id as string);
      return { ok: true, currentPeriodEnd: periodEnd };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });