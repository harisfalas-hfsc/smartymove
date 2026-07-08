import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SmartyCard } from "@/components/SmartyCard";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — SmartyMove AI Movement Intelligence Platform" },
      { name: "description", content: "Answers about the SmartyMove AI Movement Intelligence Platform: how the movement screen works, what Movement Score™ and Movement Age™ mean, corrective exercise, privacy, and who it's for." },
      { property: "og:title", content: "SmartyMove FAQ — Movement Screening, Movement Score & Corrective Exercise" },
      { property: "og:description", content: "Everything people ask about AI movement screening, Movement Score, Movement Age, and the corrective exercise program." },
      { property: "og:url", content: "https://smartymove.com/faq" },
    ],
    links: [{ rel: "canonical", href: "https://smartymove.com/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "FAQPage",
              url: "https://smartymove.com/faq",
              inLanguage: "en",
              isPartOf: { "@id": "https://smartymove.com/#website" },
              speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", "h2", "p"] },
              mainEntity: FAQ_ITEMS.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://smartymove.com/" },
                { "@type": "ListItem", position: 2, name: "FAQ", item: "https://smartymove.com/faq" },
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: Faq,
});

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is SmartyMove?",
    a: "SmartyMove is an AI Movement Intelligence Platform. It uses your phone camera to run a functional movement screen, calculate your Smarty Movement Score™ and Smarty Movement Age™, identify the root cause of any failed test, and prescribe a personalized 5-minute daily corrective exercise program.",
  },
  {
    q: "What is movement intelligence?",
    a: "Movement intelligence is the combination of mobility, stability, balance, and movement quality that determines how efficiently and safely you can move. SmartyMove quantifies it with the Smarty Movement Score™ (0–100) so you can measure and improve it.",
  },
  {
    q: "What is a movement screen and why does it matter?",
    a: "A movement screen is a short set of standardized functional tests (squat, hinge, single-leg balance, in-line lunge, overhead reach, shoulder mobility, active straight-leg raise, trunk-stability push-up, rotary stability) that reveals where your body is restricted, unstable, or compensating. It matters because pain and injury usually start from the weakest link in your movement chain — not the spot that hurts.",
  },
  {
    q: "How does SmartyMove score my movement?",
    a: "Your phone camera tracks your joints during each test using on-device AI pose detection. SmartyMove measures range of motion, tempo, and compensations (heel rise, spine rounding, knee valgus, left/right asymmetry) and grades each pattern 0–3 against Functional Movement Screen criteria. Those scores are weighted (Mobility 30%, Stability 30%, Balance 20%, Quality 20%) into a single 0–100 Smarty Movement Score™.",
  },
  {
    q: "Is SmartyMove a replacement for physical therapy?",
    a: "No. SmartyMove is a wellness and education tool, not a medical device. It helps you understand how you move and gives you a corrective routine — but if you have pain, an injury, or a medical condition, see a qualified physiotherapist or physician.",
  },
  {
    q: "What is Movement Age™?",
    a: "Smarty Movement Age™ translates your Movement Score into an intuitive age number. It compares your movement quality to your chronological age, so you can see whether your body is moving younger or older than your years — and lower it over time as your mobility, stability and strength improve.",
  },
  {
    q: "What is the difference between Movement Score and Movement Age?",
    a: "The Smarty Movement Score™ is a 0–100 number that summarizes movement quality across all tests. The Smarty Movement Age™ translates that score into an age-equivalent, using your chronological age as a reference point. Score is the metric; age is the story.",
  },
  {
    q: "How is SmartyMove different from a Functional Movement Screen (FMS)?",
    a: "The FMS is a clinician-scored, in-person seven-test protocol. SmartyMove is the AI-powered version: eight functional movement patterns scored automatically by your phone camera, delivered as an app, plus a corrective exercise engine that acts on the results. Same principles, wider access.",
  },
  {
    q: "Does SmartyMove work for knee pain, low back pain, or starting to run?",
    a: "SmartyMove identifies the root cause behind common complaints — usually limited ankle mobility, weak hips, poor core control, or scapular dysfunction — and prescribes corrective work for that root cause. If you have acute pain or an undiagnosed injury, get cleared by a clinician first.",
  },
  {
    q: "Which movement patterns does SmartyMove test?",
    a: "SmartyMove tests eight movement patterns: deep squat, hurdle step, in-line lunge, active straight-leg raise, shoulder mobility, trunk stability push-up, rotary stability, and hip-hinge. Together they cover full-body mobility, stability, balance, and motor control.",
  },
  {
    q: "How often should I re-scan?",
    a: "Every 14 days. The corrective program is built in phases — Foundation (weeks 0–1), Build (weeks 2–5), and Maintain & Perform (weeks 6+). Each rescan updates your score, your Movement Age, and the exercises the engine prescribes.",
  },
  {
    q: "Is my camera footage stored or sent anywhere?",
    a: "No. Pose detection runs on your device. Raw video is not uploaded to our servers — only the numeric movement scores and the joint-angle summaries needed to build your program are saved to your account.",
  },
];

function Faq() {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background text-foreground">
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 pb-6 pt-4">
        <SmartyCard
          Icon={HelpCircle}
          iconColor="#C2410C"
          iconBg="#FDECD8"
          title="FAQ"
          subtitle="Everything people ask before their first scan."
        >
          <div className="mt-1 flex flex-col gap-2">
            {FAQ_ITEMS.map((f) => (
              <details key={f.q} style={{ borderTop: "1px solid #EEF1F2", paddingTop: 10 }}>
                <summary style={{ fontWeight: 700, color: "#14213A", fontSize: 14.5, cursor: "pointer", listStyle: "none" }}>
                  {f.q}
                </summary>
                <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55, color: "#3B4A63" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </SmartyCard>
      </main>
      <SiteFooter />
    </div>
  );
}
