import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, Loader2, X, Crown, ScanLine, Sparkles, Infinity as InfinityIcon, RefreshCw, ShoppingBag, Play, Calendar, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const access = useQuery({
    queryKey: ["scan-access", u?.id ?? "anon"],
    queryFn: () => getScanAccess(),
    enabled: !!u,
    staleTime: 30_000,
  });
  const grandfathered = !!access.data?.hasActiveSubscription;
  const credits = access.data?.credits ?? 0;

  // After Stripe returns to /pricing?paid=1, poll scan credits until the webhook
  // grants the credit, then auto-navigate to the scan page.
  useEffect(() => {
    if (!u) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") !== "1") return;

    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      await queryClient.invalidateQueries({ queryKey: ["scan-access"] });
      const fresh = await queryClient.fetchQuery({
        queryKey: ["scan-access", u.id],
        queryFn: () => getScanAccess(),
      });
      if (cancelled) return;
      if (fresh?.canScan) {
        // Clean the ?paid=1 flag then send them to run the scan.
        window.history.replaceState({}, "", "/pricing");
        navigate({ to: "/app/screen" });
        return;
      }
      if (attempts < 10) setTimeout(tick, 1500);
    };
    tick();
    return () => { cancelled = true; };
  }, [u, navigate, queryClient]);

  const paidReturn = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("paid") === "1";

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
      <main className="mx-auto w-full max-w-[760px] px-5 pb-8 pt-5">
        {paidReturn && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ background: "#E7F7EE", color: "#0E7C86", border: "1px solid #B7E4CB" }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Payment received — unlocking your scan and taking you to the Movement Screen…
          </div>
        )}
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

        <section className="mt-5">
          <h2 className="px-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: "#5A6B85" }}>What each scan gives you</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Feature Icon={ScanLine} title="Full Movement Screen" body="5 core tests + targeted add-ons." tint="#0E7C86" bg="#E6F5F5" />
            <Feature Icon={Sparkles} title="Score & Movement Age" body="With root-cause clustering." tint="#7A3EBA" bg="#F1E9FA" />
            <Feature Icon={Calendar} title="2-Week Program" body="Personalized to your weak points." tint="#C2410C" bg="#FDECD8" />
            <Feature Icon={InfinityIcon} title="Kept Forever" body="Dashboard & history never expire." tint="#0F766E" bg="#DCFCE7" />
            <Feature Icon={RefreshCw} title="Rescan to Progress" body="Program evolves, no restart." tint="#1D4ED8" bg="#DBEAFE" full />
          </div>
        </section>

        <section className="mt-5">
          <h2 className="px-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: "#5A6B85" }}>How it works</h2>
          <div className="mt-3 space-y-2.5">
            <Step n={1} Icon={ShoppingBag} title="Buy a scan" body={`One-time €${SCAN_PRICE_EUR.toFixed(2)}. No subscription.`} tint="#FF6B4A" />
            <Step n={2} Icon={Play} title="Run your Movement Screen" body="From your phone or laptop camera." tint="#0E7C86" />
            <Step n={3} Icon={Calendar} title="Follow your 2-week plan" body="Mark sessions complete as you go." tint="#7A3EBA" />
            <Step n={4} Icon={TrendingUp} title="Rescan & progress" body="After 14 days, update your program." tint="#1D4ED8" />
          </div>
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

function Feature({ Icon, title, body, tint, bg, full }: { Icon: any; title: string; body: string; tint: string; bg: string; full?: boolean }) {
  return (
    <div className={`rounded-2xl bg-white p-4 shadow-sm ${full ? "col-span-2" : ""}`} style={{ border: "1px solid #E5EAEC" }}>
      <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: bg, color: tint }}>
        <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
      </div>
      <div className="mt-2.5 text-sm font-bold" style={{ color: "#14213A" }}>{title}</div>
      <div className="mt-0.5 text-xs leading-snug" style={{ color: "#5A6B85" }}>{body}</div>
    </div>
  );
}

function Step({ n, Icon, title, body, tint }: { n: number; Icon: any; title: string; body: string; tint: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm" style={{ border: "1px solid #E5EAEC" }}>
      <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: `${tint}14`, color: tint }}>
        <Icon className="h-5 w-5" strokeWidth={2.2} />
        <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: tint }}>{n}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold" style={{ color: "#14213A" }}>{title}</div>
        <div className="text-xs" style={{ color: "#5A6B85" }}>{body}</div>
      </div>
    </div>
  );
}