import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Gauge,
  CalendarClock,
  Wind,
  Anchor,
  Sparkles,
  ClipboardCheck,
  Activity,
  Shuffle,
  Move,
  Shield,
  Dumbbell,
  Network,
  Gem,
  AlignCenter,
  ScanSearch,
  LineChart,
  Bot,
  Atom,
  AlertOctagon,
  ChevronRight,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";

const URL = "https://smartymove.com/glossary";

type Term = { term: string; definition: string; id: string; Icon: LucideIcon; color: string };

const TERMS: Term[] = [
  { id: "smarty-movement-score", term: "Smarty Movement Score™", definition: "A single 0–100 score summarizing movement quality across the five SmartyMove tests. Weighted from Mobility (30%), Stability (30%), Balance (20%) and Movement Quality (20%).", Icon: Gauge, color: "text-blue-500" },
  { id: "smarty-movement-age", term: "Smarty Movement Age™", definition: "An age-equivalent derived from the Smarty Movement Score™. Answers whether a body moves younger or older than its chronological age.", Icon: CalendarClock, color: "text-purple-500" },
  { id: "smarty-mobility-index", term: "Smarty Mobility Index™", definition: "Sub-score reflecting joint range of motion across the squat, hinge, shoulder mobility, active straight-leg raise and in-line lunge patterns.", Icon: Wind, color: "text-cyan-500" },
  { id: "smarty-stability-index", term: "Smarty Stability Index™", definition: "Sub-score reflecting motor control and joint stability across the in-line lunge and hip-hinge patterns.", Icon: Anchor, color: "text-emerald-500" },
  { id: "smarty-movement-intelligence", term: "Smarty Movement Intelligence™", definition: "The combined measurable capacity of mobility, stability, balance and motor control that determines how efficiently and safely a body moves.", Icon: Sparkles, color: "text-pink-500" },
  { id: "functional-movement-screen", term: "Functional Movement Screen (FMS)", definition: "Standardized set of seven functional movement tests used by clinicians to identify limitations and asymmetries. SmartyMove is the AI-powered app version.", Icon: ClipboardCheck, color: "text-orange-500" },
  { id: "movement-pattern", term: "Movement Pattern", definition: "A coordinated, whole-body movement — squat, hinge, lunge, push, pull, rotation, gait — used to expose mobility, stability and motor-control deficits.", Icon: Activity, color: "text-blue-500" },
  { id: "compensation", term: "Compensation", definition: "A substitute motion the body uses to complete a task when the primary joint or muscle can't. Examples: heel rise, spine rounding, knee valgus, shoulder shrug.", Icon: Shuffle, color: "text-amber-500" },
  { id: "mobility", term: "Mobility", definition: "The active range of motion a joint can produce under control. Not the same as flexibility, which is passive.", Icon: Move, color: "text-cyan-500" },
  { id: "stability", term: "Stability", definition: "The ability to control a joint through its range under load or perturbation. Requires strength, motor control and timing.", Icon: Shield, color: "text-emerald-500" },
  { id: "corrective-exercise", term: "Corrective Exercise", definition: "A targeted mobility, stability or strength drill selected to address a specific movement deficit identified by screening.", Icon: Dumbbell, color: "text-orange-500" },
  { id: "root-cause-clustering", term: "Root-Cause Clustering", definition: "SmartyMove's engine groups failed tests into at most two primary areas (e.g. Ankle + Hip) so the corrective program stays focused.", Icon: Network, color: "text-purple-500" },
  { id: "movement-quality", term: "Movement Quality", definition: "The smoothness, tempo, symmetry and control observed during a movement — independent of raw range or strength.", Icon: Gem, color: "text-pink-500" },
  { id: "postural-assessment", term: "Postural Assessment", definition: "Evaluation of resting alignment and dynamic posture, used alongside movement screening to identify chronic loading patterns.", Icon: AlignCenter, color: "text-blue-500" },
  { id: "movement-age", term: "Movement Age", definition: "A general term for expressing movement quality as an age-equivalent; SmartyMove's implementation is the Smarty Movement Age™.", Icon: CalendarClock, color: "text-purple-500" },
  { id: "movement-screening", term: "Movement Screening", definition: "The process of running a standardized set of tests to detect movement limitations, asymmetries and injury risk before they cause symptoms.", Icon: ScanSearch, color: "text-cyan-500" },
  { id: "movement-analysis", term: "Movement Analysis", definition: "Detailed measurement of how a body moves — joint angles, timing, symmetry, compensations — usually via pose detection, motion capture or clinical observation.", Icon: LineChart, color: "text-emerald-500" },
  { id: "ai-movement-coach", term: "AI Movement Coach", definition: "Software that observes movement via camera, scores it against biomechanical criteria and prescribes corrective work — the role SmartyMove plays.", Icon: Bot, color: "text-orange-500" },
  { id: "biomechanics", term: "Biomechanics", definition: "The study of forces, motion and structure of the human body during movement.", Icon: Atom, color: "text-purple-500" },
  { id: "movement-dysfunction", term: "Movement Dysfunction", definition: "A pattern of restricted, unstable or compensated movement that raises injury risk and reduces performance.", Icon: AlertOctagon, color: "text-rose-500" },
];

