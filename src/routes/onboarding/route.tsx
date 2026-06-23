import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

const STEPS = [
  { path: "/onboarding/parq", label: "Health check" },
  { path: "/onboarding/questionnaire", label: "Readiness" },
  { path: "/onboarding/joints", label: "Areas" },
  { path: "/onboarding/disclaimer", label: "Consent" },
  { path: "/onboarding/goal", label: "Goal" },
];

export const Route = createFileRoute("/onboarding")({ component: OnboardingLayout });

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
      <main className="mx-auto w-full max-w-[440px] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mb-4">
          <div className="text-[11px] font-semibold uppercase text-muted-foreground">Step {idx + 1} of {STEPS.length} · {STEPS[idx]?.label}</div>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full ${i <= idx ? "brand-gradient" : "bg-muted"}`} />
            ))}
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
