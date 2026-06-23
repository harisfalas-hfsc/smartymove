import type { ScreenSession } from "../store";

/**
 * 14-day re-assessment evaluator.
 *
 * Compares the most recent session against the previous one and decides
 * what to tell the user. Improvements advance the phase; flat results
 * keep the current phase with supportive messaging; two flat re-tests
 * in a row gently suggest professional support.
 */

const MEANINGFUL_DELTA = 5; // 0-100 points; conservative

export type ProgressionStatus = "improved" | "steady" | "stalled" | "first";

export interface ProgressionResult {
  status: ProgressionStatus;
  delta: number;
  headline: string;
  detail: string;
  shouldAdvancePhase: boolean;
  suggestProfessional: boolean;
}

export function evaluateProgress(sessions: ScreenSession[]): ProgressionResult | null {
  if (sessions.length === 0) return null;
  if (sessions.length === 1) {
    return {
      status: "first",
      delta: 0,
      headline: "Baseline locked in",
      detail: "Your first Movement Screen is your starting line. Re-test in 14 days to see how you're moving.",
      shouldAdvancePhase: false,
      suggestProfessional: false,
    };
  }
  const latest = sessions[sessions.length - 1];
  const prev = sessions[sessions.length - 2];
  const delta = latest.overall - prev.overall;

  if (delta >= MEANINGFUL_DELTA) {
    return {
      status: "improved",
      delta,
      headline: `+${delta} points — nice work`,
      detail: "You're improving. Advancing your program to the next stage.",
      shouldAdvancePhase: true,
      suggestProfessional: false,
    };
  }

  // No meaningful improvement — check whether the prior re-test was also flat.
  const flatBefore = sessions.length >= 3
    ? Math.abs(sessions[sessions.length - 2].overall - sessions[sessions.length - 3].overall) < MEANINGFUL_DELTA
    : false;

  if (flatBefore) {
    return {
      status: "stalled",
      delta,
      headline: "Let's keep building your foundation",
      detail: "Two re-tests in a row without a meaningful jump. Keep training — and consider checking in with a physio or coach to look at things in person.",
      shouldAdvancePhase: false,
      suggestProfessional: true,
    };
  }

  return {
    status: "steady",
    delta,
    headline: "Holding steady",
    detail: "No big jump this time — that's normal. Stay consistent and we'll re-test in 14 days.",
    shouldAdvancePhase: false,
    suggestProfessional: false,
  };
}