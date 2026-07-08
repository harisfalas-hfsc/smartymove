import { createFileRoute } from "@tanstack/react-router";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";

// Public brand image URL for the Stripe product. Uses the Lovable asset CDN.
const BRAND_IMAGE_URL =
  "https://smartymove.com/__l5e/assets-v1/55cc1cbc-55bc-4e27-b23e-f04ea9e5e5b4/smartymove-social.png";

const SCAN_LOOKUP_KEY = "smartymove_scan_single";
const SCAN_UNIT_AMOUNT = 599; // €5.99
const SCAN_PRODUCT_EXTERNAL_ID = "smartymove_scan";
const LEGACY_PREMIUM_LOOKUP_KEYS = ["smartymove_premium_monthly", "premium_monthly"];

async function archivePremiumCatalog(stripe: ReturnType<typeof createStripeClient>, results: Record<string, unknown>) {
  const archivedProducts = new Set<string>();
  const archivedPrices = new Set<string>();

  for (const lookupKey of LEGACY_PREMIUM_LOOKUP_KEYS) {
    const prices = await stripe.prices.list({ lookup_keys: [lookupKey], expand: ["data.product"], limit: 10 });
    for (const price of prices.data) {
      const productId = typeof price.product === "string" ? price.product : (price.product as any).id;
      if (price.active) {
        await stripe.prices.update(price.id, { active: false });
        archivedPrices.add(price.id);
      }
      if (productId && !archivedProducts.has(productId)) {
        await stripe.products.update(productId, {
          active: false,
          description:
            "Legacy SmartyMove Premium. Replaced by pay-per-scan (€5.99). Existing subscribers keep access until their subscription ends.",
          metadata: {
            app: "smartymove",
            plan: "legacy_premium_monthly",
            status: "archived",
            replaced_by: SCAN_PRODUCT_EXTERNAL_ID,
          },
        });
        archivedProducts.add(productId);
      }
    }
  }

  // Catch manually created duplicates that may not have the expected lookup key.
  const duplicateProducts = new Map<string, any>();
  for (const query of [
    "active:'true' AND name~'SmartyMove Premium'",
    "active:'true' AND name~'Smart Move Premium'",
    "active:'true' AND name~'Smart Remove Premium'",
  ]) {
    const products = await stripe.products.search({ query, limit: 20 });
    for (const product of products.data) duplicateProducts.set(product.id, product);
  }
  for (const product of duplicateProducts.values()) {
    await stripe.products.update(product.id, {
      active: false,
      description:
        "Legacy SmartyMove Premium. Replaced by pay-per-scan (€5.99). Existing subscribers keep access until their subscription ends.",
      metadata: {
        ...product.metadata,
        app: "smartymove",
        status: "archived",
        replaced_by: SCAN_PRODUCT_EXTERNAL_ID,
      },
    });
    archivedProducts.add(product.id);
    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 20 });
    for (const price of prices.data) {
      await stripe.prices.update(price.id, { active: false });
      archivedPrices.add(price.id);
    }
  }

  results.premiumArchivedProducts = Array.from(archivedProducts);
  results.premiumArchivedPrices = Array.from(archivedPrices);
}

async function ensureScanProduct(stripe: ReturnType<typeof createStripeClient>) {
  const existingPrice = await stripe.prices.list({ lookup_keys: [SCAN_LOOKUP_KEY], expand: ["data.product"], limit: 1 });
  if (existingPrice.data.length) {
    let price = existingPrice.data[0];
    const productId = typeof price.product === "string" ? price.product : (price.product as any).id;
    const updated = await stripe.products.update(productId, {
      active: true,
      name: "SmartyMove Movement Scan",
      description:
        "One movement scan (€5.99) with a personalized 2-week corrective training program and permanent access to scan history and program results.",
      images: [BRAND_IMAGE_URL],
      tax_code: "txcd_10000000",
      metadata: {
        app: "smartymove",
        type: "one_time_scan",
        lovable_external_id: SCAN_PRODUCT_EXTERNAL_ID,
        version: "v1",
      },
    });
    if (!price.active) await stripe.prices.update(price.id, { active: true });
    // Prices are immutable in Stripe. If the amount changed, archive the old
    // price (removing its lookup_key first) and create a new one carrying the
    // canonical lookup_key so checkout picks up the new amount.
    let repriced = false;
    if (price.unit_amount !== SCAN_UNIT_AMOUNT || price.currency !== "eur") {
      await stripe.prices.update(price.id, { lookup_key: null as any, active: false });
      const newPrice = await stripe.prices.create({
        active: true,
        currency: "eur",
        unit_amount: SCAN_UNIT_AMOUNT,
        product: updated.id,
        lookup_key: SCAN_LOOKUP_KEY,
        transfer_lookup_key: true,
        metadata: {
          app: "smartymove",
          type: "one_time_scan",
          lovable_external_id: SCAN_LOOKUP_KEY,
        },
      } as any);
      price = newPrice;
      repriced = true;
    }
    return { productId: updated.id, priceId: price.id, created: false, repriced, unitAmount: price.unit_amount };
  }

  const product = await stripe.products.create({
    active: true,
    name: "SmartyMove Movement Scan",
    description:
      "One movement scan (€5.99) with a personalized 2-week corrective training program and permanent access to scan history and program results.",
    images: [BRAND_IMAGE_URL],
    tax_code: "txcd_10000000",
    metadata: {
      app: "smartymove",
      type: "one_time_scan",
      lovable_external_id: SCAN_PRODUCT_EXTERNAL_ID,
      version: "v1",
    },
  });
  const price = await stripe.prices.create({
    active: true,
    currency: "eur",
    unit_amount: SCAN_UNIT_AMOUNT,
    product: product.id,
    lookup_key: SCAN_LOOKUP_KEY,
    metadata: {
      app: "smartymove",
      type: "one_time_scan",
      lovable_external_id: SCAN_LOOKUP_KEY,
    },
  });
  return { productId: product.id, priceId: price.id, created: true, unitAmount: price.unit_amount };
}

async function sync(env: StripeEnv) {
  const stripe = createStripeClient(env);
  const results: Record<string, unknown> = { env };

  // 1) Archive all legacy subscription catalog entries (idempotent).
  try {
    await archivePremiumCatalog(stripe, results);
  } catch (e) {
    results.premiumError = getStripeErrorMessage(e);
  }

  // 2) Create/update the SmartyMove Scan product and €5.99 one-time price.
  try {
    results.scan = await ensureScanProduct(stripe);
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