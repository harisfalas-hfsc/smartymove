import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Brain,
  ClipboardCheck,
  DollarSign,
  Dumbbell,
  ExternalLink,
  Heart,
  Lightbulb,
  Quote,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/why-movement-matters")({
  head: () => ({
    meta: [
      { title: "Why Movement Matters — The Science of Moving Smarter | SmartyMove" },
      {
        name: "description",
        content:
          "Movement quality predicts injury, performance, and long-term health. See the research, case studies, and cost of poor movement — and why SmartyMove exists.",
      },
      { property: "og:title", content: "Why Movement Matters" },
      {
        property: "og:description",
        content:
          "The science behind movement screening — FMS, Gray Cook, injury prevention, performance and the real cost of moving badly.",
      },
      { property: "og:url", content: "https://smartymove.com/why-movement-matters" },
    ],
    links: [{ rel: "canonical", href: "https://smartymove.com/why-movement-matters" }],
  }),
  component: WhyMovementMatters,
});

function WhyMovementMatters() {
  const stats = [
    {
      Icon: AlertTriangle,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      value: "2.7×",
      label: "higher injury risk for people scoring ≤14 on the FMS",
      source: "Kiesel et al., NFL study (2007)",
    },
    {
      Icon: Heart,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      value: "619M",
      label: "people worldwide live with low back pain — the #1 cause of disability",
      source: "WHO, 2023",
    },
    {
      Icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      value: "$134B",
      label: "annual U.S. spend on musculoskeletal conditions — most from preventable causes",
      source: "United States Bone and Joint Initiative",
    },
    {
      Icon: TrendingUp,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      value: "80%",
      label: "of adults will experience low back pain at some point in life",
      source: "NIH / NINDS",
    },
  ];

  const pillars = [
    {
      emoji: "🎯",
      Icon: Target,
      color: "text-orange-500",
      title: "Mobility",
      body: "Can your joints reach the positions life and sport demand? Missing range shows up as pain — usually somewhere else.",
    },
    {
      emoji: "🛡️",
      Icon: ShieldCheck,
      color: "text-blue-500",
      title: "Stability",
      body: "Can you control the range you have? Uncontrolled motion is where injuries happen, especially at the spine and knee.",
    },
    {
      emoji: "⚡",
      Icon: Zap,
      color: "text-purple-500",
      title: "Symmetry",
      body: "Left vs right asymmetries are one of the strongest predictors of injury — even in pain-free athletes.",
    },
    {
      emoji: "🧠",
      Icon: Brain,
      color: "text-emerald-500",
      title: "Motor control",
      body: "Your brain owns your movement. Screen the pattern, retrain the pattern — that's what changes.",
    },
  ];

  const cases = [
    {
      emoji: "🏈",
      Icon: Trophy,
      color: "text-orange-500",
      title: "NFL — Injury Prediction",
      body: "Kiesel and colleagues screened 46 pro football players pre-season. Those scoring ≤14 on the Functional Movement Screen were 11× more likely to suffer a serious injury during the season.",
      ref: "Kiesel, Plisky & Voight (2007), N Am J Sports Phys Ther",
    },
    {
      emoji: "🎖️",
      Icon: ShieldCheck,
      color: "text-blue-500",
      title: "U.S. Marines — Preventable Losses",
      body: "In 874 Marine officer candidates, those with FMS ≤14 or any asymmetry had significantly higher rates of overuse injury during training — a cost measured in careers, not just clinic visits.",
      ref: "O'Connor et al. (2011), Med Sci Sports Exerc",
    },
    {
      emoji: "🏃",
      Icon: Activity,
      color: "text-emerald-500",
      title: "Runners & Everyday Movers",
      body: "Meta-analyses across sports show FMS ≤14 roughly doubles injury risk. The good news: targeted corrective work moves scores up — and injury risk down.",
      ref: "Bonazza et al. (2017), Am J Sports Med — systematic review",
    },
    {
      emoji: "💼",
      Icon: DollarSign,
      color: "text-purple-500",
      title: "Workplaces & Insurance",
      body: "Firefighters, police, and industrial workers screened with FMS show fewer time-loss injuries and lower workers' comp claims — insurers now fund pre-hire and annual movement screens.",
      ref: "Butler et al. (2013), J Strength Cond Res",
    },
  ];

  const graySpine = [
    {
      emoji: "🔍",
      Icon: ClipboardCheck,
      title: "First, screen",
      body: "You can't fix what you haven't measured. Screening exposes the pattern — not just where it hurts.",
    },
    {
      emoji: "🧩",
      Icon: Lightbulb,
      title: "Mobility before stability",
      body: "If a joint can't move, no amount of strength work will make it safe. Restore range first.",
    },
    {
      emoji: "🛠️",
      Icon: Dumbbell,
      title: "Then, load the pattern",
      body: "Once movement is clean, strength and skill build on top of it — instead of on top of a compensation.",
    },
  ];

  const audience = [
    { emoji: "💻", label: "Desk Workers", body: "Hips and shoulders locked from 8 hours of sitting." },
    { emoji: "🏋️", label: "Lifters", body: "Squat and press with the range and control your joints deserve." },
    { emoji: "🏃", label: "Runners", body: "Asymmetry is the silent tax on your mileage." },
    { emoji: "👶", label: "Parents", body: "Lifting kids all day is training — screen it before it screens you." },
    { emoji: "🎓", label: "Beginners", body: "Start with movement literacy, not another workout plan." },
    { emoji: "✈️", label: "Travelers", body: "Reset your body on the road in 5 minutes." },
  ];

  const refs = [
    {
      label: "Functional Movement Systems — official site",
      url: "https://www.functionalmovement.com",
    },
    {
      label: "Gray Cook — Movement (book, 2010) publisher page",
      url: "https://www.otpbooks.com/product/gray-cook-movement-book/",
    },
    {
      label: "Kiesel et al. (2007) — Can Serious Injury in Pro Football Be Predicted by FMS?",
      url: "https://pubmed.ncbi.nlm.nih.gov/21522213/",
    },
    {
      label: "Bonazza et al. (2017) — Reliability, Validity & Injury Predictive Value of the FMS",
      url: "https://pubmed.ncbi.nlm.nih.gov/27912244/",
    },
    {
      label: "O'Connor et al. (2011) — FMS & Injury Risk in Marine Officer Candidates",
      url: "https://pubmed.ncbi.nlm.nih.gov/21694637/",
    },
    {
      label: "WHO — Low back pain fact sheet (2023)",
      url: "https://www.who.int/news-room/fact-sheets/detail/low-back-pain",
    },
  ];

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background text-foreground">
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[760px] lg:max-w-6xl flex-1 px-4 lg:px-8 pb-8 pt-4 lg:pt-8 space-y-6 lg:space-y-8">
        {/* Hero */}
        <Card className="border-2 border-primary overflow-hidden">
          <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl lg:text-4xl font-bold text-foreground leading-tight">
                Why <span className="text-primary">Movement</span> Matters
              </h1>
              <p className="text-sm lg:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
                Movement quality predicts injury, performance and long-term health.
                Here's the science, the case studies, and the real cost of moving badly —
                and why SmartyMove exists.
              </p>
            </CardContent>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.map(({ Icon, color, bg, value, label, source }) => (
            <Card key={label} className="border-2 border-primary/40">
              <CardContent className="p-4 flex gap-3 items-start">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${bg}`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-2xl font-extrabold text-foreground leading-none">{value}</div>
                  <div className="text-xs text-foreground/90 mt-1 leading-snug">{label}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 italic">{source}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gray Cook quote */}
        <Card className="border-2 border-primary bg-primary/5">
          <CardContent className="p-6">
            <Quote className="w-8 h-8 text-primary mb-2" />
            <blockquote className="text-base lg:text-lg font-semibold text-foreground leading-snug">
              "First move well. Then move often."
            </blockquote>
            <div className="mt-2 text-xs text-muted-foreground">
              — Gray Cook, physical therapist & co-creator of the Functional Movement Screen (FMS)
            </div>
          </CardContent>
        </Card>

        {/* The 4 pillars of movement quality */}
        <Card className="border-2 border-primary">
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <BookOpen className="w-10 h-10 text-primary mx-auto" />
              <h2 className="text-xl lg:text-2xl font-bold">
                What is <span className="text-primary">movement quality</span>?
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                It's not how much you lift or how far you run. It's whether your body can
                produce clean, symmetrical, controlled motion — under load, under fatigue, over time.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {pillars.map(({ emoji, Icon, color, title, body }) => (
                <div
                  key={title}
                  className="rounded-xl border border-primary/30 bg-card p-4 flex gap-3 items-start"
                >
                  <div className="text-2xl leading-none pt-0.5" aria-hidden>{emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-sm font-bold">{title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Case studies */}
        <Card className="border-2 border-primary">
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <Trophy className="w-10 h-10 text-primary mx-auto" />
              <h2 className="text-xl lg:text-2xl font-bold">
                Case <span className="text-primary">Studies</span>
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                From pros to Marines to insurance data — the same pattern shows up:
                low movement scores predict injuries you can prevent.
              </p>
            </div>
            <div className="space-y-3">
              {cases.map(({ emoji, Icon, color, title, body, ref }) => (
                <div
                  key={title}
                  className="rounded-xl border border-primary/30 bg-card p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden>{emoji}</span>
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-sm font-bold">{title}</span>
                  </div>
                  <p className="text-xs text-foreground/90 mt-2 leading-relaxed">{body}</p>
                  <p className="text-[11px] text-muted-foreground mt-2 italic">{ref}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gray Cook's methodology */}
        <Card className="border-2 border-primary">
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <Lightbulb className="w-10 h-10 text-primary mx-auto" />
              <h2 className="text-xl lg:text-2xl font-bold">
                The <span className="text-primary">Gray Cook</span> Principle
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                SmartyMove is built on the philosophy that shaped modern movement screening.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {graySpine.map(({ emoji, Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-xl border border-primary/30 bg-card p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden>{emoji}</span>
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold">{title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Who this is for */}
        <Card className="border-2 border-primary">
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <Users className="w-10 h-10 text-primary mx-auto" />
              <h2 className="text-xl lg:text-2xl font-bold">
                Who <span className="text-primary">Needs This</span>?
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Everyone with a body — but especially:
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {audience.map(({ emoji, label, body }) => (
                <div
                  key={label}
                  className="rounded-xl border border-primary/30 bg-card p-4 flex gap-3 items-start"
                >
                  <div className="text-2xl leading-none pt-0.5" aria-hidden>{emoji}</div>
                  <div>
                    <div className="text-sm font-bold">{label}</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* References */}
        <Card className="border-2 border-primary">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-bold">References & Further Reading</h2>
            </div>
            <ul className="space-y-2">
              {refs.map(({ label, url }) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1.5 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-foreground italic pt-2">
              SmartyMove is an educational movement tool. It is not medical advice — if you're in pain,
              see a qualified clinician.
            </p>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="border-2 border-primary overflow-hidden">
          <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
            <CardContent className="p-6 text-center space-y-4">
              <Target className="w-10 h-10 text-primary mx-auto" />
              <h2 className="text-xl lg:text-2xl font-bold">
                Ready to see <span className="text-primary">how you move</span>?
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Take a 5-minute camera-based screen. Get your Movement Score. Fix the root cause.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
                <Link to="/pricing">
                  <Button size="lg" className="w-full sm:w-auto">Take a Movement Scan</Button>
                </Link>
                <Link to="/movement-patterns">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    See the 5 patterns
                  </Button>
                </Link>
              </div>
            </CardContent>
          </div>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}