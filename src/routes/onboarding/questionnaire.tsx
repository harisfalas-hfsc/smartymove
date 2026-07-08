import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { type Pain, type PainArea, updateOnboardingDraft, updateUser, getOnboardingDraft, getUser } from "@/lib/store";

export const Route = createFileRoute("/onboarding/questionnaire")({ component: Page });

const PAINS: { v: Pain; label: string }[] = [
  { v: "none",     label: "None" },
  { v: "mild",     label: "Mild" },
  { v: "moderate", label: "Moderate" },
  { v: "severe",   label: "Severe" },
];

// Body areas mapped to the 8 SmartyMove patterns. If the user reports pain
// in any of these, the scan still runs (Option A) — the program engine uses
// this list to add caution notes / avoid loading painful areas.
const PAIN_AREAS: { v: PainArea; label: string; hint: string }[] = [
  { v: "neck",             label: "Neck",                 hint: "Overhead reach, push-up" },
  { v: "shoulders",        label: "Shoulders",            hint: "Shoulder mobility, push-up, rotary" },
  { v: "low_back",         label: "Low back",             hint: "Squat, hinge, push-up, rotary" },
  { v: "hips",             label: "Hips / groin",         hint: "Squat, hinge, lunge, leg raise" },
  { v: "knees",            label: "Knees",                hint: "Squat, hurdle step, lunge" },
  { v: "ankles_feet",      label: "Ankles / feet",        hint: "Squat, hurdle step, lunge" },
  { v: "wrists_elbows",    label: "Wrists / elbows",      hint: "Push-up, rotary stability" },
];

function Page() {
  const navigate = useNavigate();
  const existing = getUser()?.questionnaire ?? getOnboardingDraft().questionnaire;
  const [pain, setPain] = useState<Pain | null>(existing?.pain ?? null);
  const [walk, setWalk] = useState<boolean | null>(existing?.canWalk ?? null);
  const [run, setRun] = useState<boolean | null>(existing?.canRun ?? null);
  const [jump, setJump] = useState<boolean | null>(existing?.canJump ?? null);
  const [injury, setInjury] = useState<boolean | null>(existing?.recentInjury ?? null);
  const [painAreas, setPainAreas] = useState<PainArea[]>(existing?.painAreas ?? []);
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
  const painAreasRequired = pain !== null && pain !== "none";
  const painAreasOk = !painAreasRequired || painAreas.length > 0;
  const canContinue = allAnswered && painAreasOk;
  const showWarning =
    pain === "severe" || injury === true || redFlag === true;

  function next() {
    if (!canContinue) return;
    const questionnaire = {
      pain: pain as Pain,
      canWalk: walk!, canRun: run!, canJump: jump!,
      recentInjury: injury!, redFlags: redFlag!,
      numbness: redFlag!, nightPain: redFlag!, unexplainedSymptoms: redFlag!,
      joints: existing?.joints ?? [],
      painAreas: pain === "none" ? [] : painAreas,
      disclaimerAccepted: existing?.disclaimerAccepted ?? false,
    };
    const user = getUser();
    if (user) updateUser(u => ({ ...u, questionnaire }));
    else updateOnboardingDraft({ questionnaire });
    navigate({ to: "/onboarding/joints" });
  }

  function toggleArea(a: PainArea) {
    setPainAreas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Quick readiness check</h2>
        <p className="mt-1 text-sm text-muted-foreground">Every question is required. Answer honestly — this calibrates your 8-pattern scan safely.</p>
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
                className={`rounded-2xl px-2 py-3 text-sm font-bold transition-all active:scale-[0.97] ${
                  isSelected
                    ? "brand-gradient text-white shadow-card ring-2 ring-primary scale-[1.02]"
                    : "bg-secondary text-foreground/70 hover:bg-secondary/80 border border-border"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
      {painAreasRequired && (
        <div>
          <Label className="mb-1 block text-sm font-semibold">Where is the pain? <span className="text-muted-foreground font-normal">(select all that apply)</span></Label>
          <p className="mb-2 text-xs text-muted-foreground">Your scan will still run. We use this so your program adds caution notes for movements that load these areas.</p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {PAIN_AREAS.map(a => {
              const on = painAreas.includes(a.v);
              return (
                <button
                  key={a.v}
                  type="button"
                  onClick={() => toggleArea(a.v)}
                  aria-pressed={on}
                  className={`flex flex-col items-start gap-0.5 rounded-2xl px-3 py-2.5 text-left transition-all active:scale-[0.98] ${
                    on
                      ? "brand-gradient text-white shadow-card ring-2 ring-primary"
                      : "bg-secondary text-foreground/80 border border-border hover:bg-secondary/80"
                  }`}
                >
                  <span className="text-sm font-bold">{a.label}</span>
                  <span className={`text-[11px] ${on ? "text-white/85" : "text-muted-foreground"}`}>{a.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="rounded-3xl bg-card p-1 shadow-card">
        {yesNoRows.map((row, i, arr) => (
          <div key={row.key} className={`flex items-center justify-between gap-4 px-4 py-3 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
            <span className="text-sm font-medium">{row.label}</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => row.set(true)}
                aria-pressed={row.v === true}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${row.v === true ? "brand-gradient text-white shadow-card ring-2 ring-primary" : "bg-secondary text-foreground/70 border border-border hover:bg-secondary/80"}`}
              >Yes</button>
              <button
                type="button"
                onClick={() => row.set(false)}
                aria-pressed={row.v === false}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${row.v === false ? "bg-primary text-primary-foreground shadow-card ring-2 ring-primary" : "bg-secondary text-foreground/70 border border-border hover:bg-secondary/80"}`}
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
      {!canContinue && (
        <p className="text-center text-xs text-muted-foreground">Answer every question to continue.</p>
      )}
      <Button
        onClick={next}
        disabled={!canContinue}
        className="h-12 w-full rounded-2xl brand-gradient text-base font-semibold shadow-soft disabled:opacity-50"
      >Continue</Button>
    </div>
  );
}
