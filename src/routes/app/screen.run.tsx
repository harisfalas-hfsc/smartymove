import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPoseLandmarker, maybeFallbackToLite, PL } from "@/lib/pose";
import { angle, CORE_TESTS, CONDITIONAL_TESTS, computeSession, TEST_GUIDES, TEST_VIEWS } from "@/lib/movement";
import { updateUser, useUser, type Joint, type TestResult } from "@/lib/store";
import { consumeScanCredit } from "@/lib/scans.functions";
import { ChevronLeft, Camera, CheckCircle2, AlertTriangle, AlertCircle, SkipForward, BookOpen, RotateCcw, Pause, Play, X, RotateCw, MoveHorizontal } from "lucide-react";

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
  hip_abd: "front",
  bridge_hold: "side",
  wall_slide: "side",
  elbow_rom: "front",
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
  wall_slide:  [PL.LEFT_EAR, PL.RIGHT_EAR, PL.LEFT_SHOULDER, PL.LEFT_ELBOW, PL.LEFT_HIP, PL.RIGHT_SHOULDER, PL.RIGHT_ELBOW, PL.RIGHT_HIP],
  elbow_rom:   [PL.LEFT_SHOULDER, PL.LEFT_ELBOW, PL.LEFT_WRIST, PL.RIGHT_SHOULDER, PL.RIGHT_ELBOW, PL.RIGHT_WRIST],
};

function expandToSteps(testId: string, name: string, duration: number, conditional?: boolean): Step[] {
  const views = TEST_VIEWS[testId];
  if (!views || views.length === 0) {
    // Fallback to legacy single-view mapping if a test has no view definition.
    const cv = TEST_CAMERA_VIEW[testId] ?? "front";
    return [{
      key: `${testId}:0`, groupId: testId, testId, name, duration, cameraView: cv,
      viewIndex: 0, totalViews: 1,
      viewLabel: cv === "side" ? "Side view" : "Front view",
      viewCue: cv === "side" ? "Stand sideways to the camera." : "Face the camera straight on.",
      conditional,
    }];
  }
  return views.map((v, i) => ({
    key: `${testId}:${i}`, groupId: testId, testId, name, duration,
    cameraView: v.view, viewIndex: i, totalViews: views.length,
    viewLabel: v.label, viewCue: v.cue, conditional,
  }));
}

function buildSequence(joints: Joint[]): Step[] {
  const core = CORE_TESTS.flatMap(t => expandToSteps(t.id, t.name, t.duration));
  // Wrist test is intentionally excluded from v1 scoring — flagged "Coming
  // soon" because the wrist landmarks are too small on camera for a reliable
  // flexion/extension angle on phones. If the user picked wrist as a flagged
  // joint, we still run their other selected joint's add-on (if any).
  const cond = joints
    .filter(j => j !== "none" && j !== "wrist")
    .slice(0, 2)
    .flatMap(j => {
      const c = CONDITIONAL_TESTS[j as keyof typeof CONDITIONAL_TESTS];
      return expandToSteps(c.id, c.name, 10, true);
    });
  return [...core, ...cond];
}

