import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUser, updateUser, useUser } from "./store";
import { supabase } from "@/integrations/supabase/client";
import { buildCorrectiveRoutine, pickToRoutineItem } from "./corrective/engine";
import { analyzeScan, buildPicksFromDecision, focusPickToRoutineItem, type ScanDecision } from "./corrective/decision";
import type { LibraryExercise, RoutineItem } from "./exercises";
import type { Joint } from "./store";

/** Length of a single training program in calendar days. */
export const PROGRAM_LENGTH_DAYS = 14;
/** Number of training sessions inside a single program. Every day is a training day. */
export const PROGRAM_SESSIONS = 14;
/** Day-of-program indices (1-based) that are training days. Every day trains. */
export const TRAINING_DAY_INDICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export interface SetsReps {
  sets: number;
  reps: string; // "10", "8-12", "10 / side"
  note?: string;
}

/** Default sets × reps per category. No timers — reps & sets only. */
export function setsRepsFor(category: string | undefined, bodyPart?: string | null): SetsReps {
  const bilateral = !!bodyPart && /leg|arm|shoulder|hip/i.test(bodyPart);
  switch (category) {
    case "mobility":
      return { sets: 2, reps: bilateral ? "10 / side" : "10", note: "Slow and controlled" };
    case "stability":
      return { sets: 3, reps: bilateral ? "8 / side" : "10", note: "Pause 2s each rep" };
    case "strength":
      return { sets: 3, reps: "8-12", note: "Stop 1-2 reps short of failure" };
    default:
      return { sets: 3, reps: "10" };
  }
}

export interface ProgramStatus {
  active: boolean;
  locked: boolean;
  reason: "no-scan" | "expired" | "completed" | null;
  startDate: string;
  endDate: string;
  daysElapsed: number;
  daysRemaining: number;
  completedDays: number[];
  totalSessions: number;
}

export function getProgramStatus(): ProgramStatus | null {
  const u = getUser();
  if (!u) return null;
  const hasScan = u.sessions.length > 0;
  // A 14-day training cycle starts from the latest completed Movement Screen.
  // `programStartDate` is kept for long-term phase progression, so using it
  // here would hide the rescan warning when the latest scan is already due.
  const latestScan = hasScan ? u.sessions[u.sessions.length - 1] : null;
  const startISO = latestScan?.date ?? u.programStartDate ?? u.createdAt;
  const start = new Date(startISO);
  const end = new Date(start.getTime() + PROGRAM_LENGTH_DAYS * 86400000);
  const elapsed = Math.floor((Date.now() - start.getTime()) / 86400000);
  const remaining = Math.max(0, PROGRAM_LENGTH_DAYS - elapsed);
  const completed = u.programCompletedDays ?? [];
  let reason: ProgramStatus["reason"] = null;
  if (!hasScan) reason = "no-scan";
  else if (elapsed >= PROGRAM_LENGTH_DAYS) reason = "expired";
  else if (completed.length >= PROGRAM_SESSIONS) reason = "completed";
  return {
    active: hasScan && reason === null,
    locked: !hasScan || reason === "expired" || reason === "completed",
    reason,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    daysElapsed: elapsed,
    daysRemaining: remaining,
    completedDays: completed,
    totalSessions: PROGRAM_SESSIONS,
  };
}

