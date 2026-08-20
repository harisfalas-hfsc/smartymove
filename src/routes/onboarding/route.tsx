import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ChevronLeft } from "lucide-react";

const STEPS = [
  { path: "/onboarding/parq", label: "Health check" },
  { path: "/onboarding/questionnaire", label: "Readiness" },
  { path: "/onboarding/joints", label: "Areas" },
  { path: "/onboarding/disclaimer", label: "Consent" },
  { path: "/onboarding/goal", label: "Goal" },
];

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Get started — SmartyMove" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: OnboardingLayout });

function OnboardingLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const idx = Math.max(0, STEPS.findIndex(s => pathname.startsWith(s.path)));
  function goBack() {
    if (idx === 0) navigate({ to: "/" });
    else if (idx === 1) navigate({ to: "/onboarding/parq" });
    else if (idx === 2) navigate({ to: "/onboarding/questionnaire" });
    else if (idx === 3) navigate({ to: "/onboarding/joints" });
    else navigate({ to: "/onboarding/disclaimer" });
  }
  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background text-foreground">
      <SiteHeader showBack onBack={goBack} />
      <main className="mx-auto w-full max-w-[440px] flex-1 px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              aria-label={idx === 0 ? "Back to home" : `Back to step ${idx}`}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {idx === 0 ? "Home" : "Back"}
            </button>
            <div className="text-[11px] font-semibold uppercase text-muted-foreground">Step {idx + 1} of {STEPS.length} · {STEPS[idx]?.label}</div>
          </div>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {STEPS.map((s, i) => {
              const reachable = i < idx;
              return (
                <button
                  key={s.path}
                  type="button"
                  disabled={!reachable && i !== idx}
                  onClick={() => reachable && navigate({ to: s.path })}
                  aria-label={`Go to step ${i + 1}: ${s.label}`}
                  className={`h-1.5 rounded-full transition-opacity ${i <= idx ? "brand-gradient" : "bg-muted"} ${reachable ? "cursor-pointer hover:opacity-80" : i === idx ? "" : "cursor-not-allowed"}`}
                />
              );
            })}
          </div>
        </div>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
