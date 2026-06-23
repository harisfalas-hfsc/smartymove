import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateOnboardingDraft, updateUser, getOnboardingDraft, getUser, type ParqAnswers } from "@/lib/store";

export const Route = createFileRoute("/onboarding/parq")({ component: Page });

type QKey = Exclude<keyof ParqAnswers, "acknowledgedWarning">;

const QUESTIONS: { key: QKey; label: string }[] = [
  { key: "heartCondition", label: "Has a doctor ever said you have a heart condition and recommended only medically supervised activity?" },
  { key: "chestPainActivity", label: "Do you feel pain in your chest during physical activity?" },
  { key: "chestPainRest", label: "Have you had chest pain in the past month when not doing physical activity?" },
  { key: "balanceLoss", label: "Do you lose balance because of dizziness, or have you lost consciousness in the past 12 months?" },
  { key: "boneJoint", label: "Do you have a bone or joint problem that could worsen with physical activity?" },
  { key: "bpMedication", label: "Are you currently taking medication for blood pressure or a heart condition?" },
  { key: "otherReason", label: "Do you know of any other reason you should not do physical activity?" },
];

function Page() {
  const navigate = useNavigate();
  const existing = getUser()?.parq ?? getOnboardingDraft().parq;
  const [ans, setAns] = useState<Record<QKey, boolean | null>>(() => {
    const init = {} as Record<QKey, boolean | null>;
    for (const q of QUESTIONS) init[q.key] = existing ? (existing[q.key] ?? null) : null;
    return init;
  });

  const allAnswered = QUESTIONS.every(q => ans[q.key] !== null);
  const anyYes = QUESTIONS.some(q => ans[q.key] === true);

  function next() {
    if (!allAnswered) return;
    const parq: ParqAnswers = {
      heartCondition: ans.heartCondition!,
      chestPainActivity: ans.chestPainActivity!,
      chestPainRest: ans.chestPainRest!,
      balanceLoss: ans.balanceLoss!,
      boneJoint: ans.boneJoint!,
      bpMedication: ans.bpMedication!,
      otherReason: ans.otherReason!,
      acknowledgedWarning: anyYes,
    };
    const user = getUser();
    if (user) updateUser(u => ({ ...u, parq }));
    else updateOnboardingDraft(d => ({ ...d, parq }));
    navigate({ to: "/onboarding/questionnaire" });
  }

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Health & safety check</h2>
        <p className="mt-1 text-sm text-muted-foreground">A short standard screening before any movement. Answer every question.</p>
      </div>
      <div className="rounded-3xl bg-card p-1 shadow-card">
        {QUESTIONS.map((q, i) => (
          <div key={q.key} className={`flex items-start justify-between gap-4 px-4 py-3 ${i < QUESTIONS.length - 1 ? "border-b border-border" : ""}`}>
            <span className="flex-1 text-sm font-medium leading-snug">{q.label}</span>
            <div className="flex shrink-0 gap-1.5">
              <button type="button" onClick={() => setAns(a => ({ ...a, [q.key]: true }))}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${ans[q.key] === true ? "bg-primary text-primary-foreground shadow-card" : "bg-secondary text-foreground/70"}`}>Yes</button>
              <button type="button" onClick={() => setAns(a => ({ ...a, [q.key]: false }))}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${ans[q.key] === false ? "bg-primary text-primary-foreground shadow-card" : "bg-secondary text-foreground/70"}`}>No</button>
            </div>
          </div>
        ))}
      </div>
      {anyYes && (
        <div className="rounded-2xl border border-warning/50 bg-warning/10 p-3 text-sm">
          <strong className="font-semibold">Please consult a doctor before continuing.</strong> You answered "Yes" to at least one screening question. You can still proceed, but treat any results as informational only and stop if you feel unwell.
        </div>
      )}
      {!allAnswered && (
        <p className="text-center text-xs text-muted-foreground">Answer every question to continue.</p>
      )}
      <Button onClick={next} disabled={!allAnswered} className="h-12 w-full rounded-2xl brand-gradient text-base font-semibold shadow-soft disabled:opacity-50">Continue</Button>
    </div>
  );
}