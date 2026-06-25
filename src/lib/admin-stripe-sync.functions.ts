import { createServerFn } from "@tanstack/react-start";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";

const IMAGE_URL = "https://smartymove.com/__l5e/assets-v1/58d509bd-4b38-474b-a04e-7eb0bf4df648/smartymove-pwa-512.png";

export const syncPremiumProduct = createServerFn({ method: "POST" })
  .inputValidator((data: { environment: StripeEnv }) => data)
  .handler(async ({ data }) => {
    try {
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: ["smartymove_premium_monthly"], expand: ["data.product"] });
      if (!prices.data.length) return { error: "Price not found in " + data.environment };
      const price = prices.data[0];
      const productId = typeof price.product === "string" ? price.product : (price.product as any).id;
      const updated = await stripe.products.update(productId, {
        name: "SmartyMove Premium",
        description: "Daily corrective movement program, re-tests every 14 days, Movement Age trajectory, and all add-on joint assessments. €4.99/month. Cancel anytime.",
        images: [IMAGE_URL],
        url: "https://smartymove.com/premium",
        statement_descriptor: "SMARTYMOVE PREM",
        tax_code: "txcd_10103001",
        metadata: {
          app: "smartymove",
          plan: "premium_monthly",
          tier: "premium",
          billing_cycle: "monthly",
          currency: "EUR",
          price_eur: "4.99",
          website: "https://smartymove.com",
          support_email: "smartymove@outlook.com",
        },
      });
      return { ok: true, productId: updated.id, name: updated.name, images: updated.images, metadata: updated.metadata };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });