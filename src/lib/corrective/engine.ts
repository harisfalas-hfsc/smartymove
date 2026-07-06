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

/** Score a library row against a curated canonical name. 0 = no match. */
function scoreRow(canonical: string, row: LibraryExercise): number {
  if (!row.gif_url) return 0;
  const name = row.name.toLowerCase();
  const canonLower = canonical.toLowerCase();
  if (name === canonLower) return 10000;

  const canonTokens = tokenize(canonical);
  if (canonTokens.length === 0) return 0;

  let matched = 0;
  for (const t of canonTokens) {
    if (name.includes(t)) matched++;
  }
  if (matched === 0) return 0;

  // Require at least half the keywords (rounded up) to match — keeps
  // "Glute Bridge" from matching just any "bridge" row.
  const required = Math.ceil(canonTokens.length / 2);
  if (matched < required) return 0;

  let score = matched * 100;
  if (row.equipment === "body weight") score += 30;
  // Prefer shorter, cleaner names.
  score += Math.max(0, 60 - name.length);
  // Penalize obviously loaded variants when curated name is plain.
  if (!/(barbell|dumbbell|cable|machine|smith|kettlebell)/.test(canonLower)) {
    if (/barbell|machine|smith/.test(name)) score -= 20;
  }
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
  sessionSub?: { mobility: number; stability: number; balance: number; quality: number; strength?: number };
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
  // Strength sub-score was removed from the movement screen — treat any
  // missing value as neutral (50) so legacy sessions still compute an
  // overall the same way.
  const strengthNeutral = 50;
  const overall = sub
    ? Math.round(
        ((sub.mobility >= 0 ? sub.mobility : strengthNeutral) +
          (sub.stability >= 0 ? sub.stability : strengthNeutral) +
          (sub.balance >= 0 ? sub.balance : strengthNeutral) +
          (sub.quality >= 0 ? sub.quality : strengthNeutral) +
          (sub.strength ?? strengthNeutral)) /
          5,
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
  const strengthFor = (s: NonNullable<BuildInput["sessionSub"]>) =>
    s.strength ?? strengthNeutral;
  const order: Category[] = sub
    ? (["mobility", "stability", "strength"] as Category[]).slice().sort((a, b) => {
        const sa = a === "mobility" ? Math.max(0, sub.mobility)
          : a === "stability" ? Math.max(0, Math.min(sub.stability, sub.balance))
          : strengthFor(sub);
        const sb = b === "mobility" ? Math.max(0, sub.mobility)
          : b === "stability" ? Math.max(0, Math.min(sub.stability, sub.balance))
          : strengthFor(sub);
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