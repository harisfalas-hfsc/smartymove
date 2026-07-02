import { createFileRoute } from "@tanstack/react-router";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";

async function sync(env: StripeEnv) {
  const stripe = createStripeClient(env);
  const prices = await stripe.prices.list({ lookup_keys: ["smartymove_premium_monthly"], expand: ["data.product"] });
  if (!prices.data.length) return { env, error: "Price not found" };
  const price = prices.data[0];
  const productId = typeof price.product === "string" ? price.product : (price.product as any).id;
  // Archive the legacy subscription product so no new subscribers can sign up.
  // Existing subscriptions keep billing normally until they expire or cancel.
  const updated = await stripe.products.update(productId, {
    active: false,
    description: "Legacy SmartyMove Premium. Replaced by pay-per-scan (€3.99). Existing subscribers keep access until their subscription ends.",
    metadata: {
      app: "smartymove",
      plan: "legacy_premium_monthly",
      status: "archived",
      replaced_by: "smartymove_scan",
    },
  });
  // Also deactivate the recurring price to block new checkouts using the lookup key.
  await stripe.prices.update(price.id, { active: false });
  return { env, ok: true, archived: true, productId: updated.id };
}

export const Route = createFileRoute("/api/public/admin/sync-premium")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = new URL(request.url).searchParams.get("token");
        // Temporary one-shot token to push product image/metadata to LIVE Stripe.
        // Remove this fallback after the sync has been run successfully.
        const allow = token === process.env.ADMIN_SYNC_TOKEN || token === "sm-oneshot-image-sync-2026";
        if (!allow) return new Response("Unauthorized", { status: 401 });
        const results: any[] = [];
        for (const env of ["sandbox", "live"] as StripeEnv[]) {
          try { results.push(await sync(env)); }
          catch (e) { results.push({ env, error: getStripeErrorMessage(e) }); }
        }
        return Response.json({ results });
      },
    },
  },
});