import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createScanCheckout } from "@/lib/scans.functions";

// SmartyMove is strictly pay-per-scan: every checkout is a one-time payment.
// There is no recurring/subscription checkout mode by design.
export function StripeEmbeddedCheckout({
  email,
  returnUrl,
}: {
  email?: string;
  returnUrl: string;
  mode?: "scan";
}) {
  const fetchClientSecret = async (): Promise<string> => {
    const result = await createScanCheckout({
      data: { returnUrl, environment: getStripeEnvironment(), email },
    });
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