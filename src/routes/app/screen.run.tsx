import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getPoseLandmarker, maybeFallbackToLite, PL } from "@/lib/pose";
import { angle, CORE_TESTS, CONDITIONAL_TESTS, computeSession, TEST_GUIDES } from "@/lib/movement";
import { updateUser, useUser, type Joint, type TestResult } from "@/lib/store";
import { ChevronLeft, Camera, CheckCircle2, AlertTriangle, AlertCircle, SkipForward, BookOpen, RotateCcw, Pause, Play, X, RotateCw, MoveHorizontal } from "lucide-react";

export const Route = createFileRoute("/app/screen/run")({ component: Runner });

type TestDef = { id: string; name: string; duration: number; instruction: string; conditional?: boolean; cameraView: "front" | "side" };

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
  squat:       [PL.LEFT_HIP, PL.RIGHT_HIP, PL.LEFT_KNEE, PL.RIGHT_KNEE, PL.LEFT_ANKLE, PL.RIGHT_ANKLE],
  hinge:       [PL.LEFT_SHOULDER, PL.LEFT_HIP, PL.LEFT_KNEE, PL.RIGHT_SHOULDER, PL.RIGHT_HIP, PL.RIGHT_KNEE],
  balance:     [PL.LEFT_HIP, PL.RIGHT_HIP, PL.LEFT_SHOULDER, PL.RIGHT_SHOULDER],
  lunge:       [PL.LEFT_HIP, PL.RIGHT_HIP, PL.LEFT_KNEE, PL.RIGHT_KNEE, PL.LEFT_ANKLE, PL.RIGHT_ANKLE],
  overhead:    [PL.LEFT_SHOULDER, PL.LEFT_ELBOW, PL.LEFT_HIP, PL.RIGHT_SHOULDER, PL.RIGHT_ELBOW, PL.RIGHT_HIP],
  ankle_df:    [PL.LEFT_KNEE, PL.LEFT_ANKLE, PL.RIGHT_KNEE, PL.RIGHT_ANKLE],
  knee_sld:    [PL.LEFT_HIP, PL.RIGHT_HIP, PL.LEFT_KNEE, PL.RIGHT_KNEE, PL.LEFT_ANKLE, PL.RIGHT_ANKLE],
  hip_abd:     [PL.LEFT_HIP, PL.RIGHT_HIP, PL.LEFT_KNEE, PL.RIGHT_KNEE, PL.LEFT_SHOULDER, PL.RIGHT_SHOULDER],
  bridge_hold: [PL.LEFT_HIP, PL.RIGHT_HIP, PL.LEFT_SHOULDER, PL.RIGHT_SHOULDER, PL.LEFT_KNEE, PL.RIGHT_KNEE],
  wall_slide:  [PL.LEFT_SHOULDER, PL.LEFT_ELBOW, PL.LEFT_HIP, PL.RIGHT_SHOULDER, PL.RIGHT_ELBOW, PL.RIGHT_HIP],
  elbow_rom:   [PL.LEFT_SHOULDER, PL.LEFT_ELBOW, PL.LEFT_WRIST, PL.RIGHT_SHOULDER, PL.RIGHT_ELBOW, PL.RIGHT_WRIST],
};

function buildSequence(joints: Joint[]): TestDef[] {
  const core: TestDef[] = CORE_TESTS.map(t => ({
    id: t.id, name: t.name, duration: t.duration,
    instruction: instructionFor(t.id),
    cameraView: TEST_CAMERA_VIEW[t.id] ?? "front",
  }));
  // Wrist test is intentionally excluded from v1 scoring — flagged "Coming
  // soon" because the wrist landmarks are too small on camera for a reliable
  // flexion/extension angle on phones. If the user picked wrist as a flagged
  // joint, we still run their other selected joint's add-on (if any).
  const cond: TestDef[] = joints
    .filter(j => j !== "none" && j !== "wrist")
    .slice(0, 2)
    .map(j => {
      const c = CONDITIONAL_TESTS[j as keyof typeof CONDITIONAL_TESTS];
      return {
        id: c.id, name: c.name, duration: 10,
        instruction: instructionFor(c.id),
        conditional: true,
        cameraView: TEST_CAMERA_VIEW[c.id] ?? "front",
      };
    });
  return [...core, ...cond];
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
  const [seq, setSeq] = useState<TestDef[]>([]);
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
  const [paused, setPaused] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = paused || showInstructions; }, [paused, showInstructions]);

  // Detection-latency tracking so we can downgrade the model if the device
  // is too slow to keep up with the "full" landmarker.
  const frameTimesRef = useRef<number[]>([]);
  const fallbackCheckedRef = useRef(false);

  useEffect(() => { if (u) setSeq(buildSequence(u.questionnaire?.joints ?? [])); }, [u]);

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
    samplesRef.current = [];
    setCountdown(test.duration);
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
      done = true;
      clearInterval(tickId); clearInterval(sampleId);
      const score: TestResult = skipped
        ? { id: test.id, name: test.name, score: 1, notes: "Skipped", valid: false, cameraView: test.cameraView }
        : { ...scoreSamples(test.id, samplesRef.current, test.duration), cameraView: test.cameraView };
      setResults(r => [...r, score]);
      setTimeout(() => {
        if (idx + 1 >= seq.length) finalize([...results, score]);
        else setIdx(i => i + 1);
      }, 400);
    };
    finishHandlerRef.current = finish;
    const tickId = setInterval(() => {
      if (pausedRef.current) return;
      setElapsed(e => e + 1);
      setCountdown(c => {
        if (c <= 1) { finish(false); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => { clearInterval(tickId); clearInterval(sampleId); finishHandlerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, restartKey]);

  function finalize(allResults: TestResult[]) {
    if (!u) return;
    const validCount = allResults.filter(r => r.valid !== false).length;
    if (validCount < 3) {
      setPhase("failed");
      return;
    }
    const joints = (u.questionnaire?.joints ?? []).filter(j => j !== "none") as Joint[];
    const session = computeSession(allResults, joints, u.age);
    const wasReTest = u.sessions.length > 0;
    const nextRetest = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    updateUser(prev => ({
      ...prev,
      sessions: [...prev.sessions, session],
      firstRetestDone: prev.firstRetestDone || wasReTest,
      nextRetestDate: nextRetest,
      // A new scan resets the 2-week training program.
      programStartDate: new Date().toISOString(),
      programCompletedDays: [],
    }));
    setPhase("done");
    setTimeout(() => navigate({ to: "/app/progress" }), 1200);
  }

  const cur = seq[idx];
  if (!u) return null;
  const progress = seq.length ? ((idx + (phase === "running" ? 1 - countdown / (cur?.duration ?? 1) : 0)) / seq.length) * 100 : 0;

  return (
    <div className="relative flex h-full min-h-[100dvh] flex-col bg-black text-white">
      <div className="relative flex-1 overflow-hidden bg-black">
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-contain [transform:scaleX(-1)]" />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-contain [transform:scaleX(-1)]" />
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
              {seq.length ? `Test ${Math.min(idx + 1, seq.length)} of ${seq.length}` : ""}
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
            const g = TEST_GUIDES[cur.id];
            return (
              <div className="max-h-[78vh] overflow-y-auto rounded-3xl bg-white/95 p-5 text-foreground shadow-2xl">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">Test {idx + 1} of {seq.length} · {g?.reps ?? "10 sec"}</div>
                <div className="mt-0.5 text-xl font-extrabold">{cur.name}</div>
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
                <div className="mt-5 flex gap-2">
                  <button onClick={() => navigate({ to: "/app/screen" })} className="h-12 flex-1 rounded-2xl bg-secondary text-sm font-semibold text-foreground">Exit</button>
                  <button onClick={() => setPhase("running")} disabled={!poseReady} className="h-12 flex-[2] rounded-2xl brand-gradient text-base font-semibold text-primary-foreground disabled:opacity-50">{poseReady ? "I'm ready · Start" : "Loading…"}</button>
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
                onClick={() => { setResults([]); setIdx(0); setPhase("intro"); }}
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
                  {paused || showInstructions ? "Paused" : "In progress"} · Test {idx + 1}/{seq.length}
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
        const g = TEST_GUIDES[cur.id];
        return (
          <div className="absolute inset-0 z-20 flex items-end bg-black/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto max-h-[80vh] w-full max-w-[720px] overflow-y-auto rounded-3xl bg-white/95 p-5 text-foreground shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">Test {idx + 1} of {seq.length} · Paused</div>
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

function scoreSamples(testId: string, samples: any[]): TestResult {
  const name = ({ ...Object.fromEntries(CORE_TESTS.map(t => [t.id, t.name])),
    ...Object.fromEntries(Object.values(CONDITIONAL_TESTS).map(t => [t.id, t.name])) } as Record<string,string>)[testId] ?? testId;
  // Need enough frames with a detected pose to score anything.
  if (samples.length < 15) {
    return { id: testId, name, score: 1, notes: "No pose detected — make sure your full body is in frame", valid: false };
  }
  // Detect actual movement by summing frame-to-frame displacement of major joints.
  const joints = [PL.LEFT_HIP, PL.RIGHT_HIP, PL.LEFT_KNEE, PL.RIGHT_KNEE, PL.LEFT_SHOULDER, PL.RIGHT_SHOULDER, PL.LEFT_WRIST, PL.RIGHT_WRIST];
  let motion = 0;
  for (let i = 1; i < samples.length; i++) {
    for (const j of joints) {
      const a = samples[i - 1][j]; const b = samples[i][j];
      if (!a || !b) continue;
      motion += Math.hypot(a.x - b.x, a.y - b.y);
    }
  }
  const motionPerFrame = motion / Math.max(1, samples.length - 1);
  // "Stillness" tests (balance, bridge_hold) intentionally don't need movement.
  const stillnessTest = testId === "balance" || testId === "bridge_hold";
  if (!stillnessTest && motionPerFrame < 0.015) {
    return { id: testId, name, score: 1, notes: "No movement detected during the test", valid: false };
  }
  switch (testId) {
    case "squat": {
      let minA = 180;
      for (const s of samples) {
        const la = angle(s[PL.LEFT_HIP], s[PL.LEFT_KNEE], s[PL.LEFT_ANKLE]);
        const ra = angle(s[PL.RIGHT_HIP], s[PL.RIGHT_KNEE], s[PL.RIGHT_ANKLE]);
        const a = (la + ra) / 2; if (a > 0) minA = Math.min(minA, a);
      }
      return { id: testId, name, score: scoreFromRange(minA, 95, 25), metric: Math.round(minA), notes: `Min knee angle ${Math.round(minA)}°` };
    }
    case "hinge": {
      let minT = 180;
      for (const s of samples) { const a = angle(s[PL.LEFT_SHOULDER], s[PL.LEFT_HIP], s[PL.LEFT_KNEE]); if (a > 0) minT = Math.min(minT, a); }
      return { id: testId, name, score: scoreFromRange(minT, 110, 25), metric: Math.round(minT) };
    }
    case "balance": {
      const ys = samples.map(s => (s[PL.LEFT_HIP].y + s[PL.RIGHT_HIP].y) / 2);
      const mean = ys.reduce((a,b)=>a+b,0)/ys.length;
      const std = Math.sqrt(ys.reduce((a,b)=>a+(b-mean)**2,0)/ys.length);
      const score: 1|2|3 = std < 0.01 ? 3 : std < 0.025 ? 2 : 1;
      return { id: testId, name, score, metric: Math.round(std*1000)/10 };
    }
    case "lunge":
    case "knee_sld": {
      let minK = 180;
      for (const s of samples) { const a = angle(s[PL.LEFT_HIP], s[PL.LEFT_KNEE], s[PL.LEFT_ANKLE]); if (a > 0) minK = Math.min(minK, a); }
      return { id: testId, name, score: scoreFromRange(minK, 95, 30), metric: Math.round(minK) };
    }
    case "overhead":
    case "wall_slide": {
      let maxArm = 0;
      for (const s of samples) { const a = angle(s[PL.LEFT_HIP], s[PL.LEFT_SHOULDER], s[PL.LEFT_ELBOW]); if (a > maxArm) maxArm = a; }
      const score: 1|2|3 = maxArm > 160 ? 3 : maxArm > 130 ? 2 : 1;
      return { id: testId, name, score, metric: Math.round(maxArm) };
    }
    case "ankle_df": {
      let minA = 180;
      for (const s of samples) { const a = angle(s[PL.LEFT_KNEE], s[PL.LEFT_ANKLE], { x: s[PL.LEFT_ANKLE].x + 0.1, y: s[PL.LEFT_ANKLE].y }); if (a > 0) minA = Math.min(minA, a); }
      return { id: testId, name, score: scoreFromRange(minA, 80, 20), metric: Math.round(minA) };
    }
    case "hip_abd":
    case "bridge_hold": {
      const ys = samples.map(s => (s[PL.LEFT_HIP].y + s[PL.RIGHT_HIP].y) / 2);
      const mean = ys.reduce((a,b)=>a+b,0)/ys.length;
      const std = Math.sqrt(ys.reduce((a,b)=>a+(b-mean)**2,0)/ys.length);
      const score: 1|2|3 = std < 0.012 ? 3 : std < 0.03 ? 2 : 1;
      return { id: testId, name, score, metric: Math.round(std*1000)/10 };
    }
    case "elbow_rom": {
      let maxR = 0;
      for (const s of samples) { const a = angle(s[PL.LEFT_SHOULDER], s[PL.LEFT_ELBOW], s[PL.LEFT_WRIST]); if (a > maxR) maxR = a; }
      return { id: testId, name, score: scoreFromRange(maxR, 160, 30), metric: Math.round(maxR) };
    }
    case "wrist_rom": return { id: testId, name, score: 2, notes: "Self-reported guidance applies" };
    default: return { id: testId, name, score: 1, valid: false };
  }
}
