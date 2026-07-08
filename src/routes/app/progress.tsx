import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useUser } from "@/lib/store";
import { ScoreRing } from "@/components/ScoreRing";
import { SubScoreBar } from "@/components/SubScoreBar";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Calendar, ChevronDown, ShieldAlert } from "lucide-react";
import { evaluateGraduation, recommendSmartyGym } from "@/lib/graduation";
import { SmartyGymHandoff } from "@/components/SmartyGymHandoff";
import { TEST_GUIDES } from "@/lib/movement";
import { ProgramHistory } from "@/components/ProgramHistory";

export const Route = createFileRoute("/app/progress")({ component: Progress });

function Progress() {
  const u = useUser();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  if (!u) return null;
  const sessions = u.sessions;
  const latest = sessions[sessions.length - 1];
  const first = sessions[0];
  const data = sessions.map((s, i) => ({ name: `#${i + 1}`, score: s.overall }));
  const delta = latest && first ? latest.overall - first.overall : 0;
  const graduation = evaluateGraduation(u);
  const recommendation = recommendSmartyGym(u.goal, graduation.status);
  const safeIdx = selectedIdx == null
    ? Math.max(0, sessions.length - 1)
    : Math.min(selectedIdx, Math.max(0, sessions.length - 1));
  const selected = sessions[safeIdx] ?? latest;
  const completedDays = u.programCompletedDays ?? [];
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="pb-6">
      <header className="brand-gradient-strong px-5 pb-7 pt-7 text-primary-foreground">
        <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Progress</div>
        <h1 className="mt-1 text-2xl font-extrabold">Your journey 📈</h1>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
            <div className="text-xl font-extrabold">{sessions.length}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-80">Scans</div>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
            <div className="text-xl font-extrabold">{u.streak}🔥</div>
            <div className="text-[10px] uppercase tracking-wider opacity-80">Day streak</div>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
            <div className="text-xl font-extrabold">{delta >= 0 ? "+" : ""}{delta}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-80">
              {sessions.length >= 2 ? "Points gained" : "First scan"}
            </div>
          </div>
        </div>
      </header>

      <div className="-mt-4 space-y-4 rounded-t-[2rem] bg-background px-5 pt-5">
        {recommendation && (
          <SmartyGymHandoff
            variant={graduation.status === "cleared" ? "cleared" : "performance-track"}
            recommendation={recommendation}
          />
        )}

        {!latest && (
          <div className="rounded-3xl bg-card p-5 text-center shadow-card">
            <Calendar className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <div className="font-semibold">No scans yet</div>
            <p className="text-sm text-muted-foreground">Take your first Movement Screen to see progress.</p>
          </div>
        )}

        {sessions.length >= 2 && (
          <section className="rounded-3xl bg-card p-5 shadow-card">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-base font-bold">📈 Score history</h3>
              <span className="text-[11px] text-muted-foreground">{sessions.length} scans</span>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Your overall movement score over time. Higher is better (out of 100).
            </p>
            <div className="h-40">
              <ResponsiveContainer>
                <LineChart data={data}>
                  <CartesianGrid stroke="oklch(0.92 0.012 220)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.012 220)" }} />
                  <Line type="monotone" dataKey="score" stroke="oklch(0.52 0.14 235)" strokeWidth={3} dot={{ r: 4, fill: "oklch(0.62 0.13 210)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {delta !== 0 && (
              <p className="mt-2 text-xs text-foreground/80">
                {delta > 0 ? "🎉" : "⚠️"} You&apos;re {delta > 0 ? "up" : "down"} <strong>{Math.abs(delta)} points</strong> since your first scan.
              </p>
            )}
          </section>
        )}

        {sessions.length > 0 && (
          <section className="rounded-3xl bg-card p-5 shadow-card">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-base font-bold">🔍 View a scan</h3>
              <span className="text-[11px] text-muted-foreground">Pick any date</span>
            </div>
            <div className="relative">
              <select
                value={safeIdx}
                onChange={(e) => setSelectedIdx(Number(e.target.value))}
                className="w-full appearance-none rounded-2xl border border-border bg-background py-3 pl-4 pr-10 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {sessions.map((s, i) => (
                  <option key={i} value={i}>
                    Scan #{i + 1} · {fmtDate(s.date)} · Score {s.overall}
                    {i === sessions.length - 1 ? " · Latest" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </section>
        )}

        {selected && (
          <div className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-card">
            <ScoreRing value={selected.overall} size={140} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Movement Age</div>
              <div className="mt-0.5 text-3xl font-extrabold brand-text">{selected.movementAge}</div>
              <div className="text-xs text-muted-foreground">Your real age: {u.age}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{fmtDate(selected.date)}</div>
              <p className="mt-2 text-[11px] text-muted-foreground">How young your body moves. Just a guide, not medical.</p>
            </div>
          </div>
        )}

        {selected?.redFlags && selected.redFlags.length > 0 && (
          <div className="rounded-3xl border-2 border-destructive/50 bg-destructive/10 p-5 shadow-card">
            <div className="mb-2 flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-base font-bold">Pain reported — please read</h3>
            </div>
            <p className="mb-3 text-sm text-foreground/90">
              You reported pain during {selected.redFlags.length === 1 ? "this movement" : "these movements"}.
              We&apos;ve paused loading exercises for the affected areas. Please see a qualified clinician before pushing further.
            </p>
            <ul className="space-y-1">
              {selected.redFlags.map((id) => (
                <li key={id} className="flex items-center gap-2 text-sm font-semibold text-destructive">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  {TEST_GUIDES[id]?.name ?? id}
                </li>
              ))}
            </ul>
          </div>
        )}

        {selected && (
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <h3 className="mb-1 text-base font-bold">🎯 Sub-scores</h3>
            <p className="mb-3 text-[11px] text-muted-foreground">Scan #{safeIdx + 1} · {fmtDate(selected.date)}</p>
            <div className="space-y-3">
              <SubScoreBar label="Mobility" value={selected.sub.mobility} hint="How freely your joints move" />
              <SubScoreBar label="Stability" value={selected.sub.stability} hint="How steady you stay under load" />
              <SubScoreBar label="Balance" value={selected.sub.balance} hint="Left/right single-leg control" />
              <SubScoreBar label="Movement Quality" value={selected.sub.quality} hint="Clean form without compensations" />
            </div>
          </div>
        )}

        {selected && selected.tests.length > 0 && (
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <h3 className="mb-1 text-base font-bold">📋 Test-by-test results</h3>
            <p className="mb-3 text-[11px] text-muted-foreground">
              Scan #{safeIdx + 1} · {fmtDate(selected.date)} · tap any test for details
            </p>
            <ul className="space-y-2">
              {selected.tests.map((t, i) => {
                const bilateral = t.left != null && t.right != null;
                const flag = (t.asymmetry ?? 0) >= 10;
                const pained = t.score === 0;
                const scoreLabel = t.valid === false ? (pained ? "0/3" : "—") : `${t.score}/3`;
                const emoji = pained
                  ? "🩹"
                  : t.valid === false
                    ? "❔"
                    : t.score === 3
                      ? "✅"
                      : t.score === 2
                        ? "🟡"
                        : "🔴";
                const hasDetail = !!(
                  bilateral ||
                  (t.sideScores && (t.sideScores.right || t.sideScores.left)) ||
                  (t.compensations && t.compensations.length > 0) ||
                  (t.valid === false && t.notes)
                );
                return (
                  <li key={i} className="rounded-2xl border border-border bg-background/60">
                    <details className="group">
                      <summary className={`flex list-none items-center gap-2 p-3 ${hasDetail ? "cursor-pointer" : "cursor-default"}`}>
                        <span className="text-lg leading-none">{emoji}</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{t.name}</span>
                        <span className="shrink-0 text-xs font-bold tabular-nums text-foreground/80">{scoreLabel}</span>
                        {hasDetail && (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                        )}
                      </summary>
                      {hasDetail && (
                        <div className="space-y-2 border-t border-border/60 px-3 pb-3 pt-2 text-[11px]">
                          {bilateral && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                              <span>Left <strong className="text-foreground">{t.left}°</strong></span>
                              <span>Right <strong className="text-foreground">{t.right}°</strong></span>
                              <span className={flag ? "font-semibold text-warning" : ""}>Difference {t.asymmetry}°</span>
                            </div>
                          )}
                          {t.sideScores && (t.sideScores.right || t.sideScores.left) && (
                            <>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                                {t.sideScores.right && (
                                  <span>Right <strong className="text-foreground">{t.sideScores.right.score}/3</strong></span>
                                )}
                                {t.sideScores.left && (
                                  <span>Left <strong className="text-foreground">{t.sideScores.left.score}/3</strong></span>
                                )}
                              </div>
                              {t.asymmetryFlag && (
                                <div className="rounded-lg bg-warning/10 px-2 py-1.5 font-medium text-warning">
                                  ⚠️ Your{" "}
                                  {(t.sideScores.right?.score ?? 3) < (t.sideScores.left?.score ?? 3) ? "right" : "left"}{" "}
                                  side is weaker. Your program gives it extra work.
                                </div>
                              )}
                            </>
                          )}
                          {t.compensations && t.compensations.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {t.compensations.map((c, ci) => (
                                <span key={ci} className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 font-semibold text-warning">
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                          {t.valid === false && t.notes && (
                            <div className="text-muted-foreground">{t.notes}</div>
                          )}
                        </div>
                      )}
                    </details>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <ProgramHistory includeCurrent title="🏋️ Training programs" subtitle="Every scan has its own full workout. Open any program to view it again." />
      </div>
    </div>
  );
}