import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Ruler, StretchHorizontal, MoveVertical, Package, ShieldCheck } from "lucide-react";
import { updateUser, useUser } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";

type SetupSearch = { next?: string };

export const Route = createFileRoute("/app/screen/setup")({
  ssr: false,
  validateSearch: (raw: Record<string, unknown>): SetupSearch => ({
    next: typeof raw.next === "string" ? raw.next : undefined,
  }),
  component: SetupScreen,
});

const tibialSchema = z
  .number({ invalid_type_error: "Enter your tibial height in centimetres." })
  .finite()
  .min(20, { message: "That looks too small — measure again in centimetres." })
  .max(70, { message: "That looks too large — measure again in centimetres." });

type StepId = "tibia" | "lunge_tape" | "hurdle_mark" | "heel_lift";

const STEP_ORDER: StepId[] = ["tibia", "lunge_tape", "hurdle_mark", "heel_lift"];

function SetupScreen() {
  const u = useUser();
  const navigate = useNavigate();
  const { next } = useSearch({ from: "/app/screen/setup" });

  const existing = u?.scanSetup?.tibialHeightCm;
  const [tibia, setTibia] = useState<string>(existing ? String(existing) : "");
  const [tibiaError, setTibiaError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Record<StepId, boolean>>({
    tibia: !!existing,
    lunge_tape: false,
    hurdle_mark: false,
    heel_lift: false,
  });
  const [stepIdx, setStepIdx] = useState(0);

  const tibiaCm = useMemo(() => {
    const n = Number(tibia);
    return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
  }, [tibia]);

  if (!u) return null;

  const step = STEP_ORDER[stepIdx];
  const isLast = stepIdx === STEP_ORDER.length - 1;
  const canAdvance = confirmed[step];

  function commitTibia(): boolean {
    const parsed = tibialSchema.safeParse(Number(tibia));
    if (!parsed.success) {
      setTibiaError(parsed.error.issues[0]?.message ?? "Enter a valid number.");
      return false;
    }
    setTibiaError(null);
    setConfirmed((c) => ({ ...c, tibia: true }));
    return true;
  }

  function advance() {
    if (step === "tibia" && !commitTibia()) return;
    if (!confirmed[step] && step !== "tibia") return;
    if (isLast) {
      const completedAt = new Date().toISOString();
      updateUser((prev) => ({
        ...prev,
        scanSetup: { tibialHeightCm: tibiaCm, completedAt },
      }));
      navigate({ to: next ?? "/app/screen/run", replace: true });
      return;
    }
    setStepIdx((i) => Math.min(STEP_ORDER.length - 1, i + 1));
  }

  return (
    <div className="mx-auto max-w-md px-5 pb-24 pt-4">
      <header className="mb-4 flex items-center justify-between">
        <Link
          to="/app/screen"
          className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Setup · Step {stepIdx + 1} of {STEP_ORDER.length}
        </div>
        <div className="h-10 w-10" />
      </header>

      <div className="mb-4 flex gap-1.5">
        {STEP_ORDER.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${i <= stepIdx ? "bg-primary" : "bg-secondary"}`}
          />
        ))}
      </div>

      <section className="rounded-3xl bg-card p-5 shadow-card">
        {step === "tibia" && (
          <StepShell
            icon={<Ruler className="h-6 w-6" />}
            title="Measure your tibial height"
            subtitle="This one number sets your inline-lunge spacing and hurdle-step height. You only ever enter it once."
          >
            <ol className="mb-4 space-y-2 text-sm text-foreground/80">
              <li><strong>1.</strong> Stand barefoot on a hard floor.</li>
              <li><strong>2.</strong> Find the bony bump just below your kneecap (the tibial tuberosity).</li>
              <li><strong>3.</strong> Measure from the floor to that point in centimetres.</li>
            </ol>
            <div className="space-y-1.5">
              <Label htmlFor="tibia">Tibial height (cm)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="tibia"
                  inputMode="decimal"
                  type="number"
                  step="0.1"
                  min={20}
                  max={70}
                  placeholder="e.g. 44.5"
                  value={tibia}
                  onChange={(e) => {
                    setTibia(e.target.value);
                    setTibiaError(null);
                    setConfirmed((c) => ({ ...c, tibia: false }));
                  }}
                  className="h-12 rounded-2xl bg-background text-lg"
                />
                <span className="text-sm font-semibold text-muted-foreground">cm</span>
              </div>
              {tibiaError && (
                <p className="text-sm font-semibold text-destructive">{tibiaError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Typical adult range is roughly 35–50 cm.
              </p>
            </div>
          </StepShell>
        )}

        {step === "lunge_tape" && (
          <StepShell
            icon={<StretchHorizontal className="h-6 w-6" />}
            title="Mark the floor for the Inline Lunge"
            subtitle="You'll place your back toe on one mark and your front heel on the other."
          >
            <ol className="mb-4 space-y-2 text-sm text-foreground/80">
              <li><strong>1.</strong> Place a strip of tape on the floor.</li>
              <li>
                <strong>2.</strong> Mark two points on that same straight line, exactly{" "}
                <span className="rounded-lg bg-primary/10 px-1.5 py-0.5 font-bold text-primary">
                  {tibiaCm} cm
                </span>{" "}
                apart.
              </li>
              <li><strong>3.</strong> Back toe on point 1, front heel on point 2.</li>
            </ol>
            <ConfirmToggle
              checked={confirmed.lunge_tape}
              onChange={(v) => setConfirmed((c) => ({ ...c, lunge_tape: v }))}
              label="Marks are placed and measured"
            />
          </StepShell>
        )}

        {step === "hurdle_mark" && (
          <StepShell
            icon={<MoveVertical className="h-6 w-6" />}
            title="Mark the hurdle height on a wall"
            subtitle="You'll step over an imaginary line at this height during the Hurdle Step test."
          >
            <ol className="mb-4 space-y-2 text-sm text-foreground/80">
              <li>
                <strong>1.</strong> Place a strip of tape on a wall or door frame at exactly{" "}
                <span className="rounded-lg bg-primary/10 px-1.5 py-0.5 font-bold text-primary">
                  {tibiaCm} cm
                </span>{" "}
                from the floor.
              </li>
              <li><strong>2.</strong> Keep it horizontal — that's your hurdle height.</li>
            </ol>
            <ConfirmToggle
              checked={confirmed.hurdle_mark}
              onChange={(v) => setConfirmed((c) => ({ ...c, hurdle_mark: v }))}
              label="Hurdle height is marked"
            />
          </StepShell>
        )}

        {step === "heel_lift" && (
          <StepShell
            icon={<Package className="h-6 w-6" />}
            title="Grab a heel-lift object"
            subtitle="Keep it nearby — we may ask you to retry the squat with heels elevated."
          >
            <ol className="mb-4 space-y-2 text-sm text-foreground/80">
              <li><strong>1.</strong> Find a rolled towel or thick book, about <strong>2–3 cm</strong> high.</li>
              <li><strong>2.</strong> Place it within arm's reach of your scan spot.</li>
            </ol>
            <ConfirmToggle
              checked={confirmed.heel_lift}
              onChange={(v) => setConfirmed((c) => ({ ...c, heel_lift: v }))}
              label="Heel-lift object is ready"
            />
          </StepShell>
        )}
      </section>

      <div className="mt-6 flex items-center gap-3">
        {stepIdx > 0 && (
          <Button
            variant="secondary"
            onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            className="h-12 rounded-2xl px-4 font-semibold"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        )}
        <Button
          onClick={advance}
          disabled={!canAdvance && step !== "tibia"}
          className="h-12 flex-1 rounded-2xl brand-gradient text-base font-semibold text-primary-foreground shadow-soft"
        >
          {isLast ? (
            <>
              <ShieldCheck className="h-5 w-5" /> Start scan
            </>
          ) : (
            <>
              Continue <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function StepShell({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl brand-gradient-soft text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <h1 className="text-lg font-extrabold leading-tight">{title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ConfirmToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${
        checked
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:border-primary/40"
      }`}
    >
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${
          checked ? "border-primary bg-primary text-primary-foreground" : "border-border"
        }`}
      >
        {checked && <CheckCircle2 className="h-5 w-5" />}
      </span>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}