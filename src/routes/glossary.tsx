import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const URL = "https://smartymove.com/glossary";

type Term = { term: string; definition: string; id: string };

const TERMS: Term[] = [
  { id: "smarty-movement-score", term: "Smarty Movement Score™", definition: "A single 0–100 score summarizing movement quality across the eight SmartyMove tests. Weighted from Mobility (30%), Stability (30%), Balance (20%) and Movement Quality (20%)." },
  { id: "smarty-movement-age", term: "Smarty Movement Age™", definition: "An age-equivalent derived from the Smarty Movement Score™. Answers whether a body moves younger or older than its chronological age." },
  { id: "smarty-mobility-index", term: "Smarty Mobility Index™", definition: "Sub-score reflecting joint range of motion across the squat, hinge, shoulder mobility, active straight-leg raise and in-line lunge patterns." },
  { id: "smarty-stability-index", term: "Smarty Stability Index™", definition: "Sub-score reflecting motor control and joint stability across hurdle step, in-line lunge, trunk-stability push-up and rotary stability." },
  { id: "smarty-movement-intelligence", term: "Smarty Movement Intelligence™", definition: "The combined measurable capacity of mobility, stability, balance and motor control that determines how efficiently and safely a body moves." },
  { id: "functional-movement-screen", term: "Functional Movement Screen (FMS)", definition: "Standardized set of seven functional movement tests used by clinicians to identify limitations and asymmetries. SmartyMove is the AI-powered app version." },
  { id: "movement-pattern", term: "Movement Pattern", definition: "A coordinated, whole-body movement — squat, hinge, lunge, push, pull, rotation, gait — used to expose mobility, stability and motor-control deficits." },
  { id: "compensation", term: "Compensation", definition: "A substitute motion the body uses to complete a task when the primary joint or muscle can't. Examples: heel rise, spine rounding, knee valgus, shoulder shrug." },
  { id: "mobility", term: "Mobility", definition: "The active range of motion a joint can produce under control. Not the same as flexibility, which is passive." },
  { id: "stability", term: "Stability", definition: "The ability to control a joint through its range under load or perturbation. Requires strength, motor control and timing." },
  { id: "corrective-exercise", term: "Corrective Exercise", definition: "A targeted mobility, stability or strength drill selected to address a specific movement deficit identified by screening." },
  { id: "root-cause-clustering", term: "Root-Cause Clustering", definition: "SmartyMove's engine groups failed tests into at most two primary areas (e.g. Ankle + Hip) so the corrective program stays focused." },
  { id: "movement-quality", term: "Movement Quality", definition: "The smoothness, tempo, symmetry and control observed during a movement — independent of raw range or strength." },
  { id: "postural-assessment", term: "Postural Assessment", definition: "Evaluation of resting alignment and dynamic posture, used alongside movement screening to identify chronic loading patterns." },
  { id: "movement-age", term: "Movement Age", definition: "A general term for expressing movement quality as an age-equivalent; SmartyMove's implementation is the Smarty Movement Age™." },
  { id: "movement-screening", term: "Movement Screening", definition: "The process of running a standardized set of tests to detect movement limitations, asymmetries and injury risk before they cause symptoms." },
  { id: "movement-analysis", term: "Movement Analysis", definition: "Detailed measurement of how a body moves — joint angles, timing, symmetry, compensations — usually via pose detection, motion capture or clinical observation." },
  { id: "ai-movement-coach", term: "AI Movement Coach", definition: "Software that observes movement via camera, scores it against biomechanical criteria and prescribes corrective work — the role SmartyMove plays." },
  { id: "biomechanics", term: "Biomechanics", definition: "The study of forces, motion and structure of the human body during movement." },
  { id: "movement-dysfunction", term: "Movement Dysfunction", definition: "A pattern of restricted, unstable or compensated movement that raises injury risk and reduces performance." },
];

export const Route = createFileRoute("/glossary")({
  head: () => ({
    meta: [
      { title: "Movement Glossary — Definitions of Movement Score, Mobility, Stability & More | SmartyMove" },
      { name: "description", content: "Plain-language definitions of every SmartyMove metric and movement concept: Smarty Movement Score™, Movement Age™, Mobility Index™, Stability Index™, functional movement screen, corrective exercise, compensations, biomechanics." },
      { property: "og:title", content: "SmartyMove Movement Glossary" },
      { property: "og:description", content: "Definitions of every movement-intelligence term used across SmartyMove." },
      { property: "og:url", content: URL },
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
    <div className="flex min-h-[100dvh] w-full flex-col" style={{ background: "#ffffff", color: "#14213A" }}>
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[820px] flex-1 px-5 pb-8 pt-5">
        <h1 style={{ fontWeight: 800, fontSize: 30, letterSpacing: "-0.02em", margin: "8px 0 14px", lineHeight: 1.15 }}>Movement Glossary</h1>
        <p style={{ fontSize: 16, lineHeight: 1.65, color: "#3B4A63", margin: "0 0 22px" }}>
          Definitions of the metrics, terms, and concepts used across SmartyMove — the AI Movement Intelligence Platform.
        </p>
        <dl style={{ background: "#fff", border: "1px solid #E5EAEC", borderRadius: 18, padding: "22px 24px" }}>
          {TERMS.map((t) => (
            <div key={t.id} id={t.id} style={{ marginBottom: 16 }}>
              <dt style={{ fontWeight: 700, fontSize: 17, color: "#14213A", margin: "0 0 4px" }}>{t.term}</dt>
              <dd style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: "#3B4A63" }}>{t.definition}</dd>
            </div>
          ))}
        </dl>
        <p style={{ marginTop: 18 }}>
          <Link to="/movement-intelligence" style={{ color: "#0E7C86", fontWeight: 700 }}>← Back to the Movement Intelligence pillar</Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}