import { useState } from "react";
import { CalendarDays, CheckCircle2, ChevronDown, Dumbbell } from "lucide-react";
import { SmartyCard } from "@/components/SmartyCard";
import { DayWorkoutSheet } from "@/components/DayWorkoutSheet";
import { ExerciseSheet } from "@/components/ExerciseSheet";
import {
  formatProgramDayDate,
  PROGRAM_LENGTH_DAYS,
  PROGRAM_SESSIONS,
  TRAINING_DAY_INDICES,
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
  const [openDay, setOpenDay] = useState<{ entry: Entry; day: number } | null>(null);
  const [openExerciseId, setOpenExerciseId] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
  const activeIndex = openIndex;

  const completedDaysFor = (entry: Entry) =>
    entry.index === currentIndex ? (u.programCompletedDays ?? []) : TRAINING_DAY_INDICES;

  const openEntry = openDay?.entry;
  const openDayNumber = openDay?.day ?? null;

  return (
    <SmartyCard Icon={Dumbbell} iconColor="#0E7C86" iconBg="#E6F5F5" title={title} subtitle={subtitle}>
      <div className="space-y-3">
        {entries.map((entry) => {
          const completed = entry.index === currentIndex ? (u.programCompletedDays ?? []).length : PROGRAM_SESSIONS;
          const completedDays = completedDaysFor(entry);
          const isOpen = entry.index === activeIndex;
          return (
            <div
              key={entry.index}
              data-open={isOpen ? "true" : "false"}
              className="group overflow-hidden rounded-2xl border border-border bg-background/70"
            >
              <ProgramEntry
                entry={entry}
                completed={completed}
                completedDays={completedDays}
                fmt={fmt}
                isOpen={isOpen}
                onToggle={() => setOpenIndex(isOpen ? null : entry.index)}
                onDayClick={(day) => setOpenDay({ entry, day })}
              />
            </div>
          );
        })}
      </div>

      {openEntry != null && openDayNumber != null && (
        <DayWorkoutSheet
          dayIndex={openDayNumber}
          startDate={openEntry.startDate}
          completedDays={completedDaysFor(openEntry)}
          routine={openEntry.items}
          session={openEntry.session}
          onClose={() => setOpenDay(null)}
          onOpenExercise={(id) => setOpenExerciseId(id)}
          readOnly
        />
      )}
      <ExerciseSheet exerciseId={openExerciseId} onClose={() => setOpenExerciseId(null)} />
    </SmartyCard>
  );
}

type Entry = ReturnType<typeof useProgramHistory>["data"] extends (infer T)[] | undefined ? T : never;

function ProgramEntry({
  entry,
  completed,
  completedDays,
  fmt,
  isOpen,
  onToggle,
  onDayClick,
}: {
  entry: Entry;
  completed: number;
  completedDays: number[];
  fmt: (iso: string) => string;
  isOpen: boolean;
  onToggle: () => void;
  onDayClick: (day: number) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
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
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
      <div className="space-y-3 border-t border-border/70 p-3 pt-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" /> 14 training days — tap a day to open its workout
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: PROGRAM_LENGTH_DAYS }, (_, i) => i + 1).map((day) => {
              const isDone = completedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onDayClick(day)}
                  className={`relative rounded-xl px-2.5 py-2 text-left transition ${
                    isDone
                      ? "bg-success/15 text-foreground hover:bg-success/25"
                      : "bg-secondary hover:bg-secondary/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Day {day}</div>
                    {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                  </div>
                  <div className="truncate text-xs font-semibold">{formatProgramDayDate(entry.startDate, day)}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      )}
    </>
  );
}
