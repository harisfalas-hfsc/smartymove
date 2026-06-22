import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { type Goal, updateOnboardingDraft, updateUser, getOnboardingDraft, getUser, restoreUserFromBackend, useUser } from "@/lib/store";

export const Route = createFileRoute("/onboarding/goal")({ component: Page });

const GOALS: { v: Goal; title: string; sub: string; emoji: string }[] = [
  { v: "reduce_pain",    title: "Reduce pain",                 sub: "Calm symptoms, restore basics", emoji: "🩹" },
  { v: "prevent_injury", title: "Prevent injury",              sub: "Bulletproof the weak links",     emoji: "🛡️" },
  { v: "start_sport",    title: "Start a sport or running",    sub: "Get a safe baseline",            emoji: "🏃" },
  { v: "perform_better", title: "Perform better",              sub: "Unlock range and control",       emoji: "⚡" },
  { v: "feel_better",    title: "Move and feel better",        sub: "General wellbeing",              emoji: "🌿" },
];

function Page() {
  const navigate = useNavigate();
  const user = useUser();
  const [authChecked, setAuthChecked] = useState(false);
  const [g, setG] = useState<Goal | null>(getUser()?.goal ?? getOnboardingDraft().goal ?? null);
  useEffect(() => {
    let alive = true;
    void restoreUserFromBackend()
      .then((restored) => {
        if (!alive) return;
        if (restored?.goal && !g) setG(restored.goal);
      })
      .finally(() => { if (alive) setAuthChecked(true); });
    return () => { alive = false; };
  }, []);
  function next() {
    if (!g) return;
    if (getUser()) {
      updateUser({ goal: g });
      navigate({ to: "/app" });
      return;
    }
    updateOnboardingDraft({ goal: g });
    window.location.assign("/?auth=signup");
  }
  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">What brings you here?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pick one. We'll shape your routine around it.</p>
      </div>
      <div className="space-y-2.5">
        {GOALS.map(o => {
          const active = g === o.v;
          return (
            <button key={o.v} onClick={() => setG(o.v)}
              className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${active ? "border-primary bg-accent shadow-soft" : "border-border bg-card"}`}>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl brand-gradient-soft text-2xl">{o.emoji}</span>
              <div className="flex-1">
                <div className="font-bold">{o.title}</div>
                <div className="text-xs text-muted-foreground">{o.sub}</div>
              </div>
            </button>
          );
        })}
      </div>
      <Button disabled={!g || !authChecked} onClick={next} className="h-12 w-full rounded-2xl brand-gradient text-base font-semibold shadow-soft disabled:opacity-50">
        {!authChecked ? "Checking account…" : user ? "Save goal" : "Create account to continue"}
      </Button>
    </div>
  );
}