export function useProgramStatus(): ProgramStatus | null {
  const u = useUser();
  const latestScanDate = u?.sessions?.[u.sessions.length - 1]?.date;
  return useMemo(() => {
    if (!u) return null;
    return getProgramStatus();
    // recompute when user object changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [u?.programStartDate, latestScanDate, u?.programCompletedDays?.length, u?.sessions.length]);
}

export function markDayCompleted(dayIndex: number) {
  updateUser(prev => {
    const cur = new Set(prev.programCompletedDays ?? []);
    cur.add(dayIndex);
    const arr = Array.from(cur).sort((a, b) => a - b);
    return { ...prev, programCompletedDays: arr };
  });
}

export function unmarkDayCompleted(dayIndex: number) {
  updateUser(prev => {
    const cur = new Set(prev.programCompletedDays ?? []);
    cur.delete(dayIndex);
    return { ...prev, programCompletedDays: Array.from(cur).sort((a, b) => a - b) };
  });
}

async function fetchLibrary(): Promise<LibraryExercise[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("id,name,body_part,equipment,target,secondary_muscles,instructions,gif_url")
    .not("gif_url", "is", null);
  if (error) throw error;
  return (data ?? []) as LibraryExercise[];
}

async function attachSignedUrls(items: RoutineItem[]): Promise<RoutineItem[]> {
  const paths = items.map(i => i.gifPath).filter((p): p is string => !!p);
  if (paths.length === 0) return items;
  const { data, error } = await supabase.storage.from("exercise-gifs").createSignedUrls(paths, 60 * 60);
  if (error || !data) return items;
  const byPath = new Map<string, string>();
  data.forEach(d => { if (d.path && d.signedUrl) byPath.set(d.path, d.signedUrl); });
  return items.map(i => ({ ...i, gifUrl: i.gifPath ? byPath.get(i.gifPath) ?? null : null }));
}

/**
 * Returns the fixed 7-exercise routine for the active 2-week program.
 * Seeded by programStartDate so it stays stable across the whole program.
 */
export function useProgramRoutine() {
  const u = useUser();
  const userId = u?.id ?? "anon";
  const goal = u?.goal;
  const joints = (u?.questionnaire?.joints ?? []) as Joint[];
  const jointsKey = [...joints].sort().join(",");
  const programStart = u?.programStartDate ?? u?.createdAt ?? new Date().toISOString();
  const phaseOverride = u?.phaseOverride;
  const latest = u?.sessions?.[u.sessions.length - 1];
  const sessionSub = latest?.sub;
  const sessionKey = latest?.date ?? "no-session";
  return useQuery({
    queryKey: ["program-routine", userId, goal ?? "none", jointsKey, programStart, phaseOverride ?? "auto", sessionKey],
    queryFn: async () => {
      const library = await fetchLibrary();
      const built = buildCorrectiveRoutine(
        {
          userId,
          goal,
          joints,
          programStartDate: programStart,
          // Seed by program start so the routine is the same all 2 weeks.
          dateISO: programStart.slice(0, 10),
          phaseOverride,
          sessionSub,
        },
        library,
      );
      // Failure-mode-driven selection when we have scan results — otherwise
      // fall back to the area-based engine (questionnaire only).
      let decision: ScanDecision | null = null;
      let items: RoutineItem[];
      if (latest && latest.tests.length > 0) {
        decision = analyzeScan(latest.tests, joints, goal);
        const focusPicks = buildPicksFromDecision(decision, library);
        if (focusPicks.length > 0) {
          items = focusPicks.map(focusPickToRoutineItem);
        } else {
          items = built.picks.map(pickToRoutineItem);
        }
      } else {
        items = built.picks.map(pickToRoutineItem);
      }
      return { items: await attachSignedUrls(items), phase: built.phase, decision };
    },
    staleTime: 30 * 60 * 1000,
  });
}

/** Format a date as a short weekday + day-of-month, e.g. "Mon 12". */
export function formatProgramDayDate(startISO: string, dayIndex: number): string {
  const d = new Date(new Date(startISO).getTime() + (dayIndex - 1) * 86400000);
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export function isTrainingDay(dayIndex: number): boolean {
  return dayIndex >= 1 && dayIndex <= PROGRAM_LENGTH_DAYS;
}

/**
 * Sync hook returning the cluster/priority decision for the user's latest
 * Movement Screen — used by the results / progress screen to render
 * root-cause insights instead of raw per-test failures.
 */
export function useScanDecision(): ScanDecision | null {
  const u = useUser();
  return useMemo(() => {
    if (!u) return null;
    const latest = u.sessions?.[u.sessions.length - 1];
    if (!latest || latest.tests.length === 0) return null;
    const joints = (u.questionnaire?.joints ?? []) as Joint[];
    return analyzeScan(latest.tests, joints, u.goal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [u?.sessions?.length, u?.goal, (u?.questionnaire?.joints ?? []).join(",")]);
}