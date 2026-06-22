import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { updateUser } from "@/lib/store";

export const Route = createFileRoute("/onboarding/disclaimer")({ component: Page });

function Page() {
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);
  function next() {
    updateUser(u => ({ ...u, questionnaire: { ...(u.questionnaire!), disclaimerAccepted: true } }));
    navigate({ to: "/onboarding/goal" });
  }
  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">A note before we start</h2>
        <p className="mt-1 text-sm text-muted-foreground">Please read and accept to continue.</p>
      </div>
      <div className="space-y-3 rounded-3xl bg-card p-5 text-sm leading-relaxed shadow-card">
        <p><strong>SmartyMove does not provide medical advice.</strong> Scores, the Movement Age estimate, and any recommendations are educational and motivational, not diagnostic.</p>
        <p>By continuing, you accept our Terms of Use and Liability Waiver and confirm you are exercising at your own risk. Stop any test that causes pain.</p>
        <p className="rounded-xl bg-muted px-3 py-2 text-[11px] font-mono text-muted-foreground">⚠️ REPLACE WITH LAWYER-REVIEWED TEXT before launch.</p>
      </div>
      <label className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card">
        <Checkbox checked={ok} onCheckedChange={v => setOk(!!v)} className="mt-0.5" />
        <span className="text-sm">I have read and accept the Terms of Use and Liability Waiver.</span>
      </label>
      <Button disabled={!ok} onClick={next} className="h-12 w-full rounded-2xl brand-gradient text-base font-semibold shadow-soft disabled:opacity-50">I agree, continue</Button>
    </div>
  );
}
