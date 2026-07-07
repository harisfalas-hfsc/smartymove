import type { User, Goal, ScreenSession, ParqAnswers } from "./store";

/**
 * SmartyGym handoff logic. SmartyMove is a scanner + corrective app; once
 * a user is "cleared" or is performance-minded to begin with, we point
 * them at the SmartyGym categories that match their goal.
 *
 * All routing is external (opens smartygym.com in a new tab). No auth
 * handoff, no shared state — SmartyGym browse pages are public.
 */

export type GraduationStatus = "not-cleared" | "performance-track" | "cleared";

export interface GraduationResult {
  status: GraduationStatus;
  reason: string;
}

export interface SmartyGymTarget {
  slug: string;
  title: string;
  url: string;
}

export interface SmartyGymRecommendation {
  program: SmartyGymTarget;
  workouts: SmartyGymTarget[];
  headline: string;
  blurb: string;
}

const SMARTYGYM_ORIGIN = "https://smartygym.com";

const PROGRAM_TITLES: Record<string, string> = {
  "functional-strength": "Functional Strength",
  "cardio-endurance": "Cardio Endurance",
  "muscle-hypertrophy": "Muscle Hypertrophy",
  "weight-loss": "Weight Loss",
  "pain-relief": "Pain Relief",
  "movement-quality": "Movement Quality",
};

const WORKOUT_TITLES: Record<string, string> = {
  strength: "Strength",
  metabolic: "Metabolic",
  challenge: "Challenge",
  cardio: "Cardio",
  mobility: "Mobility",
  pilates: "Pilates",
  recovery: "Recovery",
  "calorie-burning": "Calorie Burning",
  "micro-workouts": "Micro-Workouts",
};

function program(slug: keyof typeof PROGRAM_TITLES): SmartyGymTarget {
  return {
    slug,
    title: PROGRAM_TITLES[slug],
    url: `${SMARTYGYM_ORIGIN}/training-program/${slug}`,
  };
}

function workout(slug: keyof typeof WORKOUT_TITLES): SmartyGymTarget {
  return {
    slug,
    title: WORKOUT_TITLES[slug],
    url: `${SMARTYGYM_ORIGIN}/workout/${slug}`,
  };
}

function parqIsClean(parq: ParqAnswers | undefined): boolean {
  if (!parq) return true;
  return !(
    parq.heartCondition ||
    parq.chestPainActivity ||
    parq.chestPainRest ||
    parq.balanceLoss ||
    parq.boneJoint ||
    parq.bpMedication ||
    parq.otherReason
  );
}

function scanIsClean(session: ScreenSession, minOverall: number): boolean {
  if (session.overall < minOverall) return false;
  return !session.tests.some((t) => t.score === 1);
}

/**
 * Decide whether the user should see a SmartyGym handoff and at what level.
 *
 * - "cleared": their movement is good enough to train performance without
 *   ongoing corrective work.
 * - "performance-track": they told us at onboarding they want performance
 *   or to start a sport, and their PAR-Q is clean — show performance CTAs
 *   alongside their corrective program.
 * - "not-cleared": stay focused on the corrective program.
 */
export function evaluateGraduation(user: User): GraduationResult {
  const sessions = user.sessions ?? [];
  const latest = sessions[sessions.length - 1];
  const previous = sessions[sessions.length - 2];
  const pain = user.questionnaire?.pain;
  const painFlag = pain === "moderate" || pain === "severe";

  if (latest && !painFlag) {
    // Rule 1: high-scoring latest scan, no 1/3 tests.
    if (scanIsClean(latest, 85)) {
      return { status: "cleared", reason: "latest-scan-clean" };
    }
    // Rule 2: two consecutive scans, newest ≥ 80, no 1/3 tests.
    if (previous && scanIsClean(latest, 80) && scanIsClean(previous, 75)) {
      return { status: "cleared", reason: "consistent-improvement" };
    }
  }

  const performanceGoal = user.goal === "perform_better" || user.goal === "start_sport";
  if (performanceGoal && parqIsClean(user.parq)) {
    return { status: "performance-track", reason: "goal-performance" };
  }

  return { status: "not-cleared", reason: "corrective-focus" };
}

/**
 * Goal → SmartyGym recommendation. Cleared users get the "level up" copy;
 * performance-track (not yet cleared) users get a "keep building" tone.
 */
export function recommendSmartyGym(
  goal: Goal | undefined,
  status: GraduationStatus,
): SmartyGymRecommendation | null {
  if (status === "not-cleared") return null;

  const cleared = status === "cleared";
  const g: Goal = goal ?? "feel_better";

  switch (g) {
    case "perform_better":
      return {
        program: program("functional-strength"),
        workouts: [workout("strength"), workout("metabolic"), workout("challenge")],
        headline: cleared ? "You're cleared — train performance" : "Build performance alongside your program",
        blurb: cleared
          ? "Your scan says your movement is ready. SmartyMove is a scanner, not a gym — SmartyGym is where you push."
          : "Your corrective program is running. When you're ready to add load, SmartyGym has the workouts.",
      };
    case "start_sport":
      return {
        program: program("cardio-endurance"),
        workouts: [workout("cardio"), workout("mobility"), workout("metabolic")],
        headline: cleared ? "You're cleared to train for your sport" : "Prep for your sport as you progress",
        blurb: cleared
          ? "Your movement checks out. Take it to the next step at SmartyGym."
          : "Keep the corrective work here. Build capacity in parallel at SmartyGym.",
      };
    case "feel_better":
      return {
        program: program("movement-quality"),
        workouts: [workout("pilates"), workout("mobility"), workout("recovery")],
        headline: cleared ? "Keep moving well — every day" : "Add gentle movement to your week",
        blurb: cleared
          ? "Your scan is clean. Keep the habit going with the SmartyGym feel-good categories."
          : "Pair your corrective program with easy sessions from SmartyGym.",
      };
    case "prevent_injury":
      return {
        program: program("movement-quality"),
        workouts: [workout("mobility"), workout("recovery"), workout("pilates")],
        headline: cleared ? "Bulletproofed — now stay that way" : "Reinforce the weak links",
        blurb: cleared
          ? "Cleared. Keep the resilience with SmartyGym movement-quality work."
          : "Complement your corrective program with SmartyGym mobility and recovery.",
      };
    case "reduce_pain":
    default:
      if (!cleared) return null;
      return {
        program: program("pain-relief"),
        workouts: [workout("recovery"), workout("mobility")],
        headline: "You're cleared — protect what you built",
        blurb: "Your scan is clean. Keep your body happy with SmartyGym's pain-relief and recovery categories.",
      };
  }
}
