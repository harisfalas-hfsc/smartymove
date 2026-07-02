import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useUser } from "@/lib/store";
import { ScoreRing } from "@/components/ScoreRing";
import { SubScoreBar } from "@/components/SubScoreBar";
import { Activity, ArrowRight, Flame, Calendar, CheckCircle2, Dumbbell, Moon } from "lucide-react";
import { useCurrentPhase } from "@/lib/exercises";
import { ExerciseSheet } from "@/components/ExerciseSheet";
import { evaluateProgress } from "@/lib/corrective/progression";
import { getOngoingTrack } from "@/lib/corrective/phase";
import { useProgramStatus, isTrainingDay, TRAINING_DAY_INDICES, PROGRAM_SESSIONS } from "@/lib/program";

export const Route = createFileRoute("/app/")({ component: Home });

function Home() {
  const u = useUser();
  const [openId, setOpenId] = useState<string | null>(null);
  const phase = useCurrentPhase();
  const status = useProgramStatus();
  if (!u) return null;
  const latest = u.sessions[u.sessions.length - 1];
  const daysSince = latest ? Math.floor((Date.now() - new Date(latest.date).getTime()) / 86400000) : null;
  const daysUntilRetest = latest ? Math.max(0, 14 - (daysSince ?? 0)) : null;
  const retestDue = latest != null && (daysSince ?? 0) >= 14;
  const progression = evaluateProgress(u.sessions);
  const ongoing = getOngoingTrack(u.programStartDate ?? u.createdAt, u.goal);

  return (
    <div className="pb-6">
      <header className="brand-gradient-strong px-5 pb-8 pt-7 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Hi, {u.name.split(" ")[0]}</div>
            <div className="mt-0.5 text-lg font-bold">Ready to move smarter?</div>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Activity className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur">
            <Flame className="mx-auto h-4 w-4" />
            <div className="mt-1 text-xl font-extrabold">{u.streak}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-80">Streak</div>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur">
            <Activity className="mx-auto h-4 w-4" />
            <div className="mt-1 text-xl font-extrabold">{latest?.overall ?? "—"}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-80">Score</div>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur">
            <Calendar className="mx-auto h-4 w-4" />
            <div className="mt-1 text-xl font-extrabold">{daysUntilRetest ?? "—"}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-80">Re-test in</div>
          </div>
        </div>
      </header>

      <div className="-mt-5 space-y-4 rounded-t-[2rem] bg-background px-5 pt-6">
        {retestDue && (
          <Link
            to="/app/screen"
            className="block rounded-3xl brand-gradient p-5 text-primary-foreground shadow-soft"
            style={{ textDecoration: "none" }}
          >
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-90">
              <Calendar className="h-3.5 w-3.5" /> Time to rescan
            </div>
            <div className="mt-1 text-lg font-extrabold">Your program needs an update</div>
            <p className="mt-1 text-sm opacity-95">
              Your 2-week program is complete. Rescan now to measure your progress and unlock your next program.
            </p>
            <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold">
              Start Movement Screen <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        )}
        {phase && (
          <div className="rounded-3xl bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Phase</div>
                <div className="text-base font-extrabold capitalize">{phase.label} · Week {phase.weekInPhase}</div>
              </div>
              <div className="flex gap-1.5 text-[10px] font-bold uppercase tracking-wide">
                <span className="rounded-full bg-accent px-2 py-1">Mob {Math.round(phase.ratios.mobility * 100)}%</span>
                <span className="rounded-full bg-accent px-2 py-1">Stab {Math.round(phase.ratios.stability * 100)}%</span>
                <span className="rounded-full bg-accent px-2 py-1">Str {Math.round(phase.ratios.strength * 100)}%</span>
              </div>
            </div>
          </div>
        )}
        {progression && progression.status !== "first" && (
          <div className={`rounded-3xl p-4 shadow-card ${progression.status === "improved" ? "bg-success/15 ring-1 ring-success/40" : progression.status === "stalled" ? "bg-warning/15 ring-1 ring-warning/40" : "bg-card"}`}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Latest re-test</div>
            <div className="mt-0.5 text-base font-extrabold">{progression.headline}</div>
            <p className="mt-1 text-xs text-muted-foreground">{progression.detail}</p>
          </div>
        )}
        {ongoing.active && (
          <div className="rounded-3xl brand-gradient-soft p-4 shadow-card">
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Ongoing program</div>
            <div className="mt-0.5 text-base font-extrabold">{ongoing.label}</div>
            <p className="mt-1 text-xs text-muted-foreground">{ongoing.description}</p>
          </div>
        )}
        {!latest ? (
          <Link to="/app/screen" className="block rounded-3xl brand-gradient p-5 text-primary-foreground shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Start here</div>
                <div className="mt-1 text-xl font-extrabold">Take your first Movement Screen</div>
                <div className="mt-1 text-sm opacity-90">~5 minutes • camera-based • on-device</div>
              </div>
              <ArrowRight className="h-6 w-6" />
            </div>
          </Link>
        ) : (
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <ScoreRing value={latest.overall} size={140} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Movement Age</div>
                <div className="mt-0.5 text-3xl font-extrabold brand-text">{latest.movementAge}</div>
                <div className="text-xs text-muted-foreground">Chronological: {u.age}</div>
                <Link to="/app/progress" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  See breakdown <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Movement Age is a motivational estimate, not a medical measurement.</p>
          </div>
        )}

        {latest && status && <ProgramCta status={status} />}

        {latest && (
          <section>
            <h3 className="mb-2 text-base font-bold">Sub-scores</h3>
            <div className="space-y-3 rounded-3xl bg-card p-5 shadow-card">
              <SubScoreBar label="Mobility" value={latest.sub.mobility} />
              <SubScoreBar label="Stability" value={latest.sub.stability} />
              <SubScoreBar label="Balance" value={latest.sub.balance} />
              <SubScoreBar label="Movement Quality" value={latest.sub.quality} />
              <SubScoreBar label="Strength Capacity" value={latest.sub.strength} />
            </div>
          </section>
        )}
      </div>
      <ExerciseSheet exerciseId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function ProgramCta({ status }: { status: NonNullable<ReturnType<typeof useProgramStatus>> }) {
  // Today's day index within the 2-week program (1-based). Outside range → program closed.
  const start = new Date(status.startDate);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayIndex = Math.floor((today - startDay) / 86400000) + 1;
  const inProgram = dayIndex >= 1 && dayIndex <= 14;
  const training = inProgram && isTrainingDay(dayIndex);
  const sessionNumber = training ? TRAINING_DAY_INDICES.indexOf(dayIndex) + 1 : null;
  const done = inProgram && status.completedDays.includes(dayIndex);

  if (status.locked) {
    return null;
  }

  if (!inProgram) {
    return (
      <Link to="/app/program" className="block rounded-3xl brand-gradient p-5 text-primary-foreground shadow-soft">
        <div className="text-xs font-semibold uppercase tracking-widest opacity-85">Your 2-week program</div>
        <div className="mt-1 text-lg font-extrabold">Open your training program</div>
        <div className="mt-2 flex items-center gap-1 text-sm font-semibold opacity-95">Start improving your movement <ArrowRight className="h-4 w-4" /></div>
      </Link>
    );
  }

  if (!training) {
    return (
      <Link to="/app/program" className="block rounded-3xl bg-card p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl brand-gradient-soft"><Moon className="h-5 w-5 text-primary" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Today · Day {dayIndex}</div>
            <div className="text-base font-extrabold">Rest day</div>
            <div className="text-xs text-muted-foreground">{status.completedDays.length} / {PROGRAM_SESSIONS} sessions done</div>
          </div>
          <ArrowRight className="h-5 w-5 text-primary" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/app/program"
      className={`block rounded-3xl p-5 shadow-soft ${done ? "bg-card shadow-card" : "brand-gradient text-primary-foreground"}`}
    >
      <div className="flex items-center gap-3">
        <span className={`grid h-12 w-12 place-items-center rounded-2xl ${done ? "brand-gradient-soft text-primary" : "bg-white/20 text-white"}`}>
          {done ? <CheckCircle2 className="h-6 w-6" /> : <Dumbbell className="h-6 w-6" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className={`text-[10px] font-bold uppercase tracking-widest ${done ? "text-muted-foreground" : "opacity-85"}`}>
            Today · Session {sessionNumber} / {PROGRAM_SESSIONS}
          </div>
          <div className="text-base font-extrabold">
            {done ? "Completed — great work!" : "Start today's training"}
          </div>
          <div className={`text-xs ${done ? "text-muted-foreground" : "opacity-90"}`}>
            {status.completedDays.length} / {PROGRAM_SESSIONS} sessions done · {status.daysRemaining} day{status.daysRemaining === 1 ? "" : "s"} left
          </div>
        </div>
        <ArrowRight className={`h-5 w-5 ${done ? "text-primary" : ""}`} />
      </div>
    </Link>
  );
}
