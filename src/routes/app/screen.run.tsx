import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPoseLandmarker, maybeFallbackToLite, PL } from "@/lib/pose";
import { angle, CORE_TESTS, CONDITIONAL_TESTS, CLEARING_TESTS, BILATERAL_TESTS, computeSession, TEST_GUIDES, TEST_VIEWS } from "@/lib/movement";
import squatImg from "@/assets/fms/squat.png.asset.json";
import hingeImg from "@/assets/fms/hinge.jpg.asset.json";
import balanceImg from "@/assets/fms/balance.png.asset.json";
import lungeImg from "@/assets/fms/lunge.png.asset.json";
import overheadImg from "@/assets/fms/overhead.png.asset.json";
import hipAbdImg from "@/assets/fms/hip_abd.png.asset.json";
import bridgeHoldImg from "@/assets/fms/bridge_hold.png.asset.json";
import rotaryImg from "@/assets/fms/rotary_stability.png.asset.json";

const DEMO_IMAGES: Record<string, string> = {
  squat: squatImg.url,
  hinge: hingeImg.url,
  balance: balanceImg.url,
  lunge: lungeImg.url,
  overhead: overheadImg.url,
  hip_abd: hipAbdImg.url,
  bridge_hold: bridgeHoldImg.url,
  rotary_stability: rotaryImg.url,
  sl_balance: balanceImg.url,
};
import { updateUser, useUser, type Joint, type TestResult } from "@/lib/store";
import { consumeScanCredit } from "@/lib/scans.functions";
import { ChevronLeft, Camera, CheckCircle2, AlertTriangle, AlertCircle, SkipForward, BookOpen, RotateCcw, Pause, Play, X, RotateCw, MoveHorizontal, ShieldAlert, HeartPulse } from "lucide-react";
import { TestPreviewSheet } from "@/components/TestPreviewSheet";

export const Route = createFileRoute("/app/screen/run")({
  ssr: false,
  component: Runner,
});

type TestDef = { id: string; name: string; duration: number; instruction: string; conditional?: boolean; cameraView: "front" | "side" };

