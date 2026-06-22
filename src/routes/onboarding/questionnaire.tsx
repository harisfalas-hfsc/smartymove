import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { type Pain, updateOnboardingDraft, updateUser, getOnboardingDraft, getUser } from "@/lib/store";

export const Route = createFileRoute("/onboarding/questionnaire")({ component: Page });

const PAINS: { v: Pain; label: string; tint: string }[] = [
  { v: "none", label: "None", tint: "bg-success/15 text-foreground" },
  { v: "mild", label: "Mild", tint: "bg-accent text-accent-foreground" },
  { v: "moderate", label: "Moderate", tint: "bg-warning/20 text-foreground" },
  { v: "severe", label: "Severe", tint: "bg-destructive/15 text-foreground" },
];

function Page() {
  const navigate = useNavigate();
  const existing = getUser()?.questionnaire ?? getOnboardingDraft().questionnaire;
  const [pain, setPain] = useState<Pain>(existing?.pain ?? "none");
  const [walk, setWalk] = useState(existing?.canWalk ?? true);
  const [run, setRun] = useState(existing?.canRun ?? true);
  const [jump, setJump] = useState(existing?.canJump ?? true);
  const [injury, setInjury] = useState(existing?.recentInjury ?? false);
  const [numbness, setNumbness] = useState(existing?.numbness ?? false);
  const [nightPain, setNightPain] = useState(existing?.nightPain ?? false);
  const [unexplained, setUnexplained] = useState(existing?.unexplainedSymptoms ?? false);
  const flags = numbness || nightPain || unexplained;

  function next() {
    const questionnaire = {
      pain, canWalk: walk, canRun: run, canJump: jump,
      recentInjury: injury, redFlags: flags,
      numbness, nightPain, unexplainedSymptoms: unexplained,
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
        <p className="mt-1 text-sm text-muted-foreground">Helps us calibrate your screen safely.</p>
      </div>
      <div>
        <Label className="mb-2 block text-sm font-semibold">Current pain level</Label>
        <div className="grid grid-cols-4 gap-2">
          {PAINS.map(p => (
            <button key={p.v} onClick={() => setPain(p.v)}
              className={`rounded-2xl px-2 py-3 text-xs font-semibold transition-all ${pain === p.v ? "ring-2 ring-primary shadow-card " + p.tint : p.tint + " opacity-70"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-3xl bg-card p-1 shadow-card">
        {[
          { label: "I can walk without pain", v: walk, set: setWalk },
          { label: "I can run without pain", v: run, set: setRun },
          { label: "I can jump and land without pain", v: jump, set: setJump },
          { label: "I had a recent injury or surgery", v: injury, set: setInjury },
          { label: "Numbness or tingling", v: numbness, set: setNumbness },
          { label: "Night pain (wakes you up)", v: nightPain, set: setNightPain },
          { label: "Unexplained symptoms (weight loss, fever)", v: unexplained, set: setUnexplained },
        ].map((row, i, arr) => (
          <div key={row.label} className={`flex items-center justify-between gap-4 px-4 py-3 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
            <span className="text-sm font-medium">{row.label}</span>
            <Switch checked={row.v} onCheckedChange={row.set} />
          </div>
        ))}
      </div>
      {(flags || pain === "severe") && (
        <div className="rounded-2xl border border-warning/50 bg-warning/10 p-3 text-sm">
          <strong className="font-semibold">Heads up:</strong> Please consult a clinician before continuing. You can still proceed, but treat any results as informational only.
        </div>
      )}
      <Button onClick={next} className="h-12 w-full rounded-2xl brand-gradient text-base font-semibold shadow-soft">Continue</Button>
    </div>
  );
}
