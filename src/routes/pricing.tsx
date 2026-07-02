import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, Loader2, X, Crown, ScanLine, Sparkles, Infinity as InfinityIcon, RefreshCw, ShoppingBag, Play, Calendar, TrendingUp, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { useUser } from "@/lib/store";
import { getScanAccess, SCAN_PRICE_EUR } from "@/lib/scans.functions";
import { createBillingPortalSession } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "SmartyMove Pricing — €3.99 per Movement Scan" },
      { name: "description", content: "Pay only when you scan. €3.99 per Movement Screen with a personalized 2-week training program you keep forever." },
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

  const perks = [
    { Icon: ScanLine, color: "text-blue-500", label: "Full Movement Screen — 5 core tests + add-ons" },
    { Icon: Sparkles, color: "text-purple-500", label: "Movement Score & Movement Age" },
    { Icon: Calendar, color: "text-orange-500", label: "Personalized 2-week training program" },
    { Icon: InfinityIcon, color: "text-emerald-500", label: "Dashboard & history — kept forever" },
    { Icon: RefreshCw, color: "text-cyan-500", label: "Rescan anytime to progress your plan" },
    { Icon: CheckCircle2, color: "text-pink-500", label: "No subscription. No hidden fees." },
  ];

  const steps = [
    { n: 1, Icon: ShoppingBag, color: "text-orange-500", title: "Buy a scan", body: `One-time €${SCAN_PRICE_EUR.toFixed(2)}. No subscription.` },
    { n: 2, Icon: Camera, color: "text-blue-500", title: "Run your Movement Screen", body: "Phone or laptop camera. ~5 minutes." },
    { n: 3, Icon: Calendar, color: "text-purple-500", title: "Follow your 2-week plan", body: "Mark sessions complete as you go." },
    { n: 4, Icon: TrendingUp, color: "text-emerald-500", title: "Rescan & progress", body: "After 14 days, update your program." },
  ];

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background text-foreground">
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 pb-6 pt-4 space-y-6">
        {paidReturn && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Payment received — unlocking your scan…
          </div>
        )}

        <Card className="border-2 border-primary">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <Camera className="w-12 h-12 text-primary mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">
                One Scan. <span className="text-primary">One Price.</span>
              </h1>
              <p className="text-4xl font-extrabold text-primary">€{SCAN_PRICE_EUR.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No subscription. One-time payment for a full Movement Screen plus your personalized 2-week training program — yours to keep forever.
              </p>
              {grandfathered ? (
                <div className="space-y-2 rounded-md bg-primary/5 p-3 text-sm">
                  <div className="flex items-center justify-center gap-2 font-semibold text-primary">
                    <Crown className="h-4 w-4" /> Legacy Premium — unlimited scans
                  </div>
                  <Button variant="outline" onClick={handleManage} disabled={portalLoading} className="w-full">
                    {portalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {portalLoading ? "Opening…" : "Manage subscription"}
                  </Button>
                </div>
              ) : (
                <>
                  <Button size="lg" onClick={handleBuy} className="w-full">
                    <Camera className="w-4 h-4 mr-2" /> Buy one scan · €{SCAN_PRICE_EUR.toFixed(2)}
                  </Button>
                  {u && (
                    <p className="text-xs text-muted-foreground">
                      You have <strong className="text-foreground">{credits}</strong> scan{credits === 1 ? "" : "s"} available.
                    </p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <Sparkles className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">
                What <span className="text-primary">Each Scan</span> Gives You
              </h2>
              <div className="space-y-3 text-left pt-2">
                {perks.map(({ Icon, color, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${color} flex-shrink-0`} />
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <Play className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">
                How <span className="text-primary">It Works</span>
              </h2>
              <div className="space-y-3 text-left pt-2">
                {steps.map(({ n, Icon, color, title, body }) => (
                  <div key={n} className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-extrabold text-primary">
                      {n}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className="text-sm font-bold text-foreground">{title}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

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