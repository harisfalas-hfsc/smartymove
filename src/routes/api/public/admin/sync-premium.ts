import { createFileRoute } from "@tanstack/react-router";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";

// Public brand image URL for the Stripe product. Uses the Lovable asset CDN.
const BRAND_IMAGE_URL =
  "https://smartymove.com/__l5e/assets-v1/55cc1cbc-55bc-4e27-b23e-f04ea9e5e5b4/smartymove-social.png";

async function sync(env: StripeEnv) {
  const stripe = createStripeClient(env);
  const results: Record<string, unknown> = { env };

  // 1) Archive the legacy subscription product (idempotent).
  try {
    const premium = await stripe.prices.list({
      lookup_keys: ["smartymove_premium_monthly"],
      expand: ["data.product"],
    });
    if (premium.data.length) {
      const price = premium.data[0];
      const productId =
        typeof price.product === "string" ? price.product : (price.product as any).id;
      await stripe.products.update(productId, {
        active: false,
        description:
          "Legacy SmartyMove Premium. Replaced by pay-per-scan (€3.99). Existing subscribers keep access until their subscription ends.",
        metadata: {
          app: "smartymove",
          plan: "legacy_premium_monthly",
          status: "archived",
          replaced_by: "smartymove_scan",
        },
      });
      if (price.active) await stripe.prices.update(price.id, { active: false });
      results.premiumArchived = productId;
    }
  } catch (e) {
    results.premiumError = getStripeErrorMessage(e);
  }

  // 2) Update the SmartyMove Scan product with brand image + description.
  try {
    const scan = await stripe.prices.list({
      lookup_keys: ["smartymove_scan_single"],
      expand: ["data.product"],
    });
    if (!scan.data.length) {
      results.scanError = "Scan price not found";
    } else {
      const price = scan.data[0];
      const productId =
        typeof price.product === "string" ? price.product : (price.product as any).id;
      const updated = await stripe.products.update(productId, {
        name: "SmartyMove Movement Scan",
        description:
          "One AI-guided movement scan (€3.99). Includes a personalized 2-week corrective training program you keep forever. Rescan anytime to progress.",
        images: [BRAND_IMAGE_URL],
        metadata: {
          app: "smartymove",
          type: "one_time_scan",
          version: "v1",
        },
      });
      results.scanUpdated = updated.id;
    }
  } catch (e) {
    results.scanError = getStripeErrorMessage(e);
  }

  return { ...results, ok: true };
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