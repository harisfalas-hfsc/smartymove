import type { Joint, TestResult, ScreenSession } from "./store";

export const CORE_TESTS = [
  { id: "squat", name: "Squat", focus: ["mobility", "strength"], duration: 10 },
  { id: "hinge", name: "Hip Hinge", focus: ["mobility", "quality"], duration: 10 },
  { id: "balance", name: "Single-leg Balance", focus: ["balance", "stability"], duration: 10 },
  { id: "lunge", name: "Lunge Reach", focus: ["mobility", "stability"], duration: 10 },
  { id: "overhead", name: "Overhead Reach + Rotation", focus: ["mobility", "quality"], duration: 10 },
] as const;

export const CONDITIONAL_TESTS: Record<Exclude<Joint, "none">, { id: string; name: string; note?: string }> = {
  ankle:    { id: "ankle_df",    name: "Ankle Dorsiflexion (knee-to-wall)" },
  knee:     { id: "knee_sld",    name: "Single-leg Step-down" },
  hip:      { id: "hip_abd",     name: "Standing Hip Abduction" },
  back:     { id: "bridge_hold", name: "Glute Bridge Endurance" },
  shoulder: { id: "wall_slide",  name: "Scapular Wall Slide" },
  elbow:    { id: "elbow_rom",   name: "Elbow Flex/Extend Range" },
  wrist:    { id: "wrist_rom",   name: "Guided Wrist Range Check", note: "Less precise than other tests — partly self-reported." },
};

export function angle(a: {x:number;y:number}, b: {x:number;y:number}, c: {x:number;y:number}) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x*cb.x + ab.y*cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  if (!mag) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dot/mag))) * 180/Math.PI;
}

export function scoreFromRange(value: number, ideal: number, tolerance: number): 1 | 2 | 3 {
  const diff = Math.abs(value - ideal);
  if (diff <= tolerance) return 3;
  if (diff <= tolerance * 2) return 2;
  return 1;
}

export function computeSession(results: TestResult[], conditional: Joint[], age: number): ScreenSession {
  const focusMap: Record<string, string[]> = {
    squat: ["mobility","strength","quality"],
    hinge: ["mobility","quality"],
    balance: ["balance","stability"],
    lunge: ["mobility","stability","strength"],
    overhead: ["mobility","quality"],
    ankle_df: ["mobility"], knee_sld: ["stability","strength"],
    hip_abd: ["stability","balance"], bridge_hold: ["strength","stability"],
    wall_slide: ["mobility","quality"], elbow_rom: ["mobility"], wrist_rom: ["mobility"],
  };
  const subs = { mobility: [] as number[], stability: [] as number[], balance: [] as number[], quality: [] as number[], strength: [] as number[] };
  for (const r of results) {
    const pct = (r.score / 3) * 100;
    for (const f of focusMap[r.id] ?? []) (subs as any)[f].push(pct);
  }
  const avg = (a: number[]) => a.length ? Math.round(a.reduce((x,y)=>x+y,0)/a.length) : 70;
  const sub = { mobility: avg(subs.mobility), stability: avg(subs.stability), balance: avg(subs.balance), quality: avg(subs.quality), strength: avg(subs.strength) };
  const overall = Math.round((sub.mobility + sub.stability + sub.balance + sub.quality + sub.strength) / 5);
  const offset = Math.round(((75 - overall) / 25) * 5);
  const movementAge = Math.max(16, Math.min(90, age + offset));
  return { date: new Date().toISOString(), overall, sub, movementAge, tests: results, conditional };
}
