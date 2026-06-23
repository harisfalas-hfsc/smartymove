/**
 * Phase + progression rules from the SmartyMove v1 spec.
 *
 * Phases never end — users keep cycling through Perform forever.
 */

import type { Category } from "./libraries";
import type { Goal } from "../store";

export type Phase = "restore" | "build" | "perform";

export interface PhaseInfo {
  phase: Phase;
  label: string;
  weekIndex: number; // 0-based weeks since program start
  weekInPhase: number; // 1-based for UI
  ratios: Record<Category, number>; // sum ~= 1
  slotCounts: Record<Category, number>; // for a 7-exercise routine
}

export const PHASE_LABEL: Record<Phase, string> = {
  restore: "Foundation",
  build: "Build",
  perform: "Maintain & Perform",
};

export const PHASE_RATIOS: Record<Phase, Record<Category, number>> = {
  restore: { mobility: 0.7, stability: 0.2, strength: 0.1 },
  build:   { mobility: 0.3, stability: 0.4, strength: 0.3 },
  perform: { mobility: 0.2, stability: 0.3, strength: 0.5 },
};

/** Hand-tuned slot counts so totals always equal 7. */
const PHASE_SLOTS_7: Record<Phase, Record<Category, number>> = {
  restore: { mobility: 5, stability: 1, strength: 1 },
  build:   { mobility: 2, stability: 3, strength: 2 },
  perform: { mobility: 1, stability: 2, strength: 4 },
};

function weeksSince(startISO: string): number {
  const ms = Date.now() - new Date(startISO).getTime();
  return Math.max(0, Math.floor(ms / (7 * 24 * 60 * 60 * 1000)));
}

export function phaseForWeek(week: number): Phase {
  if (week < 2) return "restore";
  if (week < 6) return "build";
  return "perform";
}

export function getPhaseInfo(startISO: string, override?: Phase): PhaseInfo {
  const weekIndex = weeksSince(startISO);
  const phase = override ?? phaseForWeek(weekIndex);
  const phaseStartWeek = phase === "restore" ? 0 : phase === "build" ? 2 : 6;
  const weekInPhase = Math.max(1, weekIndex - phaseStartWeek + 1);
  return {
    phase,
    label: PHASE_LABEL[phase],
    weekIndex,
    weekInPhase,
    ratios: PHASE_RATIOS[phase],
    slotCounts: PHASE_SLOTS_7[phase],
  };
}

/**
 * Stage 4 — Ongoing Training Programs. After ~12 weeks the user is
 * substantially out of corrective territory and graduates onto a
 * goal-driven ongoing track. Drawn from the same library, just framed
 * as ongoing training (Maintain & Perform ratios continue).
 */
export interface OngoingTrack {
  active: boolean;
  label: string;
  description: string;
  weekIndex: number;
}

export function getOngoingTrack(startISO: string, goal: Goal | undefined): OngoingTrack {
  const weekIndex = weeksSince(startISO);
  const active = weekIndex >= 12;
  let label = "Mobility Maintenance Program";
  let description = "Light, broad rotation to keep you moving well across all areas.";
  switch (goal) {
    case "perform_better":
    case "prevent_injury":
      label = "General Strength Program";
      description = "Ongoing full-body strength and stability work to keep building.";
      break;
    case "start_sport":
      label = "Runner Prep Program";
      description = "Running-relevant capacity: calves, glutes, hips, single-leg control.";
      break;
    case "feel_better":
      label = "Mobility Maintenance Program";
      description = "Light, broad rotation across all areas — keeps you feeling good.";
      break;
    case "reduce_pain":
      label = "Resilience Program";
      description = "Conservative continued work to keep your flagged areas strong.";
      break;
  }
  return { active, label, description, weekIndex };
}