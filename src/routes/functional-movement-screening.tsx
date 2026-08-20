import { createFileRoute } from "@tanstack/react-router";
import { TopicPage, topicJsonLd, type TopicFaq } from "@/components/seo/TopicPage";

const URL = "https://smartymove.com/functional-movement-screening";
const TITLE = "Functional Movement Screening Explained — Online FMS-Style Screen | SmartyMove";
const DESCRIPTION =
  "What functional movement screening is, what each test reveals, and how SmartyMove runs an FMS-style movement screen with your phone camera to score movement quality and prescribe corrective exercise.";

const faqs: TopicFaq[] = [
  {
    q: "What is functional movement screening?",
    a: "Functional movement screening is a standardized way of grading fundamental movement patterns — squat, hinge, lunge, leg raise, overhead reach — to find restriction, instability and asymmetry before they become a training problem. Each pattern is scored on a small fixed scale so the results can be compared over time and between people.",
  },
  {
    q: "What is the difference between a functional movement screen and a fitness test?",
    a: "A fitness test measures capacity: how much, how fast, how long. A movement screen measures quality: whether you can reach and control a position at all. Someone can be extremely fit and still screen poorly, which is exactly the combination that tends to produce recurring problems.",
  },
  {
    q: "Is SmartyMove the same as the FMS?",
    a: "No. The Functional Movement Screen is a clinician-scored, in-person seven-test protocol. SmartyMove is an FMS-style screen: five patterns, graded automatically from camera pose data against similar criteria, plus a corrective exercise engine that acts on the result. Same principles, different delivery, and it is not a clinical substitute.",
  },
  {
    q: "What is a good movement screen score?",
    a: "There is no universal pass mark in SmartyMove. What matters is your own baseline and its direction over time, plus whether any single pattern is scoring far below the others — an isolated low pattern is a more useful target than an average.",
  },
  {
    q: "Why does screening use so few tests?",
    a: "Because the patterns overlap. A small number of well-chosen tasks, each loading several joints, lets you triangulate which joint is actually limiting you. Adding more tests mostly adds noise, not information.",
  },
];

export const Route = createFileRoute("/functional-movement-screening")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Functional Movement Screening Explained — SmartyMove" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: topicJsonLd({ url: URL, name: TITLE, description: DESCRIPTION, breadcrumb: "Functional movement screening", faqs }),
      },
    ],
  }),
  component: () => (
    <TopicPage
      eyebrow="Functional movement screening"
      h1="Functional movement screening, explained in plain language"
      intro="Movement screening came out of a simple clinical observation: people who move badly in basic patterns tend to get hurt doing the things they enjoy. Screening formalises that observation into a short, repeatable set of tests with fixed scoring, so movement quality becomes a number you can track instead of an opinion."
      keyFacts={[
        "A movement screen grades fundamental patterns for restriction, instability and asymmetry.",
        "Each pattern is scored on a fixed scale so results are comparable over time.",
        "SmartyMove screens five patterns automatically using camera-based pose detection.",
        "Screening is a filter, not a diagnosis — it points at where to look, not at what is wrong medically.",
      ]}
      sections={[
        {
          h: "Where movement screening came from",
          p: [
            "Clinicians working with athletes noticed that strength and conditioning testing missed something. Two athletes could post identical numbers and only one of them kept breaking down. The difference was rarely capacity; it was the quality of the basic patterns everything else was built on.",
            "The response was a small battery of standardized tasks, deliberately unloaded or lightly loaded, scored the same way every time. Screening spread from sports medicine into strength coaching, physiotherapy and general fitness because the logic travels: check the foundation before you build on it.",
          ],
        },
        {
          h: "What each screening pattern reveals",
          p: [
            "SmartyMove screens five patterns. Each one is chosen because it loads several joints at once, so a limitation shows up in more than one place and can be traced back to its source.",
          ],
          list: [
            "Deep squat — whole-chain mobility: ankle, knee, hip, thoracic spine and shoulder working together with an upright trunk.",
            "Hip hinge — the ability to bend from the hips with a neutral spine, the pattern behind every lift and every bend-and-pick-up.",
            "Active straight-leg raise — hip flexion on one side while the other hip stays extended, exposing hamstring and hip restriction independently of the spine.",
            "Shoulder mobility — reciprocal shoulder range and left-to-right symmetry, heavily influenced by thoracic extension.",
            "In-line lunge — split-stance control, exposing single-leg stability, ankle mobility and balance under a narrow base.",
          ],
        },
        {
          h: "How scoring works",
          p: [
            "Each pattern is graded 0–3. Three means clean execution with no visible compensation. Two means completed with compensation. One means unable to complete. Zero is reserved for pain, which stops the interpretation entirely and becomes a referral rather than a training target.",
            "SmartyMove derives those grades from measurements the camera can make reliably: joint angles, depth, tempo, heel position, spine orientation and left-to-right differences. Grades are weighted into mobility, stability, balance and quality sub-scores, then into a single Smarty Movement Score™ from 0 to 100 and a Movement Age™ that puts the score in context against your chronological age.",
          ],
        },
        {
          h: "Asymmetry is the finding people underrate",
          p: [
            "A left side that scores well and a right side that scores poorly is a more actionable finding than two mediocre sides. Asymmetry means your body already has a preferred way of cheating the pattern, and it will keep using it under load and under fatigue.",
            "Because the screen records each side separately, asymmetry drives exercise selection directly: the restricted side gets prioritised, and the rescan checks whether the gap actually closed.",
          ],
        },
        {
          h: "What screening cannot tell you",
          p: [
            "A screen is not a diagnosis. It cannot see tissue, it cannot identify a pathology, and it cannot tell you why a joint is restricted — capsule, muscle, old injury or simple habit all look the same from the outside.",
            "What it can do is tell you where the limitation is, how large it is, whether it is one-sided, and whether it is improving. If you have pain or a known condition, that belongs with a qualified physiotherapist or physician first.",
          ],
        },
      ]}
      faqs={faqs}
      related={[
        { to: "/movement-assessment", label: "Movement assessment online", blurb: "How the whole assessment runs, from setup to program." },
        { to: "/movement-patterns", label: "The 5 movement patterns", blurb: "A closer look at every test in the screen." },
        { to: "/mobility-and-stability", label: "Mobility vs stability", blurb: "Why the difference decides which exercises you get." },
        { to: "/research", label: "The research behind screening", blurb: "A plain-language digest of the evidence." },
      ]}
      ctaTitle="Screen your own movement"
      ctaBody="Five patterns graded automatically, with a corrective program built from the result."
    />
  ),
});
