import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Learn — Movement guides | SmartyMove" },
      {
        name: "description",
        content:
          "Plain-language guides to functional movement screening, Movement Score, ankle mobility, hip mobility, and why your weakest link drives pain and performance.",
      },
      { property: "og:title", content: "SmartyMove Learn — Movement guides" },
      {
        property: "og:description",
        content: "Functional movement screening explained. Ankle mobility, Movement Score, root-cause training.",
      },
      { property: "og:url", content: "https://smartymove.com/learn" },
    ],
    links: [{ rel: "canonical", href: "https://smartymove.com/learn" }],
  }),
  component: LearnLayout,
});

const ARTICLES = [
  {
    slug: "what-is-a-movement-score",
    title: "What Is a Movement Score?",
    blurb: "How SmartyMove turns a short camera screen into a single 0–100 number you can actually improve.",
  },
  {
    slug: "functional-movement-screening-explained",
    title: "Functional Movement Screening Explained",
    blurb: "What a movement screen is, why physios use one, and what each test actually reveals about your body.",
  },
  {
    slug: "ankle-mobility-and-your-squat",
    title: "Ankle Mobility and Why It Affects Your Squat",
    blurb: "Why a stiff ankle is one of the most common root causes behind a bad squat, sore knees, and a tight low back.",
  },
];

const TOPICS: { to: "/movement-assessment" | "/functional-movement-screening" | "/corrective-exercise" | "/mobility-and-stability" | "/posture-and-movement-quality" | "/injury-prevention" | "/movement-patterns"; title: string; blurb: string }[] = [
  { to: "/movement-assessment", title: "Movement assessment online", blurb: "What a movement assessment measures and how to run one at home." },
  { to: "/functional-movement-screening", title: "Functional movement screening", blurb: "The tests, the scoring, and what a screen can and cannot tell you." },
  { to: "/corrective-exercise", title: "Corrective exercise", blurb: "Turning a screen finding into a five-minute daily program." },
  { to: "/mobility-and-stability", title: "Mobility vs stability", blurb: "Two different problems that look identical from the outside." },
  { to: "/posture-and-movement-quality", title: "Posture & movement quality", blurb: "Movement compensations and why they matter more than posture." },
  { to: "/injury-prevention", title: "Injury prevention", blurb: "Asymmetry, weak links, and smarter movement preparation." },
  { to: "/movement-patterns", title: "The 5 movement patterns", blurb: "Every test in the SmartyMove screen, explained." },
];

function LearnLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isIndex = pathname === "/learn" || pathname === "/learn/";
  return (
    <div className="flex min-h-[100dvh] w-full flex-col" style={{ background: "#ffffff", color: "#14213A" }}>
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[760px] lg:max-w-5xl flex-1 px-5 lg:px-8 pb-6 pt-5 lg:pt-8">
        {isIndex ? <LearnIndex /> : <Outlet />}
      </main>
      <SiteFooter />
    </div>
  );
}

function LearnIndex() {
  return (
    <>
      <header>
        <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 700, color: "#0E7C86" }}>
          SmartyMove Learn
        </div>
        <h1 style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.02em", margin: "8px 0 6px" }}>
          Movement guides
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "#3B4A63", margin: 0 }}>
          Short, plain-language guides on functional movement screening, mobility tests, and how a smarter
          warm-up can fix what feels stiff or sore.
        </p>
      </header>
      <ul className="mt-5 flex flex-col gap-3" style={{ listStyle: "none", padding: 0 }}>
        {ARTICLES.map((a) => (
          <li key={a.slug}>
            <Link
              to="/learn/$slug"
              params={{ slug: a.slug }}
              style={{
                display: "block",
                background: "#fff",
                border: "1px solid #E5EAEC",
                borderRadius: 14,
                padding: "16px 18px",
                textDecoration: "none",
                color: "#14213A",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16 }}>{a.title}</div>
              <div style={{ marginTop: 4, fontSize: 13.5, color: "#3B4A63", lineHeight: 1.5 }}>{a.blurb}</div>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-8">
        <h2 style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.01em", margin: "0 0 6px" }}>
          Movement topics
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "#3B4A63", margin: "0 0 12px" }}>
          Deeper reference pages on assessment, screening, corrective exercise, mobility, stability and
          movement quality.
        </p>
        <ul className="flex flex-col gap-3" style={{ listStyle: "none", padding: 0 }}>
          {TOPICS.map((t) => (
            <li key={t.to}>
              <Link
                to={t.to}
                style={{
                  display: "block",
                  background: "#fff",
                  border: "1px solid #E5EAEC",
                  borderRadius: 14,
                  padding: "16px 18px",
                  textDecoration: "none",
                  color: "#14213A",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 16 }}>{t.title}</div>
                <div style={{ marginTop: 4, fontSize: 13.5, color: "#3B4A63", lineHeight: 1.5 }}>{t.blurb}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export { ARTICLES };