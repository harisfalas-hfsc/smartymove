import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Check, Loader2, X, Crown } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { useUser } from "@/lib/store";
import { getScanAccess, SCAN_PRICE_EUR } from "@/lib/scans.functions";
import { createBillingPortalSession } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "SmartyMove Pricing — €3.99 per Movement Scan" },
      { name: "description", content: "Pay only when you scan. €3.99 per Movement Screen with a personalized 2-week training program you keep forever. Rescan anytime to progress." },
      { property: "og:title", content: "SmartyMove — €3.99 per scan" },
      { property: "og:description", content: "Pay per scan. Keep your program forever. Rescan anytime to update your plan." },
      { property: "og:url", content: "https://smartymove.com/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://smartymove.com/pricing" }],
  }),
  component: Pricing,
});

function Pricing() {
  const u = useUser();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const isTestMode = (import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined)?.startsWith("pk_test_");
  const access = useQuery({
    queryKey: ["scan-access", u?.id ?? "anon"],
    queryFn: () => getScanAccess(),
    enabled: !!u,
    staleTime: 30_000,
  });
  const grandfathered = !!access.data?.hasActiveSubscription;
  const credits = access.data?.credits ?? 0;

  function handleBuy() {
    if (!u) { window.location.href = "/"; return; }
    setCheckoutOpen(true);
  }
  async function handleManage() {
    if (!u) return;
    setPortalLoading(true);
    const w = window.open("about:blank", "_blank");
    try {
      const result = await createBillingPortalSession({
        data: { environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/pricing` },
      });
      if ("error" in result) throw new Error(result.error);
      if (w) w.location.href = result.url;
      else window.location.assign(result.url);
    } catch (e) {
      w?.close();
      alert(e instanceof Error ? e.message : "Could not open billing portal");
    } finally { setPortalLoading(false); }
  }

  return (
    <div className="flex min-h-[100dvh] w-full flex-col" style={{ background: "#E7ECEC", color: "#14213A" }}>
      <SiteHeader showBack />
      {isTestMode && (
        <div className="w-full border-b text-center text-xs" style={{ background: "#FFF4E5", borderColor: "#F5C99B", color: "#7A4B00", padding: "8px 12px" }}>
          Test mode — use card <strong>4242 4242 4242 4242</strong>, any future date, any CVC.
        </div>
      )}
      <main className="mx-auto w-full max-w-[760px] px-5 pb-8 pt-5">
        <div className="relative overflow-hidden" style={{ background: "linear-gradient(160deg,#0E7C86 0%, #1f6fa8 100%)", borderRadius: 22, padding: "26px 22px 28px", color: "#fff" }}>
          <div className="flex items-center gap-2" style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 700, opacity: 0.9 }}>
            <Camera className="h-3.5 w-3.5" /> Pay per scan
          </div>
          <h1 style={{ fontWeight: 800, fontSize: 28, lineHeight: 1.15, letterSpacing: "-0.02em", margin: "10px 0 10px" }}>
            One Movement Scan.<br />
            <span style={{ color: "#7CFFB8" }}>€{SCAN_PRICE_EUR.toFixed(2)}.</span> No subscription.
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.55, opacity: 0.95, margin: 0 }}>
            One scan = one full Movement Screen + a personalized 2-week training program. Keep your program, dashboard, and history forever. Rescan when you want to progress.
          </p>

          {grandfathered ? (
            <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm">
              <div className="flex items-center gap-2 font-semibold"><Crown className="h-4 w-4" /> You're on legacy Premium</div>
              <div className="mt-1 opacity-90">Unlimited scans included until your subscription ends. After that, scans are €{SCAN_PRICE_EUR.toFixed(2)} each.</div>
              <button type="button" onClick={handleManage} disabled={portalLoading} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl font-bold" style={{ background: "#fff", color: "#14213A" }}>
                {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {portalLoading ? "Opening…" : "Manage subscription"}
              </button>
            </div>
          ) : (
            <>
              <button type="button" onClick={handleBuy} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold" style={{ background: "#FF6B4A", color: "#fff", boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)" }}>
                <Camera className="h-4 w-4" /> Buy one scan · €{SCAN_PRICE_EUR.toFixed(2)}
              </button>
              {u && (
                <p className="mt-2 text-center text-[11px]" style={{ opacity: 0.85 }}>
                  You have <strong>{credits}</strong> scan{credits === 1 ? "" : "s"} available.
                </p>
              )}
            </>
          )}
        </div>

        <section className="mt-4 rounded-3xl bg-white p-6 shadow" style={{ border: "1px solid #E5EAEC" }}>
          <h2 className="text-lg font-extrabold">What each scan gives you</h2>
          <ul className="mt-3 space-y-2.5 text-sm" style={{ color: "#3B4A63", lineHeight: 1.55 }}>
            <Li><strong>1 full Movement Screen</strong> — 5 core tests + targeted add-ons for your selected areas.</Li>
            <Li><strong>Movement Score & Movement Age</strong> — with root-cause clustering.</Li>
            <Li><strong>Personalized 2-week training program</strong> — updated based on your specific weak points.</Li>
            <Li><strong>Kept forever in your account</strong> — dashboard, history, and program never expire.</Li>
            <Li><strong>Rescan anytime</strong> — the next €{SCAN_PRICE_EUR.toFixed(2)} scan updates your program (progression, load, exercise swaps) rather than starting from zero.</Li>
          </ul>
        </section>

        <section className="mt-4 rounded-3xl bg-white p-6 shadow" style={{ border: "1px solid #E5EAEC" }}>
          <h2 className="text-lg font-extrabold">How it works</h2>
          <ol className="mt-3 space-y-2 text-sm" style={{ color: "#3B4A63", lineHeight: 1.55 }}>
            <li>1. Buy a scan for €{SCAN_PRICE_EUR.toFixed(2)}.</li>
            <li>2. Run your Movement Screen from your phone or laptop camera.</li>
            <li>3. Follow your 2-week training program — mark sessions complete.</li>
            <li>4. After 14 days you'll get a rescan reminder. Rescan (€{SCAN_PRICE_EUR.toFixed(2)}) to progress your program based on your improvements.</li>
          </ol>
        </section>
      </main>
      <SiteFooter />

      {checkoutOpen && u && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCheckoutOpen(false)} />
          <div className="relative w-full max-w-[560px] max-h-[92dvh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <div className="font-bold">Buy a Movement Scan</div>
              <button onClick={() => setCheckoutOpen(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-black/5"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4">
              <StripeEmbeddedCheckout mode="scan" email={u.email} returnUrl={`${window.location.origin}/pricing?paid=1`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#0E7C86" }} />{children}</li>;
}