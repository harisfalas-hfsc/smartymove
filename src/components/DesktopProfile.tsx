import { useUser, updateUser, setUser, type Goal } from "@/lib/store";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ScoreRing";
import { SubScoreBar } from "@/components/SubScoreBar";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Activity, LogOut, Smartphone } from "lucide-react";

export function DesktopProfile() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const u = useUser();
  if (!mounted) return null;
  if (!u) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-8 text-center">
        <div>
          <h1 className="text-xl font-bold">SmartyMove</h1>
          <p className="text-muted-foreground">Please sign in on your phone to view this account.</p>
          <a href="/" className="mt-4 inline-block rounded-2xl brand-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground">Open app</a>
        </div>
      </div>
    );
  }
  return <DesktopProfileInner key={u.id} />;
}

function DesktopProfileInner() {
  const u = useUser()!;
  const [name, setName] = useState(u.name);
  const [email, setEmail] = useState(u.email);
  const [age, setAge] = useState(u.age);
  const [goal, setGoal] = useState<Goal | undefined>(u.goal);
  const [saved, setSaved] = useState(false);
  const latest = u.sessions[u.sessions.length - 1];
  const data = u.sessions.map((s, i) => ({ name: `#${i+1}`, score: s.overall }));

  function save() {
    updateUser({ name, email, age, goal });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_oklch(0.96_0.03_210),_oklch(0.99_0.005_220))]">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-8 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-2xl brand-gradient text-primary-foreground"><Activity className="h-5 w-5" /></span>
          <div className="flex-1">
            <div className="text-sm font-bold tracking-tight">SmartyMove</div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Account portal</div>
          </div>
          <a href="/app" className="hidden items-center gap-2 rounded-2xl bg-secondary px-3 py-2 text-sm font-semibold lg:inline-flex"><Smartphone className="h-4 w-4" /> Mobile app</a>
          <button onClick={() => { setUser(null); window.location.href = "/"; }} className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2 text-sm font-semibold"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-6 px-8 py-8 lg:grid-cols-[1.2fr_1fr]">
        <section className="space-y-6">
          <div className="rounded-3xl bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold">Profile</h2>
            <p className="text-sm text-muted-foreground">Edit your details. Movement scoring is calibrated to your age.</p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5"><Label htmlFor="dn">Name</Label><Input id="dn" value={name} onChange={e => setName(e.target.value)} className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label htmlFor="de">Email</Label><Input id="de" value={email} onChange={e => setEmail(e.target.value)} className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label htmlFor="da">Age</Label><Input id="da" type="number" min={12} max={100} value={age} onChange={e => setAge(Number(e.target.value))} className="h-11 rounded-xl" /></div>
              <div className="col-span-2 space-y-1.5">
                <Label>Goal</Label>
                <select value={goal ?? ""} onChange={e => setGoal((e.target.value || undefined) as Goal | undefined)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="">—</option>
                  <option value="reduce_pain">Reduce pain</option>
                  <option value="prevent_injury">Prevent injury</option>
                  <option value="start_sport">Start a sport / running</option>
                  <option value="perform_better">Perform better</option>
                  <option value="feel_better">Move and feel better</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <Button onClick={save} className="h-11 rounded-2xl brand-gradient font-semibold shadow-soft">Save changes</Button>
              {saved && <span className="text-sm font-semibold text-success">Saved</span>}
            </div>
          </div>

          <div className="rounded-3xl bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold">Subscription</h2>
            <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl brand-gradient-soft p-4">
              <div>
                <div className="font-bold">{u.premium ? "Premium" : "Free"}</div>
                <div className="text-xs text-muted-foreground">{u.premium ? "€4.99/mo · cancel anytime" : "Upgrade for daily routines, re-tests, joint tests, Movement Age, projections"}</div>
              </div>
              <Button onClick={() => updateUser({ premium: !u.premium })} className="rounded-2xl">{u.premium ? "Cancel" : "Upgrade"}</Button>
            </div>
          </div>

          <div className="rounded-3xl bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold">Joint focus</h2>
            <p className="mt-1 text-sm text-muted-foreground">{(u.questionnaire?.joints ?? []).join(", ") || "—"}</p>
            <a href="/onboarding/joints" className="mt-3 inline-block text-sm font-semibold text-primary">Update on mobile →</a>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl bg-card p-6 text-center shadow-card">
            <div className="mx-auto inline-block"><ScoreRing value={latest?.overall ?? 0} size={200} /></div>
            <div className="mt-4 text-sm text-muted-foreground">Movement Age</div>
            <div className="text-3xl font-extrabold brand-text">{latest?.movementAge ?? "—"}</div>
            <div className="text-xs text-muted-foreground">Chronological: {u.age}</div>
          </div>
          {latest && (
            <div className="rounded-3xl bg-card p-6 shadow-card">
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
          {u.sessions.length >= 2 && (
            <div className="rounded-3xl bg-card p-6 shadow-card">
              <h3 className="mb-2 text-base font-bold">Score history</h3>
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
        </aside>
      </main>
    </div>
  );
}
