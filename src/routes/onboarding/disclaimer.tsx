import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getUser, updateOnboardingDraft, updateUser } from "@/lib/store";

export const Route = createFileRoute("/onboarding/disclaimer")({ component: Page });

function Page() {
  const navigate = useNavigate();
  const [ok, setOk] = useState(false);
  function next() {
    const user = getUser();
    if (user) updateUser(u => ({ ...u, questionnaire: { ...(u.questionnaire!), disclaimerAccepted: true } }));
    else updateOnboardingDraft(draft => ({ ...draft, questionnaire: { ...(draft.questionnaire!), disclaimerAccepted: true } }));
    navigate({ to: "/onboarding/goal" });
  }
  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Release of liability</h2>
        <p className="mt-1 text-sm text-muted-foreground">Please read and accept to continue. Full text on the Disclaimer page.</p>
      </div>
      <div className="space-y-3 rounded-3xl bg-card p-5 text-sm leading-relaxed shadow-card">
        <p>
          <strong>SmartyMove is not a doctor, physiotherapist, or other healthcare provider</strong> and does not provide medical advice, diagnosis, or treatment. The Movement Score, Movement Age, joint sub-scores, and corrective routines are for general wellness purposes only.
        </p>
        <p>
          <strong>Readiness:</strong> You confirm that the answers you gave in the readiness questionnaire and joint-issue selection are accurate. If any red-flag symptom applies to you (numbness, unexplained pain, chest pain, dizziness, recent surgery, pregnancy concerns), you will obtain medical clearance before continuing.
        </p>
        <p>
          <strong>Assumption of risk &amp; release:</strong> You voluntarily assume all risks associated with physical activity and release SmartyMove, its operator and contributors from any claim for injury, illness, or damage arising from your use of the screens or corrective routines, to the fullest extent permitted by law. Stop any test or routine immediately if you feel pain, dizziness, faintness, or shortness of breath.
        </p>
        <p>
          <strong>Camera &amp; data:</strong> Pose detection runs on-device. Raw video is never uploaded. Only your derived metrics (angles, scores, timestamps) are saved.
        </p>
        <p className="text-[12px] text-muted-foreground">
          Read the full{" "}
          <Link to="/disclaimer" target="_blank" className="font-semibold text-primary underline">Disclaimer &amp; Release of Liability</Link>,{" "}
          <Link to="/terms" target="_blank" className="font-semibold text-primary underline">Terms &amp; Conditions</Link>, and{" "}
          <Link to="/privacy" target="_blank" className="font-semibold text-primary underline">Privacy Policy</Link>.
        </p>
      </div>
      <label className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-card">
        <Checkbox checked={ok} onCheckedChange={v => setOk(!!v)} className="mt-0.5" />
        <span className="text-sm">I have read and accept the Disclaimer &amp; Release of Liability, Terms &amp; Conditions, and Privacy Policy.</span>
      </label>
      <Button disabled={!ok} onClick={next} className="h-12 w-full rounded-2xl brand-gradient text-base font-semibold shadow-soft disabled:opacity-50">I agree, continue</Button>
    </div>
  );
}
