import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Camera, Activity, Target, ShieldCheck, Repeat, Compass, Users, Heart, GraduationCap, Dumbbell, Plane, Briefcase, Play, Search, Calendar, TrendingUp, ListChecks, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About SmartyMove — Your pocket movement coach" },
      { name: "description", content: "SmartyMove is a camera-based movement screen and corrective training app. Find out what's holding your body back, then fix it in 5 minutes a day." },
      { property: "og:title", content: "About SmartyMove" },
      { property: "og:description", content: "Know how you move. Move smarter. The pocket movement coach for everyday humans." },
      { property: "og:url", content: "https://smartymove.com/about" },
    ],
    links: [{ rel: "canonical", href: "https://smartymove.com/about" }],
  }),
  component: About,
});

function About() {
  const whatItDoes = [
    { Icon: Camera, color: "text-blue-500", label: "Camera-based Movement Screen" },
    { Icon: Activity, color: "text-emerald-500", label: "Movement Score & Movement Age" },
    { Icon: Target, color: "text-orange-500", label: "Root-cause corrective program" },
    { Icon: Repeat, color: "text-purple-500", label: "5 minutes a day, structured in phases" },
    { Icon: Sparkles, color: "text-pink-500", label: "Compensation & asymmetry detection" },
    { Icon: ShieldCheck, color: "text-cyan-500", label: "Private by design — on-device pose tracking" },
  ];

  const audience = [
    { Icon: Briefcase, color: "text-blue-500", label: "Desk Workers" },
    { Icon: Dumbbell, color: "text-orange-500", label: "Lifters" },
    { Icon: Activity, color: "text-emerald-500", label: "Runners" },
    { Icon: Heart, color: "text-pink-500", label: "Parents" },
    { Icon: GraduationCap, color: "text-purple-500", label: "Beginners" },
    { Icon: Plane, color: "text-cyan-500", label: "Travelers" },
  ];

  const howItWorks = [
    { n: 1, Icon: Compass, color: "text-blue-500", title: "Set up", body: "Quick readiness questionnaire and goal." },
    { n: 2, Icon: Camera, color: "text-orange-500", title: "Screen", body: "Prop your phone, follow the prompts, 5 short tests." },
    { n: 3, Icon: Search, color: "text-purple-500", title: "See your results", body: "Score, Movement Age, and the real root cause." },
    { n: 4, Icon: Play, color: "text-emerald-500", title: "Train", body: "Your 5-minute daily routine — mobility, stability, strength." },
    { n: 5, Icon: TrendingUp, color: "text-cyan-500", title: "Rescan every 14 days", body: "Watch your score improve, your program evolve." },
  ];

  const eightPatterns = [
    "Deep squat",
    "Hurdle step",
    "In-line lunge",
    "Active straight-leg raise",
    "Shoulder mobility",
    "Trunk stability push-up",
    "Rotary stability",
    "Hip-hinge",
  ];

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background text-foreground">
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[760px] lg:max-w-6xl flex-1 px-4 lg:px-8 pb-6 pt-4 lg:pt-8 space-y-6 lg:space-y-8">
        {/* Hero card — mirrors SmartyGym "Your Gym Re-imagined" */}
        <Card className="border-2 border-primary">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <Target className="w-12 h-12 text-primary mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">
                Know How You Move. <span className="text-primary">Move Smarter.</span>
              </h1>
              <div className="space-y-3 text-left pt-1">
                {whatItDoes.map(({ Icon, color, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${color} flex-shrink-0`} />
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                Your pocket movement coach — a camera-based screen and a short daily routine built around what your body actually needs.
              </p>
              <Link to="/pricing">
                <Button size="lg" className="w-full mt-2">Take a Movement Scan</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Why SmartyMove exists */}
        <Card className="border-2 border-primary">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <Sparkles className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">
                Why <span className="text-primary">SmartyMove</span> Exists
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed text-left">
                Most people don't know how their body actually moves. They feel stiff, sore, or stuck —
                but they don't know <strong className="text-foreground">where</strong> the limit is,{" "}
                <strong className="text-foreground">why</strong> it's there, or{" "}
                <strong className="text-foreground">what</strong> to do about it.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed text-left">
                SmartyMove turns your phone camera into a movement screen. In 5 minutes you get a clear
                picture of how you move and a short daily routine that targets the{" "}
                <strong className="text-primary">root cause</strong> — not just the symptoms.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="border-2 border-primary">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <Play className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">
                How <span className="text-primary">It Works</span>
              </h2>
              <div className="grid gap-4 pt-2 lg:grid-cols-[1fr_280px] lg:items-start">
                <div className="space-y-3 text-left">
                  {howItWorks.map(({ n, Icon, color, title, body }) => {
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
                      <Link key={n} to="/movement-patterns" aria-label="See the 8 movement patterns we test">
                        {row}
                      </Link>
                    ) : (
                      <div key={n}>{row}</div>
                    );
                  })}
                </div>
                {/* Methodology mini-card — 8 movement patterns */}
                <Link
                  to="/movement-patterns"
                  className="block rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 text-left transition hover:border-primary hover:bg-primary/10"
                >
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-primary" />
                    <span className="text-sm font-extrabold text-foreground">The 8 Movement Patterns</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Our methodology: 8 functional tests scored by your camera — full-body mobility, stability, balance & control.
                  </p>
                  <ul className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
                    {eightPatterns.map((p, i) => (
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

        {/* Who it's for */}
        <Card className="border-2 border-primary">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <Users className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">
                Who <span className="text-primary">SmartyMove</span> Is For
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {audience.map(({ Icon, color, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <Icon className={`w-7 h-7 ${color}`} />
                    <span className="text-xs font-bold text-foreground text-center leading-tight">{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Anyone who wants to move better — and is tired of generic routines that don't match their body.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Safety */}
        <Card className="border-2 border-primary">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
              <h2 className="text-xl font-bold text-foreground">Wellness Tool, Not Medical Advice</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                SmartyMove is an education and wellness product. It doesn't diagnose or treat medical conditions.
                See our <Link to="/disclaimer" className="font-semibold text-primary hover:underline">disclaimer</Link> for details.
              </p>
            </div>
          </CardContent>
        </Card>

      </main>
      <SiteFooter />
    </div>
  );
}