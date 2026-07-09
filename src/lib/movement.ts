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
    { view: "front", label: "Front view", cue: "Face the camera, feet shoulder-width, dowel held overhead with arms straight.", detects: ["knee valgus", "left-right asymmetry"] },
    { view: "side",  label: "Side view",  cue: "Now turn sideways so your full profile is visible.", detects: ["depth (thighs below parallel)", "heel rise", "excessive forward lean", "dowel dropping forward"] },
  ],
  hinge: [
    { view: "side",  label: "Side view",  cue: "Stand sideways to the camera so we can see the line from your head to your hips.", detects: ["spine angle", "true hip flexion", "knee bend compensation"] },
  ],
  lunge: [
    { view: "side",  label: "Side view",  cue: "Stand sideways with both feet in line on a 2×6 board. Dowel behind your back (head, spine, tailbone touching).", detects: ["front knee tracks over foot", "back knee touches the board behind the front heel", "trunk stays upright"] },
    { view: "front", label: "Front view", cue: "Now face the camera on the board and repeat the lunge on the same leg.", detects: ["loss of balance", "torso rotation", "front-knee drift (valgus / varus)"] },
  ],
  overhead: [
    { view: "front", label: "Front view", cue: "Face the camera. Make a fist around your thumb on each hand.", detects: ["fist-to-fist distance (target: within one hand length)", "L/R shoulder symmetry"] },
  ],
  hip_abd: [
    { view: "side",  label: "Side view",  cue: "Lie on your back with the camera on your side. Arms flat, legs straight, toes up.", detects: ["moving-leg ankle height vs. mid-thigh of the down leg", "opposite-leg staying flat", "loss of neutral pelvis"] },
  ],
};

/**
 * The SmartyMove Scan is a fixed 8-pattern movement screen. The internal
 * test ids reuse the pre-existing scoring engine (squat/balance/lunge/…) so
 * geometry + compensation detection continue to work; user-facing names,
 * descriptions and camera guides are re-branded for the SmartyMove protocol.
 *
 *   Deep Squat                → id "squat"
 *   Hip Hinge                 → id "hinge"
 *   Hurdle Step               → id "balance"
 *   In-line Lunge             → id "lunge"
 *   Shoulder Mobility         → id "overhead"           (front view only)
 *   Active Straight-Leg Raise → id "hip_abd"
 *   Trunk Stability Push-Up   → id "bridge_hold"
 *   Rotary Stability          → id "rotary_stability"
 *
 * The three FMS clearing patterns (Shoulder Mobility, TSPU, Rotary
 * Stability) surface a "any pain during that test?" prompt in the runner;
 * pain forces the pattern to score 0 (invalid).
 */
export const CORE_TESTS = [
  { id: "squat",            name: "Deep Squat",                 focus: ["mobility", "quality"],  duration: 10 },
  { id: "hinge",            name: "Hip Hinge",                  focus: ["mobility", "quality"],  duration: 10 },
  { id: "hip_abd",          name: "Active Straight-Leg Raise",  focus: ["mobility"],              duration: 10 },
  { id: "overhead",         name: "Shoulder Mobility",          focus: ["mobility"],              duration: 10 },
  { id: "lunge",            name: "In-line Lunge",              focus: ["mobility", "stability"], duration: 10 },
] as const;

/** Tests that surface a "Did you feel pain during that pattern?" prompt.
 *  Pain forces the pattern to score 0 (marked invalid + excluded from sub-scores). */
export const CLEARING_TESTS = new Set(["overhead"]);

/**
 * Tests that must be captured and scored per side (right, then left).
 * Final test score = the lower of the two side scores. A side-to-side
 * difference > 1 point flags the test as asymmetric on the results screen.
 * Non-bilateral tests (Deep Squat, Hip Hinge, Trunk Stability Push-Up) run
 * as a single movement with the sides moving together.
 */
export const BILATERAL_TESTS = new Set([
  "lunge",             // In-line Lunge
  "overhead",          // Shoulder Mobility
  "hip_abd",           // Active Straight-Leg Raise
]);

