/**
 * SmartyMove — Corrective Decision Engine.
 *
 * Sits between the Movement Screen scoring output and the exercise picker.
 * It does NOT change scoring or compensation detection — it only decides
 * what to do with those results:
 *
 *   1. Failure-mode-specific exercise selection. The same test failing for
 *      different reasons needs different fixes. We map the *specific
 *      compensation or failure mode* (heel rise, knee valgus, spine
 *      rounding, lumbar arch, shoulder shrug, hip hike, ...) to a small
 *      focused exercise pool — not just "test X failed → area Y drills".
 *
 *   2. Root-cause clustering across tests. Heel rise on the squat + heel
 *      rise on the lunge + a failed/borderline ankle dorsiflexion test
 *      are three symptoms of one root cause (ankle restriction). We
 *      collapse them into one primary focus rather than three separate
 *      programs.
 *
 *   3. Prioritization. We cap the assigned program at MAX 2 primary
 *      focuses, and prioritize: (a) anything that overlaps the user's
 *      stated pain joints or goal area, (b) clusters with the most
 *      supporting signals, (c) outright failures over borderlines.
 *
 * Compensation detection itself lives in screen.run.tsx — here we only
 * pattern-match on the human-readable strings it emits.
 */

import type { TestResult } from "../store";
import type { Joint, Goal } from "../store";
import type { LibraryExercise, RoutineItem } from "../exercises";
import {
  AREA_LABEL,
  CATEGORY_DURATION,
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  GOAL_DEFAULT_AREAS,
  jointToArea,
  type Area,
  type Category,
} from "./libraries";
import { resolveCanonical } from "./engine";

// ─────────────────────────────────────────────────────────────────────────────
// Focus templates — one per root-cause cluster. Each template defines the
// exercise pool we draw from, plus the area + category we tag those picks
// with for the routine UI. Names are matched fuzzily against the library
// by the corrective engine, so minor naming variants are fine.
// ─────────────────────────────────────────────────────────────────────────────

export type FocusId =
  | "ankle_restriction"
  | "hip_stability"
  | "core_spinal_control"
  | "scapular_control"
  | "hip_mobility"
  | "shoulder_mobility"
  | "thoracic_mobility"
  | "hip_hinge_pattern"
  | "balance_proprioception"
  | "glute_strength"
  | "elbow_mobility"
  | "general_lower_mobility";

interface FocusTemplate {
  id: FocusId;
  label: string;
  /** Plain-language explanation shown on the results screen. */
  rationale: (signals: Signal[]) => string;
  area: Area;
  /** Mix of curated exercise names; each tagged with the category we
   *  want it surfaced as in the routine. */
  exercises: { canonical: string; category: Category }[];
}

