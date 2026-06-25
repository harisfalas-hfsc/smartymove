import { useServerFn } from "@tanstack/react-start";
import { Activity, Download, Loader2, LogOut, Smartphone, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
import { deleteAccountAndData, exportAccountData } from "@/lib/account.functions";
import { cancelPremiumSubscription, createBillingPortalSession } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { clearLocalAccountData, signOutUser, updateUser, type Goal } from "@/lib/store";
import { useUserPremium } from "@/lib/useUserPremium";

type PortalResult = { url: string } | { error: string };
type CancelResult = { ok: true; currentPeriodEnd: string | null } | { error: string };
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
  const [loading, setLoading] = useState<"portal" | "cancel" | "export" | "delete" | null>(null);
  const openPortal = useServerFn(createBillingPortalSession);
  const cancelSubscription = useServerFn(cancelPremiumSubscription);
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

  function downloadJson(filename: string, data: unknown) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function manageSubscription() {
    setLoading("portal");
    setMessage(null);
    const portalWindow = window.open("about:blank", "_blank");
    try {
      const result = (await openPortal({
        data: { environment: getStripeEnvironment(), returnUrl: window.location.href },
      })) as PortalResult;
      if ("error" in result) throw new Error(result.error);
      if (portalWindow) portalWindow.location.href = result.url;
      else window.location.assign(result.url);
    } catch (e) {
      portalWindow?.close();
      setMessage(e instanceof Error ? e.message : "Could not open billing portal");
    } finally {
      setLoading(null);
    }
  }

  async function cancelPlan() {
    setLoading("cancel");
    setMessage(null);
    try {
      const result = (await cancelSubscription({
        data: { environment: getStripeEnvironment() },
      })) as CancelResult;
      if ("error" in result) throw new Error(result.error);
      const date = result.currentPeriodEnd
        ? new Date(result.currentPeriodEnd).toLocaleDateString()
        : "the end of the paid period";
      setMessage(`Cancellation scheduled. Premium stays active until ${date}.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not cancel subscription");
    } finally {
      setLoading(null);
    }
  }

  async function downloadAccountData() {
    setLoading("export");
    setMessage(null);
    try {
      const result = (await exportData({ data: {} })) as ExportResult;
      if ("error" in result) throw new Error(result.error);
      downloadJson(`smartymove-data-${new Date().toISOString().slice(0, 10)}.json`, result.data);
      setMessage("Your data export has downloaded.");
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_oklch(0.96_0.03_210),_oklch(0.99_0.005_220))]">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-8 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-2xl brand-gradient text-primary-foreground">
            <Activity className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="text-sm font-bold tracking-tight">SmartyMove</div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Account portal
            </div>
          </div>
          <a
            href="/app"
            className="hidden items-center gap-2 rounded-2xl bg-secondary px-3 py-2 text-sm font-semibold lg:inline-flex"
          >
            <Smartphone className="h-4 w-4" /> Mobile app
          </a>
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

          <div className="rounded-3xl bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold">Subscription</h2>
            <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl brand-gradient-soft p-4">
              <div>
                <div className="font-bold">{u.premium ? "Premium" : "Free"}</div>
                <div className="text-xs text-muted-foreground">
                  {u.premium
                    ? "€4.99/mo · cancel anytime"
                    : "Upgrade for daily routines, re-tests, joint tests, Movement Age, projections"}
                </div>
              </div>
              {u.premium ? (
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    onClick={manageSubscription}
                    disabled={loading === "portal"}
                    className="rounded-2xl"
                  >
                    {loading === "portal" && <Loader2 className="h-4 w-4 animate-spin" />} Manage
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={loading === "cancel"}
                        variant="destructive"
                        className="rounded-2xl"
                      >
                        {loading === "cancel" && <Loader2 className="h-4 w-4 animate-spin" />}{" "}
                        Cancel
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Premium?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Your subscription will stop renewing. You keep Premium until the end of
                          the paid period.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Premium</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={cancelPlan}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Cancel plan
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    window.location.href = "/premium";
                  }}
                  className="rounded-2xl"
                >
                  Upgrade
                </Button>
              )}
            </div>
            {message && (
              <div className="mt-3 rounded-2xl bg-secondary p-3 text-sm font-semibold text-foreground">
                {message}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold">Account data</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Download your SmartyMove data or permanently delete your account and app data.
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
                Download data
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
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={11} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.012 220)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="oklch(0.52 0.14 235)"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "oklch(0.62 0.13 210)" }}
                    />
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
