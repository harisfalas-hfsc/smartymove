import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useUser } from "@/lib/store";
import { ScoreRing } from "@/components/ScoreRing";
import { SubScoreBar } from "@/components/SubScoreBar";
import { Activity, ArrowRight, Flame, Calendar, CheckCircle2, Dumbbell, Moon, LineChart as LineChartIcon, RefreshCw, TrendingUp, Target } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useCurrentPhase } from "@/lib/exercises";
import { ExerciseSheet } from "@/components/ExerciseSheet";
import { evaluateProgress } from "@/lib/corrective/progression";
import { getOngoingTrack } from "@/lib/corrective/phase";
import { useProgramStatus, useScanDecision, isTrainingDay, TRAINING_DAY_INDICES, PROGRAM_SESSIONS, PROGRAM_LENGTH_DAYS } from "@/lib/program";
import { evaluateRescan } from "@/lib/corrective/rescan";
import { evaluateGraduation, recommendSmartyGym } from "@/lib/graduation";
import { SmartyGymHandoff } from "@/components/SmartyGymHandoff";

export const Route = createFileRoute("/app/")({ component: Home });

function Home() {
  const u = useUser();
  const [openId, setOpenId] = useState<string | null>(null);
  const phase = useCurrentPhase();
  const status = useProgramStatus();
  const decision = useScanDecision();
  if (!u) return null;
  const latest = u.sessions[u.sessions.length - 1];
  const first = u.sessions[0];
  const daysSince = latest ? Math.floor((Date.now() - new Date(latest.date).getTime()) / 86400000) : null;
  const daysUntilRetest = latest ? Math.max(0, 14 - (daysSince ?? 0)) : null;
  const progression = evaluateProgress(u.sessions);
  const ongoing = getOngoingTrack(u.programStartDate ?? u.createdAt, u.goal);
  const rescan = evaluateRescan(u, status);
  const graduation = evaluateGraduation(u);
  const recommendation = graduation.status === "cleared" ? recommendSmartyGym(u.goal, graduation.status) : null;
  const chartData = u.sessions.map((s, i) => ({ name: `#${i + 1}`, score: s.overall }));
  const delta = latest && first ? latest.overall - first.overall : 0;

  return (
    <div className="pb-6">
      <header className="brand-gradient-strong px-5 pb-8 pt-7 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Hi, {u.name.split(" ")[0]}</div>
            <div className="mt-0.5 text-lg font-bold">Ready to move smarter?</div>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Activity className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur">
            <Flame className="mx-auto h-4 w-4" />
            <div className="mt-1 text-xl font-extrabold">{u.streak}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-80">Streak</div>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur">
            <Activity className="mx-auto h-4 w-4" />
            <div className="mt-1 text-xl font-extrabold">{latest?.overall ?? "—"}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-80">Score</div>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur">
            <Calendar className="mx-auto h-4 w-4" />
            <div className="mt-1 text-xl font-extrabold">
              {daysUntilRetest ?? "—"}{daysUntilRetest != null && <span className="text-xs font-bold opacity-80">d</span>}
            </div>
            <div className="text-[10px] uppercase tracking-wider opacity-80">
              {daysUntilRetest === 0 ? "Rescan today" : "Days to rescan"}
            </div>
          </div>
        </div>
      </header>

      <div className="-mt-5 space-y-4 rounded-t-[2rem] bg-background px-5 pt-6">
        {recommendation && (
          <SmartyGymHandoff variant="cleared" recommendation={recommendation} />
        )}
        {rescan && rescan.reason !== "first-scan" && (
          <Link
            to="/app/screen"
            className="group relative block overflow-hidden rounded-3xl bg-card p-[2px] shadow-soft transition-transform duration-200 hover:-translate-y-0.5"
            style={{ textDecoration: "none", background: "linear-gradient(135deg, oklch(0.62 0.13 210), oklch(0.72 0.15 160))" }}
          >
            <div className="relative rounded-[calc(1.5rem-2px)] bg-card p-5">
              <span
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-2xl"
                style={{ background: "linear-gradient(135deg, oklch(0.62 0.13 210), oklch(0.72 0.15 160))" }}
              />
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl brand-gradient text-primary-foreground shadow-soft">
                  <RefreshCw className="h-4 w-4" />
                </span>
                <div className="text-[10px] font-black uppercase tracking-widest brand-text">
                  {rescan.reason === "foundation-complete" ? "Foundation complete" : rescan.reason === "goal-changed" ? "Goal updated" : rescan.reason === "self-reported-change" ? "Something shifted" : rescan.reason === "no-improvement" ? "Program adjustment" : "Time to rescan"}
                </div>
                {rescan.urgency === "high" && (
                  <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-primary">
                    Recommended
                  </span>
                )}
              </div>
              <div className="mt-2 text-xl font-extrabold text-foreground">{rescan.title}</div>
              <p className="mt-1.5 text-sm text-muted-foreground">{rescan.message}</p>
              <div className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl brand-gradient px-5 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 group-hover:scale-[1.02]">
                {rescan.cta} <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        )}
        {phase && (
          <div className="rounded-3xl bg-card p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Phase</div>
                <div className="text-base font-extrabold capitalize">{phase.label} · Week {phase.weekInPhase}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Program #{Math.max(1, u.sessions.length)} · {(u.programCompletedDays?.length ?? 0)} sessions this program · {u.sessions.length} scan{u.sessions.length === 1 ? "" : "s"} total
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-1.5 text-[10px] font-bold uppercase tracking-wide">
                <span className="rounded-full bg-accent px-2 py-1">Mob {Math.round(phase.ratios.mobility * 100)}%</span>
                <span className="rounded-full bg-accent px-2 py-1">Stab {Math.round(phase.ratios.stability * 100)}%</span>
                <span className="rounded-full bg-accent px-2 py-1">Str {Math.round(phase.ratios.strength * 100)}%</span>
              </div>
            </div>
          </div>
        )}
        {progression && progression.status !== "first" && (
          <div className={`rounded-3xl p-4 shadow-card ${progression.status === "improved" ? "bg-success/15 ring-1 ring-success/40" : progression.status === "stalled" ? "bg-warning/15 ring-1 ring-warning/40" : "bg-card"}`}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Latest re-test</div>
            <div className="mt-0.5 text-base font-extrabold">{progression.headline}</div>
            <p className="mt-1 text-xs text-muted-foreground">{progression.detail}</p>
          </div>
        )}
        {ongoing.active && (
          <div className="rounded-3xl brand-gradient-soft p-4 shadow-card">
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Ongoing program</div>
            <div className="mt-0.5 text-base font-extrabold">{ongoing.label}</div>
            <p className="mt-1 text-xs text-muted-foreground">{ongoing.description}</p>
          </div>
        )}
        {!latest ? (
          <Link to="/app/screen" className="block rounded-3xl brand-gradient p-5 text-primary-foreground shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Start here</div>
                <div className="mt-1 text-xl font-extrabold">Take your first Movement Screen</div>
                <div className="mt-1 text-sm opacity-90">~8 minutes • camera-based • on-device</div>
              </div>
              <ArrowRight className="h-6 w-6" />
            </div>
          </Link>
        ) : (
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <ScoreRing value={latest.overall} size={140} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Movement Age</div>
                <div className="mt-0.5 text-3xl font-extrabold brand-text">{latest.movementAge}</div>
                <div className="text-xs text-muted-foreground">Chronological: {u.age}</div>
                <Link to="/app/progress" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  See breakdown <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">Movement Age is a motivational estimate, not a medical measurement.</p>
            <Link
              to="/app/screen"
              className="mt-4 flex items-center justify-center gap-2 rounded-2xl brand-gradient px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
              style={{ textDecoration: "none" }}
            >
              <RefreshCw className="h-4 w-4" /> Rescan &amp; update your score
            </Link>
          </div>
        )}

        {latest && status && <ProgramCta status={status} />}

        {latest && (
          <section>
            <h3 className="mb-2 text-base font-bold">Quick actions</h3>
            <div className="grid grid-cols-3 gap-2">
              <Link
                to="/app/screen"
                className="flex flex-col items-center gap-2 rounded-2xl bg-card p-3 text-center shadow-card"
                style={{ textDecoration: "none" }}
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl brand-gradient-soft text-primary">
                  <Activity className="h-5 w-5" />
                </span>
                <span className="text-xs font-bold text-foreground">Rescan</span>
              </Link>
              <Link
                to="/app/program"
                className="flex flex-col items-center gap-2 rounded-2xl bg-card p-3 text-center shadow-card"
                style={{ textDecoration: "none" }}
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl brand-gradient-soft text-primary">
                  <Dumbbell className="h-5 w-5" />
                </span>
                <span className="text-xs font-bold text-foreground">Program</span>
              </Link>
              <Link
                to="/app/progress"
                className="flex flex-col items-center gap-2 rounded-2xl bg-card p-3 text-center shadow-card"
                style={{ textDecoration: "none" }}
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl brand-gradient-soft text-primary">
                  <LineChart className="h-5 w-5" />
                </span>
                <span className="text-xs font-bold text-foreground">Progress</span>
              </Link>
            </div>
          </section>
        )}

        {latest && (
          <section>
            <h3 className="mb-2 text-base font-bold">Sub-scores</h3>
            <div className="space-y-3 rounded-3xl bg-card p-5 shadow-card">
              <SubScoreBar label="Mobility" value={latest.sub.mobility} />
              <SubScoreBar label="Stability" value={latest.sub.stability} />
              <SubScoreBar label="Balance" value={latest.sub.balance} />
              <SubScoreBar label="Movement Quality" value={latest.sub.quality} />
            </div>
          </section>
        )}

        {u.sessions.length >= 2 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-bold">Score history</h3>
              <Link to="/app/progress" className="text-xs font-semibold text-primary">Full progress →</Link>
            </div>
            <div className="rounded-3xl bg-card p-4 shadow-card">
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span>{u.sessions.length} screens · <strong className={delta >= 0 ? "text-success" : "text-warning"}>{delta >= 0 ? "+" : ""}{delta}</strong> since first scan</span>
              </div>
              <div className="h-36">
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="oklch(0.92 0.012 220)" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={10} width={28} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.012 220)" }} />
                    <Line type="monotone" dataKey="score" stroke="oklch(0.52 0.14 235)" strokeWidth={3} dot={{ r: 3, fill: "oklch(0.62 0.13 210)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {latest && status && !status.locked && status.reason === null && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-bold">Program schedule</h3>
              <Link to="/app/program" className="text-xs font-semibold text-primary">Open program →</Link>
            </div>
            <MiniSchedule status={status} />
          </section>
        )}

        {decision && decision.focuses.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-bold">Your focus areas</h3>
              <Link to="/app/progress" className="text-xs font-semibold text-primary">All findings →</Link>
            </div>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span>What your program targets right now</span>
            </div>
            <ul className="space-y-3">
              {decision.focuses.map((f, idx) => {
                const relatedTests = Array.from(
                  new Map(f.signals.map((s) => [s.testName, s.severity])).entries(),
                );
                return (
                  <li key={f.id} className="rounded-3xl bg-card p-4 shadow-card">
                    <div className="flex items-start gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl brand-gradient text-sm font-extrabold text-primary-foreground">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-extrabold text-foreground">{f.label}</div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.rationale}</p>
                      </div>
                    </div>
                    {relatedTests.length > 0 && (
                      <div className="mt-3 border-t border-border/60 pt-3">
                        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Flagged in</div>
                        <ul className="space-y-1">
                          {relatedTests.map(([name, sev]) => (
                            <li key={name} className="flex items-center gap-2 text-xs">
                              <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${sev === "fail" ? "bg-destructive" : "bg-warning"}`} />
                              <span className="truncate text-foreground/90">{name}</span>
                              <span className={`ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-wide ${sev === "fail" ? "text-destructive" : "text-warning"}`}>
                                {sev === "fail" ? "Fail" : "Borderline"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {decision && decision.allClean && (
          <div className="rounded-3xl border border-success/40 bg-success/10 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-bold text-success">Movement screen looks solid</span>
            </div>
            <p className="mt-1 text-xs text-foreground/80">No major restrictions found. Your program focuses on strength and maintenance.</p>
          </div>
        )}
      </div>
      <ExerciseSheet exerciseId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function MiniSchedule({ status }: { status: NonNullable<ReturnType<typeof useProgramStatus>> }) {
  const days = Array.from({ length: PROGRAM_LENGTH_DAYS }, (_, i) => i + 1);
  const completed = new Set(status.completedDays);
  const start = new Date(status.startDate);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayIndex = Math.floor((today - startDay) / 86400000) + 1;
  return (
    <Link
      to="/app/program"
      className="block rounded-3xl bg-card p-4 shadow-card"
      style={{ textDecoration: "none" }}
    >
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{status.completedDays.length} / {PROGRAM_SESSIONS} sessions</span>
        <span className="font-semibold text-primary">{status.daysRemaining} day{status.daysRemaining === 1 ? "" : "s"} left</span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const done = completed.has(d);
          const isToday = d === todayIndex;
          const missed = !done && d < todayIndex;
          const dayDate = new Date(startDay + (d - 1) * 86400000);
          const dayNum = dayDate.getDate();
          const tile = done
            ? "bg-success/15 text-success ring-1 ring-success/40"
            : isToday
              ? "brand-gradient text-primary-foreground ring-2 ring-primary/40"
              : missed
                ? "bg-warning/15 text-warning ring-1 ring-warning/40"
                : "bg-secondary text-foreground/80";
          return (
            <div key={d} className={`flex flex-col items-center justify-center rounded-lg py-1 leading-tight ${tile}`}>
              <span className="text-[9px] font-bold uppercase opacity-70">D{d}</span>
              <span className="text-sm font-extrabold">{dayNum}</span>
              {done && <CheckCircle2 className="h-2.5 w-2.5" />}
            </div>
          );
        })}
      </div>
    </Link>
  );
}

function ProgramCta({ status }: { status: NonNullable<ReturnType<typeof useProgramStatus>> }) {
  // Today's day index within the 2-week program (1-based). Outside range → program closed.
  const start = new Date(status.startDate);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayIndex = Math.floor((today - startDay) / 86400000) + 1;
  const inProgram = dayIndex >= 1 && dayIndex <= 14;
  const training = inProgram && isTrainingDay(dayIndex);
  const sessionNumber = training ? TRAINING_DAY_INDICES.indexOf(dayIndex) + 1 : null;
  const done = inProgram && status.completedDays.includes(dayIndex);

  if (status.locked) {
    return null;
  }

  if (!inProgram) {
    return (
      <Link to="/app/program" className="block rounded-3xl brand-gradient p-5 text-primary-foreground shadow-soft">
        <div className="text-xs font-semibold uppercase tracking-widest opacity-85">Your 2-week program</div>
        <div className="mt-1 text-lg font-extrabold">Open your training program</div>
        <div className="mt-2 flex items-center gap-1 text-sm font-semibold opacity-95">Start improving your movement <ArrowRight className="h-4 w-4" /></div>
      </Link>
    );
  }

  if (!training) {
    return (
      <Link to="/app/program" className="block rounded-3xl bg-card p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl brand-gradient-soft"><Moon className="h-5 w-5 text-primary" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Today · Day {dayIndex}</div>
            <div className="text-base font-extrabold">Rest day</div>
            <div className="text-xs text-muted-foreground">{status.completedDays.length} / {PROGRAM_SESSIONS} sessions done</div>
          </div>
          <ArrowRight className="h-5 w-5 text-primary" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/app/program"
      className={`block rounded-3xl p-5 shadow-soft ${done ? "bg-card shadow-card" : "brand-gradient text-primary-foreground"}`}
    >
      <div className="flex items-center gap-3">
        <span className={`grid h-12 w-12 place-items-center rounded-2xl ${done ? "brand-gradient-soft text-primary" : "bg-white/20 text-white"}`}>
          {done ? <CheckCircle2 className="h-6 w-6" /> : <Dumbbell className="h-6 w-6" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className={`text-[10px] font-bold uppercase tracking-widest ${done ? "text-muted-foreground" : "opacity-85"}`}>
            Today · Session {sessionNumber} / {PROGRAM_SESSIONS}
          </div>
          <div className="text-base font-extrabold">
            {done ? "Completed — great work!" : "Start today's training"}
          </div>
          <div className={`text-xs ${done ? "text-muted-foreground" : "opacity-90"}`}>
            {status.completedDays.length} / {PROGRAM_SESSIONS} sessions done · {status.daysRemaining} day{status.daysRemaining === 1 ? "" : "s"} left
          </div>
        </div>
        <ArrowRight className={`h-5 w-5 ${done ? "text-primary" : ""}`} />
      </div>
    </Link>
  );
}
