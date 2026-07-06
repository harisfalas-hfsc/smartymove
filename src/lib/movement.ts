import type { Joint, TestResult, ScreenSession } from "./store";

/**
 * Per-test camera view definition. Every core/conditional test can declare
 * one or more views, each with the compensations the camera can detect
 * from that angle. Used to drive:
 *   • the pre-test intro (silhouette + copy)
 *   • the "reposition" transition between views
 *   • per-view compensation detection in screen.run.tsx
 *
 * Some tests (hip abduction, elbow ROM) only need one view — the second
 * view would add minimal insight and would waste user time.
 */
export type TestView = {
  view: "front" | "side";
  label: string;
  /** One-line positioning hint shown on the reposition transition screen. */
  cue: string;
  /** Compensations reliably detectable from this view — for UX + docs. */
  detects: string[];
};

export const TEST_VIEWS: Record<string, TestView[]> = {
  squat: [
    { view: "side",  label: "Side view",  cue: "Stand sideways to the camera so your full profile is visible.", detects: ["depth", "heel rise", "trunk lean", "lumbar rounding"] },
    { view: "front", label: "Front view", cue: "Now face the camera straight on.", detects: ["knee valgus", "knee varus", "left-right asymmetry", "hip shift"] },
  ],
  hinge: [
    { view: "side",  label: "Side view",  cue: "Stand sideways to the camera so we can see the line from your head to your hips.", detects: ["spine angle", "true hip flexion", "knee bend compensation"] },
    { view: "front", label: "Front view", cue: "Now face the camera straight on.", detects: ["lateral trunk shift", "pelvic asymmetry"] },
  ],
  balance: [
    { view: "front", label: "Front view", cue: "Face the camera. Full body in frame.", detects: ["pelvic drop", "trunk lateral lean", "knee position"] },
    { view: "side",  label: "Side view",  cue: "Turn sideways to the camera. Do both legs from this angle too.", detects: ["forward trunk lean", "hip flexion substitution"] },
  ],
  lunge: [
    { view: "side",  label: "Side view",  cue: "Stand sideways to the camera so we can see the front knee angle.", detects: ["front knee angle", "front heel rise", "trunk lean"] },
    { view: "front", label: "Front view", cue: "Now face the camera and repeat on the same leg, then switch legs.", detects: ["front knee valgus", "torso rotation", "back-leg hip drop"] },
  ],
  overhead: [
    { view: "front", label: "Front view", cue: "Face the camera, full body in frame.", detects: ["arm elevation angle", "shoulder shrug", "L/R shoulder symmetry"] },
    { view: "side",  label: "Side view",  cue: "Turn sideways so we can see if the lower back arches.", detects: ["lumbar extension / arch", "rib-cage flare"] },
  ],
  ankle_df: [
    { view: "side",  label: "Side view",  cue: "Kneel sideways to the camera.", detects: ["tibia forward lean", "heel lift"] },
    { view: "front", label: "Front view", cue: "Now kneel facing the camera.", detects: ["knee collapsing inward (valgus)"] },
  ],
  knee_sld: [
    { view: "front", label: "Front view", cue: "Face the camera on your step.", detects: ["knee valgus", "pelvic drop", "trunk lateral lean"] },
    { view: "side",  label: "Side view",  cue: "Turn sideways for the second set.", detects: ["trunk forward pitch", "heel rise", "descent control"] },
  ],
  hip_abd: [
    { view: "front", label: "Front view", cue: "Face the camera. Full body in frame.", detects: ["hip hike", "trunk lean", "leg lift height", "pelvic drop"] },
  ],
  bridge_hold: [
    { view: "side",  label: "Side view",  cue: "Lie on your back with your side to the camera.", detects: ["hip height", "lumbar arch / hyperextension"] },
    { view: "front", label: "Front view", cue: "Rotate so the camera can see across both hips.", detects: ["pelvic rotation / unilateral glute weakness"] },
  ],
  wall_slide: [
    { view: "side",  label: "Side view",  cue: "Stand sideways to the camera against the wall.", detects: ["lumbar arch", "wall contact quality"] },
    { view: "front", label: "Front view", cue: "Now face the camera against the wall.", detects: ["L/R shoulder height asymmetry"] },
  ],
  elbow_rom: [
    { view: "front", label: "Front view", cue: "Face the camera.", detects: ["range of motion", "upper-arm compensation"] },
  ],
  wrist_rom: [
    { view: "front", label: "Front view", cue: "Face the camera.", detects: ["wrist flexion/extension range (partly self-reported)"] },
  ],
};

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
  const valid = results.filter(r => r.valid !== false);
  for (const r of valid) {
    const pct = (r.score / 3) * 100;
    for (const f of focusMap[r.id] ?? []) (subs as any)[f].push(pct);
  }
  const avg = (a: number[]) => a.length ? Math.round(a.reduce((x,y)=>x+y,0)/a.length) : 0;
  const sub = { mobility: avg(subs.mobility), stability: avg(subs.stability), balance: avg(subs.balance), quality: avg(subs.quality), strength: avg(subs.strength) };
  const present = [sub.mobility, sub.stability, sub.balance, sub.quality, sub.strength].filter(v => v > 0);
  const overall = present.length ? Math.round(present.reduce((a,b)=>a+b,0) / present.length) : 0;
  const offset = Math.round(((75 - overall) / 25) * 5);
  const movementAge = Math.max(16, Math.min(90, age + offset));
  return { date: new Date().toISOString(), overall, sub, movementAge, tests: results, conditional };
}

