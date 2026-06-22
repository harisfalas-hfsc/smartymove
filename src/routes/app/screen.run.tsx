import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getPoseLandmarker, PL } from "@/lib/pose";
import { angle, CORE_TESTS, CONDITIONAL_TESTS, computeSession, scoreFromRange } from "@/lib/movement";
import { updateUser, useUser, type Joint, type TestResult } from "@/lib/store";
import { ChevronLeft, Camera, CheckCircle2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/screen/run")({ component: Runner });

type TestDef = { id: string; name: string; duration: number; instruction: string; conditional?: boolean };

function buildSequence(joints: Joint[]): TestDef[] {
  const core: TestDef[] = CORE_TESTS.map(t => ({ id: t.id, name: t.name, duration: t.duration, instruction: instructionFor(t.id) }));
  const cond: TestDef[] = joints.filter(j => j !== "none").slice(0, 2).map(j => {
    const c = CONDITIONAL_TESTS[j as keyof typeof CONDITIONAL_TESTS];
    return { id: c.id, name: c.name, duration: 10, instruction: instructionFor(c.id), conditional: true };
  });
  return [...core, ...cond];
}

function instructionFor(id: string): string {
  return ({
    squat: "Stand tall, feet shoulder-width. Squat down as deep as comfortable for 3 reps.",
    hinge: "Feet hip-width. Push hips back, hinge forward, keep spine long. 3 reps.",
    balance: "Stand on your right leg, then your left. Hold 5 seconds each.",
    lunge: "Step into a lunge, hold briefly, return. Both sides.",
    overhead: "Reach both arms overhead, then rotate side to side.",
    ankle_df: "Half-kneel, drive front knee over toes without lifting heel.",
    knee_sld: "Slowly step down off a low step on one leg, then the other.",
    hip_abd: "Stand on one leg, lift other leg out to the side. Hold control.",
    bridge_hold: "Lie on back, knees bent, drive hips up and hold the bridge.",
    wall_slide: "Back to wall, slide forearms up and down.",
    elbow_rom: "Bend and straighten elbows fully, slowly.",
    wrist_rom: "Hands forward, flex and extend wrists through full range.",
  } as Record<string,string>)[id] ?? "Follow the on-screen guide.";
}

function Runner() {
  const navigate = useNavigate();
  const u = useUser();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const latestLandmarksRef = useRef<any[] | null>(null);

  const [phase, setPhase] = useState<"setup" | "preview" | "running" | "done">("setup");
  const [seq, setSeq] = useState<TestDef[]>([]);
  const [idx, setIdx] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [poseReady, setPoseReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const samplesRef = useRef<any[]>([]);

  useEffect(() => { if (u) setSeq(buildSequence(u.questionnaire?.joints ?? [])); }, [u]);

  async function start() {
    setError(null);
    setStarting(true);
    setStatusMsg("Requesting camera permission...");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Your browser doesn't support camera access. Try Chrome or Safari.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 720, height: 1280 }, audio: false });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setPhase("preview");
      setStatusMsg("Loading pose detection model...");
      const lm = await getPoseLandmarker();
      setPoseReady(true);
      setStatusMsg("");
      const tick = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const v = videoRef.current; const c = canvasRef.current;
        if (v.readyState >= 2) {
          c.width = v.videoWidth; c.height = v.videoHeight;
          const ctx = c.getContext("2d")!;
          const t = performance.now();
          const res = lm.detectForVideo(v, t);
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
    const sampleId = setInterval(() => { if (latestLandmarksRef.current) samplesRef.current.push(latestLandmarksRef.current); }, 100);
    const tickId = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(tickId); clearInterval(sampleId);
          const score = scoreSamples(test.id, samplesRef.current);
          setResults(r => [...r, score]);
          setTimeout(() => {
            if (idx + 1 >= seq.length) finalize([...results, score]);
            else setIdx(i => i + 1);
          }, 600);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => { clearInterval(tickId); clearInterval(sampleId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx]);

  function finalize(allResults: TestResult[]) {
    if (!u) return;
    const joints = (u.questionnaire?.joints ?? []).filter(j => j !== "none") as Joint[];
    const session = computeSession(allResults, joints, u.age);
    const wasReTest = u.sessions.length > 0;
    const nextRetest = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    updateUser(prev => ({
      ...prev,
      sessions: [...prev.sessions, session],
      firstRetestDone: prev.firstRetestDone || wasReTest,
      nextRetestDate: nextRetest,
      programStartDate: prev.programStartDate ?? prev.createdAt,
    }));
    setPhase("done");
    setTimeout(() => navigate({ to: "/app/progress" }), 1200);
  }

  if (!u) return null;
  const cur = seq[idx];
  const progress = seq.length ? ((idx + (phase === "running" ? 1 - countdown / (cur?.duration ?? 1) : 0)) / seq.length) * 100 : 0;

  return (
    <div className="relative flex h-full min-h-[100dvh] flex-col bg-black text-white">
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover [transform:scaleX(-1)]" />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover [transform:scaleX(-1)]" />
        {(phase === "setup" || phase === "preview") && (
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
          {phase === "preview" && cur && (
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-xl">
              <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Next up</div>
              <div className="mt-0.5 text-xl font-extrabold">{cur.name}</div>
              <p className="mt-2 text-sm opacity-90">{cur.instruction}</p>
              <p className="mt-2 text-[11px] opacity-60">{poseReady ? "Pose detection active" : (statusMsg || "Loading pose model...")}</p>
              <button onClick={() => setPhase("running")} disabled={!poseReady} className="mt-4 h-12 w-full rounded-2xl brand-gradient text-base font-semibold disabled:opacity-50">Start test</button>
            </div>
          )}
          {phase === "running" && cur && (
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest opacity-80">In progress</div>
                  <div className="text-xl font-extrabold">{cur.name}</div>
                </div>
                <div className="text-5xl font-extrabold tabular-nums brand-text">{countdown}</div>
              </div>
              <p className="mt-3 text-sm opacity-90">{cur.instruction}</p>
            </div>
          )}
          {phase === "done" && (
            <div className="rounded-3xl bg-success/30 p-5 text-center backdrop-blur-xl">
              <CheckCircle2 className="mx-auto h-8 w-8" />
              <div className="mt-1 text-lg font-bold">Screen complete</div>
              <p className="text-sm opacity-85">Crunching your scores...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function scoreSamples(testId: string, samples: any[]): TestResult {
  const name = ({ ...Object.fromEntries(CORE_TESTS.map(t => [t.id, t.name])),
    ...Object.fromEntries(Object.values(CONDITIONAL_TESTS).map(t => [t.id, t.name])) } as Record<string,string>)[testId] ?? testId;
  if (samples.length < 5) return { id: testId, name, score: 2, notes: "Limited data — partial score" };
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
    default: return { id: testId, name, score: 2 };
  }
}
