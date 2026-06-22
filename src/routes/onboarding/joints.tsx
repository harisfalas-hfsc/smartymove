import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { type Joint, updateUser, getUser } from "@/lib/store";

export const Route = createFileRoute("/onboarding/joints")({ component: Page });

const OPTIONS: { v: Joint; label: string; emoji: string }[] = [
  { v: "ankle", label: "Ankle", emoji: "🦶" },
  { v: "knee", label: "Knee", emoji: "🦵" },
  { v: "hip", label: "Hip", emoji: "🦴" },
  { v: "back", label: "Low back / Spine", emoji: "🌿" },
  { v: "shoulder", label: "Shoulder", emoji: "💪" },
  { v: "elbow", label: "Elbow", emoji: "🤜" },
  { v: "wrist", label: "Wrist", emoji: "✋" },
  { v: "none", label: "None", emoji: "✨" },
];

function Page() {
  const navigate = useNavigate();
  const [picked, setPicked] = useState<Joint[]>(getUser()?.questionnaire?.joints ?? []);
  function toggle(j: Joint) {
    if (j === "none") { setPicked(["none"]); return; }
    setPicked(p => {
      const without = p.filter(x => x !== "none" && x !== j);
      if (p.includes(j)) return without;
      if (without.length >= 2) return without;
      return [...without, j];
    });
  }
  function next() {
    updateUser(u => ({ ...u, questionnaire: { ...(u.questionnaire!), joints: picked } }));
    navigate({ to: "/onboarding/disclaimer" });
  }
  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Where do you feel it?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pick up to 2 areas, or "None". We'll add targeted tests for those joints.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map(o => {
          const active = picked.includes(o.v);
          return (
            <button key={o.v} onClick={() => toggle(o.v)}
              className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all ${active ? "border-primary bg-accent shadow-soft" : "border-border bg-card"}`}>
              <span className="text-2xl">{o.emoji}</span>
              <span className="text-sm font-semibold">{o.label}</span>
            </button>
          );
        })}
      </div>
      <div className="text-center text-xs text-muted-foreground">{picked.length}/2 selected</div>
      <Button disabled={picked.length === 0} onClick={next} className="h-12 w-full rounded-2xl brand-gradient text-base font-semibold shadow-soft disabled:opacity-50">Continue</Button>
    </div>
  );
}
