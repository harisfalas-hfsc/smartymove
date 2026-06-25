import { createServerFn } from "@tanstack/react-start";
import type Stripe from "stripe";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

type CheckoutResult = { clientSecret: string } | { error: string };
type PortalResult = { url: string } | { error: string };
type CancelSubscriptionResult = { ok: true; currentPeriodEnd: string | null } | { error: string };
type EmbeddedCheckoutSessionParams = Stripe.Checkout.SessionCreateParams & {
  ui_mode: "embedded_page";
};
type StripeSubscriptionWithPeriod = {
  id?: string;
  status?: string;
  current_period_end?: number | null;
  items?: { data?: Array<{ current_period_end?: number | null }> };
};

const BILLING_MANAGED_STATUSES = ["active", "trialing", "past_due", "incomplete"];

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
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) return existing.data[0].id;
  }
  return null;
}

async function ensureBillingPortalConfiguration(stripe: ReturnType<typeof createStripeClient>) {
  const configurations = await stripe.billingPortal.configurations.list({ active: true, limit: 1 });
  if (configurations.data.length) return configurations.data[0].id;

  const configuration = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: "Manage your SmartyMove Premium subscription",
    },
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ["email", "address", "phone", "tax_id"],
      },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: "at_period_end",
        cancellation_reason: {
          enabled: true,
          options: ["too_expensive", "missing_features", "switched_service", "unused", "other"],
        },
      },
    },
    metadata: {
      app: "SmartyMove",
      managedBy: "SmartyMove account settings",
    },
  });
  return configuration.id;
}

async function findLatestManagedSubscription(
  stripe: ReturnType<typeof createStripeClient>,
  customerId: string,
) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
    expand: ["data.items.data.price"],
  });
  return (
    subscriptions.data.find((subscription) =>
      BILLING_MANAGED_STATUSES.includes(subscription.status),
    ) ??
    subscriptions.data.find((subscription) => subscription.status === "canceled") ??
    null
  );
}

function getPeriodEnd(subscription: StripeSubscriptionWithPeriod, fallback?: string | null) {
  const rawPeriodEnd =
    subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end;
  return rawPeriodEnd ? new Date(rawPeriodEnd * 1000).toISOString() : (fallback ?? null);
}

function getSubscriptionCatalogInfo(subscription: Stripe.Subscription) {
  const price = subscription.items.data[0]?.price;
  const product = price?.product;
  return {
    priceId:
      price?.lookup_key ??
      price?.metadata?.lovable_external_id ??
      price?.id ??
      "smartymove_premium_monthly",
    productId: typeof product === "string" ? product : (product?.id ?? "smartymove_premium"),
  };
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
      const customerId = await resolveOrCreateCustomer(stripe, {
        email: data.email,
        userId: context.userId,
      });
      const checkoutParams: EmbeddedCheckoutSessionParams = {
        line_items: [{ price: price.id, quantity: 1 }],
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        metadata: { userId: context.userId },
        subscription_data: { metadata: { userId: context.userId } },
      };
      const session = await stripe.checkout.sessions.create(checkoutParams);
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
    try {
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
      const stripe = createStripeClient(data.environment);
      const email =
        (profile?.email as string | null | undefined) ??
        (typeof context.claims?.email === "string" ? context.claims.email : undefined);
      const customerId =
        (sub?.stripe_customer_id as string | undefined) ??
        (await resolveExistingCustomer(stripe, {
          userId,
          email,
        }));
      if (!customerId)
        return {
          error:
            "No billing account found yet. If you just subscribed, wait a few seconds and try again.",
        };
      const configuration = await ensureBillingPortalConfiguration(stripe);
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        configuration,
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
    try {
      const [{ data: sub, error: subError }, { data: profile }] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("id,stripe_subscription_id,stripe_customer_id,status,current_period_end")
          .eq("user_id", userId)
          .eq("environment", data.environment)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("profiles").select("email").eq("id", userId).maybeSingle(),
      ]);
      if (subError) return { error: subError.message };
      const stripe = createStripeClient(data.environment);

      let subscriptionId = sub?.stripe_subscription_id as string | undefined;
      let customerId = sub?.stripe_customer_id as string | undefined;
      let fallbackCurrentPeriodEnd = (sub?.current_period_end as string | null | undefined) ?? null;

      if (!subscriptionId) {
        const email =
          (profile?.email as string | null | undefined) ??
          (typeof context.claims?.email === "string" ? context.claims.email : undefined);
        customerId = (await resolveExistingCustomer(stripe, { userId, email })) ?? undefined;
        if (customerId) {
          const found = await findLatestManagedSubscription(stripe, customerId);
          subscriptionId = found?.id;
          fallbackCurrentPeriodEnd = found
            ? getPeriodEnd(found as StripeSubscriptionWithPeriod, null)
            : null;
          if (
            found?.status &&
            ["canceled", "incomplete_expired", "unpaid"].includes(found.status)
          ) {
            return { ok: true, currentPeriodEnd: fallbackCurrentPeriodEnd };
          }
        }
      }

      if (!subscriptionId) return { error: "No active billing subscription found." };
      if (
        sub?.status &&
        ["canceled", "incomplete_expired", "unpaid"].includes(sub.status as string)
      ) {
        return { ok: true, currentPeriodEnd: fallbackCurrentPeriodEnd };
      }

      const updated = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      const updatedSubscription = updated as StripeSubscriptionWithPeriod;
      const periodEnd = getPeriodEnd(updatedSubscription, fallbackCurrentPeriodEnd);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      if (sub?.id) {
        await supabaseAdmin
          .from("subscriptions")
          .update({
            cancel_at_period_end: true,
            current_period_end: periodEnd,
            status: updated.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id as string);
      } else {
        const resolvedCustomerId =
          customerId ?? (typeof updated.customer === "string" ? updated.customer : undefined);
        if (!resolvedCustomerId) return { error: "Could not resolve billing customer." };
        const catalog = getSubscriptionCatalogInfo(updated);
        await supabaseAdmin.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: resolvedCustomerId,
            price_id: catalog.priceId,
            product_id: catalog.productId,
            status: updated.status,
            current_period_end: periodEnd,
            cancel_at_period_end: true,
            environment: data.environment,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "stripe_subscription_id" },
        );
      }
      return { ok: true, currentPeriodEnd: periodEnd };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
