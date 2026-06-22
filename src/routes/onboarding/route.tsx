import { createFileRoute, Outlet, useRouterState, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { ChevronLeft } from "lucide-react";

const STEPS = [
  { path: "/onboarding/questionnaire", label: "Readiness" },
  { path: "/onboarding/joints", label: "Areas" },
  { path: "/onboarding/disclaimer", label: "Consent" },
  { path: "/onboarding/goal", label: "Goal" },
];

export const Route = createFileRoute("/onboarding")({ component: OnboardingLayout });

function OnboardingLayout() {
  const pathname = useRouterState({ select: s => s.location.pathname });
  const idx = Math.max(0, STEPS.findIndex(s => pathname.startsWith(s.path)));
  const prev = STEPS[idx - 1]?.path ?? "/";
  return (
    <PhoneFrame>
      <div className="flex h-full min-h-[100dvh] flex-col bg-background">
        <header className="flex items-center gap-3 px-4 pb-3 pt-5">
          <Link to={prev} className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Step {idx + 1} of {STEPS.length}</div>
            <div className="text-base font-bold">{STEPS[idx]?.label}</div>
          </div>
        </header>
        <div className="px-4">
          <div className="grid grid-cols-4 gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full ${i <= idx ? "brand-gradient" : "bg-muted"}`} />
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6"><Outlet /></div>
      </div>
    </PhoneFrame>
  );
}
