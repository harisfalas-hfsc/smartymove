import { createFileRoute } from "@tanstack/react-router";
import { TopicPage, topicJsonLd, type TopicFaq } from "@/components/seo/TopicPage";

const URL = "https://smartymove.com/mobility-and-stability";
const TITLE = "Mobility vs Stability — Assess Both and Train the Right One | SmartyMove";
const DESCRIPTION =
  "Mobility assessment and stability assessment explained: how to tell whether you cannot reach a position or cannot control it, and how SmartyMove measures both with separate Mobility and Stability indexes.";

const faqs: TopicFaq[] = [
  {
    q: "What is the difference between mobility and stability?",
    a: "Mobility is how much usable range a joint has. Stability is your ability to control that range under load, on one leg, or at speed. A hip that can reach depth but collapses on the way up is a stability problem; a hip that never reaches depth at all is a mobility problem. The exercises for the two are almost opposites.",
  },
  {
    q: "What is a mobility assessment?",
    a: "A mobility assessment measures how far specific joints can travel actively before another joint has to compensate. SmartyMove derives it from the squat, hinge, active straight-leg raise and shoulder tests and reports it as a Smarty Mobility Index™.",
  },
  {
    q: "What is a stability assessment?",
    a: "A stability assessment measures control rather than range: whether you can own a position without wobbling, collapsing or shifting. The in-line lunge and the single-leg elements of the screen drive the Smarty Stability Index™.",
  },
  {
    q: "How can I improve my mobility?",
    a: "Work the specific restricted joint most days with active range work rather than passive stretching alone, then immediately load or control the new range so it is retained. Frequency matters more than session length.",
  },
  {
    q: "How can I improve my stability?",
    a: "Train slow, controlled work in the positions you struggle to hold — single-leg stances, split positions, and paused reps — and progress by reducing the base of support or adding time under control rather than by adding speed.",
  },
  {
    q: "Should I train mobility or stability first?",
    a: "Whichever the screen says is limiting you. If range is missing, stability work in a range you cannot reach has nothing to hold on to. If range is present but uncontrolled, more stretching typically makes things feel looser and perform worse.",
  },
];

export const Route = createFileRoute("/mobility-and-stability")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Mobility vs Stability — Assess Both | SmartyMove" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: topicJsonLd({ url: URL, name: TITLE, description: DESCRIPTION, breadcrumb: "Mobility and stability", faqs }),
      },
    ],
  }),
  component: () => (
    <TopicPage
      eyebrow="Mobility & stability assessment"
      h1="Mobility vs stability: two different problems that look identical from the outside"
      intro="Two people fail the same squat. One cannot get down; the other gets down and cannot come back up in control. Prescribe the same stretching routine to both and you help one and actively harm the other. Separating mobility from stability is the single most useful thing an assessment does — and it is why SmartyMove reports them as two independent indexes rather than one number."
      keyFacts={[
        "Mobility is available range. Stability is control of that range.",
        "SmartyMove reports a Smarty Mobility Index™ and a Smarty Stability Index™ separately.",
        "Mobility work opens range; stability and strength work make it stick.",
        "Stretching a joint that is already mobile but uncontrolled usually makes performance worse, not better.",
      ]}
      sections={[
        {
          h: "How to tell which one you have",
          p: [
            "The practical test is whether the position is reachable at all. If you cannot get there — heel lifts in the squat, spine rounds early in the hinge, arm will not reach behind the back — that is mobility. If you can get there but the position deteriorates the moment load, fatigue or a single leg is involved, that is stability.",
            "The confusing case is the one where both are true, which is common in a joint that has been restricted for a long time: range was lost, the body stopped using it, and control of it was never built. Those need mobility first, then loading, in that order.",
          ],
        },
        {
          h: "Mobility: what the assessment looks at",
          p: [
            "The screen infers mobility from active range, not passive range, because active range is what you can actually use. Ankle dorsiflexion is read from knee travel and heel behaviour in the squat, hip and hamstring range from the active straight-leg raise, and thoracic and shoulder range from the reciprocal overhead reach.",
            "Restriction rarely stays local. A stiff ankle relocates work into the knee and low back. A stiff thoracic spine relocates work into the lumbar spine and the shoulder joint itself. That is why the assessment reports a root-cause area rather than simply listing which tests failed.",
          ],
        },
        {
          h: "Stability: what the assessment looks at",
          p: [
            "Stability shows up as control quality: whether the knee tracks or collapses inward, whether the trunk stays stacked, whether a split stance holds still, and whether the two sides behave the same way.",
            "The in-line lunge carries most of the weight here because a narrow base removes the option of bracing your way through. Balance and tempo are read from the pose data over the whole repetition rather than from the end position alone.",
          ],
        },
        {
          h: "The training implication",
          p: [
            "Mobility responds to frequent active range work — daily, brief, specific, at the joint that failed. Stability responds to slow, controlled, low-speed work in the exact position that breaks down, progressed by narrowing the base or extending time under control.",
          ],
          list: [
            "Missing range → mobility drills at the restricted joint, most days.",
            "Range present, control missing → paused, single-leg and split-stance control work.",
            "Range gained recently → load it, or you will lose it again within weeks.",
            "One side worse than the other → prioritise the restricted side and retest the gap.",
          ],
        },
      ]}
      faqs={faqs}
      related={[
        { to: "/movement-assessment", label: "Movement assessment online", blurb: "How both indexes are measured in one five-minute screen." },
        { to: "/corrective-exercise", label: "Corrective exercise", blurb: "Turning a mobility or stability finding into a daily program." },
        { to: "/posture-and-movement-quality", label: "Posture & movement quality", blurb: "Why compensation, not posture, is the useful signal." },
        { to: "/movement-patterns", label: "The 5 movement patterns", blurb: "Which test measures which quality." },
      ]}
      ctaTitle="Find out which one is limiting you"
      ctaBody="Get separate mobility and stability indexes from a single camera-based screen."
    />
  ),
});
