import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useUser } from "@/lib/store";
import { ScoreRing } from "@/components/ScoreRing";
import { SubScoreBar } from "@/components/SubScoreBar";
import { Activity, ArrowRight, Flame, Calendar, Lock, Loader2 } from "lucide-react";
import { useMicroRoutine, useCurrentPhase } from "@/lib/exercises";
import { ExerciseSheet } from "@/components/ExerciseSheet";

export const Route = createFileRoute("/app/")({ component: Home });

function Home() {
  const u = useUser();
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: routine = [], isLoading } = useMicroRoutine(u?.goal, u?.questionnaire?.joints ?? []);
  const phase = useCurrentPhase();
  if (!u) return null;
  const latest = u.sessions[u.sessions.length - 1];
  const daysSince = latest ? Math.floor((Date.now() - new Date(latest.date).getTime()) / 86400000) : null;
  const daysUntilRetest = latest ? Math.max(0, 14 - (daysSince ?? 0)) : null;
  const retestDue = latest != null && (daysSince ?? 0) >= 14;

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
            <div className="mt-1 text-xl font-extrabold">{daysUntilRetest ?? "—"}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-80">Re-test in</div>
          </div>
        </div>
      </header>

      <div className="-mt-5 space-y-4 rounded-t-[2rem] bg-background px-5 pt-6">
        {phase && (
          <div className="rounded-3xl bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Phase</div>
                <div className="text-base font-extrabold capitalize">{phase.label} · Week {phase.weekInPhase}</div>
              </div>
              <div className="flex gap-1.5 text-[10px] font-bold uppercase tracking-wide">
                <span className="rounded-full bg-accent px-2 py-1">Mob {Math.round(phase.ratios.mobility * 100)}%</span>
                <span className="rounded-full bg-accent px-2 py-1">Stab {Math.round(phase.ratios.stability * 100)}%</span>
                <span className="rounded-full bg-accent px-2 py-1">Str {Math.round(phase.ratios.strength * 100)}%</span>
              </div>
            </div>
          </div>
        )}
        {retestDue && (
          <Link to="/app/screen" className="flex items-center justify-between rounded-3xl bg-warning/15 p-4 ring-1 ring-warning/40">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-warning">Retest due</div>
              <div className="text-sm font-semibold">Re-take your Movement Screen to update your plan.</div>
            </div>
            <ArrowRight className="h-5 w-5" />
          </Link>
        )}
        {!latest ? (
          <Link to="/app/screen" className="block rounded-3xl brand-gradient p-5 text-primary-foreground shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Start here</div>
                <div className="mt-1 text-xl font-extrabold">Take your first Movement Screen</div>
                <div className="mt-1 text-sm opacity-90">~5 minutes • camera-based • on-device</div>
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
          </div>
        )}

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-bold">Today's Workout</h3>
            <Link to="/app/program" className="text-xs font-semibold text-primary">Open</Link>
          </div>
          <div className="space-y-2">
            {isLoading && (
              <div className="grid place-items-center rounded-2xl bg-card p-6 shadow-card">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading && routine.length === 0 && (
              <div className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-card">
                No exercises found in the library yet.
              </div>
            )}
            {routine.slice(0, 7).map((e, i) => {
              const locked = !u.premium && i > 0;
              return (
                <button
                  key={e.id}
                  onClick={() => { if (!locked) setOpenId(e.id); }}
                  className={`flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-card transition active:scale-[0.98] ${locked ? "opacity-60" : ""}`}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl brand-gradient-soft text-xl">{e.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold capitalize">{e.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{e.durationSec}s • {e.description}</div>
                  </div>
                  {locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                </button>
              );
            })}
          </div>
        </section>

        {latest && (
          <section>
            <h3 className="mb-2 text-base font-bold">Sub-scores</h3>
            <div className="space-y-3 rounded-3xl bg-card p-5 shadow-card">
              <SubScoreBar label="Mobility" value={latest.sub.mobility} />
              <SubScoreBar label="Stability" value={latest.sub.stability} />
              <SubScoreBar label="Balance" value={latest.sub.balance} />
              <SubScoreBar label="Movement Quality" value={latest.sub.quality} />
              <SubScoreBar label="Strength Capacity" value={latest.sub.strength} />
            </div>
          </section>
        )}
      </div>
      <ExerciseSheet exerciseId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
