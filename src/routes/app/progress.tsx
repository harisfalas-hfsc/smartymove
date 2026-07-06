import { createFileRoute } from "@tanstack/react-router";
import { useUser } from "@/lib/store";
import { useScanDecision } from "@/lib/program";
import { ScoreRing } from "@/components/ScoreRing";
import { SubScoreBar } from "@/components/SubScoreBar";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Calendar, TrendingUp, Share2, Lock, AlertCircle, Target, CheckCircle2, Info } from "lucide-react";

export const Route = createFileRoute("/app/progress")({ component: Progress });

function Progress() {
  const u = useUser();
  const decision = useScanDecision();
  if (!u) return null;
  const sessions = u.sessions;
  const latest = sessions[sessions.length - 1];
  const first = sessions[0];
  const data = sessions.map((s, i) => ({ name: `#${i+1}`, score: s.overall }));
  const delta = latest && first ? latest.overall - first.overall : 0;
  const projection = u.firstRetestDone && sessions.length >= 2
    ? Math.min(100, Math.round(latest.overall + Math.max(0, delta) * 1.2)) : null;

  return (
    <div className="pb-6">
      <header className="brand-gradient-strong px-5 pb-7 pt-7 text-primary-foreground">
        <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Progress</div>
        <h1 className="mt-1 text-2xl font-extrabold">Your trajectory</h1>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur"><div className="text-xl font-extrabold">{sessions.length}</div><div className="text-[10px] uppercase tracking-wider opacity-80">Screens</div></div>
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur"><div className="text-xl font-extrabold">{u.streak}</div><div className="text-[10px] uppercase tracking-wider opacity-80">Day streak</div></div>
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur"><div className={`text-xl font-extrabold ${delta >= 0 ? "" : "text-warning"}`}>{delta >= 0 ? "+" : ""}{delta}</div><div className="text-[10px] uppercase tracking-wider opacity-80">Change</div></div>
        </div>
      </header>

      <div className="-mt-4 space-y-4 rounded-t-[2rem] bg-background px-5 pt-5">
        {!latest && (
          <div className="rounded-3xl bg-card p-5 text-center shadow-card">
            <Calendar className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <div className="font-semibold">No screens yet</div>
            <p className="text-sm text-muted-foreground">Take your first Movement Screen to see progress.</p>
          </div>
        )}
        {latest && (
          <div className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-card">
            <ScoreRing value={latest.overall} size={140} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Movement Age</div>
              <div className="mt-0.5 text-3xl font-extrabold brand-text">{latest.movementAge}</div>
              <div className="text-xs text-muted-foreground">Chronological: {u.age}</div>
              <p className="mt-2 text-[11px] text-muted-foreground">Motivational estimate, not a clinical measurement.</p>
            </div>
          </div>
        )}
        {sessions.length >= 2 && (
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-bold">Score history</h3>
              <button
                onClick={() => { /* TODO: share */ }}
                className="flex items-center gap-1 rounded-xl bg-secondary px-3 py-1.5 text-xs font-semibold"
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
            </div>
            <div className="h-44">
              <ResponsiveContainer>
                <LineChart data={data}>
                  <CartesianGrid stroke="oklch(0.92 0.012 220)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis domain={[0,100]} tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.012 220)" }} />
                  <Line type="monotone" dataKey="score" stroke="oklch(0.52 0.14 235)" strokeWidth={3} dot={{ r: 4, fill: "oklch(0.62 0.13 210)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {latest && (
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <h3 className="mb-3 text-base font-bold">Sub-scores</h3>
            <div className="space-y-3">
              <SubScoreBar label="Mobility" value={latest.sub.mobility} hint="Hip hinge, overhead reach, lunge, ankle" />
              <SubScoreBar label="Stability" value={latest.sub.stability} hint="Single-leg balance, lunge, hip abduction" />
              <SubScoreBar label="Balance" value={latest.sub.balance} hint="Single-leg balance (left + right)" />
              <SubScoreBar label="Movement Quality" value={latest.sub.quality} hint="Squat, hip hinge & overhead — compensations included" />
            </div>
          </div>
        )}
        {decision && decision.focuses.length > 0 && (
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <div className="mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="text-base font-bold">Root-cause insights</h3>
            </div>
            <p className="mb-3 text-[11px] text-muted-foreground">
              We grouped your test findings into shared root causes instead of treating each failed test as a separate problem. Your program targets the {decision.focuses.length === 1 ? "cause below" : "two causes below"}.
            </p>
            <ul className="space-y-3">
              {decision.focuses.map((f) => (
                <li key={f.id} className="rounded-2xl border border-primary/30 bg-primary/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-bold text-primary">{f.label}</div>
                    {f.isCluster && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        Cluster · {f.signals.length} signals
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-foreground/80">{f.rationale}</p>
                </li>
              ))}
            </ul>
            {decision.otherFindings.length > 0 && (
              <div className="mt-3 border-t border-border pt-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Also noted (lower priority)</div>
                <ul className="mt-1.5 space-y-1">
                  {decision.otherFindings.map((line, i) => (
                    <li key={i} className="text-[11px] text-muted-foreground">• {line}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {decision && decision.allClean && (
          <div className="rounded-3xl border border-success/40 bg-success/10 p-5">
            <div className="mb-1 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <h3 className="text-base font-bold text-success">Your movement screen looks solid</h3>
            </div>
            <p className="text-sm text-foreground/80">
              No major restrictions or compensations found across the board. Your program shifts to building strength and maintaining what you've got — no corrective block needed.
            </p>
          </div>
        )}
        {decision && decision.cleanPasses.length > 0 && !decision.allClean && (
          <div className="rounded-3xl border border-success/40 bg-success/5 p-5">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <h3 className="text-base font-bold">Passed cleanly — real progress</h3>
            </div>
            <ul className="space-y-1">
              {decision.cleanPasses.map((p) => (
                <li key={p.testId} className="text-sm text-foreground/80">
                  • <strong>{p.testName}</strong> — no compensation detected. We're keeping this area at maintenance-level work while we focus on the areas that need it.
                </li>
              ))}
            </ul>
          </div>
        )}
        {decision && decision.findings.length > 0 && (
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <div className="mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <h3 className="text-base font-bold">Findings & what your program does about them</h3>
            </div>
            <p className="mb-3 text-[11px] text-muted-foreground">
              Every flagged compensation gets its own card — what we saw, why it matters, and the specific direction your program takes to fix the root cause.
            </p>
            <ul className="space-y-3">
              {decision.findings.map((f, i) => (
                <li key={i} className="rounded-2xl border border-border bg-background/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-bold">{f.focusLabel}</div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${f.severity === "fail" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}`}>
                      {f.severity === "fail" ? "Fail" : "Borderline"} · {f.testName}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1.5 text-xs">
                    <div><span className="font-semibold text-foreground">What we saw: </span><span className="text-foreground/80">{f.what}</span></div>
                    <div><span className="font-semibold text-foreground">Why it matters: </span><span className="text-foreground/80">{f.why}</span></div>
                    <div><span className="font-semibold text-primary">Your program: </span><span className="text-foreground/80">{f.program}</span></div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {latest && latest.tests.length > 0 && (
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <h3 className="mb-3 text-base font-bold">Per-test breakdown</h3>
            <ul className="space-y-2">
              {latest.tests.map((t, i) => {
                const bilateral = t.left != null && t.right != null;
                const flag = (t.asymmetry ?? 0) >= 10;
                const scoreLabel = t.valid === false ? "—" : `${t.score}/3`;
                const cleanPass = t.valid !== false && t.score === 3 && (!t.compensations || t.compensations.length === 0);
                const cleanCopy: Record<string, string> = {
                  squat:    "Clean squat — good depth, good alignment.",
                  hinge:    "Good hip hinge — hips did the work, spine stayed neutral.",
                  balance:  "Balanced cleanly — pelvis stayed level.",
                  lunge:    "Clean lunge — depth reached with the knee tracking over the foot.",
                  overhead: "Full overhead reach — no lumbar or shoulder compensation.",
                  ankle_df: "Clean ankle dorsiflexion — heel stayed flat.",
                  knee_sld: "Controlled step-down — knee tracked over the foot.",
                  hip_abd:  "Clean hip abduction — no hike, no trunk lean.",
                  bridge_hold: "Held the bridge with level hips.",
                  wall_slide:  "Full wall slide range — contact maintained.",
                };
                return (
                  <li key={i} className="rounded-2xl border border-border bg-background/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{t.name}</div>
                        {t.viewFindings && t.viewFindings.length > 1 ? (
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {t.viewFindings.map(v => v.view).join(" + ")} views
                          </div>
                        ) : t.cameraView && (
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.cameraView} view</div>
                        )}
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                        t.valid === false ? "bg-muted text-muted-foreground" :
                        t.score === 3 ? "bg-success/20 text-success" :
                        t.score === 2 ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive"
                      }`}>
                        {t.valid === false ? "No data" : `${t.score === 3 ? "Pass" : t.score === 2 ? "Borderline" : "Fail"} · ${scoreLabel}`}
                      </span>
                    </div>
                    {cleanPass && (
                      <div className="mt-1.5 text-[11px] font-medium text-success">
                        {cleanCopy[t.id] ?? "Clean pass — no compensation detected."}
                      </div>
                    )}
                    {bilateral && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span>L <strong className="text-foreground">{t.left}°</strong></span>
                        <span>R <strong className="text-foreground">{t.right}°</strong></span>
                        <span className={flag ? "text-warning font-semibold" : ""}>Asymmetry {t.asymmetry}°</span>
                      </div>
                    )}
                    {t.viewFindings && t.viewFindings.length > 1 ? (
                      <div className="mt-2 space-y-1.5">
                        {t.viewFindings.map((v, vi) => (
                          <div key={vi} className="rounded-xl bg-background p-2">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              <span>{v.view} view</span>
                              <span className={
                                v.valid === false ? "text-muted-foreground" :
                                v.score === 3 ? "text-success" :
                                v.score === 2 ? "text-warning" : "text-destructive"
                              }>
                                {v.valid === false ? "No reading" : v.score === 3 ? "Pass" : v.score === 2 ? "Borderline" : "Fail"}
                              </span>
                            </div>
                            {v.compensations && v.compensations.length > 0 && (
                              <ul className="mt-1 space-y-0.5">
                                {v.compensations.map((c, ci) => (
                                  <li key={ci} className="flex items-start gap-1.5 text-[11px] text-foreground">
                                    <AlertCircle className="mt-[2px] h-3 w-3 shrink-0 text-warning" />
                                    <span>{c}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : t.compensations && t.compensations.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {t.compensations.map((c, ci) => (
                          <span key={ci} className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning">
                            <AlertCircle className="h-3 w-3" /> {c}
                          </span>
                        ))}
                      </div>
                    )}
                    {t.valid === false && t.notes && (
                      <div className="mt-1.5 text-[11px] text-muted-foreground">{t.notes}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="rounded-3xl bg-card p-5 shadow-card">
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-base font-bold">Future projection</h3>
            {!u.firstRetestDone && <Lock className="ml-auto h-4 w-4 text-muted-foreground" />}
          </div>
          {projection ? (
            <>
              <div className="text-3xl font-extrabold brand-text">~{projection}</div>
              <p className="mt-1 text-xs text-muted-foreground">Population-trend estimate if you keep your current habits. Not a personal guarantee.</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Complete one re-test to unlock a projection based on your trajectory.</p>
          )}
        </div>
      </div>
    </div>
  );
}
