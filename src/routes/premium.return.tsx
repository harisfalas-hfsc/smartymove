import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Crown } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/premium/return")({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  head: () => ({ meta: [{ title: "Welcome to SmartyMove Premium" }] }),
  component: PremiumReturn,
});

function PremiumReturn() {
  const { session_id } = Route.useSearch();
  return (
    <div className="flex min-h-[100dvh] w-full flex-col" style={{ background: "#ffffff", color: "#14213A" }}>
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[560px] px-5 pb-8 pt-8 text-center">
        <div className="rounded-3xl bg-white p-8 shadow" style={{ border: "1px solid #E5EAEC" }}>
          {session_id ? (
            <>
              <CheckCircle2 className="mx-auto h-14 w-14" style={{ color: "#0E7C86" }} />
              <h1 className="mt-3 text-2xl font-extrabold">You're Premium 🎉</h1>
              <p className="mt-2 text-sm" style={{ color: "#3B4A63" }}>
                Thanks for subscribing. Your full corrective program, re-tests, and add-on tests are unlocked.
              </p>
              <Link to="/app" className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 font-bold text-white" style={{ background: "#0E7C86" }}>
                <Crown className="h-4 w-4" /> Open the app
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-extrabold">No session found</h1>
              <p className="mt-2 text-sm" style={{ color: "#3B4A63" }}>If you completed checkout, your subscription will be active in a few seconds.</p>
              <Link to="/premium" className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 font-bold text-white" style={{ background: "#0E7C86" }}>Back to Premium</Link>
            </>
          )}
        </div>
        <SiteFooter />
      </main>
    </div>
  );
}