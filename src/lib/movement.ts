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
    { view: "front", label: "Front view", cue: "Now face the camera straight on.", detects: ["lateral trunk shift", "pelvic asymmetry"] },
  ],
  balance: [
    { view: "front", label: "Front view", cue: "Face the camera, hurdle set at your shin height, dowel across your shoulders.", detects: ["pelvis staying level", "L/R stance leg asymmetry"] },
    { view: "side",  label: "Side view",  cue: "Now stand sideways so we can see the stepping leg clear the hurdle.", detects: ["forward trunk lean", "hip flexion range", "loss of stance-leg alignment"] },
  ],
  lunge: [
    { view: "side",  label: "Side view",  cue: "Stand sideways with both feet in line on a 2×6 board. Dowel behind your back (head, spine, tailbone touching).", detects: ["front knee tracks over foot", "back knee touches the board behind the front heel", "trunk stays upright"] },
    { view: "front", label: "Front view", cue: "Now face the camera on the board and repeat, then switch legs.", detects: ["loss of balance", "torso rotation", "front-knee drift"] },
  ],
  overhead: [
    { view: "front", label: "Front view", cue: "Face the camera. Make a fist around your thumb on each hand.", detects: ["fist-to-fist distance (target: within one hand length)", "L/R shoulder symmetry"] },
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
    { view: "side",  label: "Side view",  cue: "Lie on your back with the camera on your side. Arms flat, legs straight, toes up.", detects: ["moving-leg ankle height vs. mid-thigh of the down leg", "opposite-leg staying flat", "loss of neutral pelvis"] },
  ],
  bridge_hold: [
    { view: "side",  label: "Side view",  cue: "Get face-down with hands under your shoulders (men: thumbs at forehead; women: thumbs at chin). Feet together.", detects: ["body rises as one unit — no lag in the hips", "chest/knees leave the floor together", "no lower-back sagging"] },
  ],
  rotary_stability: [
    { view: "side",  label: "Side view",  cue: "Get on all fours over a 2×6 board with your knees under your hips and hands under your shoulders. Extend your same-side arm and leg.", detects: ["arm and leg extend in line with the torso", "touch elbow to knee over the board", "no loss of balance"] },
  ],
  sl_balance: [
    { view: "front", label: "Front view", cue: "Face the camera, arms crossed on your chest, feet under your hips. Lift one foot just off the floor and hold.",
      detects: ["pelvic drop on the lifted side", "trunk lateral lean", "stance-knee wobble"] },
    { view: "side",  label: "Side view",  cue: "Now turn sideways so your full profile is visible. Same leg lifted, same 10-second hold.",
      detects: ["forward trunk pitch (>20° from vertical)", "hip flexion substitution"] },
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
  { id: "balance",          name: "Hurdle Step",                focus: ["stability", "balance"], duration: 10 },
  { id: "lunge",            name: "In-line Lunge",              focus: ["mobility", "stability"], duration: 10 },
  { id: "overhead",         name: "Shoulder Mobility",          focus: ["mobility"],              duration: 10 },
  { id: "hip_abd",          name: "Active Straight-Leg Raise",  focus: ["mobility"],              duration: 10 },
  { id: "bridge_hold",      name: "Trunk Stability Push-Up",    focus: ["stability"],             duration: 10 },
  { id: "rotary_stability", name: "Rotary Stability",           focus: ["stability", "quality"],  duration: 10 },
  { id: "sl_balance",       name: "Single-Leg Balance",         focus: ["balance", "stability"], duration: 10 },
] as const;

/** Tests that surface a "Did you feel pain during that pattern?" prompt.
 *  Pain forces the pattern to score 0 (marked invalid + excluded from sub-scores). */
export const CLEARING_TESTS = new Set(["overhead", "bridge_hold", "rotary_stability"]);

/**
 * Tests that must be captured and scored per side (right, then left).
 * Final test score = the lower of the two side scores. A side-to-side
 * difference > 1 point flags the test as asymmetric on the results screen.
 * Non-bilateral tests (Deep Squat, Hip Hinge, Trunk Stability Push-Up) run
 * as a single movement with the sides moving together.
 */
