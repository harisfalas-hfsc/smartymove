import type { Goal, Joint } from "./store";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getUser } from "./store";
import { buildCorrectiveRoutine, pickToRoutineItem, findUnresolvedCanonicals } from "./corrective/engine";
import { getPhaseInfo, type PhaseInfo } from "./corrective/phase";

/** Row from the public.exercises library table. */
export interface LibraryExercise {
  id: string;
  name: string;
  body_part: string | null;
  equipment: string | null;
  target: string | null;
  secondary_muscles: string[] | null;
  instructions: string[] | null;
  gif_url: string | null;
}

/** What the UI consumes for the daily micro-routine. */
export interface RoutineItem {
  id: string;
  slot: string;
  name: string;
  description: string;
  durationSec: number;
  emoji: string;
  bodyPart: string | null;
  equipment: string | null;
  target: string | null;
  secondaryMuscles: string[];
  instructions: string[];
  gifPath: string | null;
  gifUrl: string | null;
  area?: string;
  category?: string;
  canonical?: string;
}

/**
 * Concept slots. Each represents a movement we WANT to give the user.
 * The picker searches the library for the best matching exercise — we never
 * hard-code a specific library row, only the keywords and filters that
 * describe the kind of movement we're after.
 */
interface Slot {
  slot: string;
  label: string;
  emoji: string;
  durationSec: number;
  // Library filters
  bodyParts?: string[];
  targets?: string[];
  // Substrings to match (lower-case) in the exercise name. Higher in the list = higher weight.
  keywords: string[];
  // Prefer body-weight unless overridden
  preferEquipment?: string[];
  // Relevance
  joints?: Joint[];
  goals?: Goal[];
  baseScore?: number;
}

const SLOTS: Slot[] = [
  {
    slot: "ankle_mobility", label: "Ankle mobility", emoji: "🦵", durationSec: 45,
    bodyParts: ["lower legs"], keywords: ["ankle", "calf stretch", "dorsi"],
    joints: ["ankle", "knee"], goals: ["prevent_injury", "start_sport"], baseScore: 1,
  },
  {
    slot: "hip_mobility", label: "Hip mobility", emoji: "🦴", durationSec: 60,
    bodyParts: ["upper legs", "waist"], keywords: ["90", "hip", "pigeon", "figure", "frog", "rotation"],
    joints: ["hip", "back"], goals: ["feel_better", "reduce_pain", "perform_better"], baseScore: 2,
  },
  {
    slot: "glute_activation", label: "Glute activation", emoji: "🌉", durationSec: 45,
    bodyParts: ["upper legs"], targets: ["glutes"],
    keywords: ["glute bridge", "bridge", "hip thrust", "clam"],
    joints: ["hip", "back"], goals: ["reduce_pain", "prevent_injury", "feel_better"], baseScore: 2,
  },
  {
    slot: "core_stability", label: "Core stability", emoji: "🪨", durationSec: 45,
    bodyParts: ["waist"], keywords: ["plank", "dead bug", "bird dog", "hollow"],
    joints: ["back"], goals: ["prevent_injury", "perform_better", "reduce_pain"], baseScore: 2,
  },
  {
    slot: "thoracic_mobility", label: "Thoracic mobility", emoji: "🌀", durationSec: 60,
    bodyParts: ["back", "waist"], keywords: ["thoracic", "cat", "cobra", "open book", "rotation"],
    joints: ["back", "shoulder"], goals: ["feel_better", "perform_better"], baseScore: 1,
  },
  {
    slot: "shoulder_mobility", label: "Shoulder mobility", emoji: "🧱", durationSec: 60,
    bodyParts: ["shoulders", "upper arms"], keywords: ["wall slide", "shoulder", "scapular", "y t w"],
    joints: ["shoulder"], goals: ["feel_better", "perform_better"], baseScore: 1,
  },
  {
    slot: "balance", label: "Single-leg balance", emoji: "⚖️", durationSec: 45,
    bodyParts: ["upper legs"], keywords: ["single leg", "single-leg", "one leg", "stork", "rdl"],
    joints: ["hip", "knee", "ankle"], goals: ["perform_better", "start_sport", "prevent_injury"], baseScore: 1,
  },
  {
    slot: "lower_strength", label: "Lower-body strength", emoji: "🏋️", durationSec: 60,
    bodyParts: ["upper legs"], targets: ["quads", "glutes"],
    keywords: ["split squat", "bulgarian", "lunge", "squat", "step up"],
    joints: ["knee", "hip"], goals: ["perform_better", "start_sport"], baseScore: 1,
  },
  {
    slot: "posterior_chain", label: "Posterior chain", emoji: "🦿", durationSec: 60,
    bodyParts: ["upper legs", "back"], targets: ["hamstrings", "glutes"],
    keywords: ["good morning", "deadlift", "rdl", "hip hinge", "hyperextension"],
    joints: ["hip", "back"], goals: ["perform_better", "prevent_injury"], baseScore: 1,
  },
  {
    slot: "upper_pull", label: "Upper-body pull", emoji: "💪", durationSec: 45,
    bodyParts: ["back", "upper arms"], targets: ["lats", "upper back"],
    keywords: ["row", "pull", "scapular pull"],
    joints: ["shoulder"], goals: ["perform_better", "start_sport"], baseScore: 0,
  },
  {
    slot: "neck_relief", label: "Neck relief", emoji: "💆", durationSec: 30,
    bodyParts: ["neck"], keywords: ["neck", "chin tuck"],
    joints: ["back", "shoulder"], goals: ["feel_better", "reduce_pain"], baseScore: 0,
  },
  {
    slot: "calf_strength", label: "Calf strength", emoji: "🦵", durationSec: 45,
    bodyParts: ["lower legs"], keywords: ["calf raise", "heel raise"],
    joints: ["ankle"], goals: ["prevent_injury", "start_sport"], baseScore: 0,
  },
];

