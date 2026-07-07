/**
 * Corrective Exercise Engine v1.
 *
 * Builds a 7-exercise daily routine by:
 *  1. Determining the user's focus areas (max 2; default by goal if "none").
 *  2. Computing slot counts (mobility / stability / strength) from the
 *     current phase ratios.
 *  3. Walking the curated per-area lists and resolving each curated name
 *     to the closest row in the public.exercises library.
 *
 * The engine NEVER invents exercises. If a curated movement does not
 * resolve to a library row, it is skipped (and surfaced for the admin).
 */

import type { LibraryExercise } from "../exercises";
import {
  AREA_BLOCKLIST,
  CATEGORY_DURATION,
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  AREA_LABEL,
  GOAL_DEFAULT_AREAS,
  LIBRARY,
  jointToArea,
  type Area,
  type Category,
} from "./libraries";
import { getPhaseInfo, type PhaseInfo } from "./phase";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "to", "of", "with", "on", "in",
  "from", "for", "by", "into", "v", "v.",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t));
}

/**
 * "Qualifier" tokens describe HOW a movement is performed (setup, side,
 * tempo, level, equipment context). They are NOT the movement itself, so
 * the strict-subset check ignores them.
 *
 * Everything not in this set is treated as a MOVEMENT/CONTENT token — if
 * the library row carries a content token the curated canonical didn't
 * ask for, the row is introducing an exercise we didn't prescribe and is
 * rejected outright.
 */
const QUALIFIER_TOKENS = new Set([
  // position / stance
  "kneeling", "half", "standing", "seated", "supine", "prone", "quadruped",
  "tall", "short", "split", "staggered", "narrow", "wide", "close", "open",
  "neutral", "forward", "backward", "front", "back", "top", "bottom", "side",
  "sides", "lateral", "medial", "left", "right", "each", "per", "alternating",
  // support / setup
  "supported", "unsupported", "assisted", "unassisted", "modified", "wall",
  "bench", "chair", "floor", "mat", "box", "step", "table",
  // equipment context (allowed variants)
  "band", "bands", "resistance", "bodyweight", "body", "weight", "elastic",
  "dumbbell", "dumbbells", "kettlebell", "kettlebells", "medicine", "ball",
  "weighted", "loaded",
  // count / laterality
  "single", "double", "two", "one", "three", "leg", "legs", "arm", "arms",
  "bilateral", "unilateral",
  // execution
  "hold", "holds", "isometric", "eccentric", "concentric", "static", "dynamic",
  "slow", "tempo", "reverse", "regression", "progression", "beginner",
  "advanced", "intermediate", "variation", "variations", "level", "easy", "hard",
  // grammatical / descriptors
  "the", "a", "an", "and", "or", "to", "of", "with", "on", "in", "from",
  "for", "by", "into", "up", "down", "against", "using", "over", "under",
  "closed", "eyes", "open",
]);

function contentTokens(name: string): string[] {
  return tokenize(name).filter((t) => !QUALIFIER_TOKENS.has(t));
}

/**
 * HARD REJECTS — never appropriate for a corrective program regardless of
 * how well the name matches. We are a corrective/rehab tool, not a gym
 * programmer. Olympic lifts, plyometrics, sprints, kipping, and compound
 * CrossFit-style combos are all off-limits.
 */
const UNSAFE_FOR_CORRECTIVE = /(burpee|snatch|clean\s*(and|&)?\s*jerk|power\s*clean|hang\s*clean|muscle\s*up|kipping|plyo|plyometric|box\s*jump|broad\s*jump|depth\s*jump|sprint|olympic|jerk\b)/i;

/**
 * Heavy/gym equipment we won't substitute in unless the curated canonical
 * explicitly names it. Body-weight, band, and light dumbbell variants are
 * fine; barbells, machines, cables, sleds, and trap bars are not.
 */
