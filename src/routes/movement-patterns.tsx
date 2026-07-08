import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, ArrowDownWideNarrow, Footprints, Activity, ArrowUpDown, Dumbbell, RotateCw, Anchor, Target, Play } from "lucide-react";

const URL = "https://smartymove.com/movement-patterns";

export const Route = createFileRoute("/movement-patterns")({
  head: () => ({
    meta: [
      { title: "The 8 Movement Patterns — SmartyMove Methodology" },
      { name: "description", content: "SmartyMove's camera-based movement screen tests 8 functional patterns — deep squat, hurdle step, in-line lunge, active straight-leg raise, shoulder mobility, trunk stability push-up, rotary stability, and hip-hinge — for full-body mobility, stability, balance, and control." },
      { property: "og:title", content: "The 8 Movement Patterns — SmartyMove Methodology" },
      { property: "og:description", content: "Our methodology: 8 functional tests scored by your phone camera for full-body mobility, stability, balance, and control." },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: MovementPatternsPage,
});

const patterns = [
  { n: 1, Icon: ArrowDownWideNarrow, color: "text-blue-500", name: "Deep squat", tests: "Full-body mobility", body: "Hips, knees and ankles moving together with upright trunk and overhead shoulders." },
  { n: 2, Icon: Footprints, color: "text-orange-500", name: "Hurdle step", tests: "Single-leg stability", body: "Stride mechanics and pelvis control while stepping over an obstacle." },
  { n: 3, Icon: Activity, color: "text-purple-500", name: "In-line lunge", tests: "Hip / ankle mobility & balance", body: "Split-stance control challenging opposite-side hip and ankle." },
  { n: 4, Icon: ArrowUpDown, color: "text-emerald-500", name: "Active straight-leg raise", tests: "Hamstring & hip mobility", body: "Active hip flexion of one leg while the other stays extended and stable." },
  { n: 5, Icon: Dumbbell, color: "text-cyan-500", name: "Shoulder mobility", tests: "Shoulder range & symmetry", body: "Reciprocal shoulder range — reaching up-and-behind vs down-and-behind." },
  { n: 6, Icon: Anchor, color: "text-pink-500", name: "Trunk stability push-up", tests: "Core & anti-extension strength", body: "Symmetrical push-up with the spine holding a rigid line." },
  { n: 7, Icon: RotateCw, color: "text-indigo-500", name: "Rotary stability", tests: "Multi-plane core control", body: "Coordinated arm and leg motion on all fours without rotation of the trunk." },
  { n: 8, Icon: Target, color: "text-amber-500", name: "Hip-hinge", tests: "Posterior chain pattern", body: "Bending from the hips with a neutral spine — the foundation of lifting." },
];

function MovementPatternsPage() {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background text-foreground">
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[760px] lg:max-w-6xl flex-1 px-4 lg:px-8 pb-6 pt-4 lg:pt-8 space-y-6">
        {/* Hero */}
        <Card className="border-2 border-primary">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <ListChecks className="w-12 h-12 text-primary mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">
                The <span className="text-primary">8 Movement Patterns</span>
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our methodology: 8 functional tests scored by your phone camera — together they cover full-body{" "}
                <strong className="text-foreground">mobility</strong>,{" "}
                <strong className="text-foreground">stability</strong>,{" "}
                <strong className="text-foreground">balance</strong>, and{" "}
                <strong className="text-foreground">motor control</strong>.
              </p>
              <Link to="/app/screen">
                <Button size="lg" className="w-full mt-2">
                  <Play className="w-4 h-4 mr-2" /> Start your Movement Scan
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Patterns grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {patterns.map(({ n, Icon, color, name, tests, body }) => (
            <Card key={n} className="border-2 border-primary/40 hover:border-primary transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-base font-extrabold text-primary">
                    {n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${color} shrink-0`} />
                      <span className="text-base font-bold text-foreground truncate">{name}</span>
                    </div>
                    <div className="text-[11px] uppercase tracking-wider font-bold text-primary mt-1">{tests}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">{body}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <Card className="border-2 border-primary">
          <CardContent className="p-6 text-center space-y-3">
            <h2 className="text-xl font-bold text-foreground">Ready to see how you move?</h2>
            <p className="text-sm text-muted-foreground">
              Prop your phone, follow the prompts, and get your Smarty Movement Score™ in about 5 minutes.
            </p>
            <Link to="/app/screen">
              <Button size="lg" className="w-full mt-1">
                <Play className="w-4 h-4 mr-2" /> Get started
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}