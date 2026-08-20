import { createFileRoute } from "@tanstack/react-router";
import { TopicPage, topicJsonLd, type TopicFaq } from "@/components/seo/TopicPage";

const URL = "https://smartymove.com/injury-prevention";
const TITLE = "Movement Screening and Injury Prevention — Find the Weak Link First | SmartyMove";
const DESCRIPTION =
  "How movement screening supports injury prevention and movement preparation: why the painful area is rarely the limited one, what asymmetry means, and how to build a five-minute daily routine around your own findings.";

const faqs: TopicFaq[] = [
  {
    q: "Can movement screening prevent injuries?",
    a: "No screen can promise that. What screening does is identify restriction, poor control and asymmetry so you can address them before you load them heavily — which is a sensible risk-reduction practice, not a guarantee. SmartyMove is a wellness and education tool and makes no medical claims.",
  },
  {
    q: "Why does the painful area often score fine?",
    a: "Pain usually appears where load ends up, not where movement went missing. A stiff ankle or hip pushes work into the knee or low back, so the restricted joint tests badly while the loaded joint is the one that complains.",
  },
  {
    q: "Why does asymmetry matter for injury risk?",
    a: "A side-to-side difference means your body has an established preference for one way of completing a pattern. Under fatigue and load, that preference gets stronger, and one side absorbs more work than it was prepared for.",
  },
  {
    q: "What is movement preparation?",
    a: "Movement preparation is a short, specific routine done before training that opens the ranges your session needs and activates the control you want to use. It is far more targeted than a general warm-up, because it is built from your own screen findings.",
  },
  {
    q: "I already have pain. Should I screen?",
    a: "See a physiotherapist or physician first. SmartyMove scores any painful test as zero and caps the affected sub-score precisely because pain is a referral signal, not a training target.",
  },
];

export const Route = createFileRoute("/injury-prevention")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Movement Screening and Injury Prevention — SmartyMove" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: topicJsonLd({ url: URL, name: TITLE, description: DESCRIPTION, breadcrumb: "Injury prevention", faqs }),
      },
    ],
  }),
  component: () => (
    <TopicPage
      eyebrow="Injury prevention & movement preparation"
      h1="Movement screening and injury prevention: find the weak link before you load it"
      intro="Nothing prevents injury outright, and anyone claiming otherwise is selling something. What is defensible is far more modest and far more useful: restriction, poor control and asymmetry are findable in advance, and addressing them is cheaper than working around them later. That is what a movement screen is for."
      keyFacts={[
        "Screening identifies restriction, poor control and asymmetry — it does not guarantee anything.",
        "The area that hurts is often not the area that is limited.",
        "Asymmetry is the most actionable single finding a screen produces.",
        "Findings feed a five-minute daily routine that doubles as movement preparation before training.",
        "SmartyMove is a wellness and education tool. Pain belongs with a qualified professional.",
      ]}
      sections={[
        {
          h: "Load has to go somewhere",
          p: [
            "The core mechanical argument is simple. Every task requires a certain amount of total joint motion. If one joint cannot supply its share, the neighbouring joints supply it instead — usually joints that are built for stability rather than range.",
            "Repeat that for months and the pattern becomes the default. The restricted joint stays quiet; the borrowing joint accumulates work it was never designed for. That is why screening looks at the whole chain rather than only at the part that is complaining.",
          ],
        },
        {
          h: "Asymmetry: the finding worth acting on first",
          p: [
            "If your left and right sides score differently, you already have a preferred solution to the pattern, and preferences intensify under fatigue and load. A screen that records each side separately turns that into a target: prioritise the restricted side, then retest the gap rather than assuming it closed.",
            "Symmetrical mediocrity is usually a training-history problem. One-sided restriction is usually a history problem — old injury, sport bias, occupational habit — and it is the more urgent of the two.",
          ],
        },
        {
          h: "Movement preparation beats the generic warm-up",
          p: [
            "A general warm-up raises temperature and heart rate. Movement preparation does that and also opens the specific ranges the session will demand and rehearses the control you want to use in them.",
            "Because a SmartyMove program is built from your own findings, the five-minute daily routine works as movement preparation without any modification: run it before your main session and you train in the range you just opened, which is also the most reliable way to keep that range.",
          ],
          list: [
            "Before training: run the routine as preparation, then train.",
            "On rest days: run it on its own — frequency is what changes range.",
            "After a rescan: expect the routine to change as priorities shift.",
          ],
        },
        {
          h: "What screening will not do",
          p: [
            "It will not diagnose an injury, identify tissue damage, or tell you whether a specific structure is at risk. It will not replace assessment by a physiotherapist or physician, and it should not be used to push through pain.",
            "SmartyMove is explicit about this boundary: report pain during a test and that test scores zero, the affected sub-score is capped, and the guidance is to seek qualified help rather than to keep training around it.",
          ],
        },
      ]}
      faqs={faqs}
      related={[
        { to: "/functional-movement-screening", label: "Functional movement screening", blurb: "What each test in the screen exposes." },
        { to: "/corrective-exercise", label: "Corrective exercise", blurb: "Building the daily routine from your findings." },
        { to: "/why-movement-matters", label: "Why movement matters", blurb: "The research, case studies and the cost of moving badly." },
        { to: "/research", label: "Research digest", blurb: "Plain-language summaries of the evidence base." },
      ]}
      ctaTitle="Find your weak link"
      ctaBody="Screen five patterns, see the asymmetries, and get a routine that doubles as movement prep."
    />
  ),
});
