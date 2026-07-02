import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createPremiumCheckout } from "@/lib/payments.functions";
import { createScanCheckout } from "@/lib/scans.functions";

export function StripeEmbeddedCheckout({
  email,
  returnUrl,
  mode = "premium",
}: {
  email?: string;
  returnUrl: string;
  mode?: "premium" | "scan";
}) {
  const fetchClientSecret = async (): Promise<string> => {
    const args = { data: { returnUrl, environment: getStripeEnvironment(), email } };
    const result = mode === "scan" ? await createScanCheckout(args) : await createPremiumCheckout(args);
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Stripe did not return a client secret");
    return result.clientSecret;
  };

  return (
    <div id="checkout" className="rounded-2xl overflow-hidden bg-white">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}