export const BILATERAL_TESTS = new Set([
  "balance",           // Hurdle Step
  "lunge",             // In-line Lunge
  "overhead",          // Shoulder Mobility
  "hip_abd",           // Active Straight-Leg Raise
  "rotary_stability",  // Rotary Stability
  "sl_balance",        // Single-Leg Balance
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
  // Per-test contribution map. Each test only contributes to the dimensions
  // it can actually measure from the camera. Strength was removed — a
  // camera movement screen cannot measure strength capacity.
  //
  //   Mobility  ← hip hinge + overhead + ankle_df (if run) + lunge
  //   Stability ← single-leg balance + lunge (knee tracking) + hip_abd (if run)
  //   Balance   ← single-leg balance (both sides)
  //   Quality   ← squat, hip hinge, overhead (compensation-adjusted scores)
  const focusMap: Record<string, Array<"mobility" | "stability" | "balance" | "quality">> = {
    // Per spec: Mobility ← Squat + Hinge + Shoulder Mobility + Active SLR.
    // Stability ← Single-Leg Balance + Trunk Stability + Rotary Stability.
    // Balance ← Single-Leg Balance. Quality ← composite of squat/hinge/overhead.
    squat:       ["mobility", "quality"],
    hinge:       ["mobility", "quality"],
    balance:     ["balance", "stability"],
    lunge:       ["mobility", "stability"],
    overhead:    ["mobility", "quality"],
    ankle_df:    ["mobility"],
    knee_sld:    ["stability"],
    hip_abd:     ["mobility"],
    bridge_hold: ["stability"],
    rotary_stability: ["stability", "quality"],
    sl_balance:  ["balance", "stability"],
    wall_slide:  ["mobility"],
    elbow_rom:   ["mobility"],
    wrist_rom:   [],
  };
  const buckets = {
    mobility: [] as number[],
    stability: [] as number[],
    balance: [] as number[],
    quality: [] as number[],
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
  const valid = results.filter(r => r.valid !== false);
  // score 3 → 100, score 2 → 67, score 1 → 33, score 0 (pain) → 0 with cap.
  const scoreToPct = (s: 0 | 1 | 2 | 3) => (s === 3 ? 100 : s === 2 ? 67 : s === 1 ? 33 : 0);
  for (const r of valid) {
    const pct = scoreToPct(r.score);
    for (const f of focusMap[r.id] ?? []) {
      buckets[f].push(pct);
      if (r.score === 0) painInBucket[f] = true;
    }
  }
  // MIN_CONTRIBUTORS = 1: a single test IS enough for a sub-score. If nothing
  // contributed, the sub-score is marked as -1 ("Insufficient data"). This
  // matches the spec: never show a fake number when we don't have data.
  const avgOrInsufficient = (a: number[]) =>
    a.length >= 1 ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : -1;
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
  balance: {
    id: "balance", name: "Hurdle Step",
    what: "Step one leg over a shin-height hurdle (or string) and touch the heel down on the other side, without losing your posture.",
    why: "Tests single-leg stability, stride mechanics and hip mobility while a dowel keeps your posture honest.",
    setup: [
      "Set a hurdle (or a string between two chairs) at the height of your tibial tuberosity (just below the knee)",
      "Stand right behind it with your feet together",
      "Rest a dowel across your shoulders, held in place with both hands",
    ],
    steps: [
      "Slowly raise one leg and step over the hurdle — heel first",
      "Lightly touch the heel to the floor on the other side without shifting your weight",
      "Return the leg to the start position under control",
      "Repeat on the other side",
    ],
    mistakes: [
      "Loss of balance during the step",
      "Stance-leg hip or knee collapsing inward",
      "Trunk leaning or twisting to clear the hurdle",
      "Dowel tilting off horizontal",
    ],
    reps: "Up to 3 slow reps each leg",
    libraryQuery: "hurdle step",
    scoring: {
      "3": "Hips, knees and ankles stay aligned. Minimal trunk motion. Dowel and hurdle stay level.",
      "2": "Movement completes but with visible alignment loss (knee/hip drift, trunk tilt, dowel tilt).",
      "1": "Contact between the foot and the hurdle, loss of balance, or the step can't be completed.",
      "0": "Any pain during the step.",
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
  bridge_hold: {
    id: "bridge_hold", name: "Trunk Stability Push-Up",
    what: "From a strict narrow-hand push-up position, press up so the whole body leaves the floor as a single rigid unit.",
    why: "Tests whether your trunk can transfer force between the upper and lower body without the hips sagging or lagging.",
    setup: [
      "Lie face-down. Feet together, toes tucked",
      "Hands under your shoulders — men: thumbs at forehead line; women: thumbs at chin line",
      "Knees off the floor, body in one long line",
      "Camera on your side to catch a sagging low back",
    ],
    steps: [
      "Press up so your body rises as one solid piece — chest and knees leave the floor at the same instant",
      "Hold the top for a beat, lower under control",
      "Report if you feel any lower-back or shoulder pain — that clears this pattern to zero",
    ],
    mistakes: [
      "Hips lifting first (or last) — body must move as one unit",
      "Lower back sagging",
      "Chest coming up while knees stay on the floor",
    ],
    reps: "1 clean rep",
    libraryQuery: "push up",
    scoring: {
      "3": "One clean rep from the men's / women's starting hand position — body rises as one rigid unit, no lag, no sag.",
      "2": "One clean rep from the easier (chin / clavicle) hand position — same rigid form required.",
      "1": "Cannot perform a rep in the correct form (hips lag, back sags, or chest/knees leave at different times).",
      "0": "Any pain in the low back, shoulders or wrists during the push-up (clearing test — forces a 0).",
    },
  },
  rotary_stability: {
    id: "rotary_stability", name: "Rotary Stability",
    what: "On all-fours, extend the same-side arm and leg, then bring elbow to knee over a narrow line — without losing balance.",
    why: "Screens multi-plane trunk stability: whether the core can coordinate an arm and a leg on the same side over a narrow base.",
    setup: [
      "Get on all fours over a narrow board or taped line",
      "Hands directly under shoulders, knees directly under hips",
      "Toes tucked so they can push the floor",
    ],
    steps: [
      "Extend the right arm straight forward and the right leg straight back — both in line with the torso, over the board",
      "In one motion, bring the right elbow to the right knee directly over the board",
      "Extend back out, then return to all fours",
      "Repeat on the left side",
      "Report if any pain shows up during the movement — that clears this pattern to zero",
    ],
    mistakes: [
      "Losing balance / dropping off the board",
      "Arm and leg not staying in line with the torso",
      "Elbow and knee not touching over the board",
    ],
    reps: "1 clean rep each side",
    libraryQuery: "bird dog",
    scoring: {
      "3": "Unilateral (same-side arm + leg) rep: elbow touches knee over the board with no loss of balance, on both sides.",
      "2": "Diagonal (opposite-side arm + leg) rep: elbow touches knee over the board with no loss of balance, on both sides.",
      "1": "Cannot perform a diagonal rep, or loses balance during the movement.",
      "0": "Any pain in the low back, hips or shoulders during the pattern (clearing test — forces a 0).",
    },
  },
  sl_balance: {
    id: "sl_balance", name: "Single-Leg Balance",
    what: "Stand on one leg for 10 seconds without pelvic drop, trunk lean, or knee wobble. Test both sides.",
    why: "Single-leg stance exposes hip stability, ankle strategy and postural control — the base of every gait, sport and injury-prevention program.",
    setup: [
      "Face the camera, arms folded across your chest",
      "Feet under your hips, look straight ahead at a fixed point",
      "Rear the room so your full body is visible in the frame",
    ],
    steps: [
      "Lift one foot just off the floor (knee softly bent)",
      "Hold for 10 seconds without touching down or shifting your weight",
      "Return under control, then repeat on the other leg",
      "Turn sideways and repeat both legs — the side view catches forward trunk pitch",
    ],
    mistakes: [
      "Pelvis drops on the lifted side (>5° = compensation)",
      "Trunk leans to the side or pitches forward (>20°)",
      "Stance knee wobbles or foot has to touch down",
    ],
    reps: "10-second hold each leg · both views",
    libraryQuery: "single leg balance",
    scoring: {
      "3": "Full 10-second hold, pelvis level within 5°, trunk stays upright.",
      "2": "Holds but with pelvic drop 5–10°, trunk lean, or visible knee wobble.",
      "1": "Balance lost before 10 s, or pelvic drop over 10°.",
      "0": "Any pain in the stance-leg hip, knee or ankle during the hold.",
    },
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