/** Kept for back-compat with older exports; the fixed 8-pattern scan no
 *  longer branches on joint selection. */
export const CONDITIONAL_TESTS: Record<string, { id: string; name: string; note?: string }> = {};

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
  // Per-test contribution map for the confirmed 5-test SmartyMove Scan.
  // Each entry is [subScoreKey, weight]. Shoulder Mobility ("overhead") is
  // camera-estimated so it contributes to Mobility and Quality at half weight
  // per the founder spec — the score still counts, but doesn't dominate.
  //
  //   Mobility  ← OH Squat + Hip Hinge + Active SLR + Shoulder Mobility (0.5) + Inline Lunge
  //   Stability ← OH Squat + Inline Lunge + Active SLR
  //   Balance   ← Inline Lunge (lateral control)
  //   Quality   ← OH Squat + Hip Hinge + Shoulder Mobility (0.5)
  type SubKey = "mobility" | "stability" | "balance" | "quality";
  const focusMap: Record<string, Array<[SubKey, number]>> = {
    squat:    [["mobility", 1], ["stability", 1], ["quality", 1]],
    hinge:    [["mobility", 1], ["quality", 1]],
    hip_abd:  [["mobility", 1], ["stability", 1]],
    overhead: [["mobility", 0.5], ["quality", 0.5]],
    lunge:    [["mobility", 1], ["stability", 1], ["balance", 1]],
    // Legacy IDs kept so old sessions still render sub-scores after schema
    // history rather than blanking out.
    balance:          [["balance", 1], ["stability", 1]],
    ankle_df:         [["mobility", 1]],
    knee_sld:         [["stability", 1]],
    bridge_hold:      [["stability", 1]],
    rotary_stability: [["stability", 1], ["quality", 1]],
    sl_balance:       [["balance", 1], ["stability", 1]],
    wall_slide:       [["mobility", 1]],
    elbow_rom:        [["mobility", 1]],
    wrist_rom:        [],
  };
  const buckets: Record<SubKey, Array<{ pct: number; w: number }>> = {
    mobility: [], stability: [], balance: [], quality: [],
  };
  // Pain-cap flags: if ANY pain-scored (0) test contributes to a bucket,
  // that bucket's final sub-score is capped at 50 — pain is a red flag,
  // not a green light. Score-0 tests still contribute a 0 to the average
  // (they are no longer silently excluded).
  const painInBucket = {
    mobility: false, stability: false, balance: false, quality: false,
  };
  // Camera-invalid / skipped-for-non-pain tests are still excluded — no
  // reading, no number.
  // Pain (score 0) is a flag, never a gate. Per founder spec the finding is
  // included in the average (contributes 0 pct) AND caps the sub-score at 50.
  // The rest of the scan continues normally regardless of pain reports.
  const scoreToPct = (s: 0 | 1 | 2 | 3) => (s === 3 ? 100 : s === 2 ? 67 : s === 1 ? 33 : 0);
  for (const r of results) {
    // Camera-invalid frames (never captured) are still excluded; pain-scored
    // rows keep `valid: false` today, so treat score-0 rows as painful and
    // include them, but leave other invalid rows out.
    const isPain = r.score === 0;
    if (r.valid === false && !isPain) continue;
    const pct = scoreToPct(r.score);
    for (const [key, w] of focusMap[r.id] ?? []) {
      buckets[key].push({ pct, w });
      if (isPain) painInBucket[key] = true;
    }
  }
  // MIN_CONTRIBUTORS = 1: a single test IS enough for a sub-score. If nothing
  // contributed, the sub-score is marked as -1 ("Insufficient data"). This
  // matches the spec: never show a fake number when we don't have data.
  const avgOrInsufficient = (a: Array<{ pct: number; w: number }>) => {
    if (!a.length) return -1;
    let ws = 0, sum = 0;
    for (const { pct, w } of a) { sum += pct * w; ws += w; }
    return ws > 0 ? Math.round(sum / ws) : -1;
  };
  const capIfPain = (v: number, painFlag: boolean) =>
    v < 0 ? v : painFlag ? Math.min(v, 50) : v;
  const sub = {
    mobility:  capIfPain(avgOrInsufficient(buckets.mobility),  painInBucket.mobility),
    stability: capIfPain(avgOrInsufficient(buckets.stability), painInBucket.stability),
    balance:   capIfPain(avgOrInsufficient(buckets.balance),   painInBucket.balance),
    quality:   capIfPain(avgOrInsufficient(buckets.quality),   painInBucket.quality),
  };
  // Overall = weighted average of the four sub-scores (Mobility 30, Stability
  // 30, Balance 20, Quality 20). If a sub-score is "Insufficient data" it is
  // excluded from the weighting and the remaining weights are renormalized.
  const weights: Record<keyof typeof sub, number> = {
    // Per spec: Mobility 30%, Stability 30%, Balance 20%, Movement Quality 20%.
    mobility: 0.30, stability: 0.30, balance: 0.20, quality: 0.20,
  };
  let wSum = 0, weighted = 0;
  (Object.keys(weights) as Array<keyof typeof sub>).forEach(k => {
    const v = sub[k];
    if (v >= 0) { weighted += v * weights[k]; wSum += weights[k]; }
  });
  const overall = wSum > 0 ? Math.round(weighted / wSum) : 0;
  const offset = Math.round(((75 - overall) / 25) * 5);
  const movementAge = Math.max(16, Math.min(90, age + offset));
  const redFlags = results
    .filter(r => r.valid !== false && r.score === 0)
    .map(r => r.id);
  return { date: new Date().toISOString(), overall, sub, movementAge, tests: results, conditional, redFlags };
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
  /** Plain-language 0/1/2/3 scoring rubric shown in the preview sheet. */
  scoring?: {
    "3": string;
    "2": string;
    "1": string;
    "0": string;
  };
};

