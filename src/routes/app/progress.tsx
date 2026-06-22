import { createFileRoute } from "@tanstack/react-router";
import { useUser } from "@/lib/store";
import { ScoreRing } from "@/components/ScoreRing";
import { SubScoreBar } from "@/components/SubScoreBar";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Calendar, TrendingUp, Share2, Lock } from "lucide-react";

export const Route = createFileRoute("/app/progress")({ component: Progress });

function Progress() {
  const u = useUser();
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
              <button className="flex items-center gap-1 rounded-xl bg-secondary px-3 py-1.5 text-xs font-semibold"><Share2 className="h-3.5 w-3.5" /> Share</button>
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
              <SubScoreBar label="Mobility" value={latest.sub.mobility} />
              <SubScoreBar label="Stability" value={latest.sub.stability} />
              <SubScoreBar label="Balance" value={latest.sub.balance} />
              <SubScoreBar label="Movement Quality" value={latest.sub.quality} />
              <SubScoreBar label="Strength Capacity" value={latest.sub.strength} />
            </div>
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
