import { createFileRoute, Link, notFound } from "@tanstack/react-router";

type Article = {
  slug: string;
  title: string;
  description: string;
  body: { h: string; p: string }[];
};

const ARTICLES: Record<string, Article> = {
  "what-is-a-movement-score": {
    slug: "what-is-a-movement-score",
    title: "What Is a Movement Score?",
    description:
      "A Movement Score is a single 0–100 number summarizing how well you move across a short functional movement screen. Here's exactly how SmartyMove calculates it.",
    body: [
      {
        h: "The short answer",
        p: "A Movement Score is a single 0–100 number that summarizes how well you move across a short set of functional tests — squat, hinge, balance, lunge, and overhead reach. SmartyMove generates it from your phone camera in about 8 minutes.",
      },
      {
        h: "What gets measured",
        p: "Each test is graded on joint angles (range of motion), tempo, and compensations (heel rise, spine rounding, knee valgus, left/right asymmetry). Reference values come from physiotherapy literature, not a guess.",
      },
      {
        h: "Why one number",
        p: "A single score makes progress measurable. Re-scan in 14 days and you can see whether your corrective program is actually working — instead of relying on how you feel that morning.",
      },
      {
        h: "What a score means",
        p: "Roughly: 80+ is well-balanced movement quality, 60–80 shows targeted limitations worth correcting, and below 60 means there's a clear root cause limiting you that a short daily routine can usually move within weeks.",
      },
    ],
  },
  "functional-movement-screening-explained": {
    slug: "functional-movement-screening-explained",
    title: "Functional Movement Screening Explained",
    description:
      "What a functional movement screen is, why physios use one, and what each test reveals about your real-world mobility, stability, and injury risk.",
    body: [
      {
        h: "The short answer",
        p: "A functional movement screen is a short, standardized set of full-body tests designed to expose where your body is restricted, unstable, or compensating — before that weak link turns into pain or injury.",
      },
      {
        h: "Why physios use it",
        p: "Pain rarely starts where it hurts. A stiff ankle can wreck a squat, a sleepy glute can overload a low back, and a tight thoracic spine can stress a shoulder. A screen finds the source, not just the symptom.",
      },
      {
        h: "What SmartyMove screens",
        p: "Squat, hinge, single-leg balance, lunge, overhead reach, plus ankle dorsiflexion, hip mobility, shoulder mobility, bridge, and wall-slide sub-tests. Each one targets a specific joint and motor pattern.",
      },
      {
        h: "What you do with the results",
        p: "SmartyMove clusters your failures into at most two root causes (Ankle, Hip, Core, or Scapular) and builds a 14-day program around them — so you train the limiter, not a generic mobility routine.",
      },
    ],
  },
  "ankle-mobility-and-your-squat": {
    slug: "ankle-mobility-and-your-squat",
    title: "Ankle Mobility and Why It Affects Your Squat",
    description:
      "Limited ankle dorsiflexion is one of the most common root causes behind a shallow squat, sore knees, and a tight low back. Here's why — and how to test yours.",
    body: [
      {
        h: "The short answer",
        p: "If your ankle can't bend enough (dorsiflexion), your knee can't track forward over your toes in a squat. The body compensates by leaning the torso forward, collapsing the arches, or shifting load into the low back — and that's where pain shows up.",
      },
      {
        h: "How to test it",
        p: "Knee-to-wall test: kneel facing a wall, big toe about 10 cm away, and try to touch your knee to the wall without lifting the heel. Less than 10 cm of clearance usually points to a real ankle restriction.",
      },
      {
        h: "Why a stretch alone rarely fixes it",
        p: "Ankle mobility involves the calf, the joint capsule, and the small muscles around the foot. SmartyMove pairs mobility work with loaded stability drills so the new range sticks.",
      },
      {
        h: "How SmartyMove handles it",
        p: "If the screen flags an ankle limitation, your program prioritizes ankle mobility and calf work in the Foundation phase, then layers in single-leg stability and squat patterning in the Build phase.",
      },
    ],
  },
};

export const Route = createFileRoute("/learn/$slug")({
  loader: ({ params }) => {
    const article = ARTICLES[params.slug];
    if (!article) throw notFound();
    return article;
  },
  head: ({ loaderData, params }) => {
    const a = loaderData ?? ARTICLES[params.slug];
    if (!a) return {};
    const url = `https://smartymove.com/learn/${a.slug}`;
    return {
      meta: [
        { title: `${a.title} | SmartyMove Learn` },
        { name: "description", content: a.description },
        { property: "og:title", content: a.title },
        { property: "og:description", content: a.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Article",
                headline: a.title,
                description: a.description,
                mainEntityOfPage: url,
                url,
                inLanguage: "en",
                articleSection: "Movement Intelligence",
                keywords: [
                  "movement screening", "movement analysis", "movement score",
                  "functional movement", "corrective exercise", "mobility",
                  "stability", "biomechanics", "AI movement coach"
                ],
                author: { "@type": "Organization", name: "SmartyMove", url: "https://smartymove.com" },
                publisher: { "@id": "https://smartymove.com/#organization" },
                isPartOf: { "@id": "https://smartymove.com/#website" },
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: "https://smartymove.com/" },
                  { "@type": "ListItem", position: 2, name: "Learn", item: "https://smartymove.com/learn" },
                  { "@type": "ListItem", position: 3, name: a.title, item: url },
                ],
              },
              {
                "@type": "SpeakableSpecification",
                cssSelector: ["h1", "article p"],
              },
            ],
          }),
        },
      ],
    };
  },
  component: Article,
  notFoundComponent: () => (
    <div style={{ padding: "20px 0" }}>
      <p style={{ color: "#3B4A63" }}>Guide not found.</p>
      <Link to="/learn" style={{ color: "#0E7C86", fontWeight: 700 }}>← Back to all guides</Link>
    </div>
  ),
});

function Article() {
  const a = Route.useLoaderData();
  return (
    <article>
      <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 700, color: "#0E7C86" }}>
        SmartyMove Learn
      </div>
      <h1 style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.02em", margin: "8px 0 14px", lineHeight: 1.2 }}>
        {a.title}
      </h1>
      <p style={{ fontSize: 15.5, lineHeight: 1.65, color: "#3B4A63", margin: "0 0 18px" }}>{a.description}</p>
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5EAEC",
          borderRadius: 18,
          padding: "20px 22px",
        }}
      >
        {a.body.map((b: { h: string; p: string }) => (
          <section key={b.h} style={{ marginBottom: 16 }}>
            <h2 style={{ fontWeight: 700, fontSize: 17, color: "#14213A", margin: "0 0 6px" }}>{b.h}</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#3B4A63" }}>{b.p}</p>
          </section>
        ))}
      </div>
      <div className="mt-5">
        <Link to="/learn" style={{ color: "#0E7C86", fontWeight: 700, textDecoration: "none" }}>
          ← All movement guides
        </Link>
      </div>
    </article>
  );
}