const FOCUS_TEMPLATES: Record<FocusId, FocusTemplate> = {
  ankle_restriction: {
    id: "ankle_restriction",
    label: "Ankle mobility",
    area: "ankle",
    rationale: (sigs) => {
      const tests = uniqueTestNames(sigs);
      return `Ankle mobility looks like the root cause behind ${joinList(tests)}. We're prioritising ankle work — fixing the ankle is the move most likely to clean up the rest on your next re-test.`;
    },
    exercises: [
      { canonical: "Knee To Wall", category: "mobility" },
      { canonical: "Calf Stretch", category: "mobility" },
      { canonical: "Soleus Stretch", category: "mobility" },
      { canonical: "Dorsiflexion Mobilization", category: "mobility" },
      { canonical: "Ankle Rockers", category: "mobility" },
      { canonical: "Heel Raises", category: "strength" },
      { canonical: "Single Leg Calf Raises", category: "strength" },
    ],
  },
  hip_stability: {
    id: "hip_stability",
    label: "Hip & glute medius stability",
    area: "hip",
    rationale: (sigs) => {
      const tests = uniqueTestNames(sigs);
      return `Your hip/glute control is the common thread across ${joinList(tests)}. We're prioritising hip-stability work — that's where the knee/pelvis collapse is coming from.`;
    },
    exercises: [
      { canonical: "Clamshells", category: "stability" },
      { canonical: "Side Plank", category: "stability" },
      { canonical: "Single Leg Glute Bridge", category: "stability" },
      { canonical: "Hip Airplane", category: "stability" },
      { canonical: "Lateral Band Walk", category: "strength" },
      { canonical: "Single Leg Balance", category: "stability" },
      { canonical: "Glute Bridge", category: "strength" },
    ],
  },
  core_spinal_control: {
    id: "core_spinal_control",
    label: "Core & spinal motor control",
    area: "low_back",
    rationale: (sigs) => {
      const tests = uniqueTestNames(sigs);
      return `Your spine kept compensating across ${joinList(tests)} — the lower back is doing work the hips, shoulders or glutes should own. We're prioritising core control before any of the area-specific mobility work.`;
    },
    exercises: [
      { canonical: "Bird Dog", category: "stability" },
      { canonical: "Dead Bug", category: "stability" },
      { canonical: "Front Plank", category: "stability" },
      { canonical: "Side Plank", category: "stability" },
      { canonical: "Glute Bridge", category: "stability" },
      { canonical: "Pallof Press", category: "stability" },
      { canonical: "Cat Cow", category: "mobility" },
    ],
  },
  scapular_control: {
    id: "scapular_control",
    label: "Scapular motor control",
    area: "shoulder",
    rationale: (sigs) => {
      const tests = uniqueTestNames(sigs);
      return `Your shoulders shrugged up toward your ears on ${joinList(tests)} — that's an upper-trap/scapular control issue, not a flexibility issue. We're prioritising scapular control work over generic shoulder stretching.`;
    },
    exercises: [
      { canonical: "Wall Slides", category: "mobility" },
      { canonical: "Y Hold", category: "stability" },
      { canonical: "T Hold", category: "stability" },
      { canonical: "Band Pull Apart", category: "strength" },
      { canonical: "Scapular Push Up", category: "stability" },
      { canonical: "Face Pull", category: "strength" },
      { canonical: "Band External Rotation", category: "stability" },
    ],
  },
  hip_mobility: {
    id: "hip_mobility",
    label: "Hip mobility",
    area: "hip",
    rationale: () => "Your hip joint range is the limiting factor — your spine stayed neutral, so the hip itself needs more room.",
    exercises: [
      { canonical: "90/90 Hip Stretch", category: "mobility" },
      { canonical: "Hip Flexor Stretch", category: "mobility" },
      { canonical: "Figure Four Stretch", category: "mobility" },
      { canonical: "Adductor Rockback", category: "mobility" },
      { canonical: "Frog Stretch", category: "mobility" },
      { canonical: "Glute Stretch", category: "mobility" },
      { canonical: "World's Greatest Stretch", category: "mobility" },
    ],
  },
  shoulder_mobility: {
    id: "shoulder_mobility",
    label: "Shoulder mobility",
    area: "shoulder",
    rationale: () => "Your shoulder range is the limiting factor — no compensation flagged, so the joint itself needs more room.",
    exercises: [
      { canonical: "Wall Slides", category: "mobility" },
      { canonical: "Pec Stretch", category: "mobility" },
      { canonical: "Sleeper Stretch", category: "mobility" },
      { canonical: "Thread The Needle", category: "mobility" },
      { canonical: "Open Book", category: "mobility" },
      { canonical: "Band Dislocates", category: "mobility" },
      { canonical: "Lat Stretch", category: "mobility" },
    ],
  },
  thoracic_mobility: {
    id: "thoracic_mobility",
    label: "Thoracic mobility + anterior core",
    area: "low_back",
    rationale: () => "Your lower back arched to make up for tight upper back/shoulders. Open the thoracic spine and brace the front of the core so the lumbar stops cheating.",
    exercises: [
      { canonical: "Open Book", category: "mobility" },
      { canonical: "Thread The Needle", category: "mobility" },
      { canonical: "Thoracic Rotation", category: "mobility" },
      { canonical: "Cat Cow", category: "mobility" },
      { canonical: "Dead Bug", category: "stability" },
      { canonical: "Front Plank", category: "stability" },
      { canonical: "Bird Dog", category: "stability" },
    ],
  },
  hip_hinge_pattern: {
    id: "hip_hinge_pattern",
    label: "Hip hinge motor pattern",
    area: "hip",
    rationale: () => "Your hinge turned into a squat — this is a movement-pattern fix, not a mobility fix. Drill the hinge until the knees stop taking over.",
    exercises: [
      { canonical: "Glute Bridge", category: "stability" },
      { canonical: "Single Leg RDL", category: "stability" },
      { canonical: "Bird Dog", category: "stability" },
      { canonical: "Deadlift", category: "strength" },
      { canonical: "Hip Thrust", category: "strength" },
      { canonical: "Hamstring Stretch", category: "mobility" },
      { canonical: "Hip Flexor Stretch", category: "mobility" },
    ],
  },
  balance_proprioception: {
    id: "balance_proprioception",
    label: "Balance & proprioception",
    area: "ankle",
    rationale: () => "You needed your trunk to save the balance — that's a deeper instability signal. We start with foundational balance work before any loaded single-leg strength.",
    exercises: [
      { canonical: "Single Leg Balance", category: "stability" },
      { canonical: "Single Leg Balance Eyes Closed", category: "stability" },
      { canonical: "Tandem Walk", category: "stability" },
      { canonical: "Star Balance Reach", category: "stability" },
      { canonical: "Clock Reach", category: "stability" },
      { canonical: "Heel Walk", category: "stability" },
      { canonical: "Toe Walk", category: "stability" },
    ],
  },
  glute_strength: {
    id: "glute_strength",
    label: "Glute strength & endurance",
    area: "hip",
    rationale: () => "Simple glute weakness — the hold sagged without a spinal cheat. We progressively load the bridge/thrust pattern.",
    exercises: [
      { canonical: "Glute Bridge", category: "strength" },
      { canonical: "Hip Thrust", category: "strength" },
      { canonical: "Single Leg Glute Bridge", category: "strength" },
      { canonical: "Glute Bridge Hold", category: "stability" },
      { canonical: "Step Up", category: "strength" },
      { canonical: "Bird Dog", category: "stability" },
      { canonical: "Dead Bug", category: "stability" },
    ],
  },
  elbow_mobility: {
    id: "elbow_mobility",
    label: "Elbow mobility",
    area: "elbow",
    rationale: () => "Elbow range is short — joint-specific mobility work.",
    exercises: [
      { canonical: "Elbow Flexion Extension", category: "mobility" },
      { canonical: "Forearm Rotations", category: "mobility" },
      { canonical: "Wrist Flexor Stretch", category: "mobility" },
      { canonical: "Wrist Extensor Stretch", category: "mobility" },
      { canonical: "Nerve Glides", category: "mobility" },
      { canonical: "Hammer Curl", category: "strength" },
      { canonical: "Reverse Curl", category: "strength" },
    ],
  },
  general_lower_mobility: {
    id: "general_lower_mobility",
    label: "Ankle + hip mobility combo",
    area: "hip",
    rationale: () => "Squat depth was short but nothing specific compensated — general ankle + hip mobility combo to open the pattern up.",
    exercises: [
      { canonical: "Knee To Wall", category: "mobility" },
      { canonical: "Calf Stretch", category: "mobility" },
      { canonical: "90/90 Hip Stretch", category: "mobility" },
      { canonical: "Hip Flexor Stretch", category: "mobility" },
      { canonical: "Adductor Rockback", category: "mobility" },
      { canonical: "Assisted Deep Squat Hold", category: "mobility" },
      { canonical: "Glute Bridge", category: "strength" },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Signal extraction — pattern-match the human-readable compensation strings
// emitted by screen.run.tsx into structured (test, focusId, severity)
// tuples. We don't modify the scorer, so this is the contract.
// ─────────────────────────────────────────────────────────────────────────────

interface Signal {
  testId: string;
  testName: string;
  focusId: FocusId;
  severity: "fail" | "borderline";
  /** Compensation string or fallback "limited range" description. */
  detail: string;
  /** Optional pattern tag used to select the right reasoning card. */
  pattern?: CompensationPattern;
}

// ─────────────────────────────────────────────────────────────────────────────
// Compensation reasoning — for every detected compensation we emit three
// plain-language fields the results screen renders as a Findings card:
//   what:    what the scan actually saw
//   why:     the root-cause explanation for the user
//   program: the specific first-stage program direction it triggers
// This is deterministic — no LLM. Copy is the founder-supplied education layer.
// ─────────────────────────────────────────────────────────────────────────────

export type CompensationPattern =
  | "heel_rise"
  | "knee_valgus"
  | "spine_rounding"
  | "lateral_trunk_shift"
  | "forward_trunk_lean_balance"
  | "lumbar_arch_overhead"
  | "lumbar_arch_bridge"
  | "shoulder_shrug"
  | "hip_hike"
  | "pelvis_rotation_bridge"
  | "elbow_shoulder_cheat"
  | "limited_range_no_comp";

export interface CompensationReasoning {
  what: string;
  why: string;
  program: string;
}

const REASONING: Record<CompensationPattern, (testName: string) => CompensationReasoning> = {
  heel_rise: (t) => ({
    what: `Your heel lifted during the ${t}.`,
    why: "Your ankle can't yet dorsiflex enough to reach that depth naturally, so the body borrows the range by lifting the heel. The depth reading was bought through compensation, not real range.",
    program: "Your program starts with ankle mobility work exclusively — wall dorsiflexion drills, calf and soleus stretches, banded ankle mobilisation. We don't add squat-pattern strength until a re-test shows the heel stays flat.",
  }),
  knee_valgus: (t) => ({
    what: `Your knee tracked inward (valgus) during the ${t}.`,
    why: "This is a hip stability issue, not a knee issue. The hip abductors and glute medius aren't controlling the knee's frontal-plane position. The knee is the symptom; the hip is the cause.",
    program: "Your program addresses the hip first — clamshells, lateral band walks, single-leg glute bridges, side-lying hip abduction. Knee-specific work waits until the hip can hold the knee in line.",
  }),
  spine_rounding: (t) => ({
    what: `Your lower back rounded instead of your hips hinging on the ${t}.`,
    why: "This is a movement-pattern issue plus often a posterior-chain restriction. Stretching alone won't teach the pattern — you need to retrain the motor control of the hinge itself.",
    program: "Your program teaches your hips to do the work before adding any load — wall-tap hinge drill, dowel hinge, plus core stability (bird dog, dead bug). No loaded hinge work until the spine stays neutral.",
  }),
  lateral_trunk_shift: (t) => ({
    what: `You shifted sideways during the ${t}.`,
    why: "One hip is doing less work than the other — a unilateral weakness or restriction. This adds to your bilateral asymmetry finding.",
    program: "Your program adds unilateral hip stability and activation work on the weak side — single-leg glute bridges, clamshells, side-plank hip abduction — before returning to bilateral loading.",
  }),
  forward_trunk_lean_balance: (t) => ({
    what: `You pitched your torso forward to save your balance during the ${t}.`,
    why: "That's a strategy to keep the centre of mass over the stance foot when the hip and glute are too weak to stabilise the pelvis upright. It's a deeper instability signal than a simple pelvic drop.",
    program: "Your program starts with foundational balance and proprioception work — eyes-open then eyes-closed single-leg holds, star reaches, tandem walks — before any loaded single-leg strength.",
  }),
  lumbar_arch_overhead: (t) => ({
    what: `Your lower back arched to reach overhead on the ${t}.`,
    why: "The lumbar spine is extending to make the arms appear to go higher — the shoulder range isn't actually there. Stretching the shoulders won't fix this without teaching the anterior core to lock down the ribs.",
    program: "Your program leads with thoracic mobility (extension over a roller, open books) plus anterior core control (dead bug, plank). Shoulder mobility is secondary.",
  }),
  lumbar_arch_bridge: (t) => ({
    what: `Your lower back arched during the ${t} instead of the glutes lifting.`,
    why: "The lumbar spine is taking load the glutes should be handling — this is how low backs get overloaded during hip-thrust patterns.",
    program: "Your program starts with glute activation (isolated glute squeeze, clamshells) and core stability before any loaded hip-thrust pattern.",
  }),
  shoulder_shrug: (t) => ({
    what: `Your shoulders shrugged up toward your ears during the ${t}.`,
    why: "The upper traps are doing the job the lower traps and serratus should be doing — this is a scapular control deficit, not a flexibility deficit. Shoulder stretches alone won't fix it.",
    program: "Your program targets scapular motor control — Y/T/W holds, band pull-aparts, wall slides with an active retraction cue — before any overhead strength work.",
  }),
  hip_hike: (t) => ({
    what: `Your pelvis hiked up during the ${t}.`,
    why: "The lateral trunk muscles are lifting the pelvis to help the leg rise — the hip abductors aren't doing the work cleanly. This is a control problem, not a strength problem yet.",
    program: "Your program starts with low-level abductor activation (clamshells, isolated side-lying abduction) before any loaded abduction work.",
  }),
  pelvis_rotation_bridge: (t) => ({
    what: `Your pelvis rotated during the ${t} hold — one hip stayed higher than the other.`,
    why: "One glute is weaker than the other. Even in a bilateral test, this is a unilateral finding.",
    program: "Your program prioritises single-leg glute bridges over bilateral bridge progressions until the sides even out.",
  }),
  elbow_shoulder_cheat: (t) => ({
    what: `Your shoulder moved during the ${t}.`,
    why: "The upper arm compensated by moving the whole limb, so the elbow angle reading isn't reliable.",
    program: "We don't score this attempt. Redo the test with your upper arm pinned to your side before we generate any elbow-specific program.",
  }),
  limited_range_no_comp: (t) => ({
    what: `Range was limited on the ${t} but no compensation was flagged.`,
    why: "The joint itself needs more room — nothing else compensated to fake it.",
    program: "Your program uses joint-specific mobility work targeting the limiting tissue.",
  }),
};

/** Public: build the reasoning card for a signal. */
export function reasoningForSignal(sig: Signal | { pattern?: CompensationPattern; testName: string }): CompensationReasoning | null {
  const pattern = sig.pattern;
  if (!pattern) return null;
  return REASONING[pattern](sig.testName);
}

// ─────────────────────────────────────────────────────────────────────────────
// Signal extraction — pattern-match the human-readable compensation strings
// emitted by screen.run.tsx into structured (test, focusId, severity, pattern)
// tuples. We don't modify the scorer, so this is the contract.
// ─────────────────────────────────────────────────────────────────────────────

function hasAny(comps: string[] | undefined, ...patterns: RegExp[]): string | null {
  if (!comps) return null;
  for (const c of comps) for (const p of patterns) if (p.test(c)) return c;
  return null;
}

function severityOf(t: TestResult): "fail" | "borderline" {
  return t.score <= 1 ? "fail" : "borderline";
}

function extractSignals(tests: TestResult[]): Signal[] {
  const signals: Signal[] = [];
  for (const t of tests) {
    if (t.valid === false) continue; // skipped / invalid — not actionable
    const sev = severityOf(t);
    const comps = t.compensations;

    // ─── Squat ───────────────────────────────────────────────────────────
    if (t.id === "squat") {
      const heel = hasAny(comps, /heel.*lift|heels lifted/i);
      const valgus = hasAny(comps, /knee.*inward|valgus/i);
      const trunk = hasAny(comps, /trunk collapsed|spine compensated/i);
      if (heel) signals.push({ testId: t.id, testName: t.name, focusId: "ankle_restriction", severity: "fail", detail: heel });
      if (valgus) signals.push({ testId: t.id, testName: t.name, focusId: "hip_stability", severity: "fail", detail: valgus });
      if (trunk) signals.push({ testId: t.id, testName: t.name, focusId: "thoracic_mobility", severity: "fail", detail: trunk });
      // No compensation but limited depth → general ankle+hip combo
      if (!heel && !valgus && !trunk && t.score < 3) {
        signals.push({ testId: t.id, testName: t.name, focusId: "general_lower_mobility", severity: sev, detail: "Limited squat depth, no compensation flagged" });
      }
      continue;
    }

    // ─── Hip hinge ───────────────────────────────────────────────────────
    if (t.id === "hinge") {
      const spineRound = hasAny(comps, /back rounded|spine rounding|spine compensation/i);
      const becameSquat = hasAny(comps, /knees bent|became a squat/i);
      if (spineRound) signals.push({ testId: t.id, testName: t.name, focusId: "core_spinal_control", severity: "fail", detail: spineRound });
      if (becameSquat) signals.push({ testId: t.id, testName: t.name, focusId: "hip_hinge_pattern", severity: "fail", detail: becameSquat });
      // No compensation, limited angle, neutral spine → true hip mobility issue
      if (!spineRound && !becameSquat && t.score < 3) {
        signals.push({ testId: t.id, testName: t.name, focusId: "hip_mobility", severity: sev, detail: "Limited hip joint angle with neutral spine" });
      }
      continue;
    }

    // ─── Single-leg balance ──────────────────────────────────────────────
    if (t.id === "balance") {
      const trunkLean = hasAny(comps, /trunk leaned sideways/i);
      if (trunkLean) {
        signals.push({ testId: t.id, testName: t.name, focusId: "balance_proprioception", severity: "fail", detail: trunkLean });
      } else if (t.score < 3) {
        signals.push({ testId: t.id, testName: t.name, focusId: "hip_stability", severity: sev, detail: "Pelvic drop on single-leg stance" });
      }
      continue;
    }

    // ─── Lunge / knee step-down ──────────────────────────────────────────
    if (t.id === "lunge" || t.id === "knee_sld") {
      const heel = hasAny(comps, /heel lifted/i);
      const valgus = hasAny(comps, /knee.*inward|valgus/i);
      const rotation = hasAny(comps, /rotated your torso/i);
      if (heel) signals.push({ testId: t.id, testName: t.name, focusId: "ankle_restriction", severity: "fail", detail: heel });
      if (valgus) signals.push({ testId: t.id, testName: t.name, focusId: "hip_stability", severity: "fail", detail: valgus });
      if (rotation) signals.push({ testId: t.id, testName: t.name, focusId: "core_spinal_control", severity: "fail", detail: rotation });
      if (!heel && !valgus && !rotation && t.score < 3) {
        signals.push({ testId: t.id, testName: t.name, focusId: "hip_mobility", severity: sev, detail: "Limited lunge depth, no compensation flagged" });
      }
      continue;
    }

    // ─── Overhead reach / wall slide ─────────────────────────────────────
    if (t.id === "overhead" || t.id === "wall_slide") {
      const lumbar = hasAny(comps, /lower back arched|lumbar/i);
      const shrug = hasAny(comps, /shoulders shrugged|upper-trap/i);
      if (lumbar) signals.push({ testId: t.id, testName: t.name, focusId: "thoracic_mobility", severity: "fail", detail: lumbar });
      if (shrug) signals.push({ testId: t.id, testName: t.name, focusId: "scapular_control", severity: "fail", detail: shrug });
      if (!lumbar && !shrug && t.score < 3) {
        signals.push({ testId: t.id, testName: t.name, focusId: "shoulder_mobility", severity: sev, detail: "Limited overhead reach, no compensation flagged" });
      }
      continue;
    }

    // ─── Ankle dorsiflexion ──────────────────────────────────────────────
    if (t.id === "ankle_df") {
      const valgus = hasAny(comps, /knee collapsed inward/i);
      // Default to ankle mobility regardless — per founder spec, that's the
      // most likely driver. We still flag hip stability as a secondary
      // signal if knee valgus appeared during the test.
      if (t.score < 3) {
        signals.push({ testId: t.id, testName: t.name, focusId: "ankle_restriction", severity: sev, detail: "Limited ankle dorsiflexion", pattern: "limited_range_no_comp" });
      }
      if (valgus) signals.push({ testId: t.id, testName: t.name, focusId: "hip_stability", severity: "borderline", detail: valgus, pattern: "knee_valgus" });
      continue;
    }

    // ─── Standing hip abduction ──────────────────────────────────────────
    if (t.id === "hip_abd") {
      const hike = hasAny(comps, /pelvis hiked/i);
      const lean = hasAny(comps, /trunk leaned away/i);
      if (hike) signals.push({ testId: t.id, testName: t.name, focusId: "hip_stability", severity: "fail", detail: hike });
      if (lean) signals.push({ testId: t.id, testName: t.name, focusId: "core_spinal_control", severity: "borderline", detail: lean });
      if (!hike && !lean && t.score < 3) {
        // True abductor weakness — handled by hip_stability strength pool.
        signals.push({ testId: t.id, testName: t.name, focusId: "hip_stability", severity: sev, detail: "Limited hip abduction strength" });
      }
      continue;
    }

    // ─── Glute bridge hold ───────────────────────────────────────────────
    if (t.id === "bridge_hold") {
      const lumbar = hasAny(comps, /lumbar hyperextension|lower back arched/i);
      const sag = hasAny(comps, /hip sag/i);
      if (lumbar) signals.push({ testId: t.id, testName: t.name, focusId: "core_spinal_control", severity: "fail", detail: lumbar });
      else if (sag || t.score < 3) signals.push({ testId: t.id, testName: t.name, focusId: "glute_strength", severity: sev, detail: sag ?? "Short bridge hold" });
      continue;
    }

    // ─── Elbow ROM ───────────────────────────────────────────────────────
    if (t.id === "elbow_rom") {
      if (t.score < 3) {
        signals.push({ testId: t.id, testName: t.name, focusId: "elbow_mobility", severity: sev, detail: "Limited elbow range" });
      }
      continue;
    }
  }
  return signals;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cluster + prioritise
// ─────────────────────────────────────────────────────────────────────────────

export interface ScanFocus {
  id: FocusId;
  label: string;
  rationale: string;
  area: Area;
  signals: Signal[];
  /** When true, this focus is a true cluster (≥2 signals collapsed into one). */
  isCluster: boolean;
}

export interface ScanDecision {
  focuses: ScanFocus[];          // up to 2
  otherFindings: string[];        // plain-language lines for lower-priority issues
  insightSummary: string[];      // root-cause insights for the results screen
  /** Per-signal reasoning cards — the "why it matters + what your program does". */
  findings: Finding[];
  /** Tests that passed cleanly (score 3, no compensation, valid). */
  cleanPasses: { testId: string; testName: string }[];
  /** True when every valid test passed cleanly — no corrective needed. */
  allClean: boolean;
  /** Borderline tests (score 2, no compensation) — light Foundation, not full. */
  borderlines: { testId: string; testName: string }[];
}

export interface Finding {
  testId: string;
  testName: string;
  focusLabel: string;
  area: Area;
  severity: "fail" | "borderline";
  pattern: CompensationPattern;
  what: string;
  why: string;
  program: string;
}

const MAX_FOCUSES = 2;

function uniqueTestNames(sigs: Signal[]): string[] {
  return Array.from(new Set(sigs.map((s) => s.testName.toLowerCase())));
}

function joinList(parts: string[]): string {
  if (parts.length === 0) return "your scan";
  if (parts.length === 1) return `your ${parts[0]}`;
  if (parts.length === 2) return `your ${parts[0]} and ${parts[1]}`;
  return `your ${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function painGoalAreas(joints: Joint[], goal: Goal | undefined): Set<Area> {
  const set = new Set<Area>();
  for (const j of joints) {
    const a = jointToArea(j);
    if (a) set.add(a);
  }
  if (set.size === 0 && goal) {
    for (const a of GOAL_DEFAULT_AREAS[goal] ?? []) set.add(a);
  }
  return set;
}

/**
 * Turn raw test results into a prioritised, clustered corrective plan.
 */
export function analyzeScan(
  tests: TestResult[],
  joints: Joint[],
  goal: Goal | undefined,
): ScanDecision {
  const signals = extractSignals(tests);
  const validTests = tests.filter((t) => t.valid !== false);
  const cleanPasses = validTests
    .filter((t) => t.score === 3 && (!t.compensations || t.compensations.length === 0))
    .map((t) => ({ testId: t.id, testName: t.name }));
  const borderlines = validTests
    .filter((t) => t.score === 2 && (!t.compensations || t.compensations.length === 0))
    .map((t) => ({ testId: t.id, testName: t.name }));
  const allClean = validTests.length > 0 && validTests.every(
    (t) => t.score === 3 && (!t.compensations || t.compensations.length === 0),
  );

  if (signals.length === 0) {
    return { focuses: [], otherFindings: [], insightSummary: [], findings: [], cleanPasses, allClean, borderlines };
  }

  // Group by focus.
  const grouped = new Map<FocusId, Signal[]>();
  for (const s of signals) {
    const arr = grouped.get(s.focusId) ?? [];
    arr.push(s);
    grouped.set(s.focusId, arr);
  }

  const painAreas = painGoalAreas(joints, goal);

  const ranked = Array.from(grouped.entries()).map(([id, sigs]) => {
    const tmpl = FOCUS_TEMPLATES[id];
    const failCount = sigs.filter((s) => s.severity === "fail").length;
    const sizeScore = sigs.length * 10;         // cluster size weighs most after pain match
    const failScore = failCount * 4;            // fails beat borderlines
    const painScore = painAreas.has(tmpl.area) ? 50 : 0;
    return {
      id,
      sigs,
      tmpl,
      score: painScore + sizeScore + failScore,
    };
  });

  ranked.sort((a, b) => b.score - a.score);

  const top = ranked.slice(0, MAX_FOCUSES);
  const rest = ranked.slice(MAX_FOCUSES);

  const focuses: ScanFocus[] = top.map(({ id, sigs, tmpl }) => ({
    id,
    label: tmpl.label,
    rationale: tmpl.rationale(sigs),
    area: tmpl.area,
    signals: sigs,
    isCluster: sigs.length >= 2,
  }));

  const otherFindings: string[] = rest.map(({ tmpl, sigs }) => {
    const tests = uniqueTestNames(sigs);
    return `${tmpl.label} — also flagged on ${joinList(tests)}, but not part of this program's primary focus.`;
  });

  const insightSummary: string[] = focuses.map((f) => f.rationale);

  const findings: Finding[] = signals
    .map((s): Finding | null => {
      const r = reasoningForSignal(s);
      if (!r || !s.pattern) return null;
      const tmpl = FOCUS_TEMPLATES[s.focusId];
      return {
        testId: s.testId,
        testName: s.testName,
        focusLabel: tmpl.label,
        area: tmpl.area,
        severity: s.severity,
        pattern: s.pattern,
        what: r.what,
        why: r.why,
        program: r.program,
      };
    })
    .filter((f): f is Finding => f !== null);

  return { focuses, otherFindings, insightSummary, findings, cleanPasses, allClean, borderlines };
}

// ─────────────────────────────────────────────────────────────────────────────
// Build routine items directly from the decision (failure-mode-driven).
// Falls back to the area-based engine in program.ts when no decision exists.
// ─────────────────────────────────────────────────────────────────────────────

const TARGET_ROUTINE_SIZE = 7;

export interface FocusPick {
  area: Area;
  category: Category;
  canonical: string;
  row: LibraryExercise;
  focusId: FocusId;
  focusLabel: string;
}

/**
 * Build at most TARGET_ROUTINE_SIZE picks from the prioritised focuses.
 * Splits the slot count between focuses (4+3 for two, 7 for one) and
 * walks each focus's exercise list, resolving each canonical name to a
 * library row. Skips items that don't resolve, falls through to the
 * other focus to fill the gap.
 */
export function buildPicksFromDecision(
  decision: ScanDecision,
  library: LibraryExercise[],
): FocusPick[] {
  if (decision.focuses.length === 0) return [];
  const used = new Set<string>();
  const picks: FocusPick[] = [];

  const quotas = decision.focuses.length === 1
    ? [TARGET_ROUTINE_SIZE]
    : [Math.ceil(TARGET_ROUTINE_SIZE / 2), Math.floor(TARGET_ROUTINE_SIZE / 2)];

  // Two passes: fill each focus to its quota; then backfill to TARGET.
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < decision.focuses.length; i++) {
      const focus = decision.focuses[i];
      const tmpl = FOCUS_TEMPLATES[focus.id];
      const quota = pass === 0 ? quotas[i] : TARGET_ROUTINE_SIZE - picks.length;
      if (quota <= 0) continue;
      let filledFromThisFocus = picks.filter((p) => p.focusId === focus.id).length;
      for (const ex of tmpl.exercises) {
        if (filledFromThisFocus >= quota) break;
        if (picks.length >= TARGET_ROUTINE_SIZE) break;
        const row = resolveCanonical(focus.area, ex.canonical, library, used);
        if (!row) continue;
        used.add(row.id);
        picks.push({
          area: focus.area,
          category: ex.category,
          canonical: ex.canonical,
          row,
          focusId: focus.id,
          focusLabel: focus.label,
        });
        filledFromThisFocus++;
      }
    }
    if (picks.length >= TARGET_ROUTINE_SIZE) break;
  }

  return picks;
}

/** Shape a FocusPick into the existing RoutineItem contract. */
export function focusPickToRoutineItem(p: FocusPick): RoutineItem {
  return {
    id: p.row.id,
    slot: p.category,
    name: titleCase(p.row.name),
    description: `${p.focusLabel} · ${CATEGORY_LABEL[p.category]}`,
    durationSec: CATEGORY_DURATION[p.category],
    emoji: CATEGORY_EMOJI[p.category],
    bodyPart: p.row.body_part,
    equipment: p.row.equipment,
    target: p.row.target,
    secondaryMuscles: p.row.secondary_muscles ?? [],
    instructions: p.row.instructions ?? [],
    gifPath: p.row.gif_url,
    gifUrl: null,
    area: p.area,
    category: p.category,
    canonical: p.canonical,
  };
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** AREA_LABEL re-export so the UI can render focus area badges. */
export { AREA_LABEL };