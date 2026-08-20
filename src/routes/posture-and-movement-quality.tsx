import { createFileRoute } from "@tanstack/react-router";
import { TopicPage, topicJsonLd, type TopicFaq } from "@/components/seo/TopicPage";

const URL = "https://smartymove.com/posture-and-movement-quality";
const TITLE = "Posture and Movement Quality — Assess Compensations, Not Just Standing Posture | SmartyMove";
const DESCRIPTION =
  "Posture assessment is a snapshot; movement quality is the whole film. Learn what movement compensations are, how they are identified, and how SmartyMove scores movement quality from camera-based screening.";

const faqs: TopicFaq[] = [
  {
    q: "What is movement quality?",
    a: "Movement quality is how well a movement is organised: whether joints reach the positions the task requires, whether the effort is shared appropriately, and whether the pattern looks the same on both sides and from rep to rep. It is independent of strength — you can be strong and move poorly, or weak and move cleanly.",
  },
  {
    q: "What are movement compensations?",
    a: "A compensation is a substitution your body makes to complete a task when the intended joint cannot do its part. Common examples are the heel lifting in a squat, the spine rounding in a hinge, the knee drifting inward in a lunge, and the ribs flaring during an overhead reach.",
  },
  {
    q: "Is a posture assessment useful?",
    a: "Standing posture on its own is a weak predictor of much. What is far more informative is how your posture behaves under a task — whether you can organise into and hold good positions while moving, which is exactly what a movement screen looks at.",
  },
  {
    q: "How can I identify my own movement compensations?",
    a: "Film yourself from the side and the front performing a squat, a hinge and a split-stance lunge, then watch for the heel, the spine and the knee. A camera-based screen automates the same observation and measures the size of each deviation instead of eyeballing it.",
  },
  {
    q: "Does poor posture cause pain?",
    a: "The relationship is much weaker and more individual than popular advice suggests. SmartyMove does not make claims about pain causation; it reports movement findings and, when you report pain, directs you to a qualified professional.",
  },
];

export const Route = createFileRoute("/posture-and-movement-quality")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Posture and Movement Quality — SmartyMove" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: topicJsonLd({ url: URL, name: TITLE, description: DESCRIPTION, breadcrumb: "Posture and movement quality", faqs }),
      },
    ],
  }),
  component: () => (
    <TopicPage
      eyebrow="Posture & movement quality"
      h1="Posture is a snapshot. Movement quality is the whole film."
      intro="Most posture advice stops at how you stand. That is one frame out of thousands, and it tells you very little about how your body organises itself when it has a job to do. Movement quality asks the more useful question: when you squat, hinge, lunge or reach, does the effort land where it should — and what does your body substitute when it does not?"
      keyFacts={[
        "Movement quality describes how a task is organised, not how much load you can move.",
        "Compensations are the substitutions used when the intended joint cannot do its part.",
        "SmartyMove measures compensations from camera pose data: heel rise, spine orientation, knee tracking and left-to-right differences.",
        "Quality contributes its own weighted component to the Smarty Movement Score™.",
        "SmartyMove reports movement findings; it makes no claims about diagnosing pain or medical conditions.",
      ]}
      sections={[
        {
          h: "Why compensation is the signal worth watching",
          p: [
            "Bodies complete tasks. That is the whole problem with judging movement by whether the task got finished. Ask someone with a restricted ankle to squat and they will squat — by leaning the torso forward, lifting the heel, or letting the arches collapse. The rep counts. The cost is silent and cumulative.",
            "Compensation is what makes an invisible restriction visible. It is also directional: the way you compensate tells you where the missing capacity is. A heel that lifts early is an ankle story. A spine that rounds at the top of a hinge is a hip story.",
          ],
        },
        {
          h: "The compensations a camera can reliably see",
          p: [
            "Not everything is measurable from video, but the mechanically important deviations are, because they change joint angles and body-segment relationships in ways pose data captures well.",
          ],
          list: [
            "Heel rise and forward torso lean in the squat — usually ankle dorsiflexion.",
            "Early lumbar rounding in the hinge — usually hip flexion or posterior-chain range.",
            "Knee drifting inward in the lunge or squat — usually hip stability and control.",
            "Ribs flaring or the low back arching overhead — usually thoracic extension range.",
            "Left-to-right differences in any of the above — a preferred cheat, and the highest-value fix.",
          ],
        },
        {
          h: "How movement quality is scored",
          p: [
            "Quality is one of four weighted components in the Smarty Movement Score™, alongside mobility, stability and balance. It is derived from the size and consistency of the deviations detected during each pattern rather than from whether the repetition was completed.",
            "Because it is scored separately, you can see a case that pure range measurements would miss: adequate mobility, adequate stability, but a pattern that is consistently organised poorly. That is a motor-control problem, and it responds to slow, deliberate practice more than to stretching.",
          ],
        },
        {
          h: "Posture, desk work and the movement you actually do",
          p: [
            "Long static positions do not damage you by virtue of being static; the issue is what a body stops practising. Ranges you never visit become ranges you cannot use, and the patterns you rely on all day become the patterns you default to under load.",
            "The remedy is not a perfect chair. It is visiting the missing ranges often enough that they stay available, and occasionally checking — with a repeatable screen — whether they still are.",
          ],
        },
      ]}
      faqs={faqs}
      related={[
        { to: "/mobility-and-stability", label: "Mobility vs stability", blurb: "The two causes behind most compensations." },
        { to: "/movement-assessment", label: "Movement assessment online", blurb: "How compensations are detected and scored." },
        { to: "/corrective-exercise", label: "Corrective exercise", blurb: "What to do once a compensation is identified." },
        { to: "/glossary", label: "Movement glossary", blurb: "Definitions for every term on this page." },
      ]}
      ctaTitle="See your own compensations"
      ctaBody="A camera-based screen measures the deviations you cannot feel while you are moving."
    />
  ),
});
