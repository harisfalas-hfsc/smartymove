import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const URL = "https://smartymove.com/movement-intelligence";

export const Route = createFileRoute("/movement-intelligence")({
  head: () => ({
    meta: [
      { title: "AI Movement Intelligence Platform — SmartyMove" },
      { name: "description", content: "SmartyMove is the world's AI Movement Intelligence Platform: camera-based movement screening, Smarty Movement Score™, Smarty Movement Age™, and a personalized corrective exercise engine. The definitive resource for movement analysis, mobility, stability, and human performance." },
      { property: "og:title", content: "AI Movement Intelligence Platform — SmartyMove" },
      { property: "og:description", content: "The complete resource on movement intelligence: screening, scoring, corrective exercise, and AI-driven mobility improvement." },
      { property: "og:type", content: "article" },
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
              "@type": "MedicalWebPage",
              url: URL,
              name: "AI Movement Intelligence Platform",
              description: "Pillar resource on movement intelligence — screening, scoring, and corrective exercise.",
              inLanguage: "en",
              isPartOf: { "@id": "https://smartymove.com/#website" },
              about: [
                { "@type": "Thing", name: "Movement Intelligence" },
                { "@type": "Thing", name: "Functional Movement Screen" },
                { "@type": "Thing", name: "Corrective Exercise" },
                { "@type": "Thing", name: "Biomechanics" },
                { "@type": "Thing", name: "Mobility" },
                { "@type": "Thing", name: "Stability" },
              ],
              audience: { "@type": "PeopleAudience", audienceType: "general public, athletes, desk workers, older adults" },
              speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", "h2", "p"] },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://smartymove.com/" },
                { "@type": "ListItem", position: 2, name: "Movement Intelligence", item: URL },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: Pillar,
});

const SECTIONS: { h: string; p: string }[] = [
  {
    h: "What is movement intelligence?",
    p: "Movement intelligence is the measurable combination of mobility, stability, balance, and motor control that determines how efficiently and safely a body can move. SmartyMove is the AI Movement Intelligence Platform: a system that quantifies movement intelligence with the Smarty Movement Score™, translates it into the Smarty Movement Age™, and continuously improves it through a phased corrective exercise engine.",
  },
  {
    h: "Why movement intelligence matters",
    p: "Pain, injury, and lost performance rarely start where they hurt. A stiff ankle wrecks a squat, a sleepy glute overloads a low back, and a tight thoracic spine stresses a shoulder. Movement intelligence surfaces those weak links so training corrects the cause, not the symptom.",
  },
  {
    h: "The eight movement patterns SmartyMove screens",
    p: "Deep squat, hurdle step, in-line lunge, active straight-leg raise, shoulder mobility, trunk-stability push-up, rotary stability, and hip-hinge. Together they cover full-body mobility, stability, and motor control — the same domains a Functional Movement Screen assesses in a clinic, delivered by a phone camera.",
  },
  {
    h: "How the Smarty Movement Score™ is calculated",
    p: "Each pattern is graded 0–3 against FMS criteria using AI pose detection. Sub-scores are weighted — Mobility 30%, Stability 30%, Balance 20%, Movement Quality 20% — and normalized to a single 0–100 number. A higher score means fewer compensations, more range, and better motor control.",
  },
  {
    h: "What Smarty Movement Age™ tells you",
    p: "The Movement Age™ translates the score into an age-equivalent using chronological age as a reference. It answers a simple question: is your body moving younger or older than your years? The metric is designed to be lowered as your Mobility Index™ and Stability Index™ improve.",
  },
  {
    h: "From screening to a corrective program",
    p: "The Corrective Decision Engine clusters failures into at most two root-cause areas (Ankle, Knee, Hip, Low Back, Shoulder, Elbow, Wrist) and selects exercises from a curated library of mobility, stability, and strength drills — Foundation (weeks 0–1), Build (weeks 2–5), Maintain & Perform (weeks 6+). Every 14 days, a rescan updates the plan.",
  },
  {
    h: "Movement intelligence, biomechanics, and injury prevention",
    p: "Screening quantifies risk. Corrective exercise reduces it. Modern research links poor movement quality, asymmetry, and limited joint range to higher injury rates in athletes and higher pain rates in the general population. Movement intelligence turns those research signals into personal, actionable feedback.",
  },
  {
    h: "Who movement intelligence is for",
    p: "Desk workers with stiff hips and shoulders, runners and lifters protecting their joints, older adults maintaining independence, athletes chasing performance, and anyone recovering from minor musculoskeletal issues who has been cleared for exercise. Not a medical device or a substitute for a physiotherapist.",
  },
  {
    h: "Deeper topics",
    p: "Explore the SmartyMove Glossary for definitions of every metric, the Learn hub for plain-language guides, the FAQ for quick answers, and the Research page for the science behind movement screening, corrective exercise, and mobility.",
  },
];

function Pillar() {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col" style={{ background: "#ffffff", color: "#14213A" }}>
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[820px] flex-1 px-5 pb-8 pt-5">
        <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 700, color: "#0E7C86" }}>
          Pillar resource
        </div>
        <h1 style={{ fontWeight: 800, fontSize: 30, letterSpacing: "-0.02em", margin: "8px 0 14px", lineHeight: 1.15 }}>
          AI Movement Intelligence Platform
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.65, color: "#3B4A63", margin: "0 0 22px" }}>
          The complete resource on how AI turns your phone camera into a functional movement screen — and how the Smarty Movement Score™ and Smarty Movement Age™ measure and improve the way you move.
        </p>
        <div style={{ background: "#fff", border: "1px solid #E5EAEC", borderRadius: 18, padding: "22px 24px" }}>
          {SECTIONS.map((s) => (
            <section key={s.h} style={{ marginBottom: 18 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, color: "#14213A", margin: "0 0 6px" }}>{s.h}</h2>
              <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.65, color: "#3B4A63" }}>{s.p}</p>
            </section>
          ))}
          <nav aria-label="Related resources" style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 14 }}>
            <Link to="/glossary" style={{ color: "#0E7C86", fontWeight: 700 }}>Glossary →</Link>
            <Link to="/learn" style={{ color: "#0E7C86", fontWeight: 700 }}>Learn hub →</Link>
            <Link to="/faq" style={{ color: "#0E7C86", fontWeight: 700 }}>FAQ →</Link>
            <Link to="/research" style={{ color: "#0E7C86", fontWeight: 700 }}>Research →</Link>
          </nav>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}