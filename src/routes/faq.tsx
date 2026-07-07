import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SmartyCard } from "@/components/SmartyCard";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Frequently Asked Questions — SmartyMove" },
      { name: "description", content: "Answers to common questions about SmartyMove: how the movement screen works, what Movement Age means, privacy, and who it's for." },
      { property: "og:title", content: "Frequently Asked Questions — SmartyMove" },
      { property: "og:description", content: "Everything people ask before their first scan." },
      { property: "og:url", content: "https://smartymove.com/faq" },
    ],
    links: [{ rel: "canonical", href: "https://smartymove.com/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_ITEMS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: Faq,
});

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is a movement screen and why does it matter?",
    a: "A movement screen is a short set of standardized tests (like a squat, hinge, single-leg balance, lunge, and overhead reach) that reveals where your body is restricted, unstable, or compensating. It matters because pain and injury usually start from the weakest link in your movement chain — not the spot that hurts.",
  },
  {
    q: "How does SmartyMove score my movement?",
    a: "Your phone camera tracks your joints during each test. SmartyMove measures range of motion, tempo, and compensations (heel rise, spine rounding, knee valgus, left/right asymmetry) and compares them to reference values for each movement. Those scores combine into a single 0–100 Movement Score.",
  },
  {
    q: "Is SmartyMove a replacement for physical therapy?",
    a: "No. SmartyMove is a wellness and education tool, not a medical device. It helps you understand how you move and gives you a corrective routine — but if you have pain, an injury, or a medical condition, see a qualified physiotherapist or physician.",
  },
  {
    q: "What is Movement Age?",
    a: "Movement Age is a motivational estimate of how old your movement quality looks, compared to your chronological age. It's based on your Movement Score and is designed to be lowered over time as your mobility, stability and strength improve.",
  },
  {
    q: "Does SmartyMove work for knee pain, low back pain, or starting to run?",
    a: "SmartyMove identifies the root cause behind common complaints — usually limited ankle mobility, weak hips, poor core control, or scapular dysfunction — and prescribes corrective work for that root cause. If you have acute pain or an undiagnosed injury, get cleared by a clinician first.",
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
          title="Frequently asked questions"
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
