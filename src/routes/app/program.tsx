import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useUser, updateUser } from "@/lib/store";
import { useMicroRoutine, useCurrentPhase } from "@/lib/exercises";
import { ExerciseSheet } from "@/components/ExerciseSheet";
import { Play, Pause, CheckCircle2, Lock, ChevronLeft, ChevronRight, Crown, Info } from "lucide-react";

export const Route = createFileRoute("/app/program")({ component: Program });

function Program() {
  const u = useUser();
  const [running, setRunning] = useState(false);
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  const { data: routine = [] } = useMicroRoutine(u?.goal, u?.questionnaire?.joints ?? []);
  const phase = useCurrentPhase();
  const cur = routine[idx];

  useEffect(() => {
    if (!running || !cur) return;
    setRemaining(cur.durationSec);
    intervalRef.current = window.setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [running, idx, cur]);

  if (!u || !cur) return null;

  function completeSession() {
    const today = new Date().toISOString().slice(0,10);
    updateUser(prev => {
      const already = prev.programDays.find(d => d.date === today);
      const programDays = already ? prev.programDays.map(d => d.date === today ? { ...d, completed: true } : d)
        : [...prev.programDays, { date: today, completed: true }];
      const days = new Set(programDays.filter(d => d.completed).map(d => d.date));
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const k = d.toISOString().slice(0,10);
        if (days.has(k)) streak++; else break;
      }
      return { ...prev, programDays, streak };
    });
  }

  return (
    <div className="pb-6">
      <header className="brand-gradient-strong px-5 pb-7 pt-7 text-primary-foreground">
        <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Today's program</div>
        <h1 className="mt-1 text-2xl font-extrabold">5-minute corrective routine</h1>
        <p className="mt-1 text-sm opacity-90">
          {phase ? `${phase.label} · Week ${phase.weekInPhase} · ${Math.round(phase.ratios.mobility * 100)}/${Math.round(phase.ratios.stability * 100)}/${Math.round(phase.ratios.strength * 100)} Mob/Stab/Str` : "Built around your goal & joint focus."}
        </p>
      </header>

      <div className="-mt-4 space-y-4 rounded-t-[2rem] bg-background px-5 pt-5">
        <div className="rounded-3xl bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button disabled={idx === 0} onClick={() => { setIdx(i => i - 1); setRunning(false); }} className="grid h-9 w-9 place-items-center rounded-xl bg-secondary disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Exercise {idx + 1} / {routine.length}</div>
              <button disabled={idx === routine.length - 1} onClick={() => { setIdx(i => i + 1); setRunning(false); }} className="grid h-9 w-9 place-items-center rounded-xl bg-secondary disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <div className="text-3xl tabular-nums font-extrabold brand-text">{running ? remaining : cur.durationSec}s</div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl brand-gradient-soft text-4xl">{cur.emoji}</span>
            <div className="min-w-0">
              <div className="text-xl font-extrabold capitalize">{cur.name}</div>
              <p className="mt-0.5 text-sm text-muted-foreground">{cur.description}</p>
              <button onClick={() => setOpenId(cur.id)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                <Info className="h-3.5 w-3.5" /> See demonstration
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => setRunning(r => !r)} className="flex items-center justify-center gap-2 rounded-2xl brand-gradient p-3 font-semibold text-primary-foreground shadow-soft">
              {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> {remaining === 0 ? "Start" : "Resume"}</>}
            </button>
            <button onClick={() => { if (idx === routine.length - 1) completeSession(); else { setIdx(i => i + 1); setRunning(false); } }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-secondary p-3 font-semibold">
              {idx === routine.length - 1 ? <><CheckCircle2 className="h-4 w-4" /> Finish</> : "Next"}
            </button>
          </div>
        </div>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Full routine</h3>
          <div className="space-y-2">
            {routine.map((e, i) => {
              const locked = !u.premium && i >= 1;
              return (
                <button key={e.id} onClick={() => { if (locked) return; setIdx(i); setOpenId(e.id); }}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left shadow-card transition-all ${i === idx ? "bg-accent ring-2 ring-primary" : "bg-card"} ${locked ? "opacity-60" : ""}`}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl brand-gradient-soft text-xl">{e.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold capitalize">{e.name}</div>
                    <div className="text-xs text-muted-foreground">{e.durationSec}s</div>
                  </div>
                  {locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                </button>
              );
            })}
          </div>
        </section>

        {!u.premium && (
          <div className="rounded-3xl brand-gradient p-5 text-primary-foreground shadow-soft">
            <Crown className="h-5 w-5" />
            <div className="mt-1 text-base font-extrabold">Unlock the full daily routine</div>
            <p className="text-sm opacity-90">Premium unlocks 3-5 daily exercises, re-tests, joint-specific tests, Movement Age, and Future Projection. €4.99/mo.</p>
            <button onClick={() => updateUser({ premium: true })} className="mt-3 h-11 w-full rounded-2xl bg-white font-semibold text-primary">Start 7-day free trial</button>
          </div>
        )}
      </div>
      <ExerciseSheet exerciseId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
