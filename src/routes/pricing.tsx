import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, Loader2, ScanLine, Sparkles, Infinity as InfinityIcon, RefreshCw, ShoppingBag, Play, Calendar, TrendingUp, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useBuyScan } from "@/components/BuyScanDialog";
import { useUser } from "@/lib/store";
import { getScanAccess, SCAN_PRICE_EUR } from "@/lib/scans.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "SmartyMove Pricing — €9.99 per Movement Scan" },
      { name: "description", content: "Pay only when you scan. €9.99 per Movement Screen with a personalized 14-day training program you keep forever. One-time payment — no subscription." },
      { property: "og:title", content: "SmartyMove — €9.99 per scan" },
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
  const { openBuyScan, buyScanElement } = useBuyScan("/pricing?paid=1");
  const access = useQuery({
    queryKey: ["scan-access", u?.id ?? "anon"],
    queryFn: () => getScanAccess(),
    enabled: !!u,
    staleTime: 30_000,
    retry: false,
  });
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
    { n: 2, Icon: Camera, color: "text-blue-500", title: "Run your Movement Screen", body: "Phone or laptop camera. About 5 minutes for the 5 movement patterns." },
    { n: 3, Icon: Calendar, color: "text-purple-500", title: "Follow your 2-week plan", body: "Mark sessions complete as you go." },
    { n: 4, Icon: TrendingUp, color: "text-emerald-500", title: "Rescan & progress", body: "After 14 days, update your program." },
  ];

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background text-foreground">
      <SiteHeader showBack />

      {/* MOBILE — untouched */}
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 pb-6 pt-4 space-y-6 lg:hidden">
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
              <Button size="lg" onClick={openBuyScan} className="w-full">
                <Camera className="w-4 h-4 mr-2" /> Buy one scan · €{SCAN_PRICE_EUR.toFixed(2)}
              </Button>
              {u ? (
                <p className="text-xs text-muted-foreground">
                  You have <strong className="text-foreground">{credits}</strong> scan{credits === 1 ? "" : "s"} available.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Sign in to purchase — you'll be brought straight back here.
                </p>
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

      {/* DESKTOP — SmartyDiet-inspired layout */}
      <main className="hidden lg:block flex-1 w-full">
        <div className="mx-auto w-full max-w-[1080px] px-6 pt-16 pb-20">
          {paidReturn && (
            <div className="mb-8 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Payment received — unlocking your scan…
            </div>
          )}

          <div className="text-center">
            <span className="inline-block text-[11px] font-extrabold tracking-[0.28em] uppercase text-primary">PRICING</span>
            <h1 className="mt-4 text-[52px] leading-[1.05] font-extrabold tracking-tight text-[#0f172a]">
              Simple pricing. <span className="text-primary">No subscription.</span>
            </h1>
            <p className="mt-5 text-lg text-slate-500">
              Pay once, get your Movement Screen + 2-week program. Come back only when you want to rescan.
            </p>
          </div>

          <div className="mt-14 relative rounded-[32px] border-2 border-primary bg-white p-12">
            <div className="flex items-center gap-4">
              <div className="flex-1 inline-flex items-center gap-3 rounded-full border-2 border-primary/40 px-6 py-3">
                <Camera className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-extrabold tracking-[0.28em] uppercase text-primary">ONE-TIME PAYMENT</span>
              </div>
              <div className="grid place-items-center h-14 w-14 rounded-full border-2 border-primary/40 bg-primary/5">
                <Camera className="h-6 w-6 text-primary" />
              </div>
            </div>

            <div className="mt-10 flex items-baseline gap-3">
              <span className="text-[64px] leading-none font-extrabold text-[#0f172a]">€{SCAN_PRICE_EUR.toFixed(2)}</span>
              <span className="text-[32px] font-extrabold text-primary">once.</span>
            </div>
            <p className="mt-4 text-slate-500 text-lg">
              One personalized Movement Screen + 2-week corrective program. Yours to keep. No subscription, no hidden add-ons, no monthly fee.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-8">
              <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6">
                <h3 className="text-xs font-extrabold tracking-[0.2em] uppercase text-[#0f172a]">Your scan includes</h3>
                <div className="mt-4 space-y-3">
                  {perks.slice(0, 4).map(({ Icon, label }) => (
                    <div key={label} className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-4 py-3">
                      <Icon className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-sm font-semibold text-[#0f172a]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6">
                <h3 className="text-xs font-extrabold tracking-[0.2em] uppercase text-[#0f172a]">Also included</h3>
                <div className="mt-4 space-y-3">
                  {perks.slice(4).map(({ Icon, label }) => (
                    <div key={label} className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-4 py-3">
                      <Icon className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-sm font-semibold text-[#0f172a]">{label}</span>
                    </div>
                  ))}
                  {u && (
                    <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-600">
                      You have <strong className="text-[#0f172a]">{credits}</strong> scan{credits === 1 ? "" : "s"} available.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center gap-4">
              <Button size="lg" onClick={openBuyScan} className="h-14 px-8 text-base rounded-2xl">
                <Camera className="w-5 h-5 mr-2" /> Buy one scan · €{SCAN_PRICE_EUR.toFixed(2)}
              </Button>
              <p className="text-sm text-slate-500">
                Not medical advice. Consult a professional for medical conditions.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-[32px] border-2 border-primary bg-white p-12">
            <div className="flex items-center gap-4">
              <div className="flex-1 inline-flex items-center gap-3 rounded-full border-2 border-primary/40 px-6 py-3">
                <Play className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-extrabold tracking-[0.28em] uppercase text-primary">HOW IT WORKS</span>
              </div>
              <div className="grid place-items-center h-14 w-14 rounded-full border-2 border-primary/40 bg-primary/5">
                <Play className="h-6 w-6 text-primary" />
              </div>
            </div>

            <h2 className="mt-10 text-[34px] leading-tight font-extrabold text-[#0f172a]">
              From scan <span className="text-primary">to program.</span>
            </h2>
            <p className="mt-3 text-slate-500">Four steps. One payment. No subscription.</p>

            <div className="mt-10 grid grid-cols-4 gap-6">
              {steps.map(({ n, Icon, title, body }) => (
                <div key={n} className="text-center">
                  <div className={`text-[56px] leading-none font-extrabold ${n === 1 ? "text-orange-500" : n === 2 ? "text-blue-500" : n === 3 ? "text-purple-500" : "text-emerald-500"}`}>{n}</div>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-base font-bold text-[#0f172a]">{title}</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-500">{body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />

      {buyScanElement}
    </div>
  );
}