const HEAVY_EQUIPMENT = /(barbell|machine|smith|cable|sled|trap\s*bar|leg\s*press|hack\s*squat|lat\s*pulldown)/i;

/**
 * Connective phrases that indicate a COMPOUND movement (two exercises
 * fused into one). "Push-Up To Side Plank", "Squat Into Press", etc.
 * Reject unless the canonical asked for the same connector.
 */
const COMPOUND_CONNECTOR = /(\bto\b|\binto\b|\bplus\b|\+|\&)/i;

/** Score a library row against a curated canonical name. 0 = no match. */
function scoreRow(canonical: string, row: LibraryExercise): number {
  if (!row.gif_url) return 0;
  const name = row.name.toLowerCase();
  const canonLower = canonical.toLowerCase();
  if (name === canonLower) return 10000;

  const canonTokens = tokenize(canonical);
  if (canonTokens.length === 0) return 0;

  // HARD REJECTS — non-negotiable for a corrective tool.
  if (UNSAFE_FOR_CORRECTIVE.test(name)) return 0;
  if (HEAVY_EQUIPMENT.test(name) && !HEAVY_EQUIPMENT.test(canonLower)) return 0;
  if (COMPOUND_CONNECTOR.test(name) && !COMPOUND_CONNECTOR.test(canonLower)) return 0;

  // STRICT SUBSET — every MOVEMENT token in the library row must appear in
  // the curated canonical. This is what stops "Push-Up To Side Plank" from
  // resolving to "Side Plank": the row carries "push" as a content token,
  // the canonical does not, so the row is prescribing a movement we never
  // asked for. Same rule kills "Bird Dog Reach" for "Bird Dog",
  // "Glute Bridge Two Legs On Bench" for "Glute Bridge", etc.
  const canonContent = new Set(contentTokens(canonical));
  const rowContent = contentTokens(name);
  if (rowContent.length === 0) return 0;
  for (const t of rowContent) {
    if (!canonContent.has(t)) return 0;
  }
  // And the canonical's core movement tokens must all be present in the row.
  for (const t of canonContent) {
    if (!name.includes(t)) return 0;
  }

  let matched = 0;
  for (const t of canonTokens) {
    if (name.includes(t)) matched++;
  }
  if (matched === 0) return 0;

  let score = matched * 100;
  if (row.equipment === "body weight") score += 30;
  if (row.equipment === "band" || row.equipment === "resistance band") score += 20;
  // Prefer shorter, cleaner names.
  score += Math.max(0, 60 - name.length);
  // Prefer rows that match the canonical exactly in content-token count.
  if (rowContent.length === canonContent.size) score += 50;
  return score;
}

function violatesBlocklist(area: Area, row: LibraryExercise): boolean {
  const blocked = AREA_BLOCKLIST[area];
  if (!blocked || blocked.length === 0) return false;
  const n = row.name.toLowerCase();
  return blocked.some((b) => n.includes(b));
}

export interface ResolvedPick {
  area: Area;
  category: Category;
  canonical: string;
  row: LibraryExercise;
}

function bestRow(
  area: Area,
  canonical: string,
  library: LibraryExercise[],
  used: Set<string>,
): LibraryExercise | null {
  let best: { row: LibraryExercise; score: number } | null = null;
  for (const row of library) {
    if (used.has(row.id)) continue;
    if (violatesBlocklist(area, row)) continue;
    const s = scoreRow(canonical, row);
    if (s <= 0) continue;
    if (!best || s > best.score) best = { row, score: s };
  }
  return best?.row ?? null;
}

