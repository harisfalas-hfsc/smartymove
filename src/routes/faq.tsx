import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle, ChevronDown } from "lucide-react";
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
    a: "A movement screen is a short set of standardized functional tests (deep squat, hip hinge, active straight-leg raise, shoulder mobility, in-line lunge) that reveals where your body is restricted, unstable, or compensating. It matters because pain and injury usually start from the weakest link in your movement chain — not the spot that hurts.",
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
    a: "The FMS is a clinician-scored, in-person seven-test protocol. SmartyMove is the AI-powered version: five functional movement patterns scored automatically by your phone camera, delivered as an app, plus a corrective exercise engine that acts on the results. Same principles, wider access.",
  },
  {
    q: "Does SmartyMove work for knee pain, low back pain, or starting to run?",
    a: "SmartyMove identifies the root cause behind common complaints — usually limited ankle mobility, weak hips, poor core control, or scapular dysfunction — and prescribes corrective work for that root cause. If you have acute pain or an undiagnosed injury, get cleared by a clinician first.",
  },
  {
    q: "Which movement patterns does SmartyMove test?",
    a: "SmartyMove tests five movement patterns: deep squat, hip hinge, active straight-leg raise, shoulder mobility, and in-line lunge. Together they cover full-body mobility, stability, and motor control.",
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

      {/* MOBILE — brand-consistent card stack */}
      <main className="mx-auto w-full max-w-[430px] flex-1 px-5 pb-8 pt-5 lg:hidden">
        <section className="rounded-[15px] border-[1.5px] border-primary/45 bg-card p-5 shadow-sm">
          <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-primary">
            <HelpCircle className="h-3.5 w-3.5" /> FAQ
          </span>
          <h1 className="mt-3 text-[28px] font-black leading-[1.1] tracking-tight text-foreground">
            Your <span className="text-primary">questions</span>, answered
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Everything people ask before their first Movement Screen. Tap a question to open the answer.
          </p>
        </section>

        <div className="mt-3.5 flex flex-col gap-3">
          {FAQ_ITEMS.map((f, i) => (
            <details
              key={f.q}
              className="group rounded-[15px] border-[1.5px] border-border bg-card p-4 shadow-sm open:border-primary/45"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-[1.5px] border-primary/40 bg-primary/10 text-[11px] font-extrabold text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 text-[15.5px] font-bold leading-snug text-foreground">{f.q}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 border-t border-border pt-3 text-[15px] leading-relaxed text-muted-foreground">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </main>

      {/* DESKTOP — SmartyDiet-inspired layout */}
      <main className="hidden lg:block flex-1 w-full">
        <div className="mx-auto w-full max-w-[1080px] px-6 pt-16 pb-20">
          <div className="text-center">
            <span className="inline-block text-[11px] font-extrabold tracking-[0.28em] uppercase text-primary">FAQ</span>
            <h1 className="mt-4 text-[52px] leading-[1.05] font-extrabold tracking-tight text-[#0f172a]">
              Your <span className="text-primary">questions</span>, answered
            </h1>
            <p className="mt-5 text-lg text-slate-500">
              The answers we get most often. Still unsure? Reach out via the footer.
            </p>
          </div>

          <div className="mt-14 relative rounded-[32px] border-2 border-primary bg-white p-10 pt-8">
            <div className="flex items-center gap-4">
              <div className="flex-1 inline-flex items-center gap-3 rounded-full border-2 border-primary/40 px-6 py-3">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-extrabold tracking-[0.28em] uppercase text-primary">FAQ</span>
              </div>
              <div className="grid place-items-center h-14 w-14 rounded-full border-2 border-primary/40 bg-primary/5">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
            </div>

            <h2 className="mt-10 text-[34px] leading-tight font-extrabold text-[#0f172a]">
              Frequently asked <span className="text-primary">questions.</span>
            </h2>
            <p className="mt-3 text-slate-500">Tap a question to open the answer.</p>

            <div className="mt-8">
              {FAQ_ITEMS.map((f, i) => (
                <details key={f.q} className="group border-t border-slate-200 py-6 first:border-t-0">
                  <summary className="flex items-center gap-5 cursor-pointer list-none">
                    <span className="grid place-items-center h-10 w-10 rounded-full border-2 border-primary/40 bg-primary/5 text-[11px] font-extrabold text-primary shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-lg font-bold text-[#0f172a] flex-1">{f.q}</span>
                    <ChevronDown className="h-5 w-5 text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 pl-[60px] pr-8 text-[15.5px] leading-relaxed text-slate-600">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