const ROUTINE_SIZE = 7;

function scoreSlot(s: Slot, goal: Goal | undefined, joints: Joint[]): number {
  let score = s.baseScore ?? 0;
  if (goal && s.goals?.includes(goal)) score += 3;
  for (const j of joints) if (j !== "none" && s.joints?.includes(j)) score += 4;
  return score;
}

/** Pick the best library exercise that matches a slot. */
function pickBestForSlot(slot: Slot, library: LibraryExercise[], used: Set<string>): LibraryExercise | null {
  const bodyParts = slot.bodyParts;
  const targets = slot.targets;
  const preferEq = slot.preferEquipment ?? ["body weight"];

  let best: { row: LibraryExercise; score: number } | null = null;
  for (const row of library) {
    if (used.has(row.id)) continue;
    if (!row.gif_url) continue;
    if (bodyParts && row.body_part && !bodyParts.includes(row.body_part)) continue;
    if (targets && row.target && !targets.includes(row.target)) continue;

    const name = row.name.toLowerCase();
    let score = 0;
    slot.keywords.forEach((kw, idx) => {
      if (name.includes(kw)) score += 10 + (slot.keywords.length - idx);
    });
    if (score === 0) continue; // no keyword hit → not a match

    if (row.equipment && preferEq.includes(row.equipment)) score += 5;
    // Prefer shorter, simpler names
    score += Math.max(0, 30 - name.length) * 0.05;

    if (!best || score > best.score) best = { row, score };
  }
  return best?.row ?? null;
}

/** Build a micro-routine for this user from the library. */
export function buildRoutine(goal: Goal | undefined, joints: Joint[], library: LibraryExercise[]): RoutineItem[] {
  const ordered = [...SLOTS]
    .map(s => ({ s, score: scoreSlot(s, goal, joints) }))
    .sort((a, b) => b.score - a.score)
    .map(x => x.s);

  const used = new Set<string>();
  const out: RoutineItem[] = [];
  for (const slot of ordered) {
    if (out.length >= ROUTINE_SIZE) break;
    const row = pickBestForSlot(slot, library, used);
    if (!row) continue;
    used.add(row.id);
    out.push(toRoutineItem(slot, row));
  }
  // Backfill from any remaining slots with looser matching if we still need more
  if (out.length < ROUTINE_SIZE) {
    for (const slot of ordered) {
      if (out.length >= ROUTINE_SIZE) break;
      const row = pickBestForSlot({ ...slot, bodyParts: undefined, targets: undefined }, library, used);
      if (!row) continue;
      used.add(row.id);
      out.push(toRoutineItem(slot, row));
    }
  }
  return out;
}

function toRoutineItem(slot: Slot, row: LibraryExercise): RoutineItem {
  return {
    id: row.id,
    slot: slot.slot,
    name: titleCase(row.name),
    description: slot.label,
    durationSec: slot.durationSec,
    emoji: slot.emoji,
    bodyPart: row.body_part,
    equipment: row.equipment,
    target: row.target,
    secondaryMuscles: row.secondary_muscles ?? [],
    instructions: row.instructions ?? [],
    gifPath: row.gif_url,
    gifUrl: null,
  };
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Fetch the SmartyMove curated library.
 *
 * Reads from `smartymove_exercises` — the closed, approved list of ~250
 * exercises the corrective engine is allowed to prescribe. The generic
 * `public.exercises` pool is kept only for future enrichment; the engine
 * NEVER pulls from it directly.
 *
 * When a curated row has a `source_exercise_id`, we hydrate the linked
 * `exercises` row's GIF, instructions and muscle metadata for the UI.
 * Otherwise the row is returned without a GIF and the UI renders name +
 * addresses only — still fully usable.
 */
async function fetchLibrary(): Promise<LibraryExercise[]> {
  const { data, error } = await supabase
    .from("smartymove_exercises")
    .select(
      "id,name,area,category,equipment,addresses,source_exercise_id,source:exercises!smartymove_exercises_source_exercise_id_fkey(id,body_part,equipment,target,secondary_muscles,instructions,gif_url)"
    )
    .eq("approved", true)
    .order("area")
    .order("category")
    .order("sort_order");
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string;
    name: string;
    area: string;
    category: string;
    equipment: string | null;
    addresses: string | null;
    source_exercise_id: string | null;
    source: {
      id: string;
      body_part: string | null;
      equipment: string | null;
      target: string | null;
      secondary_muscles: string[] | null;
      instructions: string[] | null;
      gif_url: string | null;
    } | null;
  }>;
  return rows.map((r) => ({
    id: r.source?.id ?? r.id,
    name: r.name,
    body_part: r.source?.body_part ?? r.area,
    equipment: r.source?.equipment ?? (r.equipment ?? null),
    target: r.source?.target ?? null,
    secondary_muscles: r.source?.secondary_muscles ?? [],
    instructions: r.source?.instructions ?? (r.addresses ? [r.addresses] : []),
    gif_url: r.source?.gif_url ?? null,
  }));
}

