import { createFileRoute } from "@tanstack/react-router";
import { TopicPage, topicJsonLd, type TopicFaq } from "@/components/seo/TopicPage";

const URL = "https://smartymove.com/corrective-exercise";
const TITLE = "Corrective Exercise — Personalized Programs Built From Your Movement Screen | SmartyMove";
const DESCRIPTION =
  "What corrective exercise is, how mobility, stability and strength work together, and how SmartyMove turns your movement screen result into a personalized five-minute daily corrective exercise program.";

const faqs: TopicFaq[] = [
  {
    q: "What is corrective exercise?",
    a: "Corrective exercise is targeted work chosen to address a specific movement limitation rather than to build general fitness. Instead of training everything a bit, you train the joint or pattern that is holding the rest of your movement back — usually a mix of mobility work to create range and stability or strength work to make that range usable.",
  },
  {
    q: "Can corrective exercises actually improve movement?",
    a: "Range of motion and motor control both respond to consistent, specific practice. Whether your own score moves depends on the cause of the limitation, your consistency and how long the pattern has been in place — which is why SmartyMove rescans every 14 days instead of assuming progress.",
  },
  {
    q: "How long should a corrective session take?",
    a: "About five minutes a day. Corrective work rewards frequency far more than duration; a short daily session beats one long session a week for both mobility and motor learning.",
  },
  {
    q: "Do corrective exercises replace my normal training?",
    a: "No. They sit alongside it, most usefully before your main session as movement preparation. The point is to make your regular training possible in better positions, not to become your training.",
  },
  {
    q: "Why did my program change after a rescan?",
    a: "Because the program is built from the screen result, not from a fixed template. When a limitation improves, that area drops priority and the program moves toward loading and maintaining the new range instead of continuing to open it.",
  },
];

export const Route = createFileRoute("/corrective-exercise")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Corrective Exercise — Personalized Programs | SmartyMove" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: topicJsonLd({ url: URL, name: TITLE, description: DESCRIPTION, breadcrumb: "Corrective exercise", faqs }),
      },
    ],
  }),
  component: () => (
    <TopicPage
      eyebrow="Corrective exercise"
      h1="Corrective exercise: fix the limitation, not the symptom"
      intro="Corrective exercise is what happens after an assessment. A screen tells you which joint is limiting you and how; corrective work is the specific, repeatable practice that changes it. Done well it is short, targeted and boring — a handful of drills, most days, aimed at one or two areas rather than at everything."
      keyFacts={[
        "Corrective exercise targets a specific identified limitation, not general fitness.",
        "Every SmartyMove program is built from your screen result and its likely root-cause joint.",
        "Exercises are drawn from a curated library organised by body area and by category: mobility, stability and strength.",
        "Programs run in phases — Foundation, Build, then Maintain and Perform — and update at every 14-day rescan.",
        "A maximum of two focus areas at a time, because spreading the work dilutes it.",
      ]}
      sections={[
        {
          h: "Why generic mobility routines usually fail",
          p: [
            "The standard internet mobility routine stretches everything for a few minutes. It feels productive and changes very little, for two reasons. First, it spends most of its time on areas that were never restricted. Second, it creates range without ever loading it, so the nervous system has no reason to keep it.",
            "Corrective work reverses both. It concentrates on the joint that actually failed the screen, and it pairs new range with strength and control work in that range so the change survives the next time you train.",
          ],
        },
        {
          h: "Mobility, stability and strength do different jobs",
          p: [
            "Almost every limitation is one of two problems: you cannot get into the position, or you cannot hold it. Telling them apart decides what you should be doing.",
          ],
          list: [
            "Mobility work opens range at a restricted joint — the answer when the position is unavailable.",
            "Stability work teaches control in that range — the answer when the position is available but collapses under load or on one leg.",
            "Strength work makes the new range durable, so it holds up when you are tired, loaded, or moving fast.",
          ],
        },
        {
          h: "How SmartyMove chooses your exercises",
          p: [
            "Each failed pattern is mapped back to the joint most likely responsible. A shallow squat with an early heel rise points at the ankle, not the knee. A hinge that rounds early points at the hips and posterior chain, not the lumbar spine that ended up doing the work.",
            "That area then selects exercises from a curated library, with hard rules attached. Exercise choice never crosses into unrelated areas, and specific findings block specific movements — a low-back finding, for example, removes push-up-style loading from the program until it resolves. Your questionnaire answers, goal and reported joint history feed the same decision, so two people with identical scores can still receive different programs.",
          ],
        },
        {
          h: "Phases: why the program keeps changing",
          p: [
            "Foundation, in the first couple of weeks, is about opening range and re-teaching position with low load and high frequency. Build, from around week two, adds load and complexity so the new range becomes usable under real conditions. Maintain and Perform keeps what you gained while shifting emphasis toward the goal you set at the start.",
            "The program does not end. It re-prioritises after each rescan, which means an area you fixed stops consuming your five minutes and something else takes its place.",
          ],
        },
        {
          h: "Where corrective work fits in your week",
          p: [
            "The most useful slot is immediately before your main session, as movement preparation: you get the mobility benefit and then immediately train in the range you just opened. On rest days, run it on its own.",
            "Consistency beats intensity here by a wide margin. Five minutes on six days does far more for range and control than forty minutes once.",
          ],
        },
      ]}
      faqs={faqs}
      related={[
        { to: "/movement-assessment", label: "Movement assessment online", blurb: "The screen that decides what your corrective program contains." },
        { to: "/mobility-and-stability", label: "Mobility vs stability", blurb: "How to tell which of the two you actually need." },
        { to: "/injury-prevention", label: "Movement and injury prevention", blurb: "Why the painful spot is rarely the limited one." },
        { to: "/glossary", label: "Movement glossary", blurb: "Plain-language definitions of every term used here." },
      ]}
      ctaTitle="Get a corrective program built for your body"
      ctaBody="Screen first, then train the limitation that is actually holding you back."
    />
  ),
});