export const TEST_GUIDES: Record<string, TestGuide> = {
  squat: {
    id: "squat", name: "Deep Squat",
    what: "Squat as deep as you can with a dowel held straight overhead.",
    why: "Screens full-body mechanics of the shoulders, hips, knees and ankles working together with a neutral spine.",
    setup: [
      "Feet shoulder-width apart, toes pointing straight forward",
      "Grip a dowel overhead — hands wider than shoulders, elbows locked, dowel directly above your head",
      "Stand facing the camera with your full body in frame",
    ],
    steps: [
      "Keep the dowel overhead and descend as low as you can",
      "Keep heels on the floor, torso as upright as possible, dowel over your head",
      "Pause at the bottom, then return to standing",
      "Perform up to 3 slow reps",
    ],
    mistakes: [
      "Heels lifting off the floor",
      "Dowel drifting forward past the feet",
      "Thighs not reaching parallel or below",
      "Knees caving inward",
    ],
    reps: "Up to 3 slow reps",
    libraryQuery: "overhead squat",
    scoring: {
      "3": "Thighs below parallel, dowel stays over the feet, torso stays upright, heels stay on the floor.",
      "2": "Same, but only after raising the heels onto a 2×6 board (limited ankle mobility).",
      "1": "Heels lift on the floor OR dowel drops forward OR thighs never reach parallel OR knees cave inward.",
      "0": "Any pain at any point during the pattern.",
    },
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
    scoring: {
      "3": "Long flat back, hips travel back with legs nearly straight, chest tips well forward from the hip.",
      "2": "Some hip travel but knees bend to help, or the back rounds slightly at the bottom.",
      "1": "Movement comes from the spine (rounding) or the knees (turns into a squat) — no true hip hinge.",
      "0": "Any pain in the low back, hips or hamstrings during the movement.",
    },
  },
  lunge: {
    id: "lunge", name: "In-line Lunge",
    what: "Split-stance lunge with both feet on a narrow line — hold a dowel behind the spine.",
    why: "Tests hip mobility, ankle mobility and torso stability in a narrow, staggered stance.",
    setup: [
      "Place both feet in-line on a narrow board (or a taped line). Toes point straight ahead.",
      "Front foot heel touches the line marking your own tibia length behind the toe of the back foot.",
      "Hold a dowel vertically behind your back so it contacts the back of your head, upper back, and tailbone — opposite hand to the front leg on top.",
    ],
    steps: [
      "Keeping the dowel in contact with all three points, lower straight down",
      "Touch the back knee to the board just behind the front heel",
      "Return to the start under control",
      "Switch legs and repeat",
    ],
    mistakes: [
      "Loss of balance",
      "Torso rotating off the line",
      "Dowel losing contact with head / back / tailbone",
      "Back knee not touching the board behind the front heel",
    ],
    reps: "Up to 3 slow reps each leg",
    libraryQuery: "in-line lunge",
    scoring: {
      "3": "Dowel stays in contact with head/back/tailbone, torso stays vertical, back knee touches the board behind the front heel, no balance loss.",
      "2": "Movement completes but with loss of dowel contact, slight torso rotation or an imperfect back-knee touch.",
      "1": "Loss of balance, back knee doesn't touch, or the pattern can't be completed on the line.",
      "0": "Any pain during the lunge.",
    },
  },
  overhead: {
    id: "overhead", name: "Shoulder Mobility",
    what: "One hand reaches over the top and down the back, the other reaches up the back — see how close the fists get.",
    why: "Bilateral shoulder screen: combined internal + external rotation and shoulder-blade mobility.",
    setup: [
      "Stand facing the camera",
      "Make a fist around your thumb on each hand",
      "One arm goes over the shoulder, elbow high, fist behind the neck; the other arm comes up the back, palm out, fist as high as it can go",
    ],
    steps: [
      "In one smooth motion, reach both fists toward each other behind your back",
      "Hold the position so the camera can measure the fist-to-fist distance",
      "Return to start, then repeat with the other arm on top",
    ],
    mistakes: [
      "Walking the hands together after the initial reach (must be one motion)",
      "Twisting the torso to close the gap",
      "Sharp pain in either shoulder — stop and report it",
    ],
    reps: "1 rep each side",
    libraryQuery: "shoulder mobility reach",
    scoring: {
      "3": "Fists finish within one hand-length of each other on both sides.",
      "2": "Fists finish within 1.5 hand-lengths on both sides.",
      "1": "Gap greater than 1.5 hand-lengths on either side.",
      "0": "Any shoulder pain during the reach (clearing test — forces a 0).",
    },
  },
  hip_abd: {
    id: "hip_abd", name: "Active Straight-Leg Raise",
    what: "Lie on your back and raise one straight leg as high as it will go, keeping the other leg flat.",
    why: "Isolates hamstring / posterior-chain flexibility of the moving leg AND the ability of the opposite leg to stay in extension.",
    setup: [
      "Lie flat on your back, arms flat at your sides with palms up",
      "Legs straight, toes pointing up",
      "Position sideways to the camera so it sees the full body profile",
    ],
    steps: [
      "Keeping the leg straight and the opposite leg flat on the floor, raise one leg as high as you can",
      "Ankle of the raised leg should reach at least the level of the down-leg mid-thigh",
      "Lower under control and switch sides",
    ],
    mistakes: [
      "Bending the moving-leg knee",
      "The down leg lifting or rotating out",
      "The pelvis rocking to help the lift",
    ],
    reps: "Up to 3 slow reps each leg",
    libraryQuery: "active straight leg raise",
    scoring: {
      "3": "Moving-leg ankle reaches above the mid-thigh of the down leg with the down leg staying flat.",
      "2": "Moving-leg ankle reaches between mid-thigh and knee-joint line of the down leg.",
      "1": "Moving-leg ankle stays below the knee-joint line of the down leg.",
      "0": "Any pain in the hip, low back or hamstring during the raise.",
    },
  },
};