/** Sign GIF URLs in one batch and attach them. */
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
 * React hook: returns today's micro-routine, built strictly from the
 * curated SmartyMove libraries via the Corrective Exercise Engine.
 */
export function useMicroRoutine(goal: Goal | undefined, joints: Joint[]) {
  const jointsKey = [...joints].sort().join(",");
  const u = getUser();
  const userId = u?.id ?? "anon";
  const programStart = u?.programStartDate ?? u?.createdAt ?? new Date().toISOString();
  const phaseOverride = u?.phaseOverride;
  const dateISO = new Date().toISOString().slice(0, 10);
  const latest = u?.sessions?.[u.sessions.length - 1];
  const sessionSub = latest?.sub;
  const sessionKey = latest?.date ?? "no-session";
  return useQuery({
    queryKey: ["corrective-routine", userId, goal ?? "none", jointsKey, dateISO, phaseOverride ?? "auto", sessionKey],
    queryFn: async () => {
      const library = await fetchLibrary();
      const built = buildCorrectiveRoutine(
        { userId, goal, joints, programStartDate: programStart, dateISO, phaseOverride, sessionSub },
        library,
      );
      const items: RoutineItem[] = built.picks.map(pickToRoutineItem);
      return attachSignedUrls(items);
    },
    staleTime: 30 * 60 * 1000,
  });
}

/** Phase info hook for the current user (UI banners). */
export function useCurrentPhase(): PhaseInfo | null {
  const u = getUser();
  if (!u) return null;
  const start = u.programStartDate ?? u.createdAt;
  return getPhaseInfo(start, u.phaseOverride);
}

/** Admin: list curated canonical names that don't resolve to any library row. */
export function useUnresolvedCanonicals() {
  return useQuery({
    queryKey: ["unresolved-canonicals"],
    queryFn: async () => {
      const library = await fetchLibrary();
      return findUnresolvedCanonicals(library);
    },
    staleTime: 10 * 60 * 1000,
  });
}

/** React hook: fetch a single library exercise by id with a signed GIF URL. */
export function useLibraryExercise(id: string | null) {
  return useQuery({
    queryKey: ["library-exercise", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("id,name,body_part,equipment,target,secondary_muscles,instructions,gif_url")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as LibraryExercise;
      let signed: string | null = null;
      if (row.gif_url) {
        const res = await supabase.storage.from("exercise-gifs").createSignedUrl(row.gif_url, 60 * 60);
        signed = res.data?.signedUrl ?? null;
      }
      return { row, signedUrl: signed };
    },
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * React hook: find the best library GIF that demonstrates a Movement Screen test.
 * Searches the exercise library by the curated query string and returns a
 * signed URL to its GIF (or null if nothing matched).
 */
export function useTestDemoGif(query: string | undefined) {
  return useQuery({
    queryKey: ["test-demo-gif", query ?? "none"],
    enabled: !!query,
    queryFn: async () => {
      if (!query) return null;
      const library = await fetchLibrary();
      const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
      let best: { row: LibraryExercise; score: number } | null = null;
      for (const row of library) {
        if (!row.gif_url) continue;
        const name = row.name.toLowerCase();
        let matched = 0;
        for (const t of tokens) if (name.includes(t)) matched++;
        if (matched === 0) continue;
        // Require at least half of the tokens to match.
        if (matched < Math.ceil(tokens.length / 2)) continue;
        let score = matched * 100;
        if (row.equipment === "body weight") score += 50;
        score += Math.max(0, 60 - name.length);
        if (!best || score > best.score) best = { row, score };
      }
      if (!best) return null;
      const { data } = await supabase.storage
        .from("exercise-gifs")
        .createSignedUrl(best.row.gif_url!, 60 * 60);
      return { name: best.row.name, signedUrl: data?.signedUrl ?? null };
    },
    staleTime: 60 * 60 * 1000,
  });
}
