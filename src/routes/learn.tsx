import { createFileRoute, Outlet } from "@tanstack/react-router";
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
    ],
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

function LearnLayout() {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col" style={{ background: "#ffffff", color: "#14213A" }}>
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[760px] lg:max-w-5xl flex-1 px-5 lg:px-8 pb-6 pt-5 lg:pt-8">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}

export { ARTICLES };
