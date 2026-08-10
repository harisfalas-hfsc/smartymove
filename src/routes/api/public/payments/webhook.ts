import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _supabase;
}

async function upsertSubscription(sub: any, env: StripeEnv) {
  const userId = sub.metadata?.userId;
  if (!userId) {
    console.error("subscription missing userId metadata", sub.id);
    return;
  }
  const item = sub.items?.data?.[0];
  const priceId = item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? sub.current_period_start;
  const periodEnd = item?.current_period_end ?? sub.current_period_end;

  const client = getSupabase() as any;
  await client.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: sub.id,
      stripe_customer_id: sub.customer,
      product_id: productId,
      price_id: priceId,
      status: sub.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end || false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
}

async function markCanceled(sub: any, env: StripeEnv) {
  const client = getSupabase() as any;
  await client
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", sub.id)
    .eq("environment", env);
}

function money(amount: number | null | undefined, currency: string | null | undefined): string {
  if (typeof amount !== "number") return "your payment";
  const value = (amount / 100).toFixed(2);
  const code = currency?.toUpperCase();
  return code === "EUR" ? `€${value}` : `${code ? `${code} ` : ""}${value}`;
}

function dayFromUnix(seconds: number | null | undefined, withYear = true): string | null {
  if (!seconds) return null;
  return new Date(seconds * 1000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    ...(withYear ? { year: "numeric" as const } : {}),
  });
}

async function userIdForInvoice(invoice: any, env: StripeEnv): Promise<string | null> {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return null;
  const client = getSupabase() as any;
  const { data } = await client
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .eq("environment", env)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { user_id?: string } | null)?.user_id ?? null;
}

async function handleInvoicePaid(invoice: any, env: StripeEnv) {
  const userId = await userIdForInvoice(invoice, env);
  if (!userId) return;
  const { notifyOnce } = await import("@/lib/billing-notify.server");
  const amount = money(invoice.amount_paid ?? invoice.total, invoice.currency);
  const until = dayFromUnix(invoice.lines?.data?.[0]?.period?.end);
  await notifyOnce(getSupabase() as any, {
    userId,
    kind: "billing",
    title: "Thank you — your payment went through",
    body: `We received ${amount} for your SmartyMove plan.${
      until ? ` Your access is active until ${until}.` : ""
    } Thank you for moving smarter with us — your receipt is on its way by email.`,
    dedupeKey: `invoice-paid:${invoice.id}`,
  });
}

async function handleInvoiceFailed(invoice: any, env: StripeEnv) {
  const userId = await userIdForInvoice(invoice, env);
  if (!userId) return;
  const { notifyOnce } = await import("@/lib/billing-notify.server");
  const attempt = Number(invoice.attempt_count ?? 1);
  const amount = money(invoice.amount_due ?? invoice.total, invoice.currency);
  const nextAttempt = dayFromUnix(invoice.next_payment_attempt, false);
  const body = nextAttempt
    ? `We couldn't take ${amount} for your SmartyMove plan (attempt ${attempt}). This usually means the card expired, there weren't enough funds, or the bank asked for a confirmation. We'll try again automatically on ${nextAttempt}. To sort it now — or to pay with a different card — open Billing & purchases in your profile and update your payment method. Your access stays on in the meantime.`
    : `We couldn't take ${amount} for your SmartyMove plan (attempt ${attempt}). This was the last automatic attempt, so the plan will pause unless the payment is completed. Open Billing & purchases in your profile to update your card and complete it manually — nothing in your scans, scores or program is lost.`;
  await notifyOnce(getSupabase() as any, {
    userId,
    kind: "billing",
    title: nextAttempt ? "Payment didn't go through" : "Payment failed — action needed",
    body,
    dedupeKey: `invoice-failed:${invoice.id}:${attempt}`,
  });
}

async function grantScanCredits(session: any) {
  const meta = session.metadata ?? {};
  if (meta.type !== "scan_pack") return;
  // Only grant once the money actually landed. `checkout.session.completed`
  // can fire with `payment_status: "unpaid"` for delayed/async payment methods.
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    console.log("scan_pack session not paid yet, skipping grant", session.id, session.payment_status);
    return;
  }
  const userId = meta.userId;
  if (!userId) {
    console.error("scan_pack checkout missing userId metadata", session.id);
    return;
  }
  const credits = Math.max(1, parseInt(meta.credits ?? "1", 10) || 1);
  const client = getSupabase() as any;
  const { error } = await client.rpc("grant_scan_credits", { _user_id: userId, _credits: credits });
  if (error) console.error("grant_scan_credits failed", userId, error);
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        try {
          const event = await verifyWebhook(request, env);
          switch (event.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated":
              await upsertSubscription(event.data.object, env);
              break;
            case "customer.subscription.deleted":
              await markCanceled(event.data.object, env);
              break;
            case "checkout.session.completed":
            case "checkout.session.async_payment_succeeded":
              await grantScanCredits(event.data.object);
              break;
            case "invoice.paid":
            case "invoice.payment_succeeded":
              await handleInvoicePaid(event.data.object, env);
              break;
            case "invoice.payment_failed":
              await handleInvoiceFailed(event.data.object, env);
              break;
            default:
              console.log("Unhandled event:", event.type);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});