/**
 * Plain-English guide for each Movement Screen test.
 * Used by the run screen to teach the user BEFORE the timer starts.
 */
export type TestGuide = {
  id: string;
  name: string;
  what: string;
  why: string;
  setup: string[];
  steps: string[];
  mistakes: string[];
  reps: string;
  /** Search string used to find a real demo GIF in the exercise library. */
  libraryQuery: string;
};

export const TEST_GUIDES: Record<string, TestGuide> = {
  squat: {
    id: "squat", name: "Squat",
    what: "Lower your hips down as if sitting into a chair, then stand back up.",
    why: "Shows how well your ankles, knees and hips move together under your body weight.",
    setup: ["Stand facing the camera, full body in frame", "Feet shoulder-width apart, toes slightly out", "Arms straight out in front for balance"],
    steps: ["Push hips back and bend knees", "Go as low as you can while keeping heels down", "Stand all the way back up", "Repeat for 3 slow reps in 10 seconds"],
    mistakes: ["Heels lifting off the floor", "Knees caving inward", "Rounding your lower back"],
    reps: "3 slow reps · ~10 sec",
    libraryQuery: "bodyweight squat",
  },
  hinge: {
    id: "hinge", name: "Hip Hinge",
    what: "Bow forward from your hips with a long, flat back — knees stay almost straight.",
    why: "Tests hamstring length and your ability to bend from the hips instead of the spine.",
    setup: ["Stand sideways to the camera so we can see your back line", "Feet hip-width apart", "Hands resting on the front of your thighs"],
    steps: ["Push your hips straight back (like closing a car door with your butt)", "Slide your hands down your thighs as your chest tips forward", "Keep your back long and flat — no rounding", "Stand back up. 3 slow reps."],
    mistakes: ["Rounding the upper back", "Bending the knees a lot (that's a squat, not a hinge)", "Looking up — keep your neck neutral"],
    reps: "3 slow reps · ~10 sec",
    libraryQuery: "stiff leg deadlift",
  },
  balance: {
    id: "balance", name: "Single-leg Balance",
    what: "Stand on one leg without grabbing anything.",
    why: "Measures hip stability and how steady your standing leg is.",
    setup: ["Stand facing the camera, full body in frame", "Hands on hips or relaxed at sides", "Pick a spot on the wall to look at"],
    steps: ["Lift your right foot a few inches off the ground", "Hold steady for 5 seconds", "Switch legs and hold the other 5 seconds"],
    mistakes: ["Holding onto a wall or chair", "Looking down at the floor", "Hopping on the standing foot"],
    reps: "5 sec each leg",
    libraryQuery: "single leg balance",
  },
  lunge: {
    id: "lunge", name: "Lunge Reach",
    what: "Step one foot forward into a lunge, then return to standing.",
    why: "Combines single-leg strength with hip and ankle mobility.",
    setup: ["Stand facing the camera, arms at sides", "Feet together"],
    steps: ["Take a long step forward with your right foot", "Bend both knees until your back knee almost touches the floor", "Push back up to standing", "Repeat with the left leg"],
    mistakes: ["Front knee collapsing inward", "Leaning too far forward", "Tiny step (makes it harder, not easier)"],
    reps: "1 rep each leg",
    libraryQuery: "bodyweight walking lunge",
  },
  overhead: {
    id: "overhead", name: "Overhead Reach + Rotation",
    what: "Reach both arms straight up overhead, then rotate side to side.",
    why: "Shows shoulder mobility and how well your spine rotates.",
    setup: ["Stand facing the camera, full body in frame", "Feet shoulder-width apart", "Arms relaxed at sides"],
    steps: ["Raise both arms straight up overhead — try to get them next to your ears", "Hold for 2 seconds at the top", "Rotate your torso slowly to the right, then left", "Lower arms"],
    mistakes: ["Arching the lower back to fake more reach", "Arms bending at the elbow", "Shrugging shoulders up to the ears"],
    reps: "1 slow cycle",
    libraryQuery: "standing overhead reach",
  },
  ankle_df: {
    id: "ankle_df", name: "Ankle Dorsiflexion (knee-to-wall)",
    what: "From a half-kneel, drive your front knee forward over your toes without letting the heel lift.",
    why: "Direct test of ankle mobility — the #1 missing range for most runners and lifters.",
    setup: ["Get into a half-kneel: one foot flat on the floor in front, the other knee on the floor behind", "Position sideways to the camera"],
    steps: ["Slowly push your front knee forward, past your toes", "Keep your front heel pressed firmly into the floor", "Go as far as you can, then return", "Repeat slowly for 10 seconds"],
    mistakes: ["Heel lifting off the floor (that's cheating)", "Knee caving inward instead of tracking over the toes"],
    reps: "Slow reps",
    libraryQuery: "ankle mobility",
  },
  knee_sld: {
    id: "knee_sld", name: "Single-leg Step-down",
    what: "Stand on one leg on a low step and slowly lower the other foot toward the floor.",
    why: "Reveals knee control and hip strength under load on one leg.",
    setup: ["Stand on a low step (a stair works) facing the camera", "One foot on the step, the other hanging off the edge"],
    steps: ["Slowly bend the standing knee", "Lightly tap the other heel on the floor", "Push back up — slow and controlled", "Switch legs"],
    mistakes: ["Standing knee caving inward", "Hip dropping on the lowering side", "Falling fast instead of controlling it"],
    reps: "Slow reps",
    libraryQuery: "single leg step down",
  },
  hip_abd: {
    id: "hip_abd", name: "Standing Hip Abduction",
    what: "Stand on one leg and lift the other leg straight out to the side.",
    why: "Tests the glute medius — the muscle that keeps your pelvis level when you walk and run.",
    setup: ["Stand facing the camera, full body in frame", "Hands on hips"],
    steps: ["Shift weight onto your right leg", "Lift your left leg straight out to the side, keep it straight", "Hold 2 seconds, lower with control", "Switch sides"],
    mistakes: ["Leaning the upper body to the opposite side", "Letting the lifted leg drift forward instead of straight out"],
    reps: "Both sides",
    libraryQuery: "standing hip abduction",
  },
  bridge_hold: {
    id: "bridge_hold", name: "Glute Bridge Endurance",
    what: "Lie on your back, knees bent, and lift your hips into a bridge — hold it.",
    why: "Measures glute endurance, which protects the low back.",
    setup: ["Lie on your back so the camera sees your side profile", "Knees bent, feet flat, arms relaxed at your sides"],
    steps: ["Squeeze your glutes and lift your hips toward the ceiling", "Create a straight line from your shoulders to your knees", "Hold the position — don't let the hips sag", "Hold for the full 10 seconds"],
    mistakes: ["Lower back arching instead of glutes squeezing", "Hips dropping before the timer ends", "Pushing through the toes instead of the heels"],
    reps: "Hold ~10 sec",
    libraryQuery: "glute bridge",
  },
  wall_slide: {
    id: "wall_slide", name: "Scapular Wall Slide",
    what: "Stand against a wall and slide your forearms up and down without losing contact.",
    why: "Tests shoulder blade mobility and overhead shoulder range.",
    setup: ["Stand with your back, head and butt against a wall", "Position sideways to the camera so we can see your arms", "Arms in a 'W' — elbows bent, forearms touching the wall"],
    steps: ["Slide forearms up the wall toward overhead — keep contact", "Go as high as you can without losing wall contact", "Slide back down to the 'W' position", "Repeat slowly"],
    mistakes: ["Hands or forearms peeling off the wall", "Lower back arching to fake more range", "Shrugging shoulders to the ears"],
    reps: "Slow reps",
    libraryQuery: "wall slide",
  },
  elbow_rom: {
    id: "elbow_rom", name: "Elbow Flex/Extend Range",
    what: "Bend and straighten your elbows fully through their range.",
    why: "Quick check on elbow joint range.",
    setup: ["Stand facing the camera", "Arms out in front of you, palms up"],
    steps: ["Bend both elbows fully — try to touch your shoulders with your fingers", "Then straighten them completely", "Repeat slowly and fully"],
    mistakes: ["Stopping short of full bend or full straight"],
    reps: "Slow reps",
    libraryQuery: "biceps curl",
  },
  wrist_rom: {
    id: "wrist_rom", name: "Guided Wrist Range Check",
    what: "Move your wrists through flexion and extension at full range.",
    why: "Wrist mobility check — note: this is partly self-reported because wrists are small on camera.",
    setup: ["Stand facing the camera", "Arms straight out in front, palms down"],
    steps: ["Bend wrists so fingers point up at the ceiling (extension)", "Then bend so fingers point down at the floor (flexion)", "Move slowly through full range"],
    mistakes: ["Letting elbows bend instead of moving from the wrist"],
    reps: "Slow reps",
    libraryQuery: "wrist stretch",
  },
};