// A single scan "step" = one camera view of one test. Tests with two views
// produce two consecutive steps that share the same `groupId`.
type Step = {
  key: string;               // stable per-step id (`${groupId}:${viewIndex}`)
  groupId: string;           // = testId, shared across a test's views
  testId: string;
  name: string;              // display name (test name)
  duration: number;
  cameraView: "front" | "side";
  viewIndex: number;         // 0-based
  totalViews: number;        // >=1
  viewLabel: string;         // e.g. "Side view"
  viewCue: string;           // reposition hint
  /**
   * "both" for tests that move both sides together (Deep Squat, Hip Hinge,
   * Trunk Stability Push-Up). "right" / "left" for bilateral tests where
   * each side is captured and scored separately.
   */
  side: "both" | "right" | "left";
  /** Human copy for which side/limb to use — empty for "both". */
  sideLabel: string;
  /** 1-based position across the entire scan sequence (for "Recording X of Y"). */
  stepIndex: number;
  /** Total number of recordings in the scan (all tests × sides × views). */
  totalSteps: number;
  conditional?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// REFERENCE_RANGES — v1 founder-supplied thresholds based on standard movement
// screening norms. Single source of truth; revisit once we have real user data.
// All angles are joint angles in degrees as produced by `angle()` from
// movement.ts (180° = straight limb / fully extended). Where the reference is
// phrased as a clinical angle from vertical or as "X° of flexion", the
// conversion to the joint-angle convention is noted inline.
// ─────────────────────────────────────────────────────────────────────────────
const REFERENCE_RANGES = {
  // Min knee joint angle reached during squat descent.
  // Pass ≤100° (≥parallel), borderline 100–120°, fail >120°.
  squat: { passMax: 100, borderlineMax: 120 },

  // Min trunk joint angle (shoulder-hip-knee) at bottom of hinge.
  // Forward-lean from vertical = 180 − joint angle.
  // Pass lean 40–60° → joint 120–140°. Borderline lean 25–40 or 60–75
  // → joint 105–120 or 140–155. Fail lean <25 or >75 → joint <105 or >155.
  hinge: { passJointMin: 120, passJointMax: 140, borderlineJointMin: 105, borderlineJointMax: 155 },

  // Max pelvic-drop angle (deg) observed during the 10s single-leg hold.
  // Pass <5°, borderline 5–10°, fail >10° or balance lost.
  balance: { passMaxDrop: 5, borderlineMaxDrop: 10 },

  // Min front-knee joint angle at bottom of lunge.
  // Pass 80–100°, borderline 100–120°, fail >120° or medial collapse.
  lunge: { passMin: 80, passMax: 100, borderlineMax: 120 },

  // Max shoulder joint angle (hip-shoulder-elbow) reached overhead.
  // Pass ≥160° without lumbar arch, borderline 140–160°, fail <140°
  // or full range only with lumbar compensation.
  overhead: { passMin: 160, borderlineMin: 140 },

  // Ankle dorsiflexion measured as joint angle between tibia (knee→ankle)
  // and ground-horizontal. Tibia-from-vertical lean = 90 − measured.
  // Pass DF ≥35° → measured ≤55°. Borderline 25–35° → 55–65°.
  // Fail <25° → >65°.
  ankle_df: { passMaxMeasured: 55, borderlineMaxMeasured: 65 },

  // Max hip abduction angle (leg-from-vertical) before compensation.
  // Pass 30–45° clean, borderline 20–30° or compensation 30–45°,
  // fail <20° or early compensation.
  hip_abd: { passMin: 30, passMax: 45, borderlineMin: 20 },

  // Glute bridge: target 30–45s hold at neutral hips. Our scan window is 10s
  // so this is a proxy — hip-y stability and absence of mid-window sag.
  // TODO: extend test duration to a true endurance timer before publishing v2.
  bridge_hold: { passMaxSway: 0.012, borderlineMaxSway: 0.025, sagDeltaFail: 0.04 },

  // Wall slide max arm elevation (hip-shoulder-elbow joint angle) with wall
  // contact maintained. Pass ≥150°, borderline 120–150°, fail <120°.
  wall_slide: { passMin: 150, borderlineMin: 120 },

  // Elbow active flexion-extension range. Need ≥135° of total ROM and full
  // extension within 5° of straight (joint ≥175°). Borderline range ≥110°.
  elbow_rom: { passRange: 135, passExtension: 175, borderlineRange: 110, borderlineExtension: 165 },

  // Knee single-leg step-down — uses the same min-knee thresholds as lunge.
  knee_sld: { passMin: 80, passMax: 100, borderlineMax: 120 },

  // Rotary Stability — placeholder v1 scoring. The user will supply the
  // final scoring rules; until then we accept the movement as clean if the
  // camera sees enough valid frames with meaningful motion. No angle-based
  // thresholds are asserted here on purpose.
  //
  // Rotary Stability — v2 scoring using shoulder-hip torso stability, arm/leg
  // reach coverage (both wrists extended forward beyond the shoulders in the
  // window), and wrist-to-knee proximity as a proxy for the elbow-to-knee
  // touch (elbow landmark isn't in the tracked set for this test).
  //
  //   wobble   — max std of the shoulder-hip midpoint over the window.
  //              Above ~0.04 (~4% of frame height) = balance lost.
  //   reachThr — a wrist counts as "reached" once its x-distance from body
  //              midline exceeds shoulder-width (~0.15 in normalised coords).
  //   touchThr — min normalised wrist↔knee distance ≤ 0.10 counts as an
  //              elbow-to-knee touch attempt.
  rotary_stability: {
    wobbleFail: 0.055,
    wobbleBorderline: 0.035,
    reachThresh: 0.12,
    touchThresh: 0.11,
  },
} as const;

const VISIBILITY_THRESHOLD = 0.6;
const SMOOTH_WINDOW = 5;
const MIN_VALID_FRAME_RATIO = 0.7;

const TEST_CAMERA_VIEW: Record<string, "front" | "side"> = {
  squat: "side",
  hinge: "side",
  balance: "front",
  lunge: "side",
  overhead: "front",
  ankle_df: "side",
  knee_sld: "front",
  hip_abd: "side",
  bridge_hold: "side",
  rotary_stability: "side",
  sl_balance: "front",
  wall_slide: "side",
  elbow_rom: "front",
};

// Big, from-across-the-room rep prompts. Shown as the primary instruction
// on the intro screen AND overlaid on the live camera so the user knows
// exactly what to do without walking back to read small text.
const REP_PROMPT: Record<string, string> = {
  squat:            "Overhead squat — up to 3 slow reps",
  hinge:            "Give me 3 slow hip hinges",
  balance:          "Hurdle step — up to 3 slow reps each leg",
  lunge:            "In-line lunge — up to 3 slow reps each leg",
  overhead:         "Reach one fist over, the other up the back — both sides",
  ankle_df:         "3 slow knee-to-wall reps each side",
  knee_sld:         "3 slow step-downs each leg",
  hip_abd:          "Straight-leg raise — up to 3 slow reps each leg",
  bridge_hold:      "1 strict trunk-stability push-up",
  rotary_stability: "Same-side arm + leg extend, then elbow to knee — each side",
  sl_balance:       "Stand on one leg — 10-second hold each side",
  wall_slide:       "3 slow wall slides",
  elbow_rom:        "3 full bend + straighten reps",
  wrist_rom:        "3 slow wrist flex + extend reps",
};

// Landmarks required for a frame to count toward the score of each test.
const TEST_LANDMARKS: Record<string, number[]> = {
  squat:       [PL.LEFT_SHOULDER, PL.RIGHT_SHOULDER, PL.LEFT_HIP, PL.RIGHT_HIP, PL.LEFT_KNEE, PL.RIGHT_KNEE, PL.LEFT_ANKLE, PL.RIGHT_ANKLE],
  hinge:       [PL.NOSE, PL.LEFT_SHOULDER, PL.RIGHT_SHOULDER, PL.LEFT_HIP, PL.RIGHT_HIP, PL.LEFT_KNEE, PL.RIGHT_KNEE, PL.LEFT_ANKLE, PL.RIGHT_ANKLE],
  balance:     [PL.LEFT_HIP, PL.RIGHT_HIP, PL.LEFT_SHOULDER, PL.RIGHT_SHOULDER],
  lunge:       [PL.LEFT_SHOULDER, PL.RIGHT_SHOULDER, PL.LEFT_HIP, PL.RIGHT_HIP, PL.LEFT_KNEE, PL.RIGHT_KNEE, PL.LEFT_ANKLE, PL.RIGHT_ANKLE],
  overhead:    [PL.LEFT_EAR, PL.RIGHT_EAR, PL.LEFT_SHOULDER, PL.LEFT_ELBOW, PL.LEFT_HIP, PL.RIGHT_SHOULDER, PL.RIGHT_ELBOW, PL.RIGHT_HIP],
  ankle_df:    [PL.LEFT_KNEE, PL.LEFT_ANKLE, PL.RIGHT_KNEE, PL.RIGHT_ANKLE],
  knee_sld:    [PL.LEFT_SHOULDER, PL.RIGHT_SHOULDER, PL.LEFT_HIP, PL.RIGHT_HIP, PL.LEFT_KNEE, PL.RIGHT_KNEE, PL.LEFT_ANKLE, PL.RIGHT_ANKLE],
  hip_abd:     [PL.LEFT_HIP, PL.RIGHT_HIP, PL.LEFT_KNEE, PL.RIGHT_KNEE, PL.LEFT_SHOULDER, PL.RIGHT_SHOULDER],
  bridge_hold: [PL.LEFT_HIP, PL.RIGHT_HIP, PL.LEFT_SHOULDER, PL.RIGHT_SHOULDER, PL.LEFT_KNEE, PL.RIGHT_KNEE],
  rotary_stability: [PL.LEFT_SHOULDER, PL.RIGHT_SHOULDER, PL.LEFT_HIP, PL.RIGHT_HIP, PL.LEFT_KNEE, PL.RIGHT_KNEE, PL.LEFT_WRIST, PL.RIGHT_WRIST],
  sl_balance:  [PL.LEFT_SHOULDER, PL.RIGHT_SHOULDER, PL.LEFT_HIP, PL.RIGHT_HIP, PL.LEFT_KNEE, PL.RIGHT_KNEE, PL.LEFT_ANKLE, PL.RIGHT_ANKLE],
  wall_slide:  [PL.LEFT_EAR, PL.RIGHT_EAR, PL.LEFT_SHOULDER, PL.LEFT_ELBOW, PL.LEFT_HIP, PL.RIGHT_SHOULDER, PL.RIGHT_ELBOW, PL.RIGHT_HIP],
  elbow_rom:   [PL.LEFT_SHOULDER, PL.LEFT_ELBOW, PL.LEFT_WRIST, PL.RIGHT_SHOULDER, PL.RIGHT_ELBOW, PL.RIGHT_WRIST],
};

function expandToSteps(testId: string, name: string, duration: number, conditional?: boolean): Step[] {
  return _expandToSteps(testId, name, duration, conditional);
}

/**
 * Per-test, per-side copy for the intro card, running banner and rep
 * prompt. Only referenced for tests in BILATERAL_TESTS — non-bilateral
 * tests use their normal `REP_PROMPT` unchanged.
 */
const SIDE_COPY: Record<string, { right: { label: string; prompt: string }; left: { label: string; prompt: string } }> = {
  balance: {
    right: { label: "Right leg", prompt: "Step over with your RIGHT leg" },
    left:  { label: "Left leg",  prompt: "Step over with your LEFT leg"  },
  },
  lunge: {
    right: { label: "Right foot forward", prompt: "Lunge with the RIGHT foot forward" },
    left:  { label: "Left foot forward",  prompt: "Lunge with the LEFT foot forward"  },
  },
  overhead: {
    right: { label: "Right arm overhead", prompt: "RIGHT arm reaches over the top, LEFT arm reaches up from below" },
    left:  { label: "Left arm overhead",  prompt: "LEFT arm reaches over the top, RIGHT arm reaches up from below" },
  },
  hip_abd: {
    right: { label: "Right leg raise", prompt: "Raise your RIGHT leg — keep it straight" },
    left:  { label: "Left leg raise",  prompt: "Raise your LEFT leg — keep it straight"  },
  },
  rotary_stability: {
    right: { label: "Right arm + right leg", prompt: "Extend RIGHT arm and RIGHT leg, then elbow-to-knee" },
    left:  { label: "Left arm + left leg",   prompt: "Extend LEFT arm and LEFT leg, then elbow-to-knee"   },
  },
  sl_balance: {
    right: { label: "Balance right leg", prompt: "Balance on your RIGHT leg — 10-second hold" },
    left:  { label: "Balance left leg",  prompt: "Balance on your LEFT leg — 10-second hold"  },
  },
};

/**
 * Copy shown on the mandatory clearing-test gate that appears before the
 * three FMS clearing patterns. Each answer is Yes / No — pain = score 0
 * and the pattern is skipped; no pain = proceed to the normal intro.
 */
function clearingPrompt(testId: string): { intro: string; action: string; question: string } {
  switch (testId) {
    case "overhead":
      return {
        intro:
          "This checks that your shoulders can tolerate the overhead reach without pain before we score it.",
        action:
          "Stand tall. Press both palms together behind your back — one arm reaching over the top of your shoulder down your spine, the other reaching up from below.",
        question: "Do you feel any sharp pain or pinching in either shoulder?",
      };
    case "bridge_hold":
      return {
        intro:
          "This checks that your spine tolerates extension before we ask you to press up from the floor.",
        action:
          "Lie face down. Press your hands flat on the floor at shoulder level and push your upper body up like a cobra, keeping your hips on the floor.",
        question: "Do you feel any pain in your spine?",
      };
    case "rotary_stability":
      return {
        intro:
          "This checks that your spine tolerates flexion before we score the pattern.",
        action:
          "From hands and knees, slowly rock your hips back toward your heels (child's pose direction).",
        question: "Do you feel any pain in your spine?",
      };
    default:
      return {
        intro: "Quick safety check before this pattern.",
        action: "Follow the on-screen action.",
        question: "Any pain?",
      };
  }
}

function _expandToSteps(testId: string, name: string, duration: number, conditional?: boolean): Step[] {
  const views = TEST_VIEWS[testId];
  const resolvedViews =
    views && views.length > 0
      ? views
      : [{
          view: (TEST_CAMERA_VIEW[testId] ?? "front") as "front" | "side",
          label: (TEST_CAMERA_VIEW[testId] ?? "front") === "side" ? "Side view" : "Front view",
          cue: (TEST_CAMERA_VIEW[testId] ?? "front") === "side"
            ? "Stand sideways to the camera."
            : "Face the camera straight on.",
          detects: [] as string[],
        }];
  const isBilateral = BILATERAL_TESTS.has(testId);
  const sides: Array<"both" | "right" | "left"> = isBilateral ? ["right", "left"] : ["both"];
  const totalViews = sides.length * resolvedViews.length;
  const steps: Step[] = [];
  for (const side of sides) {
    for (const v of resolvedViews) {
      const sideLabel =
        side === "both" ? "" : (SIDE_COPY[testId]?.[side]?.label ?? (side === "right" ? "Right side" : "Left side"));
      steps.push({
        key: `${testId}:${side}:${v.view}`,
        groupId: testId,
        testId,
        name,
        duration,
        cameraView: v.view,
        viewIndex: steps.length,
        totalViews,
        viewLabel: v.label,
        viewCue: v.cue,
        side,
        sideLabel,
        stepIndex: 0,       // set by buildSequence
        totalSteps: 0,      // set by buildSequence
        conditional,
      });
    }
  }
  return steps;
}

function buildSequence(_joints: Joint[]): Step[] {
  // SmartyMove Scan is a fixed 9-pattern set — no joint-based branching.
  // Bilateral tests expand to right-then-left recordings. Total = 23 recordings.
  const raw = CORE_TESTS.flatMap(t => expandToSteps(t.id, t.name, t.duration));
  return raw.map((s, i) => ({ ...s, stepIndex: i + 1, totalSteps: raw.length }));
}

/**
 * Merge per-view / per-side step results for a single test into one
 * TestResult. For bilateral tests, right and left are scored independently
 * (min score across that side's views), and the final `score` is the lower
 * of the two sides — matching the spec that the weaker side sets the
 * program priority. Side-to-side gap > 1 point sets `asymmetryFlag`.
 */
function mergeStepResults(
  stepResults: Array<TestResult & { viewIndex: number; side: "both" | "right" | "left" }>,
): TestResult {
  const sorted = [...stepResults].sort((a, b) => a.viewIndex - b.viewIndex);
  const primary = sorted[0];

  const collapseSide = (arr: typeof stepResults) => {
    if (!arr.length) return null;
    const validArr = arr.filter(r => r.valid !== false);
    const src = validArr.length ? validArr : arr;
    const score = src.reduce<0 | 1 | 2 | 3>((m, r) => (r.score < m ? r.score : m) as 0 | 1 | 2 | 3, 3);
    const compensations = Array.from(new Set(src.flatMap(r => r.compensations ?? [])));
    return { score, valid: validArr.length > 0, compensations };
  };

  const right = collapseSide(sorted.filter(r => r.side === "right"));
  const left  = collapseSide(sorted.filter(r => r.side === "left"));
  const both  = collapseSide(sorted.filter(r => r.side === "both"));

  let finalScore: 0 | 1 | 2 | 3;
  let finalValid: boolean;
  let mergedComps: string[];
  let sideScores: TestResult["sideScores"];
  let asymmetryFlag = false;

  if (right || left) {
    // Bilateral — final = lower of the two sides.
    const scores = [right?.score, left?.score].filter((x): x is 0 | 1 | 2 | 3 => x != null);
    finalScore = (scores.length ? Math.min(...scores) : 1) as 0 | 1 | 2 | 3;
    finalValid = Boolean(right?.valid || left?.valid);
    mergedComps = Array.from(new Set([
      ...(right?.compensations ?? []),
      ...(left?.compensations ?? []),
    ]));
    sideScores = {
      right: right ? { score: right.score, valid: right.valid, compensations: right.compensations.length ? right.compensations : undefined } : undefined,
      left:  left  ? { score: left.score,  valid: left.valid,  compensations: left.compensations.length  ? left.compensations  : undefined } : undefined,
    };
    if (right && left) asymmetryFlag = Math.abs(right.score - left.score) > 1;
  } else {
    finalScore = (both?.score ?? 1) as 0 | 1 | 2 | 3;
    finalValid = Boolean(both?.valid);
    mergedComps = both?.compensations ?? [];
  }

  const notes = sorted
    .map(r => {
      const sideTag = r.side === "right" ? "R " : r.side === "left" ? "L " : "";
      const viewTag = r.cameraView === "side" ? "Side" : "Front";
      return `${sideTag}${viewTag}: ${r.notes ?? ""}`;
    })
    .filter(n => n.length > 8)
    .join(" · ");

  return {
    id: primary.id,
    name: primary.name,
    score: finalScore,
    valid: finalValid,
    metric: primary.metric,
    left: primary.left,
    right: primary.right,
    asymmetry: primary.asymmetry,
    cameraView: primary.cameraView,
    compensations: mergedComps.length ? mergedComps : undefined,
    frameValidRatio: primary.frameValidRatio,
    notes: notes || primary.notes,
    viewFindings: sorted.map(r => ({
      view: (r.cameraView ?? "front") as "front" | "side",
      score: r.score,
      valid: r.valid,
      metric: r.metric,
      compensations: r.compensations,
    })),
    sideScores,
    asymmetryFlag,
  };
}

function instructionFor(id: string): string {
  return TEST_GUIDES[id]?.what ?? "Follow the on-screen guide.";
}

function Runner() {
  const navigate = useNavigate();
  const u = useUser();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const latestLandmarksRef = useRef<any[] | null>(null);

  // Gate: the one-time pre-scan setup (tibial height + tape/hurdle/heel-lift
  // confirmations) is mandatory before the first scan and cannot be skipped.
  // Once completed we never ask again unless the user resets their profile.
  useEffect(() => {
    if (!u) return;
    if (!u.scanSetup?.tibialHeightCm) {
      navigate({ to: "/app/screen/setup", replace: true, search: { next: "/app/screen/run" } });
    }
  }, [u?.scanSetup?.tibialHeightCm]);

  const [phase, setPhase] = useState<"setup" | "intro" | "running" | "squat_retry" | "confirm" | "submitting" | "done" | "failed">("setup");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewedPrompt, setReviewedPrompt] = useState(false);
  const [pendingResults, setPendingResults] = useState<TestResult[] | null>(null);
  // Clearing-test pain gate: when the user reports pain during a clearing
  // test (Shoulder Mobility / Trunk Stability Push-Up / Rotary Stability),
  // the pattern is forced to score 0 (invalid, excluded from sub-scores)
  // and the scan continues so the paid credit still yields a full result.
  const [clearingPain, setClearingPain] = useState<Set<string>>(new Set());
  // Tests the user has explicitly cleared via the pre-test pain gate. A
  // clearing test cannot be captured until this Set contains its id.
  const [clearedTests, setClearedTests] = useState<Set<string>>(new Set());
  // Heel-elevated squat branching: if the standard Deep Squat scores 1
  // (cannot reach depth heels flat), we prompt for a heel-elevated retry.
  // Passing with heels up = score 2 and flags Ankle Mobility. Failing again
  // = keep score 1 (hip/general mobility). Recorded once per scan so a
  // subsequent user "re-do" of the squat can't retrigger the prompt.
  const squatRetryDecidedRef = useRef(false);
  const seq = useMemo(
    () => buildSequence(u?.questionnaire?.joints ?? []),
    [u?.questionnaire?.joints?.join("|")],
  );
  const [idx, setIdx] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [poseReady, setPoseReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const samplesRef = useRef<any[]>([]);
  const finishHandlerRef = useRef<((skipped?: boolean) => void) | null>(null);
  // Per-view step results buffered per test groupId until all its views
  // are captured, then merged into one TestResult and pushed into `results`.
  const stepResultsRef = useRef<Map<string, Array<TestResult & { viewIndex: number }>>>(new Map());
  const [paused, setPaused] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
  const pausedRef = useRef(false);
  const activeTestKeyRef = useRef<string | null>(null);
  useEffect(() => { pausedRef.current = paused || showInstructions; }, [paused, showInstructions]);

  // Detection-latency tracking so we can downgrade the model if the device
  // is too slow to keep up with the "full" landmarker.
  const frameTimesRef = useRef<number[]>([]);
  const fallbackCheckedRef = useRef(false);

  async function start() {
    setError(null);
    setStarting(true);
    setStatusMsg("Requesting camera permission...");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Your browser doesn't support camera access. Try Chrome or Safari.");
      }
      // No forced resolution — let the browser pick its native size so the
      // preview isn't aggressively cropped/zoomed on phones.
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStatusMsg("Loading pose detection model...");
      let lm = await getPoseLandmarker();
      setPoseReady(true);
      setStatusMsg("");
      setPhase("intro");
      const tick = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const v = videoRef.current; const c = canvasRef.current;
        if (v.readyState >= 2) {
          c.width = v.videoWidth; c.height = v.videoHeight;
          const ctx = c.getContext("2d")!;
          const t0 = performance.now();
          const res = lm.detectForVideo(v, t0);
          const dt = performance.now() - t0;
          // Track recent per-frame detection latency for adaptive model fallback.
          const buf = frameTimesRef.current;
          buf.push(dt);
          if (buf.length > 60) buf.shift();
          if (!fallbackCheckedRef.current && buf.length >= 30) {
            const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
            fallbackCheckedRef.current = true;
            void maybeFallbackToLite(avg).then(async (tier) => {
              if (tier === "lite") {
                lm = await getPoseLandmarker();
              }
            });
          }
          ctx.clearRect(0, 0, c.width, c.height);
          if (res.landmarks?.[0]) {
            const pts = res.landmarks[0];
            latestLandmarksRef.current = pts;
            ctx.strokeStyle = "rgba(116, 230, 220, 0.95)"; ctx.lineWidth = 4;
            const pairs: [number,number][] = [[11,13],[13,15],[12,14],[14,16],[11,12],[23,24],[11,23],[12,24],[23,25],[25,27],[24,26],[26,28]];
            for (const [a,b] of pairs) {
              const A = pts[a], B = pts[b]; if (!A || !B) continue;
              ctx.beginPath(); ctx.moveTo(A.x * c.width, A.y * c.height); ctx.lineTo(B.x * c.width, B.y * c.height); ctx.stroke();
            }
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            for (const p of pts) { ctx.beginPath(); ctx.arc(p.x * c.width, p.y * c.height, 3.5, 0, Math.PI*2); ctx.fill(); }
          } else { latestLandmarksRef.current = null; }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e: any) {
      const name = e?.name ?? "";
      let msg = e?.message ?? "Could not start camera.";
      if (name === "NotAllowedError") msg = "Camera permission was denied. Enable it in your browser settings and try again.";
      else if (name === "NotFoundError") msg = "No camera found on this device.";
      else if (name === "NotReadableError") msg = "Camera is in use by another app. Close it and try again.";
      setError(msg);
      setStatusMsg("");
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    const s = videoRef.current?.srcObject as MediaStream | null;
    s?.getTracks().forEach(t => t.stop());
  }, []);

  useEffect(() => {
    if (phase !== "running") return;
    const test = seq[idx]; if (!test) return;
    const activeKey = `${idx}:${restartKey}:${test.key}`;
    activeTestKeyRef.current = activeKey;
    samplesRef.current = [];
    setCountdown(0);
    setElapsed(0);
    setPaused(false);
    setShowInstructions(false);
    const sampleId = setInterval(() => {
      if (pausedRef.current) return;
      if (latestLandmarksRef.current) samplesRef.current.push(latestLandmarksRef.current);
    }, 100);
    let done = false;
    const finish = (skipped = false) => {
      if (done) return;
      if (activeTestKeyRef.current !== activeKey) return;
      done = true;
      clearInterval(tickId); clearInterval(sampleId);
      // Trim the first ~1s (walking into position after pressing Start) and
      // the last ~1.5s (walking back to press "I'm Done") so only the actual
      // reps are scored.
      const HEAD_TRIM_SAMPLES = 10; // 1.0s
      const TAIL_TRIM_SAMPLES = 15; // 1.5s
      const raw = samplesRef.current;
      const trimmed = skipped
        ? raw
        : raw.slice(HEAD_TRIM_SAMPLES, Math.max(HEAD_TRIM_SAMPLES, raw.length - TAIL_TRIM_SAMPLES));
      const scoredDuration = Math.max(1, Math.round(trimmed.length / 10));
      const scored: TestResult = skipped
        ? { id: test.testId, name: test.name, score: 1, notes: "Skipped", valid: false, cameraView: test.cameraView }
        : { ...scoreSamples(test.testId, trimmed, scoredDuration, test.cameraView), cameraView: test.cameraView };
      // Buffer per-view results; on the last view of the group, merge into
      // one TestResult and push to the top-level results.
      const bucket = stepResultsRef.current.get(test.groupId) ?? [];
      bucket.push({ ...scored, viewIndex: test.viewIndex });
      stepResultsRef.current.set(test.groupId, bucket);
      const isLastView = test.viewIndex + 1 >= test.totalViews;
      let mergedForFinalize: TestResult | null = null;
      let stallForSquatRetry = false;
      if (isLastView) {
        const merged = mergeStepResults(bucket);
        mergedForFinalize = merged;
        setResults(r => [...r, merged]);
        if (merged.id === "squat" && merged.score === 1 && !squatRetryDecidedRef.current) {
          stallForSquatRetry = true;
        }
      }
      setTimeout(() => {
        if (stallForSquatRetry) {
          setPhase("squat_retry");
          return;
        }
        if (idx + 1 >= seq.length) {
          const base = mergedForFinalize ? [...results, mergedForFinalize] : results;
          finalize(base);
        } else {
          // If the next step belongs to the same group, hop straight to
          // "reposition" (intro) so the user can rotate before the timer
          // restarts. `setPhase("intro")` triggers the intro card.
          setIdx(i => i + 1);
          setPhase("intro");
        }
      }, 400);
    };
    finishHandlerRef.current = finish;
    const tickId = setInterval(() => {
      if (activeTestKeyRef.current !== activeKey) return;
      if (pausedRef.current) return;
      setElapsed(e => e + 1);
      // Count UP as an elapsed-time indicator. The user presses "Done"
      // manually when they finish the movement — no auto-finish.
      setCountdown(c => c + 1);
    }, 1000);
    return () => { activeTestKeyRef.current = null; clearInterval(tickId); clearInterval(sampleId); finishHandlerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, restartKey]);

  async function finalize(allResults: TestResult[]) {
    if (!u) return;
    const validCount = allResults.filter(r => r.valid !== false).length;
    if (validCount < 3) {
      setPhase("failed");
      return;
    }
    // Ask the user to confirm before we spend their paid scan credit.
    setPendingResults(allResults);
    setPhase("confirm");
  }

  // Pain gating happens once in the onboarding questionnaire (see
  // `painAreas`). The in-scan pain gate was removed so a paid scan always
  // produces a full 8-pattern result — no wasted tokens.

  async function submitScan() {
    if (!u || !pendingResults) return;
    setPhase("submitting");
    // Consume one scan credit. Every scan costs exactly one credit.
    try {
      const res = await consumeScanCredit();
      if (!res.ok) {
        setPhase("failed");
        setTimeout(() => navigate({ to: "/pricing" }), 800);
        return;
      }
    } catch (e) {
      console.error("consumeScanCredit failed", e);
    }
    const joints = (u.questionnaire?.joints ?? []).filter(j => j !== "none") as Joint[];
    const session = computeSession(pendingResults, joints, u.age);
    // Stamp the goal at time of scan so the rescan engine can detect goal changes later.
    session.goalAtScan = u.goal;
    const wasReTest = u.sessions.length > 0;
    const nextRetest = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    updateUser(prev => ({
      ...prev,
      sessions: [...prev.sessions, session],
      firstRetestDone: prev.firstRetestDone || wasReTest,
      nextRetestDate: nextRetest,
      // Rescans keep the original programStartDate so the phase (Foundation → Build → Perform)
      // and progression continue evolving instead of resetting to week 0.
      // The 14-day training cycle resets so the user has a fresh calendar.
      programStartDate: wasReTest ? prev.programStartDate ?? new Date().toISOString() : new Date().toISOString(),
      programCompletedDays: [],
    }));
    setPhase("done");
    setTimeout(() => navigate({ to: "/app/progress" }), 1200);
  }

  function retryScan() {
    setPendingResults(null);
    setResults([]);
    stepResultsRef.current = new Map();
    setIdx(0);
    setPhase("intro");
  }

  /**
   * Heel-elevated squat branching. Fired from the `squat_retry` phase card
   * after a Deep Squat that scored 1 with heels flat. Success = the user
   * reached depth with the towel/book under their heels → upgrade to
   * score 2 with an "ankle mobility restriction" flag (Fix 6 diagnostic
   * branch). Failure = keep score 1 (hip/general mobility root cause).
   * The retry is only offered once per scan.
   */
  function resolveSquatRetry(success: boolean) {
    squatRetryDecidedRef.current = true;
    const updated: TestResult[] = success
      ? results.map((r) =>
          r.id === "squat"
            ? {
                ...r,
                score: 2 as 2,
                compensations: [
                  ...(r.compensations ?? []),
                  "Passed only with heels elevated — ankle mobility restriction is the root cause of the squat failure",
                ],
                notes: `${r.notes ?? ""}${r.notes ? " · " : ""}Heel-elevated retry succeeded — flagged for Ankle Mobility`,
              }
            : r,
        )
      : results;
    if (success) setResults(updated);
    if (idx + 1 >= seq.length) {
      finalize(updated);
    } else {
      setIdx((i) => i + 1);
      setPhase("intro");
    }
  }

  /**
   * Clearing-test pain gate. Called from the intro card before the pattern
   * runs. Records the test as score 0 / invalid (per FMS spec) and skips
   * ahead to the next group — no camera capture, no wasted rep.
   */
  function reportClearingPain() {
    const test = seq[idx];
    if (!test) return;
    if (!CLEARING_TESTS.has(test.testId)) return;
    setClearingPain(prev => new Set(prev).add(test.testId));
    const painResult: TestResult = {
      id: test.testId,
      name: test.name,
      score: 0,
      valid: false,
      cameraView: test.cameraView,
      compensations: ["Pain reported during clearing test — pattern scored 0 per FMS spec"],
      notes: "Pain reported during clearing test — pattern scored 0 (excluded from sub-scores). We recommend a medical assessment before loading this pattern.",
    };
    // Skip past every remaining view of this same group.
    let nextIdx = idx + 1;
    while (nextIdx < seq.length && seq[nextIdx].groupId === test.groupId) nextIdx++;
    stepResultsRef.current.delete(test.groupId);
    const nextResults = [...results, painResult];
    setResults(nextResults);
    if (nextIdx >= seq.length) {
      finalize(nextResults);
    } else {
      setIdx(nextIdx);
      setPhase("intro");
    }
  }

  // Group-level "test N of M" — the user thinks of the squat + its two views
  // as one test, not two.
  const groupIds = useMemo(() => {
    const seen: string[] = [];
    for (const s of seq) if (!seen.includes(s.groupId)) seen.push(s.groupId);
    return seen;
  }, [seq]);
  const cur = seq[idx];
  if (!u) return null;
  const progress = seq.length ? ((idx + (phase === "running" ? Math.min(1, countdown / (cur?.duration ?? 1)) : 0)) / seq.length) * 100 : 0;
  const groupIndex = cur ? groupIds.indexOf(cur.groupId) : -1;
  const groupCount = groupIds.length;
  const isReposition = !!cur && cur.viewIndex > 0;

  return (
    <div className="relative flex h-full min-h-[100dvh] flex-col bg-black text-white">
      <div className="relative flex-1 overflow-hidden bg-black">
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-contain [transform:scaleX(-1)]" />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-contain [transform:scaleX(-1)]" />
        {/* Big, from-across-the-room banner. Visible during running so the
            user knows what movement + which camera view without walking
            back to the phone to read small text. */}
        {phase === "running" && cur && !showInstructions && (
          <div className="pointer-events-none absolute inset-x-0 top-16 z-10 flex flex-col items-center gap-2 px-4 text-center">
            <div className="rounded-full bg-black/70 px-5 py-2 text-2xl font-black uppercase tracking-widest text-white shadow-2xl ring-2 ring-white/30 backdrop-blur">
              {cur.cameraView === "side" ? "◐ SIDE VIEW" : "● FACE THE CAMERA"}
            </div>
            <div className="rounded-2xl bg-white/95 px-4 py-1.5 text-lg font-extrabold text-foreground shadow-xl">
              {cur.name}
            </div>
            <div className="rounded-2xl brand-gradient px-5 py-2 text-2xl font-black text-primary-foreground shadow-2xl ring-2 ring-white/40">
              {REP_PROMPT[cur.testId] ?? "Perform the movement"}
            </div>
            <div className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/90 backdrop-blur">
              Then walk back and press "I'm Done"
            </div>
          </div>
        )}
        {phase === "setup" && (
          <svg viewBox="0 0 200 400" className="pointer-events-none absolute inset-0 m-auto h-[80%] w-auto opacity-30">
            <path d="M100 30 a18 18 0 1 1 0.1 0 M82 70 h36 v90 l-16 70 v100 l-10 30 M118 70 v90 l16 70 v100 l10 30 M82 80 l-30 70 M118 80 l30 70" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-3 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <button onClick={() => navigate({ to: "/app/screen" })} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full brand-gradient transition-[width]" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-widest opacity-80">
              {groupCount ? `Test ${Math.min(groupIndex + 1, groupCount)} of ${groupCount}` : ""}
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {phase === "setup" && (
            <div className="rounded-3xl bg-white/10 p-5 text-center backdrop-blur-xl">
              {!reviewedPrompt && !starting ? (
                <>
                  <BookOpen className="mx-auto mb-2 h-7 w-7" />
                  <div className="text-lg font-bold">Review the 8 patterns first?</div>
                  <p className="mt-1 text-sm opacity-85">
                    Each pattern has a reference photo and setup cues. Taking a minute to skim them makes for a cleaner scan.
                  </p>
                  <button
                    onClick={() => setReviewOpen(true)}
                    className="mt-4 h-12 w-full rounded-2xl brand-gradient text-base font-semibold"
                  >
                    Review the movements
                  </button>
                  <button
                    onClick={() => setReviewedPrompt(true)}
                    className="mt-2 h-11 w-full rounded-2xl bg-white/10 text-sm font-semibold"
                  >
                    Skip · I know the movements
                  </button>
                </>
              ) : (
                <>
                  <Camera className="mx-auto mb-2 h-7 w-7" />
                  <div className="text-lg font-bold">Position yourself in frame</div>
                  <p className="mt-1 text-sm opacity-85">Stand 6–8 feet back so your full body fits inside the silhouette guide.</p>
                  {error && <div className="mt-3 flex items-center gap-2 rounded-xl bg-destructive/30 p-2 text-xs"><AlertTriangle className="h-4 w-4" />{error}</div>}
                  <button onClick={start} disabled={starting} className="mt-4 h-12 w-full rounded-2xl brand-gradient text-base font-semibold disabled:opacity-60">
                    {starting ? (statusMsg || "Starting...") : "Enable camera"}
                  </button>
                  {starting && statusMsg && <p className="mt-2 text-[11px] opacity-70">{statusMsg}</p>}
                </>
              )}
            </div>
          )}
          {phase === "intro" && cur && (() => {
            const g = TEST_GUIDES[cur.testId];
            const needsClearingGate =
              CLEARING_TESTS.has(cur.testId) &&
              cur.viewIndex === 0 &&
              !clearedTests.has(cur.testId) &&
              !clearingPain.has(cur.testId);
            if (needsClearingGate) {
              return (
                <div className="max-h-[78vh] overflow-y-auto rounded-3xl bg-white/95 p-5 text-foreground shadow-2xl">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-warning">
                    <ShieldAlert className="h-4 w-4" /> Safety check · Clearing test
                  </div>
                  <h2 className="mt-1 text-xl font-extrabold">
                    Before {cur.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {clearingPrompt(cur.testId).intro}
                  </p>
                  <div className="mt-4 rounded-2xl bg-secondary/60 p-4">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      Try this now
                    </div>
                    <p className="mt-1 text-sm font-semibold leading-snug">
                      {clearingPrompt(cur.testId).action}
                    </p>
                  </div>
                  <p className="mt-4 text-base font-bold">
                    {clearingPrompt(cur.testId).question}
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <button
                      onClick={reportClearingPain}
                      className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-destructive bg-destructive/10 text-base font-bold text-destructive active:scale-[0.99]"
                    >
                      <HeartPulse className="h-5 w-5" /> Yes — I felt pain
                    </button>
                    <button
                      onClick={() => setClearedTests(prev => new Set(prev).add(cur.testId))}
                      className="flex h-14 items-center justify-center gap-2 rounded-2xl brand-gradient text-base font-bold text-primary-foreground active:scale-[0.99]"
                    >
                      <CheckCircle2 className="h-5 w-5" /> No pain — continue
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    If you said yes: this pattern is scored 0 and skipped. Please consult a doctor or physiotherapist before loading this movement.
                  </p>
                </div>
              );
            }
            return (
              <div className="max-h-[78vh] overflow-y-auto rounded-3xl bg-white/95 p-5 text-foreground shadow-2xl">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                  Test {groupIndex + 1} of {groupCount}
                  {cur.totalViews > 1 ? ` · View ${cur.viewIndex + 1} of ${cur.totalViews}` : ""}
                  {" · No timer — press Done when finished"}
                </div>
                <div className="mt-0.5 text-xl font-extrabold">
                  {isReposition ? `${cur.name} — reposition` : cur.name}
                </div>
                <div className="mt-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-90">
                    {cur.cameraView === "side" ? <RotateCw className="h-4 w-4" /> : <MoveHorizontal className="h-4 w-4" />}
                    Stand like this
                  </div>
                  <div className="mt-1 text-3xl font-black uppercase tracking-wide">
                    {cur.cameraView === "side" ? "Side to camera" : "Face the camera"}
                  </div>
                  <p className="mt-1 text-sm opacity-95">{cur.viewCue}</p>
                </div>
                <div className="mt-3 rounded-2xl border-2 border-primary bg-primary/5 p-4 text-foreground">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-primary">Your task</div>
                  <div className="mt-1 text-2xl font-black">{REP_PROMPT[cur.testId] ?? "Perform the movement"}</div>
                  <div className="mt-1 text-xs text-muted-foreground">When finished, walk back and press "I'm Done". Your walk back is not scored.</div>
                </div>
                {isReposition ? (
                  <div className="mt-4 rounded-2xl bg-secondary/50 p-3 text-sm text-foreground">
                    <div className="font-semibold">Same movement, new camera angle.</div>
                    <p className="mt-1 text-muted-foreground">
                      Rotate so the camera has a {cur.cameraView === "side" ? "clear side profile" : "clear front-on view"} of you, then repeat the movement. This second angle catches what the first angle can't see.
                    </p>
                  </div>
                ) : g && (
                  <>
                    {DEMO_IMAGES[cur.testId] && (
                      <div className="mt-4 overflow-hidden rounded-2xl bg-white ring-1 ring-border">
                        <img
                          src={DEMO_IMAGES[cur.testId]}
                          alt={`${cur.name} demonstration`}
                          className="mx-auto h-56 w-auto object-contain"
                        />
                        <div className="bg-secondary px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Reference position · {cur.name}
                        </div>
                      </div>
                    )}
                    <div className="mt-4">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Set up</div>
                      <ul className="mt-1 space-y-1 text-sm">
                        {g.setup.map((s, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{s}</li>)}
                      </ul>
                    </div>
                    <div className="mt-4">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Do this</div>
                      <ol className="mt-1 space-y-1 text-sm">
                        {g.steps.map((s, i) => <li key={i} className="flex gap-2"><span className="font-bold text-primary">{i + 1}.</span>{s}</li>)}
                      </ol>
                    </div>
                    {g.mistakes.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-warning"><AlertCircle className="h-3 w-3" />Common mistakes</div>
                        <ul className="mt-1 space-y-1 text-sm">
                          {g.mistakes.map((s, i) => <li key={i} className="flex gap-2"><span className="text-warning">×</span>{s}</li>)}
                        </ul>
                      </div>
                    )}
                  </>
                )}
                <div className="mt-5 flex gap-2">
                  <button onClick={() => navigate({ to: "/app/screen" })} className="h-12 flex-1 rounded-2xl bg-secondary text-sm font-semibold text-foreground">Exit</button>
                  <button
                    onClick={() => {
                      setPhase("running");
                    }}
                    disabled={!poseReady}
                    className="h-12 flex-[2] rounded-2xl brand-gradient text-base font-semibold text-primary-foreground disabled:opacity-50"
                  >{poseReady ? (isReposition ? "I'm repositioned · Start" : "I'm ready · Start") : "Loading…"}</button>
                </div>
                {CLEARING_TESTS.has(cur.testId) && !isReposition && clearedTests.has(cur.testId) && (
                  <div className="mt-3 rounded-2xl bg-success/10 p-3 text-xs text-foreground">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-success">
                      <CheckCircle2 className="h-3 w-3" /> Clearing check passed
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      You reported no pain during the pre-test. Continue with {cur.name}.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
          {phase === "done" && (
            <div className="rounded-3xl bg-success/30 p-5 text-center backdrop-blur-xl">
              <CheckCircle2 className="mx-auto h-8 w-8" />
              <div className="mt-1 text-lg font-bold">Screen complete</div>
              <p className="text-sm opacity-85">Crunching your scores...</p>
            </div>
          )}
          {phase === "squat_retry" && (
            <div className="max-h-[78vh] overflow-y-auto rounded-3xl bg-white/95 p-5 text-foreground shadow-2xl">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary">
                <RotateCcw className="h-4 w-4" /> Diagnostic retest · Heels elevated
              </div>
              <h2 className="mt-1 text-xl font-extrabold">Try the squat once more — with heels elevated</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your deep squat couldn't reach depth with heels flat. This retry tells us whether your ankles are the limit (score improves to 2) or your hips/general mobility are (stays at 1).
              </p>
              <ol className="mt-4 space-y-2 text-sm text-foreground/85">
                <li><strong>1.</strong> Place both heels on the rolled towel or book you set aside during setup (2–3 cm high).</li>
                <li><strong>2.</strong> Perform the deep squat again. Aim for hip crease at or below the knee.</li>
                <li><strong>3.</strong> Stand back up and answer below — no camera needed for this retest.</li>
              </ol>
              <p className="mt-4 text-base font-bold">Could you reach squat depth with your heels elevated?</p>
              <div className="mt-3 grid grid-cols-1 gap-2">
                <button
                  onClick={() => resolveSquatRetry(true)}
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl brand-gradient text-base font-bold text-primary-foreground active:scale-[0.99]"
                >
                  <CheckCircle2 className="h-5 w-5" /> Yes — I reached depth
                </button>
                <button
                  onClick={() => resolveSquatRetry(false)}
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-border bg-background text-base font-bold text-foreground active:scale-[0.99]"
                >
                  <X className="h-5 w-5" /> No — still couldn't reach depth
                </button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Yes = your program will prioritize <strong>Ankle Mobility</strong> work. No = the root cause is likely hip or general mobility — we'll target that instead.
              </p>
            </div>
          )}
          {(phase === "confirm" || phase === "submitting") && (
            <div className="rounded-3xl bg-white/10 p-5 text-center backdrop-blur-xl">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
              <div className="mt-2 text-lg font-bold">Ready to submit your scan?</div>
              <p className="mt-2 text-sm opacity-90 leading-relaxed">
                Submitting will use <strong>1 scan credit</strong> and lock in these results as your official Movement Screen. We'll build your personalized <strong>2-week training program</strong> from them.
                <br /><br />
                Once submitted this can't be undone — if you'd rather practice first, you can redo the scan without spending your credit.
              </p>
              <button
                onClick={submitScan}
                disabled={phase === "submitting"}
                className="mt-4 h-12 w-full rounded-2xl brand-gradient text-base font-bold text-white disabled:opacity-60"
              >
                {phase === "submitting" ? "Submitting…" : "Yes, submit my scan"}
              </button>
              <button
                onClick={retryScan}
                disabled={phase === "submitting"}
                className="mt-2 h-11 w-full rounded-2xl bg-white/10 text-sm font-semibold disabled:opacity-60"
              >
                Redo the scan (no credit used)
              </button>
            </div>
          )}
          {phase === "failed" && (
            <div className="rounded-3xl bg-destructive/30 p-5 text-center backdrop-blur-xl">
              <AlertTriangle className="mx-auto h-8 w-8" />
              <div className="mt-1 text-lg font-bold">We couldn't score your scan</div>
              <p className="mt-1 text-sm opacity-90">
                The camera didn't detect enough movement to give a reliable result. Stand 6–8 feet back so your full body is in frame, then actually perform each movement during the timer. Skipping or staying still will not produce a real score.
              </p>
              <button
                onClick={() => { setResults([]); stepResultsRef.current = new Map(); setIdx(0); setPhase("intro"); }}
                className="mt-4 h-12 w-full rounded-2xl brand-gradient text-base font-semibold"
              >
                Try again
              </button>
              <button
                onClick={() => navigate({ to: "/app/screen" })}
                className="mt-2 h-10 w-full rounded-2xl bg-white/10 text-sm font-semibold"
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>
      {phase === "running" && cur && (
        <div className="shrink-0 border-t border-white/10 bg-black p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-[720px] space-y-2">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
                  {paused || showInstructions ? "Paused" : "Recording"} · Test {groupIndex + 1}/{groupCount}{cur.totalViews > 1 ? ` · ${cur.viewLabel}` : ""}
                </div>
                <div className="truncate text-base font-extrabold text-white">{cur.name} · press Done when finished</div>
              </div>
              <div className="w-14 text-center text-3xl font-extrabold tabular-nums brand-text">{countdown}s</div>
              <button
                onClick={() => finishHandlerRef.current?.(false)}
                disabled={elapsed < 3}
                className="flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full brand-gradient px-5 text-base font-black text-primary-foreground disabled:opacity-40"
              >
                <CheckCircle2 className="h-5 w-5" /> I'm Done
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInstructions(true)}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/15 text-xs font-semibold text-white"
              >
                <BookOpen className="h-4 w-4" /> Instructions
              </button>
              <button
                onClick={() => setPaused(p => !p)}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/15 text-xs font-semibold text-white"
              >
                {paused ? <><Play className="h-4 w-4" /> Resume</> : <><Pause className="h-4 w-4" /> Pause</>}
              </button>
              <button
                onClick={() => setRestartKey(k => k + 1)}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/15 text-xs font-semibold text-white"
              >
                <RotateCcw className="h-4 w-4" /> Restart
              </button>
              <button
                onClick={() => finishHandlerRef.current?.(true)}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/15 text-xs font-semibold text-white"
              >
                <SkipForward className="h-4 w-4" /> Skip
              </button>
            </div>
          </div>
        </div>
      )}
      {phase === "running" && cur && showInstructions && (() => {
        const g = TEST_GUIDES[cur.testId];
        return (
          <div className="absolute inset-0 z-20 flex items-end bg-black/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto max-h-[80vh] w-full max-w-[720px] overflow-y-auto rounded-3xl bg-white/95 p-5 text-foreground shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">Test {groupIndex + 1} of {groupCount}{cur.totalViews > 1 ? ` · ${cur.viewLabel}` : ""} · Paused</div>
                  <div className="mt-0.5 text-xl font-extrabold">{cur.name}</div>
                </div>
                <button onClick={() => setShowInstructions(false)} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {g && (
                <>
                  <div className="mt-4">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Set up</div>
                    <ul className="mt-1 space-y-1 text-sm">
                      {g.setup.map((s, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{s}</li>)}
                    </ul>
                  </div>
                  <div className="mt-4">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Do this</div>
                    <ol className="mt-1 space-y-1 text-sm">
                      {g.steps.map((s, i) => <li key={i} className="flex gap-2"><span className="font-bold text-primary">{i + 1}.</span>{s}</li>)}
                    </ol>
                  </div>
                  {g.mistakes.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-warning"><AlertCircle className="h-3 w-3" />Common mistakes</div>
                      <ul className="mt-1 space-y-1 text-sm">
                        {g.mistakes.map((s, i) => <li key={i} className="flex gap-2"><span className="text-warning">×</span>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </>
              )}
              <button onClick={() => setShowInstructions(false)} className="mt-5 h-12 w-full rounded-2xl brand-gradient text-base font-semibold text-primary-foreground">
                Resume test
              </button>
            </div>
          </div>
        );
      })()}
      <TestPreviewSheet
        open={reviewOpen}
        onClose={() => { setReviewOpen(false); setReviewedPrompt(true); }}
        testIds={CORE_TESTS.map((t) => t.id)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring engine — fully deterministic, on-device geometry. No frames or
// landmarks ever leave the browser. No LLM / AI Gateway is consulted for
// scoring or "second opinion". All results below are reproducible from the
// captured pose samples + REFERENCE_RANGES above.
// ─────────────────────────────────────────────────────────────────────────────

type LM = { x: number; y: number; z?: number; visibility?: number };
type Frame = LM[];

function lookupName(testId: string): string {
  const map: Record<string, string> = {
    ...Object.fromEntries(CORE_TESTS.map(t => [t.id, t.name])),
    ...Object.fromEntries(Object.values(CONDITIONAL_TESTS).map(t => [t.id, t.name])),
  };
  return map[testId] ?? testId;
}

function frameValid(s: Frame, ids: number[]): boolean {
  for (const i of ids) {
    const p = s[i];
    if (!p) return false;
    if ((p.visibility ?? 1) < VISIBILITY_THRESHOLD) return false;
  }
  return true;
}

/**
 * Apply a centered moving-average (window = SMOOTH_WINDOW) to each requested
 * landmark across the time series. Reduces frame-to-frame jitter before any
 * geometric metric is derived.
 */
function smoothSamples(samples: Frame[], ids: number[]): Frame[] {
  const N = samples.length;
  if (N === 0) return samples;
  const W = Math.min(SMOOTH_WINDOW, N);
  const half = Math.floor(W / 2);
  const out: Frame[] = samples.map(s => s.slice());
  for (const i of ids) {
    for (let t = 0; t < N; t++) {
      const lo = Math.max(0, t - half);
      const hi = Math.min(N, t + half + 1);
      let sx = 0, sy = 0, sv = 0, n = 0;
      for (let k = lo; k < hi; k++) {
        const p = samples[k][i];
        if (!p) continue;
        sx += p.x; sy += p.y; sv += p.visibility ?? 1; n++;
      }
      if (n) out[t][i] = { x: sx / n, y: sy / n, visibility: sv / n };
    }
  }
  return out;
}

function notEnoughClearFrames(testId: string, name: string, ratio: number): TestResult {
  return {
    id: testId, name, score: 1, valid: false, frameValidRatio: ratio,
    notes: "Couldn't get a clear reading, let's retry this test",
  };
}

function bucketScoreMaxOrEqual(value: number, passMin: number, borderlineMin: number): 1 | 2 | 3 {
  if (value >= passMin) return 3;
  if (value >= borderlineMin) return 2;
  return 1;
}

function bucketScoreMaxOrLess(value: number, passMax: number, borderlineMax: number): 1 | 2 | 3 {
  if (value <= passMax) return 3;
  if (value <= borderlineMax) return 2;
  return 1;
}

function bucketScoreRange(value: number, passMin: number, passMax: number, borderlineMin: number, borderlineMax: number): 1 | 2 | 3 {
  if (value >= passMin && value <= passMax) return 3;
  if (value >= borderlineMin && value <= borderlineMax) return 2;
  return 1;
}

/**
 * Hip abduction angle (deg) for one side: angle between the hip→knee vector
 * and gravity-down. 0° = leg hangs straight under the hip; ~30° = abducted.
 * Image coords use y-down, so vertical-down vector is (0, +1).
 */
function abductionAngle(hip: LM, knee: LM): number {
  const dx = knee.x - hip.x;
  const dy = knee.y - hip.y;
  return Math.atan2(Math.abs(dx), Math.max(0.0001, dy)) * 180 / Math.PI;
}

/** Trunk lean from vertical in degrees (mid-shoulder to mid-hip vector). */
function trunkLeanAngle(s: Frame): number {
  const lS = s[PL.LEFT_SHOULDER], rS = s[PL.RIGHT_SHOULDER];
  const lH = s[PL.LEFT_HIP], rH = s[PL.RIGHT_HIP];
  if (!lS || !rS || !lH || !rH) return 0;
  const sx = (lS.x + rS.x) / 2, sy = (lS.y + rS.y) / 2;
  const hx = (lH.x + rH.x) / 2, hy = (lH.y + rH.y) / 2;
  const dx = sx - hx;
  const dy = sy - hy; // shoulders should be above hips → negative
  return Math.atan2(Math.abs(dx), Math.max(0.0001, Math.abs(dy))) * 180 / Math.PI;
}

function asym(a: number, b: number): number {
  return Math.round(Math.abs(a - b));
}

// ─────────────────────────────────────────────────────────────────────────────
// Compensation helpers — geometric checks layered on top of the primary metric
// per test. Each helper is documented inline. The scoring rule is two-step:
//   1. compute the primary metric and a provisional score
//   2. run the relevant compensation checks; if any fire, the score is capped
//      (Pass → Borderline) or fully invalidated, and a plain-language note is
//      attached to the result so the corrective program targets the real
//      issue, not the masked one.
// Foot arch collapse and toe rotation are intentionally NOT detected —
// MediaPipe body-pose landmarks aren't reliable for those (documented blind
// spot, not a bug).
// ─────────────────────────────────────────────────────────────────────────────

/** Cap a score so it never exceeds `max` (e.g. cap a Pass at Borderline). */
function cap(score: 1 | 2 | 3, max: 1 | 2 | 3): 1 | 2 | 3 {
  return (score > max ? max : score) as 1 | 2 | 3;
}

/** Average y of a landmark over the first `n` frames — the "rest" baseline. */
function baselineY(samples: Frame[], id: number, n = 5): number {
  const take = Math.min(n, samples.length);
  let sum = 0, count = 0;
  for (let i = 0; i < take; i++) {
    const p = samples[i][id];
    if (p) { sum += p.y; count++; }
  }
  return count ? sum / count : 0;
}

/** Fraction of frames where an ankle (heel proxy) rose above baseline by `eps`
 *  in normalized image-y. y is image-y-down → "rise" = current y < baseline. */
function heelRiseFraction(samples: Frame[], ankleId: number, eps = 0.02): number {
  const base = baselineY(samples, ankleId);
  if (!base) return 0;
  let rise = 0;
  for (const s of samples) {
    const p = s[ankleId];
    if (p && base - p.y > eps) rise++;
  }
  return rise / samples.length;
}

/** Angle (deg) of the line between two landmarks vs horizontal, in [0, 90]. */
function lineTiltAngle(a: LM, b: LM): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) return 0;
  return Math.abs(Math.atan2(dy, dx) * 180 / Math.PI);
}

/** Shoulder-line lateral tilt (deg) — for trunk-lean / lateral-tilt checks. */
function shoulderTilt(s: Frame): number {
  const a = lineTiltAngle(s[PL.LEFT_SHOULDER], s[PL.RIGHT_SHOULDER]);
  // Normalize so 0° = level (line is horizontal), >0 = tilted.
  return Math.min(a, 180 - a);
}

/** Hip-line lateral tilt (deg). Used for pelvic drop & hip-hike detection. */
function hipTilt(s: Frame): number {
  const a = lineTiltAngle(s[PL.LEFT_HIP], s[PL.RIGHT_HIP]);
  return Math.min(a, 180 - a);
}

/**
 * Spine-curve angle: angle(NOSE, midShoulder, midHip). With a neutral spine
 * these three points are roughly collinear → ~180°. Upper-back rounding
 * brings the head forward of the shoulder-hip line, dropping the angle.
 */
function spineCurveAngle(s: Frame): number {
  const nose = s[PL.NOSE];
  const mS: LM = { x: (s[PL.LEFT_SHOULDER].x + s[PL.RIGHT_SHOULDER].x) / 2, y: (s[PL.LEFT_SHOULDER].y + s[PL.RIGHT_SHOULDER].y) / 2 };
  const mH: LM = { x: (s[PL.LEFT_HIP].x + s[PL.RIGHT_HIP].x) / 2, y: (s[PL.LEFT_HIP].y + s[PL.RIGHT_HIP].y) / 2 };
  if (!nose) return 180;
  return angle(nose, mS, mH);
}

/**
 * Shoulder→ear vertical separation (normalized). Smaller = shoulder is closer
 * to the ear (shrugged up). Returns mean of both sides if both ears visible.
 */
function shoulderEarGap(s: Frame): number {
  const lE = s[PL.LEFT_EAR], rE = s[PL.RIGHT_EAR];
  const lS = s[PL.LEFT_SHOULDER], rS = s[PL.RIGHT_SHOULDER];
  const gaps: number[] = [];
  if (lE && lS) gaps.push(lS.y - lE.y);
  if (rE && rS) gaps.push(rS.y - rE.y);
  return gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
}

/** Std-dev of a landmark's x or y over the time series. */
function landmarkStd(samples: Frame[], id: number, axis: "x" | "y"): number {
  const vals = samples.map(s => s[id]?.[axis]).filter((v): v is number => typeof v === "number");
  if (vals.length < 2) return 0;
  const m = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.sqrt(vals.reduce((a, b) => a + (b - m) ** 2, 0) / vals.length);
}

function pointMotion(samples: Frame[], ids: number[]): number {
  let maxMotion = 0;
  for (const id of ids) {
    const xs = samples.map(s => s[id]?.x).filter((v): v is number => typeof v === "number");
    const ys = samples.map(s => s[id]?.y).filter((v): v is number => typeof v === "number");
    if (xs.length < 2 || ys.length < 2) continue;
    maxMotion = Math.max(maxMotion, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  }
  return maxMotion;
}

function needsMovementSignal(testId: string): boolean {
  return testId !== "balance" && testId !== "bridge_hold";
}

function notEnoughMovement(testId: string, name: string, ratio: number): TestResult {
  return {
    id: testId,
    name,
    score: 1,
    valid: false,
    frameValidRatio: ratio,
    notes: "The camera saw you, but it didn't detect enough of the movement to score this test. Retry with your full body visible and complete the reps before pressing I'm Done.",
  };
}

function secondaryViewResult(testId: string, name: string, samples: Frame[], validRatio: number, cameraView: "front" | "side"): TestResult {
  const comps: string[] = [];
  let score: 1 | 2 | 3 = 3;
  let metric: number | undefined;

  switch (testId) {
    case "squat":
    case "lunge":
    case "knee_sld": {
      let valgusLFrames = 0, valgusRFrames = 0, activeFrames = 0;
      for (const s of samples) {
        const la = angle(s[PL.LEFT_HIP], s[PL.LEFT_KNEE], s[PL.LEFT_ANKLE]);
        const ra = angle(s[PL.RIGHT_HIP], s[PL.RIGHT_KNEE], s[PL.RIGHT_ANKLE]);
        if (la < 160 || ra < 160) {
          activeFrames++;
          const midAnkleX = (s[PL.LEFT_ANKLE].x + s[PL.RIGHT_ANKLE].x) / 2;
          if (Math.sign(s[PL.LEFT_KNEE].x - midAnkleX) !== Math.sign(s[PL.LEFT_ANKLE].x - midAnkleX)) valgusLFrames++;
          if (Math.sign(s[PL.RIGHT_KNEE].x - midAnkleX) !== Math.sign(s[PL.RIGHT_ANKLE].x - midAnkleX)) valgusRFrames++;
        }
      }
      const valgusRatio = activeFrames ? Math.max(valgusLFrames, valgusRFrames) / activeFrames : 0;
      metric = Math.round(valgusRatio * 100);
      if (valgusRatio > 0.3) {
        comps.push("Knee drifted inward from the front view — range was paired with hip-control compensation");
        score = 2;
      }
      break;
    }
    case "ankle_df": {
      let valgusLFrames = 0, valgusRFrames = 0;
      for (const s of samples) {
        const midAnkleX = (s[PL.LEFT_ANKLE].x + s[PL.RIGHT_ANKLE].x) / 2;
        if (Math.sign(s[PL.LEFT_KNEE].x - midAnkleX) !== Math.sign(s[PL.LEFT_ANKLE].x - midAnkleX)) valgusLFrames++;
        if (Math.sign(s[PL.RIGHT_KNEE].x - midAnkleX) !== Math.sign(s[PL.RIGHT_ANKLE].x - midAnkleX)) valgusRFrames++;
      }
      const valgusRatio = Math.max(valgusLFrames, valgusRFrames) / samples.length;
      metric = Math.round(valgusRatio * 100);
      if (valgusRatio > 0.3) {
        comps.push("Knee collapsed inward during the ankle check — that forward travel does not count as clean ankle range");
        score = 2;
      }
      break;
    }
    case "hinge":
    case "balance":
    case "sl_balance": {
      const shoulderTilts = samples.map(shoulderTilt);
      const hipTilts = samples.map(hipTilt);
      const baseShoulder = shoulderTilts.slice(0, Math.min(5, shoulderTilts.length)).reduce((a, b) => a + b, 0) / Math.min(5, shoulderTilts.length);
      const baseHip = hipTilts.slice(0, Math.min(5, hipTilts.length)).reduce((a, b) => a + b, 0) / Math.min(5, hipTilts.length);
      const maxShift = Math.max(
        ...shoulderTilts.map(v => Math.abs(v - baseShoulder)),
        ...hipTilts.map(v => Math.abs(v - baseHip)),
      );
      metric = Math.round(maxShift * 10) / 10;
      if (testId === "hinge" && maxShift > 7) {
        comps.push("You shifted sideways during the hinge — one side is not sharing the load evenly");
        score = 2;
      }
      if (testId === "balance") {
        const maxForwardLean = Math.max(...samples.map(trunkLeanAngle));
        metric = Math.round(maxForwardLean * 10) / 10;
        if (maxForwardLean > 12) {
          comps.push("Torso pitched forward to save the balance — that points to hip/control compensation");
          score = 2;
        }
      }
      break;
    }
    case "overhead":
    case "wall_slide": {
      let peakFrames = 0, archFrames = 0;
      let shoulderAsym = 0;
      for (const s of samples) {
        const al = angle(s[PL.LEFT_HIP], s[PL.LEFT_SHOULDER], s[PL.LEFT_ELBOW]);
        const ar = angle(s[PL.RIGHT_HIP], s[PL.RIGHT_SHOULDER], s[PL.RIGHT_ELBOW]);
        shoulderAsym = Math.max(shoulderAsym, Math.abs(al - ar));
        if (al > 140 || ar > 140) {
          peakFrames++;
          if (trunkLeanAngle(s) > 10) archFrames++;
        }
      }
      const archRatio = peakFrames ? archFrames / peakFrames : 0;
      metric = Math.round(Math.max(archRatio * 100, shoulderAsym));
      if (testId === "overhead" && archRatio > 0.3) {
        comps.push("Lower back arched from the side view — overhead range came partly from the spine");
        score = 2;
      }
      if (testId === "wall_slide" && shoulderAsym > 12) {
        comps.push("Shoulder height/range was uneven from the front view");
        score = 2;
      }
      break;
    }
    case "bridge_hold": {
      const tilts = samples.map(hipTilt);
      const base = tilts.slice(0, Math.min(5, tilts.length)).reduce((a, b) => a + b, 0) / Math.min(5, tilts.length);
      const maxTilt = Math.max(...tilts.map(v => Math.abs(v - base)));
      metric = Math.round(maxTilt * 10) / 10;
      if (maxTilt > 6) {
        comps.push("Pelvis rotated or dropped during the bridge — both hips did not hold evenly");
        score = 2;
      }
      break;
    }
  }

  return {
    id: testId,
    name,
    score,
    metric,
    compensations: comps.length ? comps : undefined,
    frameValidRatio: Math.round(validRatio * 100) / 100,
    notes: comps.length
      ? comps.join("; ")
      : `${cameraView === "front" ? "Front" : "Side"} view checked for angle-specific compensations; range score comes from the primary ${TEST_CAMERA_VIEW[testId] ?? "front"} view.`,
  };
}

function scoreSamples(testId: string, rawSamples: Frame[], duration: number, cameraView: "front" | "side"): TestResult {
  const name = lookupName(testId);
  const expectedFrames = Math.max(1, Math.floor(duration * 10)); // sampler @ 100ms

  if (rawSamples.length < 10) {
    return notEnoughClearFrames(testId, name, 0);
  }

  const relevant = TEST_LANDMARKS[testId] ?? [];
  // Visibility / validity gate — drop frames where any required landmark
  // is occluded or low-confidence.
  const validFrames = rawSamples.filter(s => frameValid(s, relevant));
  const validRatio = validFrames.length / expectedFrames;
  if (validRatio < MIN_VALID_FRAME_RATIO) {
    return notEnoughClearFrames(testId, name, Math.round(validRatio * 100) / 100);
  }

  // Smooth landmark coordinates before any angle math.
  const samples = smoothSamples(validFrames, relevant);

  const validRatioRounded = Math.round(validRatio * 100) / 100;
  const motion = pointMotion(samples, relevant);
  if (needsMovementSignal(testId) && motion < 0.025) {
    return notEnoughMovement(testId, name, validRatioRounded);
  }

  const primaryView = TEST_CAMERA_VIEW[testId] ?? "front";
  if (cameraView !== primaryView) {
    return secondaryViewResult(testId, name, samples, validRatio, cameraView);
  }

  switch (testId) {
    case "squat": {
      // Track min knee angle per side across descent; detect knee valgus by
      // checking whether knee.x deviates inward of ankle.x at any frame where
      // the knee is meaningfully bent (joint angle < 150°).
      let minL = 180, minR = 180;
      let valgusLFrames = 0, valgusRFrames = 0, descentFrames = 0;
      let trunkCollapseFrames = 0;
      let deepestTrunkAngle = 180; // shoulder-hip-knee at the bottom
      for (const s of samples) {
        const la = angle(s[PL.LEFT_HIP], s[PL.LEFT_KNEE], s[PL.LEFT_ANKLE]);
        const ra = angle(s[PL.RIGHT_HIP], s[PL.RIGHT_KNEE], s[PL.RIGHT_ANKLE]);
        if (la > 0) minL = Math.min(minL, la);
        if (ra > 0) minR = Math.min(minR, ra);
        const inDescent = la < 150 || ra < 150;
        if (inDescent) {
          descentFrames++;
          // Camera is mirrored on screen but landmark coords are in image
          // space. "Inward" = knee.x between the two ankles' midpoint and the
          // ankle on the same side.
          const midAnkleX = (s[PL.LEFT_ANKLE].x + s[PL.RIGHT_ANKLE].x) / 2;
          // Left ankle is on the right side of the image when user faces
          // camera, but we don't care which side is which — only relative.
          if (Math.sign(s[PL.LEFT_KNEE].x - midAnkleX) !== Math.sign(s[PL.LEFT_ANKLE].x - midAnkleX)) valgusLFrames++;
          if (Math.sign(s[PL.RIGHT_KNEE].x - midAnkleX) !== Math.sign(s[PL.RIGHT_ANKLE].x - midAnkleX)) valgusRFrames++;
          // Trunk collapse at the bottom of the squat = severe forward lean,
          // shoulder-hip-knee angle drops well below standing (~180°).
          const trunkL = angle(s[PL.LEFT_SHOULDER], s[PL.LEFT_HIP], s[PL.LEFT_KNEE]);
          const trunkR = angle(s[PL.RIGHT_SHOULDER], s[PL.RIGHT_HIP], s[PL.RIGHT_KNEE]);
          const trunkMin = Math.min(trunkL || 180, trunkR || 180);
          if (trunkMin < deepestTrunkAngle) deepestTrunkAngle = trunkMin;
          if (trunkMin < 90) trunkCollapseFrames++;
        }
      }
      // Heel-rise check uses the un-smoothed validFrames to keep micro-rises
      // detectable.
      const heelRiseL = heelRiseFraction(samples, PL.LEFT_ANKLE);
      const heelRiseR = heelRiseFraction(samples, PL.RIGHT_ANKLE);
      const r = REFERENCE_RANGES.squat;
      const minA = Math.min(minL, minR);
      let score = bucketScoreMaxOrLess(minA, r.passMax, r.borderlineMax);
      const comps: string[] = [];
      const valgusRatioL = descentFrames ? valgusLFrames / descentFrames : 0;
      const valgusRatioR = descentFrames ? valgusRFrames / descentFrames : 0;
      if (valgusRatioL > 0.25) { comps.push("Left knee drifts inward (valgus) — that mobility came from instability, not real range"); score = cap(score, 2); }
      if (valgusRatioR > 0.25) { comps.push("Right knee drifts inward (valgus) — that mobility came from instability, not real range"); score = cap(score, 2); }
      if (heelRiseL > 0.15 || heelRiseR > 0.15) {
        comps.push("Heels lifted off the floor — depth was bought with limited ankle mobility, not real squat range");
        score = cap(score, 2);
      }
      if (descentFrames && trunkCollapseFrames / descentFrames > 0.2) {
        comps.push("Trunk collapsed forward at the bottom — the spine compensated for tight ankles/hips");
        score = cap(score, 2);
      }
      return {
        id: testId, name, score,
        metric: Math.round(minA),
        left: Math.round(minL), right: Math.round(minR),
        asymmetry: asym(minL, minR),
        compensations: comps.length ? comps : undefined,
        frameValidRatio: Math.round(validRatio * 100) / 100,
        notes: `Min knee angle L ${Math.round(minL)}° / R ${Math.round(minR)}° · asym ${asym(minL, minR)}°${comps.length ? ` · ${comps.join("; ")}` : ""}`,
      };
    }
    case "hinge": {
      // Primary metric = true hip-joint angle (trunk line to thigh line),
      // tracked per side. Compensation pass separates trunk forward lean that
      // came from the *spine rounding* (head moves forward of the
      // shoulder-hip line) from real hip rotation, and also catches the
      // "turned into a squat" pattern where the knees bend substantially.
      let hipMinL = 180, hipMinR = 180;
      let kneeMinL = 180, kneeMinR = 180;
      let spineMin = 180;
      const spineBaselineN = Math.min(5, samples.length);
      let spineBase = 0, baseCount = 0;
      for (let i = 0; i < spineBaselineN; i++) {
        const sc = spineCurveAngle(samples[i]);
        if (sc > 0) { spineBase += sc; baseCount++; }
      }
      spineBase = baseCount ? spineBase / baseCount : 180;

      for (const s of samples) {
        const al = angle(s[PL.LEFT_SHOULDER], s[PL.LEFT_HIP], s[PL.LEFT_KNEE]);
        const ar = angle(s[PL.RIGHT_SHOULDER], s[PL.RIGHT_HIP], s[PL.RIGHT_KNEE]);
        if (al > 0) hipMinL = Math.min(hipMinL, al);
        if (ar > 0) hipMinR = Math.min(hipMinR, ar);
        const kl = angle(s[PL.LEFT_HIP], s[PL.LEFT_KNEE], s[PL.LEFT_ANKLE]);
        const kr = angle(s[PL.RIGHT_HIP], s[PL.RIGHT_KNEE], s[PL.RIGHT_ANKLE]);
        if (kl > 0) kneeMinL = Math.min(kneeMinL, kl);
        if (kr > 0) kneeMinR = Math.min(kneeMinR, kr);
        const sc = spineCurveAngle(s);
        if (sc > 0) spineMin = Math.min(spineMin, sc);
      }
      const r = REFERENCE_RANGES.hinge;
      const minHip = Math.min(hipMinL, hipMinR);
      let score = bucketScoreRange(minHip, r.passJointMin, r.passJointMax, r.borderlineJointMin, r.borderlineJointMax);
      const leanDeg = Math.round(180 - minHip);
      const spineLoss = Math.max(0, spineBase - spineMin); // bigger = more rounding
      const kneeFlex = 180 - Math.min(kneeMinL, kneeMinR); // 0 = stayed straight
      const comps: string[] = [];
      // SPINE ROUNDING — the marquee compensation. If spine angle dropped
      // significantly from its standing baseline (>15°), the forward lean was
      // bought from the upper back, not the hip joint. Fail the test.
      if (spineLoss > 15) {
        comps.push("Your back rounded to get there — the lean came from the spine, not the hip joint. Score reflects the spine compensation, not the trunk angle.");
        score = 1;
      } else if (spineLoss > 8) {
        comps.push("Some spine rounding contributed to the forward lean — the hip joint did not do all the work");
        score = cap(score, 2);
      }
      // KNEE BEND — if the user squatted instead of hinged (>30° knee flexion),
      // the hip mobility reading is invalid.
      if (kneeFlex > 30) {
        comps.push("Knees bent substantially — this became a squat, not a hinge, so the hip mobility reading isn't reliable");
        score = 1;
      }
      return {
        id: testId, name, score,
        metric: leanDeg,
        left: Math.round(180 - hipMinL), right: Math.round(180 - hipMinR),
        asymmetry: asym(hipMinL, hipMinR),
        compensations: comps.length ? comps : undefined,
        frameValidRatio: Math.round(validRatio * 100) / 100,
        notes: `Hip lean L ${Math.round(180 - hipMinL)}° / R ${Math.round(180 - hipMinR)}° · spine Δ ${Math.round(spineLoss)}° · knee flex ${Math.round(kneeFlex)}°${comps.length ? ` · ${comps.join("; ")}` : ""}`,
      };
    }
    case "balance":
    case "sl_balance": {
      // Pelvic-drop angle: deviation of the hip line from horizontal.
      const angles: number[] = [];
      const shoulderTilts: number[] = [];
      for (const s of samples) {
        const lH = s[PL.LEFT_HIP], rH = s[PL.RIGHT_HIP];
        const dy = rH.y - lH.y, dx = rH.x - lH.x;
        angles.push(Math.atan2(dy, dx) * 180 / Math.PI);
        shoulderTilts.push(shoulderTilt(s));
      }
      const baseline = angles.slice(0, Math.min(5, angles.length)).reduce((a, b) => a + b, 0) / Math.min(5, angles.length);
      let maxDrop = 0;
      for (const a of angles) maxDrop = Math.max(maxDrop, Math.abs(a - baseline));
      const baselineShoulder = shoulderTilts.slice(0, Math.min(5, shoulderTilts.length)).reduce((a, b) => a + b, 0) / Math.min(5, shoulderTilts.length);
      let maxShoulderLean = 0;
      for (const t of shoulderTilts) maxShoulderLean = Math.max(maxShoulderLean, Math.abs(t - baselineShoulder));
      // Trunk lean that "masks" pelvic drop counts as if the pelvis dropped —
      // combine them so the score can't be saved by leaning the torso.
      const effectiveDrop = Math.max(maxDrop, maxShoulderLean, maxDrop + maxShoulderLean - 2);
      const r = REFERENCE_RANGES.balance;
      let score = bucketScoreMaxOrLess(effectiveDrop, r.passMaxDrop, r.borderlineMaxDrop);
      const heldFull = validRatio >= 0.95;
      if (!heldFull) score = score === 3 ? 2 : 1;
      const comps: string[] = [];
      if (maxShoulderLean > 5) comps.push("Trunk leaned sideways over the standing leg to mask pelvic drop — the hip didn't actually stay level");
      const finalScore: 1 | 2 | 3 = score;
      return {
        id: testId, name, score: finalScore,
        metric: Math.round(effectiveDrop * 10) / 10,
        compensations: comps.length ? comps : undefined,
        frameValidRatio: Math.round(validRatio * 100) / 100,
        notes: `Pelvic drop ${Math.round(maxDrop * 10) / 10}° · trunk lean ${Math.round(maxShoulderLean * 10) / 10}°${heldFull ? "" : " · balance lost before 10 s"}${comps.length ? " · " + comps.join("; ") : ""}`,
      };
    }
    case "lunge":
    case "knee_sld": {
      let minL = 180, minR = 180;
      // Track valgus by frame, same convention as squat.
      let valgusLFrames = 0, valgusRFrames = 0, descentFrames = 0;
      // Shoulder & hip line orientation baselines for rotation detection.
      const shoulderLens: number[] = [];
      const hipLens: number[] = [];
      for (const s of samples) {
        const al = angle(s[PL.LEFT_HIP], s[PL.LEFT_KNEE], s[PL.LEFT_ANKLE]);
        const ar = angle(s[PL.RIGHT_HIP], s[PL.RIGHT_KNEE], s[PL.RIGHT_ANKLE]);
        if (al > 0) minL = Math.min(minL, al);
        if (ar > 0) minR = Math.min(minR, ar);
        if (al < 160 || ar < 160) {
          descentFrames++;
          const midAnkleX = (s[PL.LEFT_ANKLE].x + s[PL.RIGHT_ANKLE].x) / 2;
          if (Math.sign(s[PL.LEFT_KNEE].x - midAnkleX) !== Math.sign(s[PL.LEFT_ANKLE].x - midAnkleX)) valgusLFrames++;
          if (Math.sign(s[PL.RIGHT_KNEE].x - midAnkleX) !== Math.sign(s[PL.RIGHT_ANKLE].x - midAnkleX)) valgusRFrames++;
        }
        const sLen = Math.hypot(s[PL.LEFT_SHOULDER].x - s[PL.RIGHT_SHOULDER].x, s[PL.LEFT_SHOULDER].y - s[PL.RIGHT_SHOULDER].y);
        const hLen = Math.hypot(s[PL.LEFT_HIP].x - s[PL.RIGHT_HIP].x, s[PL.LEFT_HIP].y - s[PL.RIGHT_HIP].y);
        shoulderLens.push(sLen);
        hipLens.push(hLen);
      }
      // Lunge is shot from the side — shoulder/hip "widths" should stay short
      // and consistent. A sudden growth means the user rotated toward the
      // camera to fake reach.
      const sBase = shoulderLens.slice(0, 5).reduce((a, b) => a + b, 0) / Math.min(5, shoulderLens.length);
      const hBase = hipLens.slice(0, 5).reduce((a, b) => a + b, 0) / Math.min(5, hipLens.length);
      const sMax = Math.max(...shoulderLens);
      const hMax = Math.max(...hipLens);
      const shoulderRotation = sBase > 0.01 ? (sMax - sBase) / sBase : 0; // fractional growth
      const hipRotation = hBase > 0.01 ? (hMax - hBase) / hBase : 0;
      const heelRiseL = heelRiseFraction(samples, PL.LEFT_ANKLE);
      const heelRiseR = heelRiseFraction(samples, PL.RIGHT_ANKLE);
      const r = testId === "knee_sld" ? REFERENCE_RANGES.knee_sld : REFERENCE_RANGES.lunge;
      const minK = Math.min(minL, minR);
      let score = bucketScoreRange(minK, r.passMin, r.passMax, r.passMin - 0.0001, r.borderlineMax);
      if (minK > r.borderlineMax) score = 1;
      const comps: string[] = [];
      if (descentFrames && valgusLFrames / descentFrames > 0.25) { comps.push("Left front knee drifted inward (valgus)"); score = cap(score, 2); }
      if (descentFrames && valgusRFrames / descentFrames > 0.25) { comps.push("Right front knee drifted inward (valgus)"); score = cap(score, 2); }
      if (heelRiseL > 0.15 || heelRiseR > 0.15) { comps.push("Front heel lifted — depth was bought from limited ankle mobility, not real range"); score = cap(score, 2); }
      if (shoulderRotation > 0.4 || hipRotation > 0.4) { comps.push("You rotated your torso/hips toward the camera to reach further — that invalidates the depth reading"); score = cap(score, 2); }
      return {
        id: testId, name, score,
        metric: Math.round(minK),
        left: Math.round(minL), right: Math.round(minR),
        asymmetry: asym(minL, minR),
        compensations: comps.length ? comps : undefined,
        frameValidRatio: Math.round(validRatio * 100) / 100,
        notes: `Min knee angle L ${Math.round(minL)}° / R ${Math.round(minR)}° · asym ${asym(minL, minR)}°${comps.length ? ` · ${comps.join("; ")}` : ""}`,
      };
    }
    case "overhead":
    case "wall_slide": {
      // Max shoulder-flexion joint angle per side + compensation check
      // (lumbar arch ~ trunk lean > 10° during peak overhead reach).
      let maxL = 0, maxR = 0;
      let archFrames = 0, peakFrames = 0;
      // Shoulder shrug baseline (shoulder.y - ear.y at rest). When the user
      // shrugs, shoulder rises toward the ear and this gap shrinks.
      const shoulderEarBase = (() => {
        let s = 0, n = 0;
        for (let i = 0; i < Math.min(5, samples.length); i++) {
          const g = shoulderEarGap(samples[i]);
          if (g > 0) { s += g; n++; }
        }
        return n ? s / n : 0;
      })();
      let minShoulderEarGap = shoulderEarBase || 1;
      for (const s of samples) {
        const al = angle(s[PL.LEFT_HIP], s[PL.LEFT_SHOULDER], s[PL.LEFT_ELBOW]);
        const ar = angle(s[PL.RIGHT_HIP], s[PL.RIGHT_SHOULDER], s[PL.RIGHT_ELBOW]);
        if (al > maxL) maxL = al;
        if (ar > maxR) maxR = ar;
        if (al > 140 || ar > 140) {
          peakFrames++;
          if (trunkLeanAngle(s) > 10) archFrames++;
          const g = shoulderEarGap(s);
          if (g > 0 && g < minShoulderEarGap) minShoulderEarGap = g;
        }
      }
      const shrugLoss = shoulderEarBase > 0 ? (shoulderEarBase - minShoulderEarGap) / shoulderEarBase : 0;
      const r = testId === "wall_slide" ? REFERENCE_RANGES.wall_slide : REFERENCE_RANGES.overhead;
      const maxArm = Math.max(maxL, maxR);
      let score = bucketScoreMaxOrEqual(maxArm, r.passMin, r.borderlineMin);
      const comps: string[] = [];
      if (peakFrames && archFrames / peakFrames > 0.3) {
        comps.push("Lower back arched to get the arms overhead — the range came from the spine, not the shoulder");
        score = cap(score, 2);
      }
      if (shrugLoss > 0.35) {
        comps.push("Shoulders shrugged up toward the ears — that's upper-trap compensation, not true shoulder mobility");
        score = cap(score, 2);
      }
      return {
        id: testId, name, score,
        metric: Math.round(maxArm),
        left: Math.round(maxL), right: Math.round(maxR),
        asymmetry: asym(maxL, maxR),
        compensations: comps.length ? comps : undefined,
        frameValidRatio: Math.round(validRatio * 100) / 100,
        notes: `Max arm angle L ${Math.round(maxL)}° / R ${Math.round(maxR)}° · asym ${asym(maxL, maxR)}°${comps.length ? ` · ${comps.join("; ")}` : ""}`,
      };
    }
    case "ankle_df": {
      // Joint angle between tibia (knee→ankle) and ground-horizontal.
      // Lower measured angle = more dorsiflexion (tibia leans further forward).
      // Heel-lift fully invalidates this test per founder spec.
      const heelRiseL = heelRiseFraction(samples, PL.LEFT_ANKLE, 0.015);
      const heelRiseR = heelRiseFraction(samples, PL.RIGHT_ANKLE, 0.015);
      if (heelRiseL > 0.1 || heelRiseR > 0.1) {
        return {
          id: testId, name, score: 1, valid: false,
          frameValidRatio: Math.round(validRatio * 100) / 100,
          compensations: ["Heel came off the floor — this test is only meaningful with a flat heel"],
          notes: "Couldn't get a clear reading, keep your heel flat and retry",
        };
      }
      let minL = 180, minR = 180;
      let valgusLFrames = 0, valgusRFrames = 0, descentFrames = 0;
      for (const s of samples) {
        const al = angle(s[PL.LEFT_KNEE], s[PL.LEFT_ANKLE], { x: s[PL.LEFT_ANKLE].x + 0.1, y: s[PL.LEFT_ANKLE].y });
        const ar = angle(s[PL.RIGHT_KNEE], s[PL.RIGHT_ANKLE], { x: s[PL.RIGHT_ANKLE].x + 0.1, y: s[PL.RIGHT_ANKLE].y });
        if (al > 0) minL = Math.min(minL, al);
        if (ar > 0) minR = Math.min(minR, ar);
        // Valgus: knee drifts inward of the ankle on the active side.
        descentFrames++;
        const midAnkleX = (s[PL.LEFT_ANKLE].x + s[PL.RIGHT_ANKLE].x) / 2;
        if (Math.sign(s[PL.LEFT_KNEE].x - midAnkleX) !== Math.sign(s[PL.LEFT_ANKLE].x - midAnkleX)) valgusLFrames++;
        if (Math.sign(s[PL.RIGHT_KNEE].x - midAnkleX) !== Math.sign(s[PL.RIGHT_ANKLE].x - midAnkleX)) valgusRFrames++;
      }
      const r = REFERENCE_RANGES.ankle_df;
      const minA = Math.min(minL, minR);
      let score = bucketScoreMaxOrLess(minA, r.passMaxMeasured, r.borderlineMaxMeasured);
      const dfDeg = Math.round(90 - minA);
      const comps: string[] = [];
      if (descentFrames && valgusLFrames / descentFrames > 0.3) { comps.push("Left knee collapsed inward to fake forward travel — not true ankle range"); score = cap(score, 2); }
      if (descentFrames && valgusRFrames / descentFrames > 0.3) { comps.push("Right knee collapsed inward to fake forward travel — not true ankle range"); score = cap(score, 2); }
      return {
        id: testId, name, score,
        metric: dfDeg,
        left: Math.round(90 - minL), right: Math.round(90 - minR),
        asymmetry: asym(minL, minR),
        compensations: comps.length ? comps : undefined,
        frameValidRatio: Math.round(validRatio * 100) / 100,
        notes: `Dorsiflexion L ${Math.round(90 - minL)}° / R ${Math.round(90 - minR)}° · asym ${asym(minL, minR)}°${comps.length ? ` · ${comps.join("; ")}` : ""}`,
      };
    }
    case "hip_abd": {
      let maxL = 0, maxR = 0;
      // Hip-hike: pelvis tilts up on the lifting side. We track the abduction
      // angle achieved BEFORE hip-hike begins, not the final leg height.
      const hipTiltBase = (() => {
        let s = 0, n = 0;
        for (let i = 0; i < Math.min(5, samples.length); i++) {
          const t = hipTilt(samples[i]); s += t; n++;
        }
        return n ? s / n : 0;
      })();
      let preHikeMaxL = 0, preHikeMaxR = 0;
      let hipHikeDetected = false;
      let trunkLeanFrames = 0, abductFrames = 0;
      for (const s of samples) {
        const al = abductionAngle(s[PL.LEFT_HIP], s[PL.LEFT_KNEE]);
        const ar = abductionAngle(s[PL.RIGHT_HIP], s[PL.RIGHT_KNEE]);
        if (al > maxL) maxL = al;
        if (ar > maxR) maxR = ar;
        const hike = Math.abs(hipTilt(s) - hipTiltBase);
        if (hike < 4) {
          if (al > preHikeMaxL) preHikeMaxL = al;
          if (ar > preHikeMaxR) preHikeMaxR = ar;
        } else {
          hipHikeDetected = true;
        }
        if (al > 10 || ar > 10) {
          abductFrames++;
          if (trunkLeanAngle(s) > 8) trunkLeanFrames++;
        }
      }
      const r = REFERENCE_RANGES.hip_abd;
      // Score reflects pre-hike range, per founder spec.
      const scoreAngle = Math.max(preHikeMaxL, preHikeMaxR);
      let score = bucketScoreRange(scoreAngle, r.passMin, r.passMax, r.borderlineMin, r.passMax);
      if (scoreAngle < r.borderlineMin) score = 1;
      const comps: string[] = [];
      if (hipHikeDetected) comps.push("Pelvis hiked up on the lifting side — score reflects the angle before the hip-hike started, not the final leg height");
      if (abductFrames && trunkLeanFrames / abductFrames > 0.3) { comps.push("Trunk leaned away from the lifting leg to help it rise — that extra height doesn't count"); score = cap(score, 2); }
      return {
        id: testId, name, score,
        metric: Math.round(scoreAngle),
        left: Math.round(preHikeMaxL), right: Math.round(preHikeMaxR),
        asymmetry: asym(preHikeMaxL, preHikeMaxR),
        compensations: comps.length ? comps : undefined,
        frameValidRatio: Math.round(validRatio * 100) / 100,
        notes: `Pre-hike abduction L ${Math.round(preHikeMaxL)}° / R ${Math.round(preHikeMaxR)}° · final L ${Math.round(maxL)}° / R ${Math.round(maxR)}°${comps.length ? ` · ${comps.join("; ")}` : ""}`,
      };
    }
    case "bridge_hold": {
      // Hold-quality proxy: low hip-y variance AND no late sag (compare first
      // vs last third of the window). Reference target hold is 30–45 s — this
      // 10-s window is a v1 proxy; flagged in REFERENCE_RANGES.bridge_hold.
      const ys = samples.map(s => (s[PL.LEFT_HIP].y + s[PL.RIGHT_HIP].y) / 2);
      const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
      const std = Math.sqrt(ys.reduce((a, b) => a + (b - mean) ** 2, 0) / ys.length);
      const third = Math.max(1, Math.floor(ys.length / 3));
      const firstAvg = ys.slice(0, third).reduce((a, b) => a + b, 0) / third;
      const lastAvg = ys.slice(-third).reduce((a, b) => a + b, 0) / third;
      const sagDelta = lastAvg - firstAvg; // positive y-delta = hips dropped
      // Lumbar hyperextension proxy: in a clean bridge, hip lies on the
      // shoulder→knee line. If hip.y is much *above* (smaller y than) that
      // line, the lumbar spine is over-extending instead of the glutes
      // driving the lift. Sample at the lowest-y (highest-hip) frame.
      let maxLumbar = 0;
      for (const s of samples) {
        const sx = (s[PL.LEFT_SHOULDER].x + s[PL.RIGHT_SHOULDER].x) / 2;
        const sy = (s[PL.LEFT_SHOULDER].y + s[PL.RIGHT_SHOULDER].y) / 2;
        const kx = (s[PL.LEFT_KNEE].x + s[PL.RIGHT_KNEE].x) / 2;
        const ky = (s[PL.LEFT_KNEE].y + s[PL.RIGHT_KNEE].y) / 2;
        const hx = (s[PL.LEFT_HIP].x + s[PL.RIGHT_HIP].x) / 2;
        const hy = (s[PL.LEFT_HIP].y + s[PL.RIGHT_HIP].y) / 2;
        if (Math.abs(kx - sx) < 0.001) continue;
        const expectedY = sy + (ky - sy) * (hx - sx) / (kx - sx);
        const above = expectedY - hy; // positive = hip above shoulder-knee line
        if (above > maxLumbar) maxLumbar = above;
      }
      const r = REFERENCE_RANGES.bridge_hold;
      let score: 1 | 2 | 3 = std < r.passMaxSway ? 3 : std < r.borderlineMaxSway ? 2 : 1;
      const comps: string[] = [];
      if (sagDelta > r.sagDeltaFail) { comps.push("Hip sag during hold"); score = 1; }
      if (maxLumbar > 0.04) {
        comps.push("Lower back arched (lumbar hyperextension) — the lift came from the spine, not from glute drive");
        score = cap(score, 2);
      }
      return {
        id: testId, name, score,
        metric: Math.round(std * 1000) / 10,
        compensations: comps.length ? comps : undefined,
        frameValidRatio: Math.round(validRatio * 100) / 100,
        notes: `Sway ${(std * 100).toFixed(1)} · sag Δ ${(sagDelta * 100).toFixed(1)} · lumbar ${(maxLumbar * 100).toFixed(1)}${comps.length ? " · " + comps.join("; ") : ""}`,
      };
    }
    case "elbow_rom": {
      let maxL = 0, maxR = 0, minL = 180, minR = 180;
      for (const s of samples) {
        const al = angle(s[PL.LEFT_SHOULDER], s[PL.LEFT_ELBOW], s[PL.LEFT_WRIST]);
        const ar = angle(s[PL.RIGHT_SHOULDER], s[PL.RIGHT_ELBOW], s[PL.RIGHT_WRIST]);
        if (al > 0) { maxL = Math.max(maxL, al); minL = Math.min(minL, al); }
        if (ar > 0) { maxR = Math.max(maxR, ar); minR = Math.min(minR, ar); }
      }
      // Shoulder substitution — if the upper arm wandered during the test,
      // the elbow joint wasn't isolated and the angle reading is unreliable.
      const shoulderStd = Math.max(
        landmarkStd(samples, PL.LEFT_SHOULDER, "x"),
        landmarkStd(samples, PL.LEFT_SHOULDER, "y"),
        landmarkStd(samples, PL.RIGHT_SHOULDER, "x"),
        landmarkStd(samples, PL.RIGHT_SHOULDER, "y"),
      );
      if (shoulderStd > 0.04) {
        return {
          id: testId, name, score: 1, valid: false,
          frameValidRatio: Math.round(validRatio * 100) / 100,
          compensations: ["Shoulder moved during the test — keep your upper arm pinned to your side so the elbow is the only joint moving, then retry"],
          notes: "Couldn't get a clear reading — the upper arm wasn't kept still",
        };
      }
      const r = REFERENCE_RANGES.elbow_rom;
      const rangeL = maxL - minL, rangeR = maxR - minR;
      const rangeMax = Math.max(rangeL, rangeR);
      const extension = Math.max(maxL, maxR);
      let score: 1 | 2 | 3 = 1;
      if (rangeMax >= r.passRange && extension >= r.passExtension) score = 3;
      else if (rangeMax >= r.borderlineRange && extension >= r.borderlineExtension) score = 2;
      return {
        id: testId, name, score,
        metric: Math.round(rangeMax),
        left: Math.round(rangeL), right: Math.round(rangeR),
        asymmetry: asym(rangeL, rangeR),
        frameValidRatio: Math.round(validRatio * 100) / 100,
        notes: `ROM L ${Math.round(rangeL)}° / R ${Math.round(rangeR)}° · ext ${Math.round(extension)}°`,
      };
    }
    case "rotary_stability": {
      // Real v2 scoring for Rotary Stability. We can't distinguish "same-side"
      // vs "diagonal" reps from a single side-view camera reliably in 10 s,
      // so we grade the movement on FMS-adjacent, camera-observable signals:
      //   • balance loss    → torso midpoint wobble across the window
      //   • bilateral cover → both wrists reached forward past the shoulders
      //   • touch attempt   → min wrist↔knee distance approached the knee
      // Score 0 is never assigned here — the clearing-test pain gate on the
      // intro card converts a pain-reported clearing test to score 0 before
      // scoring runs.
      const r = REFERENCE_RANGES.rotary_stability;
      // Torso midpoint = mean of shoulders + hips. Wobble = std across window.
      const midXs: number[] = [];
      const midYs: number[] = [];
      let reachedL = 0, reachedR = 0;
      let minWristKnee = Infinity;
      for (const s of samples) {
        const sx = (s[PL.LEFT_SHOULDER].x + s[PL.RIGHT_SHOULDER].x) / 2;
        const hx = (s[PL.LEFT_HIP].x + s[PL.RIGHT_HIP].x) / 2;
        const sy = (s[PL.LEFT_SHOULDER].y + s[PL.RIGHT_SHOULDER].y) / 2;
        const hy = (s[PL.LEFT_HIP].y + s[PL.RIGHT_HIP].y) / 2;
        midXs.push((sx + hx) / 2);
        midYs.push((sy + hy) / 2);
        // A wrist counts as "reached" when its horizontal distance from
        // the torso midline exceeds `reachThresh`.
        const midline = (sx + hx) / 2;
        if (Math.abs(s[PL.LEFT_WRIST].x - midline) > r.reachThresh) reachedL++;
        if (Math.abs(s[PL.RIGHT_WRIST].x - midline) > r.reachThresh) reachedR++;
        // Elbow-to-knee touch proxy — wrist↔knee across all combinations.
        for (const w of [PL.LEFT_WRIST, PL.RIGHT_WRIST]) {
          for (const k of [PL.LEFT_KNEE, PL.RIGHT_KNEE]) {
            const dx = s[w].x - s[k].x;
            const dy = s[w].y - s[k].y;
            const d = Math.hypot(dx, dy);
            if (d < minWristKnee) minWristKnee = d;
          }
        }
      }
      const stdOf = (a: number[]) => {
        if (!a.length) return 0;
        const m = a.reduce((x, y) => x + y, 0) / a.length;
        return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length);
      };
      const wobble = Math.max(stdOf(midXs), stdOf(midYs));
      const frac = samples.length || 1;
      const bilateralReach = reachedL / frac > 0.15 && reachedR / frac > 0.15;
      const touchOK = Number.isFinite(minWristKnee) && minWristKnee < r.touchThresh;
      const comps: string[] = [];
      let score: 1 | 2 | 3 = 1;
      if (wobble >= r.wobbleFail) {
        score = 1;
        comps.push("Lost balance during the pattern — torso wobble was too large to score above a 1");
      } else if (bilateralReach && touchOK && wobble < r.wobbleBorderline) {
        score = 3;
      } else if (bilateralReach && wobble < r.wobbleFail) {
        score = 2;
        if (!touchOK) comps.push("Elbow and knee didn't clearly meet over the board — score capped at 2");
        if (wobble >= r.wobbleBorderline) comps.push("Visible torso wobble during the extension — score capped at 2");
      } else {
        score = 1;
        if (!bilateralReach) comps.push("Only one side of the pattern was completed — both sides required for a full score");
      }
      return {
        id: testId, name, score,
        metric: Math.round(wobble * 1000) / 10,
        compensations: comps.length ? comps : undefined,
        frameValidRatio: Math.round(validRatio * 100) / 100,
        notes: `Torso wobble ${(wobble * 100).toFixed(1)} · reach L ${Math.round((reachedL / frac) * 100)}% / R ${Math.round((reachedR / frac) * 100)}% · min wrist↔knee ${Number.isFinite(minWristKnee) ? (minWristKnee * 100).toFixed(1) : "n/a"}${comps.length ? " · " + comps.join("; ") : ""}`,
      };
    }
    // wrist_rom intentionally omitted — surfaced as "Coming soon" by being
    // excluded from buildSequence(). Defensive default in case it appears.
    default:
      return { id: testId, name, score: 1, valid: false, notes: "Test not available in v1" };
  }
}