/** Merge per-view step results for a single test into one TestResult. */
function mergeStepResults(stepResults: Array<TestResult & { viewIndex: number }>): TestResult {
  const sorted = [...stepResults].sort((a, b) => a.viewIndex - b.viewIndex);
  const primary = sorted[0];
  const validAll = sorted.every(r => r.valid !== false);
  const scoreMin = sorted.reduce<1 | 2 | 3>((m, r) => (r.score < m ? r.score : m), 3);
  const comps = Array.from(new Set(sorted.flatMap(r => r.compensations ?? [])));
  const notes = sorted
    .map(r => `${r.cameraView === "side" ? "Side" : "Front"}: ${r.notes ?? ""}`)
    .filter(n => n.length > 6)
    .join(" · ");
  return {
    id: primary.id,
    name: primary.name,
    score: validAll ? scoreMin : 1,
    valid: validAll,
    metric: primary.metric,
    left: primary.left,
    right: primary.right,
    asymmetry: primary.asymmetry,
    cameraView: primary.cameraView,
    compensations: comps.length ? comps : undefined,
    frameValidRatio: primary.frameValidRatio,
    notes: notes || primary.notes,
    viewFindings: sorted.map(r => ({
      view: (r.cameraView ?? "front") as "front" | "side",
      score: r.score,
      valid: r.valid,
      metric: r.metric,
      compensations: r.compensations,
    })),
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

  const [phase, setPhase] = useState<"setup" | "intro" | "running" | "done" | "failed">("setup");
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
      // Trim the last ~1.5s of samples so the user's movement toward the
      // "Done" button isn't scored as part of the test.
      const TAIL_TRIM_SAMPLES = 15; // sampler @ 100ms → 1.5s
      const trimmed = skipped
        ? samplesRef.current
        : samplesRef.current.slice(0, Math.max(0, samplesRef.current.length - TAIL_TRIM_SAMPLES));
      const scoredDuration = Math.max(1, Math.round(trimmed.length / 10));
      const scored: TestResult = skipped
        ? { id: test.testId, name: test.name, score: 1, notes: "Skipped", valid: false, cameraView: test.cameraView }
        : { ...scoreSamples(test.testId, trimmed, scoredDuration), cameraView: test.cameraView };
      // Buffer per-view results; on the last view of the group, merge into
      // one TestResult and push to the top-level results.
      const bucket = stepResultsRef.current.get(test.groupId) ?? [];
      bucket.push({ ...scored, viewIndex: test.viewIndex });
      stepResultsRef.current.set(test.groupId, bucket);
      const isLastView = test.viewIndex + 1 >= test.totalViews;
      let mergedForFinalize: TestResult | null = null;
      if (isLastView) {
        const merged = mergeStepResults(bucket);
        mergedForFinalize = merged;
        setResults(r => [...r, merged]);
      }
      setTimeout(() => {
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
    // Consume one scan credit (grandfathered subscribers are skipped server-side).
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
    const session = computeSession(allResults, joints, u.age);
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

  // Group-level "test N of M" — the user thinks of the squat + its two views
  // as one test, not two.
  const groupIds = useMemo(() => {
    const seen: string[] = [];
    for (const s of seq) if (!seen.includes(s.groupId)) seen.push(s.groupId);
    return seen;
  }, [seq]);
  const cur = seq[idx];
  if (!u) return null;
  const progress = seq.length ? ((idx + (phase === "running" ? 1 - countdown / (cur?.duration ?? 1) : 0)) / seq.length) * 100 : 0;
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
            <div className="rounded-2xl bg-white/95 px-4 py-1.5 text-xl font-extrabold text-foreground shadow-xl">
              {cur.name}
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
              <Camera className="mx-auto mb-2 h-7 w-7" />
              <div className="text-lg font-bold">Position yourself in frame</div>
              <p className="mt-1 text-sm opacity-85">Stand 6–8 feet back so your full body fits inside the silhouette guide.</p>
              {error && <div className="mt-3 flex items-center gap-2 rounded-xl bg-destructive/30 p-2 text-xs"><AlertTriangle className="h-4 w-4" />{error}</div>}
              <button onClick={start} disabled={starting} className="mt-4 h-12 w-full rounded-2xl brand-gradient text-base font-semibold disabled:opacity-60">
                {starting ? (statusMsg || "Starting...") : "Enable camera"}
              </button>
              {starting && statusMsg && <p className="mt-2 text-[11px] opacity-70">{statusMsg}</p>}
            </div>
          )}
          {phase === "intro" && cur && (() => {
            const g = TEST_GUIDES[cur.testId];
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
                {isReposition ? (
                  <div className="mt-4 rounded-2xl bg-secondary/50 p-3 text-sm text-foreground">
                    <div className="font-semibold">Same movement, new camera angle.</div>
                    <p className="mt-1 text-muted-foreground">
                      Rotate so the camera has a {cur.cameraView === "side" ? "clear side profile" : "clear front-on view"} of you, then repeat the movement. This second angle catches what the first angle can't see.
                    </p>
                  </div>
                ) : g && (
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
                <div className="mt-5 flex gap-2">
                  <button onClick={() => navigate({ to: "/app/screen" })} className="h-12 flex-1 rounded-2xl bg-secondary text-sm font-semibold text-foreground">Exit</button>
                  <button onClick={() => setPhase("running")} disabled={!poseReady} className="h-12 flex-[2] rounded-2xl brand-gradient text-base font-semibold text-primary-foreground disabled:opacity-50">{poseReady ? (isReposition ? "I'm repositioned · Start" : "I'm ready · Start") : "Loading…"}</button>
                </div>
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
                  {paused || showInstructions ? "Paused" : "In progress"} · Test {groupIndex + 1}/{groupCount}{cur.totalViews > 1 ? ` · ${cur.viewLabel}` : ""}
                </div>
                <div className="truncate text-base font-extrabold text-white">{cur.name}</div>
              </div>
              <div className="w-12 text-center text-4xl font-extrabold tabular-nums brand-text">{countdown}</div>
              <button
                onClick={() => finishHandlerRef.current?.(false)}
                disabled={elapsed < 2}
                className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full brand-gradient px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                <CheckCircle2 className="h-5 w-5" /> Done
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

function scoreSamples(testId: string, rawSamples: Frame[], duration: number): TestResult {
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
    case "balance": {
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
    // wrist_rom intentionally omitted — surfaced as "Coming soon" by being
    // excluded from buildSequence(). Defensive default in case it appears.
    default:
      return { id: testId, name, score: 1, valid: false, notes: "Test not available in v1" };
  }
}
