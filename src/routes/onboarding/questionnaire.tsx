import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { type Pain, updateOnboardingDraft, updateUser, getOnboardingDraft, getUser } from "@/lib/store";

export const Route = createFileRoute("/onboarding/questionnaire")({ component: Page });

const PAINS: {
  v: Pain;
  label: string;
  selectedBg: string;
  selectedText: string;
  selectedRing: string;
}[] = [
  { v: "none",     label: "None",     selectedBg: "#16A34A", selectedText: "#FFFFFF", selectedRing: "#16A34A" },
  { v: "mild",     label: "Mild",     selectedBg: "#EAB308", selectedText: "#1F1300", selectedRing: "#CA8A04" },
  { v: "moderate", label: "Moderate", selectedBg: "#F97316", selectedText: "#FFFFFF", selectedRing: "#EA580C" },
  { v: "severe",   label: "Severe",   selectedBg: "#DC2626", selectedText: "#FFFFFF", selectedRing: "#B91C1C" },
];

function Page() {
  const navigate = useNavigate();
  const existing = getUser()?.questionnaire ?? getOnboardingDraft().questionnaire;
  const [pain, setPain] = useState<Pain | null>(existing?.pain ?? null);
  const [walk, setWalk] = useState<boolean | null>(existing?.canWalk ?? null);
  const [run, setRun] = useState<boolean | null>(existing?.canRun ?? null);
  const [jump, setJump] = useState<boolean | null>(existing?.canJump ?? null);
  const [injury, setInjury] = useState<boolean | null>(existing?.recentInjury ?? null);
  // One combined red-flag question per spec: numbness / night pain / unexplained symptoms.
  const [redFlag, setRedFlag] = useState<boolean | null>(
    existing?.numbness || existing?.nightPain || existing?.unexplainedSymptoms ? true :
    (existing && (existing.numbness === false && existing.nightPain === false && existing.unexplainedSymptoms === false) ? false : null)
  );

  const yesNoRows: { key: string; label: string; v: boolean | null; set: (b: boolean) => void }[] = [
    { key: "walk", label: "I can walk without pain", v: walk, set: setWalk },
    { key: "run", label: "I can run without pain", v: run, set: setRun },
    { key: "jump", label: "I can jump and land without pain", v: jump, set: setJump },
    { key: "injury", label: "I had a recent injury or surgery", v: injury, set: setInjury },
    { key: "flag", label: "Any numbness, night pain, or unexplained symptoms", v: redFlag, set: setRedFlag },
  ];

  const allAnswered = pain !== null && yesNoRows.every(r => r.v !== null);
  const showWarning =
    pain === "severe" || injury === true || redFlag === true;

  function next() {
    if (!allAnswered) return;
    const questionnaire = {
      pain: pain as Pain,
      canWalk: walk!, canRun: run!, canJump: jump!,
      recentInjury: injury!, redFlags: redFlag!,
      numbness: redFlag!, nightPain: redFlag!, unexplainedSymptoms: redFlag!,
      joints: existing?.joints ?? [],
      disclaimerAccepted: existing?.disclaimerAccepted ?? false,
    };
    const user = getUser();
    if (user) updateUser(u => ({ ...u, questionnaire }));
    else updateOnboardingDraft({ questionnaire });
    navigate({ to: "/onboarding/joints" });
  }

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Quick readiness check</h2>
        <p className="mt-1 text-sm text-muted-foreground">Every question is required. Answer honestly — this calibrates your screen safely.</p>
      </div>
      <div>
        <Label className="mb-2 block text-sm font-semibold">Current pain level</Label>
        <div className="grid grid-cols-4 gap-2">
          {PAINS.map(p => {
            const isSelected = pain === p.v;
            return (
              <button
                key={p.v}
                type="button"
                onClick={() => setPain(p.v)}
                aria-pressed={isSelected}
                style={isSelected ? {
                  background: p.selectedBg,
                  color: p.selectedText,
                  boxShadow: `0 8px 20px -8px ${p.selectedRing}, 0 0 0 2px ${p.selectedRing}`,
                } : undefined}
                className={`rounded-2xl px-2 py-3 text-sm font-bold transition-all active:scale-[0.97] ${
                  isSelected
                    ? "scale-[1.02]"
                    : "bg-secondary text-foreground/70 hover:bg-secondary/80 border border-border"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="rounded-3xl bg-card p-1 shadow-card">
        {yesNoRows.map((row, i, arr) => (
          <div key={row.key} className={`flex items-center justify-between gap-4 px-4 py-3 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
            <span className="text-sm font-medium">{row.label}</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => row.set(true)}
                aria-pressed={row.v === true}
                style={row.v === true ? { background: "#16A34A", color: "#FFFFFF", boxShadow: "0 6px 14px -6px #16A34A, 0 0 0 2px #16A34A" } : undefined}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${row.v === true ? "" : "bg-secondary text-foreground/70 border border-border hover:bg-secondary/80"}`}
              >Yes</button>
              <button
                type="button"
                onClick={() => row.set(false)}
                aria-pressed={row.v === false}
                style={row.v === false ? { background: "#DC2626", color: "#FFFFFF", boxShadow: "0 6px 14px -6px #DC2626, 0 0 0 2px #B91C1C" } : undefined}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${row.v === false ? "" : "bg-secondary text-foreground/70 border border-border hover:bg-secondary/80"}`}
              >No</button>
            </div>
          </div>
        ))}
      </div>
      {showWarning && (
        <div className="rounded-2xl border border-warning/50 bg-warning/10 p-3 text-sm">
          <strong className="font-semibold">Please consult a doctor before continuing.</strong> You can still proceed, but treat any results as informational only.
        </div>
      )}
      {!allAnswered && (
        <p className="text-center text-xs text-muted-foreground">Answer every question to continue.</p>
      )}
      <Button
        onClick={next}
        disabled={!allAnswered}
        className="h-12 w-full rounded-2xl brand-gradient text-base font-semibold shadow-soft disabled:opacity-50"
      >Continue</Button>
    </div>
  );
}
