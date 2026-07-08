import { CalendarDays, ChevronDown, Dumbbell } from "lucide-react";
import { SmartyCard } from "@/components/SmartyCard";
import {
  formatProgramDayDate,
  getAsymmetryByArea,
  PROGRAM_LENGTH_DAYS,
  PROGRAM_SESSIONS,
  setsRepsFor,
  useProgramHistory,
} from "@/lib/program";
import { useUser } from "@/lib/store";

interface ProgramHistoryProps {
  includeCurrent?: boolean;
  title?: string;
  subtitle?: string;
}

export function ProgramHistory({
  includeCurrent = false,
  title = "Previous training programs",
  subtitle = "Open any program to see the full workout you got from that scan.",
}: ProgramHistoryProps) {
  const u = useUser();
  const { data = [], isLoading } = useProgramHistory();
  if (!u) return null;

  const currentIndex = Math.max(0, (u.sessions?.length ?? 1) - 1);
  const entries = data
    .filter((entry) => includeCurrent || entry.index < currentIndex)
    .sort((a, b) => b.index - a.index);

  if (isLoading) {
    return (
      <SmartyCard Icon={Dumbbell} iconColor="#0E7C86" iconBg="#E6F5F5" title={title} subtitle="Loading your saved programs…" />
    );
  }

  if (entries.length === 0) return null;

  const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const defaultOpen = entries[0]?.index;

  return (
    <SmartyCard Icon={Dumbbell} iconColor="#0E7C86" iconBg="#E6F5F5" title={title} subtitle={subtitle}>
      <div className="space-y-3">
        {entries.map((entry) => {
          const asymByArea = getAsymmetryByArea(entry.session);
          const completed = entry.index === currentIndex ? (u.programCompletedDays ?? []).length : PROGRAM_SESSIONS;
          return (
            <details key={entry.index} open={entry.index === defaultOpen} className="group overflow-hidden rounded-2xl border border-border bg-background/70">
              <summary className="flex list-none items-center gap-3 p-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl brand-gradient-soft text-lg font-extrabold text-primary">
                  #{entry.index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold">Program #{entry.index + 1}</div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span>{fmt(entry.startDate)} → {fmt(entry.endDate)}</span>
                    <span>Score {entry.session.overall}</span>
                    <span>{completed}/{PROGRAM_SESSIONS} days</span>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>

              <div className="space-y-3 border-t border-border/70 p-3 pt-3">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" /> 14 training days
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Array.from({ length: PROGRAM_LENGTH_DAYS }, (_, i) => i + 1).map((day) => (
                      <div key={day} className="rounded-xl bg-secondary px-2.5 py-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Day {day}</div>
                        <div className="truncate text-xs font-semibold">{formatProgramDayDate(entry.startDate, day)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Workout</div>
                  <div className="space-y-2">
                    {entry.items.map((exercise) => {
                      const bias = exercise.area ? (asymByArea as Record<string, ReturnType<typeof getAsymmetryByArea>[string]>)[exercise.area] : undefined;
                      const dose = setsRepsFor(exercise.category, exercise.bodyPart, bias);
                      return (
                        <div key={exercise.id} className="rounded-2xl bg-card p-3 shadow-card">
                          <div className="flex gap-3">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl brand-gradient-soft text-xl">{exercise.emoji}</span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-extrabold capitalize">{exercise.name}</div>
                              <div className="text-xs text-muted-foreground">{exercise.description}</div>
                              {dose.sideSets ? (
                                <div className="mt-2 rounded-xl bg-secondary px-3 py-2 text-xs font-semibold">
                                  <div className="flex justify-between gap-2"><span>{dose.sideSets.weakerSide === "R" ? "Right" : "Left"} side</span><span>{dose.sideSets.weakSets} × {dose.reps.replace(" / side", "")}</span></div>
                                  <div className="flex justify-between gap-2 text-muted-foreground"><span>{dose.sideSets.weakerSide === "R" ? "Left" : "Right"} side</span><span>{dose.sideSets.strongSets} × {dose.reps.replace(" / side", "")}</span></div>
                                </div>
                              ) : (
                                <div className="mt-2 inline-flex rounded-xl bg-secondary px-3 py-1.5 text-xs font-bold">
                                  {dose.sets} sets × {dose.reps} reps
                                </div>
                              )}
                              {exercise.instructions.length > 0 && (
                                <details className="mt-2">
                                  <summary className="list-none text-xs font-bold text-primary">View exercise steps</summary>
                                  <ol className="mt-1 list-decimal space-y-1 pl-4 text-[11px] leading-snug text-muted-foreground">
                                    {exercise.instructions.slice(0, 4).map((step, i) => <li key={i}>{step}</li>)}
                                  </ol>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </SmartyCard>
  );
}