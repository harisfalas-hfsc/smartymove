import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Camera,
  CreditCard,
  Download,
  Dumbbell,
  Home,
  LineChart as LineChartIcon,
  Loader2,
  LogOut,
  Smartphone,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ScoreHistoryChart, ScoreHistoryTimeline } from "@/components/ScoreHistoryChart";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScoreRing } from "@/components/ScoreRing";
import { SubScoreBar } from "@/components/SubScoreBar";
import { supabase } from "@/integrations/supabase/client";
import { downloadAccountDataReport } from "@/lib/account-export";
import { deleteAccountAndData, exportAccountData } from "@/lib/account.functions";
import { clearLocalAccountData, signOutUser, updateUser, type Goal } from "@/lib/store";
import { useUserPremium } from "@/lib/useUserPremium";

type ExportResult = { data: unknown } | { error: string };
type DeleteResult = { ok: true; canceledSubscriptions: number } | { error: string };

export function DesktopProfile() {
  const [mounted, setMounted] = useState(false);
  const u = useUserPremium();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (!u) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-8 text-center">
        <div>
          <h1 className="text-xl font-bold">SmartyMove</h1>
          <p className="text-muted-foreground">
            Please sign in on your phone to view this account.
          </p>
          <a
            href="/"
            className="mt-4 inline-block rounded-2xl brand-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Open app
          </a>
        </div>
      </div>
    );
  }
  return <DesktopProfileInner key={u.id} />;
}

