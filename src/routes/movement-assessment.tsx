import { createFileRoute } from "@tanstack/react-router";
import { TopicPage, topicJsonLd, type TopicFaq } from "@/components/seo/TopicPage";

const URL = "https://smartymove.com/movement-assessment";
const TITLE = "Movement Assessment Online — Screen How You Move With Your Phone | SmartyMove";
const DESCRIPTION =
  "An online movement assessment you can run at home in about five minutes. SmartyMove uses your phone camera to score movement quality, find compensations, and build a personalized corrective exercise program.";

const faqs: TopicFaq[] = [
  {
    q: "What is a movement assessment?",
    a: "A movement assessment is a set of standardized tasks — squatting, hinging, lunging, raising a leg, reaching overhead — performed so that someone (or something) can judge how well you move rather than how much you can lift. It looks at range of motion, control, symmetry and the compensations you use to get the job done.",
  },
  {
    q: "How does an online movement assessment work?",
    a: "You prop your phone, follow the on-screen prompts, and perform five movement patterns. On-device pose detection tracks your joints frame by frame and measures depth, angles, tempo and left/right differences. Those measurements are graded against functional movement screening criteria and combined into a single 0–100 Smarty Movement Score™.",
  },
  {
    q: "Can movement really be assessed using a camera?",
    a: "Yes, for the things a camera can see: joint angles, range of motion, timing, balance and visible compensations such as heel rise, knee collapse or a rounding spine. A camera cannot assess pain, tissue health or joint integrity, which is why SmartyMove asks about pain and refers you to a professional when you report it.",
  },
  {
    q: "Do I need equipment for a movement assessment?",
    a: "A phone, something to lean it against, about two metres of clear space and a broomstick or similar straight object for the overhead and lunge tests. No gym, no wearables, no coach required.",
  },
  {
    q: "How often should I reassess my movement?",
    a: "Every 14 days. That is long enough for mobility and motor-control changes to show up, and short enough to keep the corrective program matched to your current limitations.",
  },
];

export const Route = createFileRoute("/movement-assessment")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Movement Assessment Online — SmartyMove" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: topicJsonLd({ url: URL, name: TITLE, description: DESCRIPTION, breadcrumb: "Movement assessment", faqs }),
      },
    ],
  }),
  component: () => (
    <TopicPage
      eyebrow="Movement assessment"
      h1="Movement assessment online: measure how well you move, not how hard you train"
      intro="Most fitness apps measure output — reps, kilos, calories, steps. A movement assessment measures the thing underneath all of it: whether your joints can reach the positions your training asks for, and whether you can control them once you get there. SmartyMove turns that assessment into something you can run at home with a phone camera in about five minutes."
      keyFacts={[
        "Five functional movement patterns, scored automatically by on-device pose detection.",
        "Outputs a 0–100 Smarty Movement Score™, a Movement Age™, and separate mobility and stability indexes.",
        "Identifies the likely root-cause joint behind each failed pattern instead of only naming the failed test.",
        "Produces a personalized corrective exercise program of about five minutes a day.",
        "A wellness and education tool — it does not diagnose injuries or medical conditions.",
      ]}
      sections={[
        {
          h: "What a movement assessment actually measures",
          p: [
            "A movement assessment grades quality, not capacity. Across a small number of standardized patterns it looks at four things: available range of motion at each joint, stability under load, left-to-right symmetry, and the compensations your body substitutes when range or control runs out.",
            "That last one matters most. Bodies are relentlessly good at finding a way to complete a task. When an ankle will not bend far enough, the torso leans forward. When a hip will not rotate, the lumbar spine does it instead. The task still looks finished, and the cost lands somewhere else.",
          ],
          list: [
            "Range of motion — how far a joint travels before something else has to move.",
            "Stability — whether you can own a position rather than fall into it.",
            "Symmetry — whether the left and right sides score the same.",
            "Compensation — the substitution pattern used when range or control is missing.",
          ],
        },
        {
          h: "How the SmartyMove assessment works, step by step",
          p: [
            "Setup starts with a short readiness questionnaire and a goal, so the screen is interpreted against what you actually want to do. You then perform five patterns, one at a time, with the phone framing the correct view for each test — side-on for the squat and hinge, front-on for the lunge and shoulder test.",
            "Pose detection runs on the device itself while you move. Each pattern is graded 0–3 against functional movement screening criteria, weighted into sub-scores for mobility, stability, balance and quality, and combined into your Smarty Movement Score™. If you report pain during a test, that test scores zero and the affected sub-score is capped, because pain is a signal to see a professional, not something to train through.",
          ],
        },
        {
          h: "What movement issues an assessment can reveal",
          p: [
            "The five patterns are chosen because they overlap: a limitation in one joint shows up in more than one test, which is what lets the engine separate cause from symptom.",
          ],
          list: [
            "Limited ankle dorsiflexion driving a shallow, forward-leaning squat.",
            "Restricted hip flexion or hip rotation showing up as a rounding low back in the hinge.",
            "Hamstring and posterior-chain restriction limiting the active straight-leg raise.",
            "Thoracic and shoulder restriction limiting overhead reach, often asymmetrically.",
            "Poor single-leg control and balance exposed by the in-line lunge.",
          ],
        },
        {
          h: "From assessment to a personalized program",
          p: [
            "An assessment that ends with a number is a scoreboard, not a plan. Every failed pattern in SmartyMove is mapped back to the joint most likely responsible, and that joint drives exercise selection from a curated library organised by area and by category — mobility, stability and strength.",
            "The program is phased. Foundation work opens range and re-teaches position. Build work loads the new range so it holds. Maintain and perform work keeps it. You rescan every 14 days and the program updates against the new result, so the plan follows your body rather than a fixed template.",
          ],
        },
        {
          h: "Who a movement assessment is for",
          p: [
            "Anyone whose training or day-to-day life is limited by how their body moves: lifters who cannot reach depth, runners with recurring stiffness, desk workers with a stubborn low back, people returning to exercise after a long gap, and athletes who want a repeatable baseline they can retest.",
            "It is not for anyone currently in pain or under treatment. If something hurts, that is a physiotherapist's or physician's question first.",
          ],
        },
      ]}
      faqs={faqs}
      related={[
        { to: "/functional-movement-screening", label: "Functional movement screening", blurb: "What a movement screen is, and how the camera version compares to the clinical protocol." },
        { to: "/movement-patterns", label: "The 5 movement patterns", blurb: "The exact tests in the screen and what each one exposes." },
        { to: "/corrective-exercise", label: "Corrective exercise", blurb: "How findings become a five-minute daily program." },
        { to: "/how-it-works", label: "How SmartyMove works", blurb: "Scan, score, train, rescan — the full loop." },
      ]}
      ctaTitle="Run your own movement assessment"
      ctaBody="Five patterns, about five minutes, a score you can retest every two weeks."
    />
  ),
});
