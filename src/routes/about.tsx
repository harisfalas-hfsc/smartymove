import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Camera, Activity, Target, ShieldCheck, Repeat, Users, Heart, GraduationCap, Dumbbell, Plane, Briefcase, Play, ChevronRight, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useFreeAccessMode } from "@/hooks/useFreeAccessMode";

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
  const { freeAccessMode } = useFreeAccessMode();
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
              <Link to={freeAccessMode ? "/app/screen" : "/pricing"}>
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
              <div className="pt-1 text-left">
                <Link
                  to="/why-movement-matters"
                  className="inline-flex items-center gap-1 text-sm font-extrabold text-primary hover:underline"
                >
                  Learn more <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
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


        {/* Link to How it works */}
        <Card className="border-2 border-primary">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <Play className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">
                How <span className="text-primary">It Works</span>
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Set up, screen with your camera, see your results, train 5 minutes a day, and rescan
                every 14 days. The full 5-step flow — plus the movement patterns we test — lives on its own page.
              </p>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-1 text-sm font-extrabold text-primary hover:underline"
              >
                See how it works <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

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