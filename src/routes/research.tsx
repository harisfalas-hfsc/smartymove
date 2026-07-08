import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const URL = "https://smartymove.com/research";

const TOPICS: { h: string; p: string }[] = [
  { h: "Movement screening and injury risk", p: "Multiple studies link low composite Functional Movement Screen scores and side-to-side asymmetries with higher injury incidence in tactical and athletic populations. Screening is not a diagnostic test — it is a prioritization tool for corrective work." },
  { h: "Ankle dorsiflexion and lower-limb load", p: "Restricted ankle dorsiflexion is repeatedly associated with altered knee and hip mechanics during squatting and landing, increasing patellofemoral and low-back load." },
  { h: "Hip mobility, glute function and low-back pain", p: "Reduced hip internal rotation, weak gluteal recruitment and poor hip-hinge control are commonly reported in adults with non-specific low-back pain; targeted hip mobility and stability work reduces symptoms in many cases." },
  { h: "Thoracic spine, scapular control and shoulder health", p: "Limited thoracic extension and poor scapular upward rotation are linked to shoulder impingement patterns. Screening the overhead reach exposes these limitations early." },
  { h: "Corrective exercise dosage", p: "Short daily doses (5–15 minutes) of targeted mobility and stability drills, sustained over 4–8 weeks, produce measurable range-of-motion and motor-control changes in general populations." },
  { h: "AI pose estimation for movement analysis", p: "Modern on-device pose-estimation models (BlazePose, MoveNet) approximate lab-grade joint-angle measurement well enough to grade functional movement patterns, when tests are standardized and viewpoints controlled." },
];

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research — Movement Screening, Mobility & Corrective Exercise | SmartyMove" },
      { name: "description", content: "A plain-language digest of research behind movement screening, mobility, stability, corrective exercise, and AI pose analysis — the science underneath the SmartyMove AI Movement Intelligence Platform." },
      { property: "og:title", content: "SmartyMove Research" },
      { property: "og:description", content: "The research behind AI movement screening, corrective exercise and Movement Score." },
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
              "@type": "CollectionPage",
              url: URL,
              name: "SmartyMove Research",
              inLanguage: "en",
              isPartOf: { "@id": "https://smartymove.com/#website" },
              about: [
                { "@type": "Thing", name: "Functional Movement Screen" },
                { "@type": "Thing", name: "Corrective Exercise" },
                { "@type": "Thing", name: "Biomechanics" },
                { "@type": "Thing", name: "AI pose estimation" },
              ],
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://smartymove.com/" },
                { "@type": "ListItem", position: 2, name: "Research", item: URL },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: Research,
});

function Research() {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col" style={{ background: "#ffffff", color: "#14213A" }}>
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[820px] flex-1 px-5 pb-8 pt-5">
        <h1 style={{ fontWeight: 800, fontSize: 30, letterSpacing: "-0.02em", margin: "8px 0 14px", lineHeight: 1.15 }}>Research</h1>
        <p style={{ fontSize: 16, lineHeight: 1.65, color: "#3B4A63", margin: "0 0 22px" }}>
          The science underneath SmartyMove. This is a plain-language digest, not a clinical reference. SmartyMove is a wellness and education tool, not a medical device.
        </p>
        <div style={{ background: "#fff", border: "1px solid #E5EAEC", borderRadius: 18, padding: "22px 24px" }}>
          {TOPICS.map((t) => (
            <section key={t.h} style={{ marginBottom: 18 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, color: "#14213A", margin: "0 0 6px" }}>{t.h}</h2>
              <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.65, color: "#3B4A63" }}>{t.p}</p>
            </section>
          ))}
        </div>
        <p style={{ marginTop: 18 }}>
          <Link to="/movement-intelligence" style={{ color: "#0E7C86", fontWeight: 700 }}>← Movement Intelligence pillar</Link>
          {" · "}
          <Link to="/glossary" style={{ color: "#0E7C86", fontWeight: 700 }}>Glossary →</Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}