/** Deterministic seedable shuffle. */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function hashSeed(...parts: string[]): number {
  let h = 2166136261;
  for (const p of parts) {
    for (let i = 0; i < p.length; i++) {
      h ^= p.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return h >>> 0;
}

export interface BuildInput {
  userId: string;
  goal: string | undefined;
  joints: string[];
  programStartDate: string;
  dateISO?: string; // defaults to today
  phaseOverride?: PhaseInfo["phase"];
  /**
   * Latest Movement Screen sub-scores (0-100). When present, the engine
   * biases category slot counts toward the user's weakest dimensions and
   * forces the Foundation phase for very low overall scores.
   */
  sessionSub?: { mobility: number; stability: number; balance: number; quality: number };
}

export interface BuiltRoutine {
  phase: PhaseInfo;
  picks: ResolvedPick[];
  unresolved: { area: Area; category: Category; canonical: string }[];
}

/** Areas to draw from, deduped, max 2; falls back to goal default if "none". */
function resolveAreas(joints: string[], goal: string | undefined): Area[] {
  const cleaned = joints.filter((j) => j && j !== "none");
  const mapped: Area[] = [];
  for (const j of cleaned) {
    const a = jointToArea(j);
    if (a && !mapped.includes(a)) mapped.push(a);
    if (mapped.length >= 2) break;
  }
  if (mapped.length > 0) return mapped;
  const fallback = (goal && GOAL_DEFAULT_AREAS[goal]) || GOAL_DEFAULT_AREAS["feel_better"];
  return fallback.slice(0, 2);
}

/**
 * Build the daily routine.
 */
export function buildCorrectiveRoutine(
  input: BuildInput,
  library: LibraryExercise[],
): BuiltRoutine {
  const sub = input.sessionSub;
  // Strength was removed from the movement screen — the four remaining
  // sub-scores drive the overall used for phase / slot decisions here.
  // Any dimension flagged "Insufficient data" (-1) is neutralised at 50
  // so it doesn't bias the phase in either direction.
  const NEUTRAL = 50;
  const overall = sub
    ? Math.round(
        ((sub.mobility >= 0 ? sub.mobility : NEUTRAL) +
          (sub.stability >= 0 ? sub.stability : NEUTRAL) +
          (sub.balance >= 0 ? sub.balance : NEUTRAL) +
          (sub.quality >= 0 ? sub.quality : NEUTRAL)) /
          4,
      )
    : null;
  // Force the gentlest phase when the user's scan flags poor movement.
  const effectiveOverride: PhaseInfo["phase"] | undefined =
    input.phaseOverride ?? (overall !== null && overall < 50 ? "restore" : undefined);
  const phase = getPhaseInfo(input.programStartDate, effectiveOverride);
  const areas = resolveAreas(input.joints, input.goal);
  const date = input.dateISO ?? new Date().toISOString().slice(0, 10);
  const seed = hashSeed(input.userId, date);

  // Per-area shuffled curated queues for each category, seeded by day.
  const queues: Record<Area, Record<Category, string[]>> = {} as any;
  for (const area of areas) {
    queues[area] = {
      mobility: seededShuffle(LIBRARY[area].mobility, seed + 1),
      stability: seededShuffle(LIBRARY[area].stability, seed + 2),
      strength: seededShuffle(LIBRARY[area].strength, seed + 3),
    };
  }

  const used = new Set<string>();
  const picks: ResolvedPick[] = [];
  const unresolved: BuiltRoutine["unresolved"] = [];

  // Bias category order by the user's weakest dimension so the weakest
  // bucket is filled first, before slots get consumed by other categories.
  // Strength is no longer a measured sub-score — treat the training
  // category as neutral in ordering. Weakest measured dimension still
  // wins the slot bias.
  const order: Category[] = sub
    ? (["mobility", "stability", "strength"] as Category[]).slice().sort((a, b) => {
        const sa = a === "mobility" ? Math.max(0, sub.mobility)
          : a === "stability" ? Math.max(0, Math.min(sub.stability, sub.balance))
          : NEUTRAL;
        const sb = b === "mobility" ? Math.max(0, sub.mobility)
          : b === "stability" ? Math.max(0, Math.min(sub.stability, sub.balance))
          : NEUTRAL;
        return sa - sb;
      })
    : ["mobility", "stability", "strength"];

  // Build a copy of slot counts we can adjust based on scan weaknesses.
  const slots: Record<Category, number> = { ...phase.slotCounts };
  if (sub) {
    const weakest = order[0];
    const strongest = order[order.length - 1];
    if (weakest !== strongest && slots[strongest] > 1) {
      // Take one slot from the strongest dimension, give it to the weakest.
      slots[strongest] -= 1;
      slots[weakest] += 1;
    }
  }

  for (const cat of order) {
    const want = slots[cat];
    let filled = 0;
    let areaCursor = 0;
    let exhausted = 0;

    while (filled < want && exhausted < areas.length) {
      const area = areas[areaCursor % areas.length];
      areaCursor++;
      const q = queues[area][cat];
      if (q.length === 0) { exhausted++; continue; }
      exhausted = 0;

      // Try names off the queue until one resolves.
      let placed = false;
      while (q.length > 0) {
        const canonical = q.shift()!;
        const row = bestRow(area, canonical, library, used);
        if (row) {
          used.add(row.id);
          picks.push({ area, category: cat, canonical, row });
          filled++;
          placed = true;
          break;
        } else {
          unresolved.push({ area, category: cat, canonical });
        }
      }
      if (!placed) exhausted++;
    }
  }

  // Backfill to 7 by pulling from any remaining queue in any area/category.
  const TARGET = 7;
  if (picks.length < TARGET) {
    for (const cat of order) {
      for (const area of areas) {
        const q = queues[area][cat];
        while (picks.length < TARGET && q.length > 0) {
          const canonical = q.shift()!;
          const row = bestRow(area, canonical, library, used);
          if (row) {
            used.add(row.id);
            picks.push({ area, category: cat, canonical, row });
          } else {
            unresolved.push({ area, category: cat, canonical });
          }
        }
      }
    }
  }

  return { phase, picks, unresolved };
}

/** Shape the engine output into the existing RoutineItem contract. */
export function pickToRoutineItem(p: ResolvedPick) {
  return {
    id: p.row.id,
    slot: p.category,
    name: titleCase(p.row.name),
    description: `${CATEGORY_LABEL[p.category]} · ${AREA_LABEL[p.area]}`,
    durationSec: CATEGORY_DURATION[p.category],
    emoji: CATEGORY_EMOJI[p.category],
    bodyPart: p.row.body_part,
    equipment: p.row.equipment,
    target: p.row.target,
    secondaryMuscles: p.row.secondary_muscles ?? [],
    instructions: p.row.instructions ?? [],
    gifPath: p.row.gif_url,
    gifUrl: null as string | null,
    area: p.area,
    category: p.category,
    canonical: p.canonical,
  };
}

/**
 * Resolve a single curated canonical name to the best matching library row.
 * Exposed so the failure-mode-specific decision engine can build picks
 * directly from focus templates without duplicating the scoring logic.
 */
export function resolveCanonical(
  area: Area,
  canonical: string,
  library: LibraryExercise[],
  used: Set<string>,
): LibraryExercise | null {
  return bestRow(area, canonical, library, used);
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Compute the list of curated names that have NO match in the library. */
export function findUnresolvedCanonicals(library: LibraryExercise[]): {
  area: Area; category: Category; canonical: string;
}[] {
  const out: { area: Area; category: Category; canonical: string }[] = [];
  const areas = Object.keys(LIBRARY) as Area[];
  for (const area of areas) {
    for (const cat of ["mobility", "stability", "strength"] as Category[]) {
      for (const canonical of LIBRARY[area][cat]) {
        let found = false;
        for (const row of library) {
          if (violatesBlocklist(area, row)) continue;
          if (scoreRow(canonical, row) > 0) { found = true; break; }
        }
        if (!found) out.push({ area, category: cat, canonical });
      }
    }
  }
  return out;
}