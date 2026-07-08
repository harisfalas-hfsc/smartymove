import type { ReactNode } from "react";
import { CheckCircle2, Info, X } from "lucide-react";
import { formatProgramDayDate, getAsymmetryByArea, PROGRAM_LENGTH_DAYS, setsRepsFor, type AsymmetryBias } from "@/lib/program";
import type { ScreenSession } from "@/lib/store";

interface DayWorkoutSheetProps {
  dayIndex: number | null;
  startDate: string;
  completedDays: number[];
  routine: {
    id: string;
    name: string;
    emoji: string;
    description: string;
    category?: string;
    bodyPart?: string | null;
    area?: string;
  }[];
  session: ScreenSession | null | undefined;
  onClose: () => void;
  onOpenExercise: (id: string) => void;
  footer?: ReactNode;
  readOnly?: boolean;
}

export function DayWorkoutSheet({
  dayIndex,
  startDate,
  completedDays,
  routine,
  session,
  onClose,
  onOpenExercise,
  footer,
  readOnly,
}: DayWorkoutSheetProps) {
  if (dayIndex == null) return null;

  const asymByArea = getAsymmetryByArea(session);
  const done = completedDays.includes(dayIndex);

  const programStart = new Date(startDate);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex max-h-[88dvh] w-full max-w-[420px] flex-col overflow-hidden rounded-3xl bg-background shadow-2xl">
        <header className="brand-gradient-strong px-5 pb-5 pt-5 text-primary-foreground">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-widest opacity-85">
                {formatProgramDayDate(startDate, dayIndex)} · Day {dayIndex} / {PROGRAM_LENGTH_DAYS}
              </div>
              <div className="mt-0.5 text-xl font-extrabold">{workoutTitle}</div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {done && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Done — great work!
            </p>
          )}
        </header>

        <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
          {routine.length === 0 && (
            <div className="rounded-2xl bg-card p-4 text-center text-sm text-muted-foreground shadow-card">
              No exercises available.
            </div>
          )}
          {routine.map((e) => {
            const bias: AsymmetryBias | undefined = e.area
              ? (asymByArea as Record<string, AsymmetryBias>)[e.area]
              : undefined;
            const sr = setsRepsFor(e.category, e.bodyPart, bias);
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
                {sr.sideSets ? (
                  <div className="mt-2.5 space-y-1.5 rounded-xl bg-secondary px-3 py-2">
                    <div className="flex items-center justify-between text-sm font-bold tabular-nums">
                      <span className="text-muted-foreground">
                        {sr.sideSets.weakerSide === "R" ? "Right (weaker)" : "Left (weaker)"}
                      </span>
                      <span>
                        <span className="brand-text">{sr.sideSets.weakSets}</span>
                        <span className="text-muted-foreground"> × </span>
                        <span className="brand-text">{sr.reps.replace(" / side", "")}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold tabular-nums">
                      <span className="text-muted-foreground">
                        {sr.sideSets.weakerSide === "R" ? "Left (stronger)" : "Right (stronger)"}
                      </span>
                      <span>
                        <span className="brand-text">{sr.sideSets.strongSets}</span>
                        <span className="text-muted-foreground"> × </span>
                        <span className="brand-text">{sr.reps.replace(" / side", "")}</span>
                      </span>
                    </div>
                    <div className="pt-0.5 text-[11px] leading-snug text-muted-foreground">
                      Extra volume on your weaker side to close the gap ({sr.sideSets.reason}). Start with the weaker side.
                    </div>
                  </div>
                ) : (
                  <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-secondary px-3 py-2">
                    <div className="text-sm font-bold tabular-nums">
                      <span className="brand-text">{sr.sets}</span>
                      <span className="text-muted-foreground"> sets × </span>
                      <span className="brand-text">{sr.reps}</span>
                      <span className="text-muted-foreground"> reps</span>
                    </div>
                    {sr.note && <div className="hidden text-[11px] text-muted-foreground sm:block">{sr.note}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {(footer != null || readOnly) && (
          <div className="border-t border-border bg-card p-3">
            {footer ?? (
              <div className="text-center text-xs text-muted-foreground">Program closed — rescan to start a new one.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