const TOPIC_LINKS = [
  { to: "/movement-assessment", label: "Movement assessment" },
  { to: "/functional-movement-screening", label: "Functional movement screening" },
  { to: "/corrective-exercise", label: "Corrective exercise" },
  { to: "/mobility-and-stability", label: "Mobility & stability" },
  { to: "/posture-and-movement-quality", label: "Movement quality" },
  { to: "/injury-prevention", label: "Injury prevention" },
];

export const Route = createFileRoute("/glossary")({
  head: () => ({
    meta: [
      { title: "Movement Glossary — Definitions of Movement Score, Mobility, Stability & More | SmartyMove" },
      { name: "description", content: "Plain-language definitions of every SmartyMove metric and movement concept: Smarty Movement Score™, Movement Age™, Mobility Index™, Stability Index™, functional movement screen, corrective exercise, compensations, biomechanics." },
      { property: "og:title", content: "SmartyMove Movement Glossary" },
      { property: "og:description", content: "Definitions of every movement-intelligence term used across SmartyMove." },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "DefinedTermSet",
              "@id": URL + "#glossary",
              name: "SmartyMove Movement Glossary",
              inLanguage: "en",
              url: URL,
              hasDefinedTerm: TERMS.map((t) => ({
                "@type": "DefinedTerm",
                "@id": `${URL}#${t.id}`,
                name: t.term,
                description: t.definition,
                inDefinedTermSet: URL + "#glossary",
              })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://smartymove.com/" },
                { "@type": "ListItem", position: 2, name: "Glossary", item: URL },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: Glossary,
});

function Glossary() {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background text-foreground">
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[760px] lg:max-w-6xl flex-1 px-4 lg:px-8 pb-6 pt-4 lg:pt-8 space-y-6 lg:space-y-8">
        {/* Header card */}
        <Card className="border-2 border-primary">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <BookOpen className="w-12 h-12 text-primary mx-auto" />
              <h1 className="text-2xl font-bold uppercase text-foreground">
                Movement <span className="text-primary">Glossary</span>
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Definitions of the metrics, terms, and concepts used across SmartyMove — the AI Movement Intelligence Platform.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Term cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {TERMS.map(({ id, term, definition, Icon, color }) => (
            <Card
              key={id}
              id={id}
              className="border-2 border-primary/30 transition hover:border-primary scroll-mt-20"
            >
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10">
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <h2 className="text-base font-bold text-foreground leading-tight">{term}</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-[52px]">
                  {definition}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Movement topics */}
        <Card className="border-2 border-primary">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <Network className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-xl font-bold text-foreground">
                Movement <span className="text-primary">Topics</span>
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 text-left">
                {TOPIC_LINKS.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-bold text-primary transition hover:border-primary hover:bg-primary/10"
                  >
                    {l.label}
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            to="/movement-intelligence"
            className="inline-flex items-center gap-1 text-sm font-extrabold text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to the Movement Intelligence pillar
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
