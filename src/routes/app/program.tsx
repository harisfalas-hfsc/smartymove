import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useUser } from "@/lib/store";
import {
  useProgramRoutine,
  useProgramStatus,
  markDayCompleted,
  unmarkDayCompleted,
  setsRepsFor,
  PROGRAM_LENGTH_DAYS,
  PROGRAM_SESSIONS,
  TRAINING_DAY_INDICES,
  isTrainingDay,
  formatProgramDayDate,
} from "@/lib/program";
import { ExerciseSheet } from "@/components/ExerciseSheet";
import { Camera, ArrowRight, CheckCircle2, Circle, Lock, RotateCcw, Info, AlertCircle, CalendarDays } from "lucide-react";
import { SmartyCard } from "@/components/SmartyCard";
import { Sparkles, Dumbbell, Flame, Target } from "lucide-react";
// Program access is unlocked once the user has completed a scan — no paywall gating here.

export const Route = createFileRoute("/app/program")({ component: Program });

function Program() {
  const u = useUser();
  const status = useProgramStatus();
  const { data, isLoading } = useProgramRoutine();
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<number | null>(null);

  if (!u || !status) return null;

  // No scan yet → must scan first.
  if (status.reason === "no-scan") {
    return (
      <div className="space-y-4 p-5" style={{ background: "#E7ECEC" }}>
        <SmartyCard
          Icon={Camera}
          iconColor="#0E7C86"
          iconBg="#E6F5F5"
          title="Your program is built from your scan"
          subtitle="Take your first Movement Screen — your 2-week training program is built from the questionnaire and scan results together."
        >
          <Link
            to="/app/screen"
            className="mt-2 flex h-12 items-center justify-center gap-2 rounded-2xl font-bold text-white"
            style={{ background: "#FF6B4A", boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)" }}
          >
            Start Movement Screen <ArrowRight className="h-4 w-4" />
          </Link>
        </SmartyCard>
      </div>
    );
  }

  const routine = data?.items ?? [];
  const phase = data?.phase;

  // Program expired or all sessions completed → require a rescan to unlock the next program.
  if (status.locked) {
    return (
      <div className="space-y-4 p-5 pb-8" style={{ background: "#E7ECEC" }}>
        <SmartyCard
          Icon={Lock}
          iconColor="#C2410C"
          iconBg="#FDECD8"
          title="Time to rescan"
          subtitle="Your 2-week cycle is complete. Rescan now to check your progress and build the next program around what your body needs today."
        >
          <Link
            to="/app/screen"
            className="mt-2 flex h-12 items-center justify-center gap-2 rounded-2xl font-bold text-white"
            style={{ background: "#FF6B4A", boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)" }}
          >
            Rescan to unlock next program <ArrowRight className="h-4 w-4" />
          </Link>
        </SmartyCard>

        <SmartyCard Icon={CalendarDays} iconColor="#1D4ED8" iconBg="#DBEAFE" title="Your 2-week schedule" subtitle="View only — rescan to start a new program.">
          <ProgramOverview status={status} routine={routine} onSelectDay={setActiveDay} readOnly />
        </SmartyCard>
        <DaySheet
          dayIndex={activeDay}
          onClose={() => setActiveDay(null)}
          routine={routine}
          status={status}
          onOpenExercise={setOpenId}
          readOnly
        />
        <ExerciseSheet exerciseId={openId} onClose={() => setOpenId(null)} />
      </div>
    );
  }

  return (
    <div className="pb-8" style={{ background: "#E7ECEC" }}>
      <div className="space-y-4 px-5 pt-4">
        <SmartyCard
          Icon={Dumbbell}
          iconColor="#0E7C86"
          iconBg="#E6F5F5"
          title={phase ? phase.label : "Training Program"}
          subtitle={`${status.completedDays.length} / ${PROGRAM_SESSIONS} sessions done · ${status.daysRemaining} day${status.daysRemaining === 1 ? "" : "s"} left`}
        >
          <div className="mt-1 h-2 overflow-hidden rounded-full" style={{ background: "#E6F5F5" }}>
            <div
              className="h-full rounded-full transition-[width]"
              style={{ width: `${Math.round((status.completedDays.length / PROGRAM_SESSIONS) * 100)}%`, background: "linear-gradient(90deg,#0E7C86,#1f6fa8)" }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MiniStat Icon={Flame} tint="#C2410C" bg="#FDECD8" label="Sessions" value={`${status.completedDays.length}/${PROGRAM_SESSIONS}`} />
            <MiniStat Icon={CalendarDays} tint="#1D4ED8" bg="#DBEAFE" label="Days left" value={`${status.daysRemaining}`} />
            <MiniStat Icon={Target} tint="#7A3EBA" bg="#F1E9FA" label="Cycle" value="14d" />
          </div>
        </SmartyCard>

        {isLoading && (
          <SmartyCard Icon={Sparkles} iconColor="#7A3EBA" iconBg="#F1E9FA" title="Building your program…" />
        )}

        {!isLoading && (
          <SmartyCard Icon={CalendarDays} iconColor="#1D4ED8" iconBg="#DBEAFE" title="Your 2-week schedule" subtitle="Tap any day to open its workout.">
            <ProgramOverview
              status={status}
              routine={routine}
              onSelectDay={(d) => setActiveDay(d)}
            />
          </SmartyCard>
        )}
      </div>

      <DaySheet
        dayIndex={activeDay}
        onClose={() => setActiveDay(null)}
        routine={routine}
        status={status}
        onOpenExercise={(id) => setOpenId(id)}
      />
      <ExerciseSheet exerciseId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function MiniStat({ Icon, tint, bg, label, value }: { Icon: any; tint: string; bg: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl p-2.5 text-center" style={{ background: bg, color: tint }}>
      <Icon className="mx-auto h-4 w-4" strokeWidth={2.4} />
      <div className="mt-1 text-base font-extrabold" style={{ color: "#14213A" }}>{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: tint }}>{label}</div>
    </div>
  );
}

function ProgramOverview({
  status,
  routine,
  onSelectDay,
  readOnly,
}: {
  status: NonNullable<ReturnType<typeof useProgramStatus>>;
  routine: ReturnType<typeof useProgramRoutine>["data"] extends infer T ? T extends { items: infer I } ? I : never : never;
  onSelectDay: (n: number) => void;
  readOnly?: boolean;
}) {
  const days = Array.from({ length: PROGRAM_LENGTH_DAYS }, (_, i) => i + 1);
  const completed = new Set(status.completedDays);
  // Today's day-index within the program (1-based). Past, today, future drive colors.
  const start = new Date(status.startDate);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayIndex = Math.floor((today - startDay) / 86400000) + 1;
  return (
    <section>
      <div className="grid grid-cols-2 gap-2.5">
        {days.map((d) => {
          const done = completed.has(d);
          const isToday = d === todayIndex;
          const missed = !done && d < todayIndex;
          const upcoming = !done && d > todayIndex;
          // Tile styling — keep brand colors. Green = done, brand = today, amber = missed, soft = upcoming.
          const tileClass = done
            ? "bg-success/10 ring-2 ring-success"
            : isToday
              ? "brand-gradient text-primary-foreground"
              : missed
                ? "bg-warning/10 ring-1 ring-warning/50"
                : "bg-card";
          const badgeClass = done
            ? "bg-success text-white"
            : isToday
              ? "bg-white/25 text-white"
              : missed
                ? "bg-warning/20 text-warning"
                : "brand-gradient-soft text-primary";
          const dateClass = isToday
            ? done
              ? "text-success"
              : "text-white/85"
            : missed
              ? "text-warning"
              : "text-muted-foreground";
          const labelClass = isToday && !done ? "text-white" : "";
          let label = `Day ${d}`;
          if (done) label = "Completed";
          else if (isToday) label = "Today's workout";
          else if (missed) label = "Missed — do it now";
          else if (upcoming) label = `Day ${d}`;
          return (
            <button
              key={d}
              disabled={routine.length === 0}
              onClick={() => onSelectDay(d)}
              className={`flex items-center gap-3 rounded-2xl p-3 text-left shadow-card transition-all active:scale-[0.99] disabled:opacity-60 ${tileClass}`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold ${badgeClass}`}>
                {done ? <CheckCircle2 className="h-5 w-5" /> : missed ? <AlertCircle className="h-5 w-5" /> : d}
              </span>
              <div className="min-w-0 flex-1">
                <div className={`text-[11px] font-semibold uppercase tracking-widest ${dateClass}`}>
                  {formatProgramDayDate(status.startDate, d)}
                </div>
                <div className={`truncate text-sm font-semibold ${labelClass}`}>{label}</div>
              </div>
            </button>
          );
        })}
      </div>
      {readOnly && (
        <p className="mt-3 text-center text-xs text-muted-foreground">View only — rescan to start a new program.</p>
      )}
    </section>
  );
}

function DaySheet({
  dayIndex,
  onClose,
  routine,
  status,
  onOpenExercise,
  readOnly,
}: {
  dayIndex: number | null;
  onClose: () => void;
  routine: { id: string; name: string; emoji: string; description: string; category?: string; bodyPart?: string | null }[];
  status: NonNullable<ReturnType<typeof useProgramStatus>>;
  onOpenExercise: (id: string) => void;
  readOnly?: boolean;
}) {
  const u = useUser();
  if (dayIndex == null) return null;
  const done = status.completedDays.includes(dayIndex);
  const programStart = new Date(status.startDate);
  const programStartDay = new Date(programStart.getFullYear(), programStart.getMonth(), programStart.getDate()).getTime();
  const currentDate = new Date();
  const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();
  const todayIndex = Math.floor((currentDay - programStartDay) / 86400000) + 1;
  const isToday = dayIndex === todayIndex;
  const isMissed = dayIndex < todayIndex;
  const workoutTitle = done
    ? "Completed workout"
    : isToday
      ? "Today's workout"
      : isMissed
        ? "Missed workout"
        : `Day ${dayIndex} workout`;
  const visible = u?.premium ? routine : routine.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex max-h-[88dvh] w-full max-w-[420px] flex-col overflow-hidden rounded-3xl bg-background shadow-2xl">
        <header className="brand-gradient-strong px-5 pb-5 pt-5 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest opacity-85">
                {formatProgramDayDate(status.startDate, dayIndex)} · Day {dayIndex} / {PROGRAM_LENGTH_DAYS}
              </div>
              <div className="mt-0.5 text-xl font-extrabold">
                {workoutTitle}
              </div>
            </div>
            <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-white">×</button>
          </div>
          {done && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Done — great work!
            </p>
          )}
        </header>

        <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
          {visible.length === 0 && (
            <div className="rounded-2xl bg-card p-4 text-center text-sm text-muted-foreground shadow-card">No exercises available.</div>
          )}
          {visible.map((e) => {
            const sr = setsRepsFor(e.category, e.bodyPart);
            return (
              <div key={e.id} className="rounded-2xl bg-card p-3 shadow-card">
                <button onClick={() => onOpenExercise(e.id)} className="flex w-full items-center gap-3 text-left">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl brand-gradient-soft text-2xl">{e.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold capitalize">{e.name}</div>
                    <div className="text-xs text-muted-foreground">{e.description}</div>
                  </div>
                  <Info className="h-4 w-4 shrink-0 text-primary" />
                </button>
                <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-secondary px-3 py-2">
                  <div className="text-sm font-bold tabular-nums">
                    <span className="brand-text">{sr.sets}</span>
                    <span className="text-muted-foreground"> sets × </span>
                    <span className="brand-text">{sr.reps}</span>
                    <span className="text-muted-foreground"> reps</span>
                  </div>
                  {sr.note && <div className="hidden text-[11px] text-muted-foreground sm:block">{sr.note}</div>}
                </div>
              </div>
            );
          })}
          {!u?.premium && routine.length > visible.length && (
            <div className="rounded-2xl bg-secondary p-3 text-center text-xs text-muted-foreground">
              {routine.length - visible.length} more exercises with Premium.
            </div>
          )}
        </div>

        <div className="border-t border-border bg-card p-3">
          {readOnly ? (
            <div className="text-center text-xs text-muted-foreground">Program closed — rescan to start a new one.</div>
          ) : done ? (
            <button
              onClick={() => unmarkDayCompleted(dayIndex)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-secondary font-semibold"
            >
              <RotateCcw className="h-4 w-4" /> Repeat this day (mark incomplete)
            </button>
          ) : (
            <button
              onClick={() => { markDayCompleted(dayIndex); onClose(); }}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl brand-gradient font-semibold text-primary-foreground shadow-soft"
            >
              <CheckCircle2 className="h-5 w-5" /> Mark day as completed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Silence unused-import warnings for icons referenced conditionally.
void Circle;
