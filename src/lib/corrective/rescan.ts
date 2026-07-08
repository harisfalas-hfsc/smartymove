/**
 * Re-scan trigger engine — deterministic, no AI. Given the user's profile
 * and program state, returns the most relevant re-scan prompt (or null).
 *
 * Priority order (highest wins):
 *   1. Goal changed since last scan
 *   2. Self-reported change from post-session feedback
 *   3. Foundation-phase sessions complete → ready to move to Build
 *   4. Two consecutive 14-day scans with no improvement (>2 points)
 *   5. Standard 14-day cadence
 *
 * Every reason carries its own message copy so the CTA doesn't feel generic.
 */

import type { User, ScreenSession } from "../store";
import type { ProgramStatus } from "../program";
import { getPhaseInfo } from "./phase";

export type RescanReason =
  | "goal-changed"
  | "self-reported-change"
  | "foundation-complete"
  | "no-improvement"
  | "cadence"
  | "first-scan";

export interface RescanSuggestion {
  suggest: boolean;
  reason: RescanReason;
  urgency: "high" | "medium" | "low";
  title: string;
  message: string;
  cta: string;
}

const DAY = 86400000;

function daysBetween(a: string | Date, b: string | Date): number {
  const ta = typeof a === "string" ? new Date(a).getTime() : a.getTime();
  const tb = typeof b === "string" ? new Date(b).getTime() : b.getTime();
  return Math.floor((tb - ta) / DAY);
}

export function evaluateRescan(user: User, status: ProgramStatus | null): RescanSuggestion | null {
  const sessions: ScreenSession[] = user.sessions ?? [];
  const latest = sessions[sessions.length - 1];

  // ─── 0. No scan yet — first-scan prompt ──────────────────────────────────
  if (!latest) {
    return {
      suggest: true,
      reason: "first-scan",
      urgency: "medium",
      title: "Take your first Movement Screen",
      message: "We can't build a personalised program until we've seen how you move. It takes about 5 minutes.",
      cta: "Start Movement Screen · €9.99",
    };
  }

  const now = new Date();
  const daysSince = daysBetween(latest.date, now);

  // ─── 1. Goal changed since last scan ─────────────────────────────────────
  if (user.goal && latest.goalAtScan && user.goal !== latest.goalAtScan) {
    return {
      suggest: true,
      reason: "goal-changed",
      urgency: "high",
      title: "Your goal changed — let's re-scan",
      message: "Your new goal changes what we're looking for in your movement. A fresh 8-minute scan (€9.99, one-time) unlocks a brand-new 14-day training program built around your updated priorities.",
      cta: "Re-scan now · €9.99",
    };
  }

  // ─── 2. Self-reported change ─────────────────────────────────────────────
  const fb = user.postSessionFeedback;
  if (fb?.changed && daysBetween(fb.date, now) <= 3) {
    return {
      suggest: true,
      reason: "self-reported-change",
      urgency: "high",
      title: "Sounds like something has shifted",
      message: "You mentioned something felt different after your last session — a quick re-scan (€9.99, one-time) will show whether your scores have moved and generate a fresh 14-day training program.",
      cta: "Re-scan now · €9.99",
    };
  }

  // ─── 3. Foundation-phase complete ────────────────────────────────────────
  // Both clocks must agree: (a) the week-based phase engine says the user
  // has reached the end of the Foundation window (weekIndex >= 2), AND
  // (b) the user has completed the full 14-session Foundation block. This
  // avoids the "user crushed 14 sessions in 4 days → premature rescan"
  // and the inverse "week 2 hit but only 3 sessions done → premature".
  const phase = getPhaseInfo(user.programStartDate ?? user.createdAt, user.phaseOverride);
  const completedInProgram = status?.completedDays.length ?? 0;
  const foundationWeeksDone = phase.weekIndex >= 2;
  const foundationSessionsDone = completedInProgram >= (status?.totalSessions ?? 14);
  if (phase.phase === "restore" && foundationWeeksDone && foundationSessionsDone) {
    const areas = (user.questionnaire?.joints ?? []).filter((j) => j && j !== "none");
    const areaLabel = areas.length > 0 ? areas.join(" / ") : "movement";
    return {
      suggest: true,
      reason: "foundation-complete",
      urgency: "high",
      title: "You've finished your Foundation phase",
      message: `Great work. Re-scan now (€9.99, one-time) to see if your ${areaLabel} has improved and unlock your next personalised 14-day training program in the Build stage.`,
      cta: "Re-scan and progress · €9.99",
    };
  }

  // ─── 4. No improvement across two consecutive 14-day scans ───────────────
  if (sessions.length >= 3) {
    const [a, b, c] = sessions.slice(-3);
    const delta1 = b.overall - a.overall;
    const delta2 = c.overall - b.overall;
    if (Math.abs(delta1) <= 2 && Math.abs(delta2) <= 2 && daysSince >= 14) {
      return {
        suggest: true,
        reason: "no-improvement",
        urgency: "medium",
        title: "Your scores haven't shifted yet",
        message: "That's okay — some restrictions take longer. A fresh scan (€9.99, one-time) will re-focus your next 14-day training program on what's still stuck.",
        cta: "Re-scan and adjust · €9.99",
      };
    }
  }

  // ─── 5. Standard 14-day cadence ──────────────────────────────────────────
  if (daysSince >= 14) {
    return {
      suggest: true,
      reason: "cadence",
      urgency: "medium",
      title: "Time to re-scan",
      message: "Your 14-day program is complete. Rescan now (€9.99, one-time) to measure your progress and unlock your next personalised 14-day training program.",
      cta: "Rescan · €9.99",
    };
  }

  return null;
}
