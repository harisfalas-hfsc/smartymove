import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Compass, Play, Search, TrendingUp, ListChecks, ChevronRight, Info } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFreeAccessMode } from "@/hooks/useFreeAccessMode";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How SmartyMove Works — Scan, score, train, rescan" },
      { name: "description", content: "See how SmartyMove works: a 5-minute camera movement screen, your Movement Score and Movement Age, a daily corrective routine, and a rescan every 14 days." },
      { property: "og:title", content: "How SmartyMove Works" },
      { property: "og:description", content: "Scan with your camera, get your Movement Score, train 5 minutes a day, rescan every 14 days." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://smartymove.com/how-it-works" },
    ],
    links: [{ rel: "canonical", href: "https://smartymove.com/how-it-works" }],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  const { freeAccessMode } = useFreeAccessMode();

  const steps = [
    { n: 1, Icon: Compass, color: "text-blue-500", title: "Set up", body: "Quick readiness questionnaire and goal." },
    { n: 2, Icon: Camera, color: "text-orange-500", title: "Screen", body: "Prop your phone, follow the prompts, 5 short tests." },
    { n: 3, Icon: Search, color: "text-purple-500", title: "See your results", body: "Score, Movement Age, and the real root cause." },
    { n: 4, Icon: Play, color: "text-emerald-500", title: "Train", body: "Your 5-minute daily routine — mobility, stability, strength." },
    { n: 5, Icon: TrendingUp, color: "text-cyan-500", title: "Rescan every 14 days", body: "Watch your score improve, your program evolve." },
  ];

  const patterns = [
    "Deep squat",
    "Hip hinge",
    "Active straight-leg raise",
    "Shoulder mobility",
    "In-line lunge",
  ];

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background text-foreground">
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[760px] lg:max-w-6xl flex-1 px-4 lg:px-8 pb-6 pt-4 lg:pt-8 space-y-6 lg:space-y-8">
        <Card className="border-2 border-primary">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <Play className="w-12 h-12 text-primary mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">
                How <span className="text-primary">It Works</span>
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Five steps, five minutes. From scan to a daily routine built on your real limits.
              </p>
              <div className="grid gap-4 pt-2 lg:grid-cols-[1fr_280px] lg:items-start">
                <div className="space-y-3 text-left">
                  {steps.map(({ n, Icon, color, title, body }) => {
                    const isScreen = n === 2;
                    const row = (
                      <div className={`flex items-start gap-3 rounded-xl ${isScreen ? "sm-step-screen p-2 -m-2 cursor-pointer transition hover:bg-primary/5" : ""}`}>
                        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-extrabold ${isScreen ? "bg-primary text-white sm-step-pulse" : "bg-primary/10 text-primary"}`}>
                          {n}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${color}`} />
                            <span className="text-sm font-bold text-foreground">{title}</span>
                            {isScreen && <ChevronRight className="w-4 h-4 text-primary lg:hidden" />}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{body}</div>
                        </div>
                      </div>
                    );
                    return isScreen ? (
                      <Link key={n} to="/movement-patterns" aria-label="See the 5 movement patterns we test">
                        {row}
                      </Link>
                    ) : (
                      <div key={n}>{row}</div>
                    );
                  })}
                </div>
                <Link
                  to="/movement-patterns"
                  className="block rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 text-left transition hover:border-primary hover:bg-primary/10"
                >
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-primary" />
                    <span className="text-sm font-extrabold text-foreground">The 5 Movement Patterns</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Our methodology: 5 functional tests scored by your camera — full-body mobility, stability & control.
                  </p>
                  <ul className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
                    {patterns.map((p, i) => (
                      <li key={p} className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                        <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/15 text-[9px] font-extrabold text-primary">{i + 1}</span>
                        <span className="truncate">{p}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex items-center gap-1 text-xs font-bold text-primary">
                    See the tests <ChevronRight className="w-4 h-4" />
                  </div>
                </Link>
              </div>
              <Link to={freeAccessMode ? "/app/screen" : "/pricing"}>
                <Button size="lg" className="w-full mt-2">Take a Movement Scan</Button>
              </Link>
              <style>{`
                @keyframes sm-step-pulse-kf {
                  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 hsl(var(--primary) / 0.55); }
                  50%      { transform: scale(1.08); box-shadow: 0 0 0 8px hsl(var(--primary) / 0); }
                }
                .sm-step-pulse { animation: sm-step-pulse-kf 1.6s ease-in-out infinite; }
                @media (prefers-reduced-motion: reduce) { .sm-step-pulse { animation: none; } }
              `}</style>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <Info className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-xl font-bold text-foreground">New to SmartyMove?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Read what SmartyMove is, who it's for, and why it exists.
              </p>
              <Link to="/about" className="inline-flex items-center gap-1 text-sm font-extrabold text-primary hover:underline">
                About SmartyMove <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