function DesktopProfileInner() {
  const u = useUserPremium();
  const [name, setName] = useState(u?.name ?? "");
  const [email, setEmail] = useState(u?.email ?? "");
  const [age, setAge] = useState(u?.age ?? 30);
  const [goal, setGoal] = useState<Goal | undefined>(u?.goal);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<"export" | "delete" | null>(null);
  const exportData = useServerFn(exportAccountData);
  const deleteAccount = useServerFn(deleteAccountAndData);

  if (!u) return null;

  const latest = u.sessions[u.sessions.length - 1];
  const data = u.sessions.map((session, index) => ({
    name: `#${index + 1}`,
    score: session.overall,
  }));

  function save() {
    updateUser({ name, email, age, goal });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function requireSession() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("Please sign in again before managing billing or account data.");
  }

  async function downloadAccountData() {
    setLoading("export");
    setMessage(null);
    try {
      await requireSession();
      const result = (await exportData({ data: {} })) as ExportResult;
      if ("error" in result) throw new Error(result.error);
      downloadAccountDataReport(result.data);
      setMessage("Your readable data report has downloaded.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not download your data");
    } finally {
      setLoading(null);
    }
  }

  async function deleteEntireAccount() {
    setLoading("delete");
    setMessage(null);
    try {
      await requireSession();
      const result = (await deleteAccount({ data: {} })) as DeleteResult;
      if ("error" in result) throw new Error(result.error);
      clearLocalAccountData();
      await signOutUser().catch(() => undefined);
      window.location.href = "/";
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not delete your account");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-8 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-2xl brand-gradient text-primary-foreground">
            <Activity className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-bold tracking-tight">SmartyMove</div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Desktop dashboard
            </div>
          </div>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Desktop navigation">
            <DesktopNavLink to="/desktop" icon={Home} label="Home" />
            <DesktopNavLink to="/app/program" icon={Dumbbell} label="Program" />
            <DesktopNavLink to="/app/progress" icon={LineChartIcon} label="Progress" />
            <DesktopNavLink to="/app/screen" icon={Camera} label="Screen" />
            <DesktopNavLink to="/app/profile" icon={UserRound} label="Account" />
          </nav>
          <Link
            to="/app"
            className="hidden items-center gap-2 rounded-2xl bg-secondary px-3 py-2 text-sm font-semibold lg:inline-flex"
          >
            <Smartphone className="h-4 w-4" /> App home
          </Link>
          <button
            onClick={() => {
              void signOutUser().finally(() => {
                window.location.href = "/";
              });
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2 text-sm font-semibold"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-6 px-8 py-8 lg:grid-cols-[1.2fr_1fr]">
        <section className="space-y-6">
          <div className="rounded-3xl brand-gradient p-6 text-primary-foreground shadow-soft">
            <div className="text-xs font-semibold uppercase tracking-widest opacity-85">
              Welcome back, {u.name.split(" ")[0]}
            </div>
            <h1 className="mt-2 text-3xl font-extrabold">Your SmartyMove home</h1>
            <p className="mt-2 max-w-2xl text-sm opacity-90">
              Open your training program, review progress, rescan, or manage your account from one desktop dashboard.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <ActionCard to="/app/program" icon={Dumbbell} label="Training program" value="Open today's work" />
              <ActionCard to="/app/progress" icon={LineChartIcon} label="Progress" value={`${u.sessions.length} screen${u.sessions.length === 1 ? "" : "s"}`} />
              <ActionCard to="/app/screen" icon={Camera} label="Movement Screen" value="Rescan / test" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={CalendarDays} label="Streak" value={u.streak || 0} />
            <StatCard icon={Activity} label="Latest score" value={latest?.overall ?? "—"} />
            <StatCard icon={Dumbbell} label="Completed days" value={(u.programCompletedDays ?? []).length} />
          </div>

          <div className="rounded-3xl bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold">Profile</h2>
            <p className="text-sm text-muted-foreground">
              Edit your details. Movement scoring is calibrated to your age.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="dn">Name</Label>
                <Input
                  id="dn"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="de">Email</Label>
                <Input
                  id="de"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="da">Age</Label>
                <Input
                  id="da"
                  type="number"
                  min={12}
                  max={100}
                  value={age}
                  onChange={(event) => setAge(Number(event.target.value))}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Goal</Label>
                <select
                  value={goal ?? ""}
                  onChange={(event) =>
                    setGoal((event.target.value || undefined) as Goal | undefined)
                  }
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
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
              <Button
                onClick={save}
                className="h-11 rounded-2xl brand-gradient font-semibold shadow-soft"
              >
                Save changes
              </Button>
              {saved && <span className="text-sm font-semibold text-success">Saved</span>}
            </div>
          </div>

          {message && (
            <div className="rounded-2xl bg-secondary p-3 text-sm font-semibold text-foreground">
              {message}
            </div>
          )}

          <div className="rounded-3xl bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold">Account data</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Download a readable SmartyMove data report or permanently delete your account and app data.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                onClick={downloadAccountData}
                disabled={loading === "export"}
                variant="secondary"
                className="rounded-2xl"
              >
                {loading === "export" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download data report
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={loading === "delete"}
                    variant="destructive"
                    className="rounded-2xl"
                  >
                    {loading === "delete" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes your SmartyMove profile, screening history, scores,
                      and training data. Active subscriptions are set to stop renewing.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep account</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteEntireAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="rounded-3xl bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold">Joint focus</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {(u.questionnaire?.joints ?? []).join(", ") || "—"}
            </p>
            <a
              href="/onboarding/joints"
              className="mt-3 inline-block text-sm font-semibold text-primary"
            >
              Update on mobile →
            </a>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl bg-card p-6 text-center shadow-card">
            <div className="mx-auto inline-block">
              <ScoreRing value={latest?.overall ?? 0} size={200} />
            </div>
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
              </div>
            </div>
          )}
          {u.sessions.length >= 2 && (
            <div className="rounded-3xl bg-card p-6 shadow-card">
              <h3 className="mb-2 text-base font-bold">Score history</h3>
              <ScoreHistoryChart data={data} height={176} gradientId="desktopScoreGradient" />
              <ScoreHistoryTimeline sessions={u.sessions} />
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

function DesktopNavLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: typeof Home;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
      activeProps={{ className: "inline-flex items-center gap-2 rounded-2xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground" }}
      activeOptions={{ exact: to === "/desktop" }}
    >
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}

function ActionCard({
  to,
  icon: Icon,
  label,
  value,
}: {
  to: string;
  icon: typeof Home;
  label: string;
  value: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl bg-white/15 p-4 text-primary-foreground backdrop-blur transition-transform hover:scale-[1.01]"
    >
      <div className="flex items-center justify-between gap-3">
        <Icon className="h-5 w-5" />
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
      <div className="mt-3 text-sm font-extrabold">{label}</div>
      <div className="mt-0.5 text-xs opacity-85">{value}</div>
    </Link>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string | number }) {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl brand-gradient-soft text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="text-2xl font-extrabold brand-text">{value}</div>
      </div>
      <div className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
