import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  ClipboardList,
  CreditCard,
  Download,
  Loader2,
  LogOut,
  Save,
  Settings2,
  ShieldAlert,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { useState, type ComponentType } from "react";
import { useFreeAccessMode } from "@/hooks/useFreeAccessMode";

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
import { supabase } from "@/integrations/supabase/client";
import { downloadAccountDataReport } from "@/lib/account-export";
import { deleteAccountAndData, exportAccountData } from "@/lib/account.functions";
import { isAdminEmail } from "@/lib/admin";
import { createBillingPortalSession } from "@/lib/payments.functions";
import { forgetDevice, hasDeviceRecord } from "@/lib/offline/device-auth";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import { OFFLINE_ACTION_MESSAGE } from "@/components/offline/OfflineBanner";
import { getStripeEnvironment } from "@/lib/stripe";
import { clearLocalAccountData, setOnboardingNextPath, updateUser, signOutUser, useUser, type User } from "@/lib/store";

export const Route = createFileRoute("/app/profile")({ component: Profile });

type ExportResult = { data: unknown } | { error: string };
type DeleteResult = { ok: true; canceledSubscriptions: number } | { error: string };
type PortalResult = { url: string } | { error: string };

function Profile() {
  const u = useUser();
  const navigate = useNavigate();
  if (!u) return null;
  return <ProfileInner u={u} navigate={navigate} />;
}

function ProfileInner({ u, navigate }: { u: User; navigate: ReturnType<typeof useNavigate> }) {
  const { freeAccessMode } = useFreeAccessMode();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(u.name);
  const [age, setAge] = useState(String(u.age));
  const [saved, setSaved] = useState(false);
  const [accountLoading, setAccountLoading] = useState<"export" | "delete" | "billing" | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [dataOpen, setDataOpen] = useState(false);
  const online = useOnlineStatus();
  const [deviceCleared, setDeviceCleared] = useState(false);
  const exportData = useServerFn(exportAccountData);
  const deleteAccount = useServerFn(deleteAccountAndData);
  const openPortal = useServerFn(createBillingPortalSession);

  async function requireSession() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("Please sign in again before managing your account data.");
  }
  async function openBilling() {
    setAccountLoading("billing");
    setAccountMessage(null);
    try {
      if (!online) throw new Error(OFFLINE_ACTION_MESSAGE);
      await requireSession();
      const res = (await openPortal({
        data: { environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/app/profile` },
      })) as PortalResult;
      if ("error" in res) throw new Error(res.error);
      window.open(res.url, "_blank", "noopener");
    } catch (e) {
      setAccountMessage(e instanceof Error ? e.message : "Could not open billing");
    } finally {
      setAccountLoading(null);
    }
  }
  async function downloadAccountData() {
    setAccountLoading("export");
    setAccountMessage(null);
    try {
      if (!online) throw new Error(OFFLINE_ACTION_MESSAGE);
      await requireSession();
      const res = (await exportData({ data: {} })) as ExportResult;
      if ("error" in res) throw new Error(res.error);
      downloadAccountDataReport(res.data);
      setAccountMessage("Your readable data report has downloaded.");
    } catch (e) {
      setAccountMessage(e instanceof Error ? e.message : "Could not download your data");
    } finally {
      setAccountLoading(null);
    }
  }
  async function deleteEntireAccount() {
    setAccountLoading("delete");
    setAccountMessage(null);
    try {
      if (!online) throw new Error(OFFLINE_ACTION_MESSAGE);
      await requireSession();
      const res = (await deleteAccount({ data: {} })) as DeleteResult;
      if ("error" in res) throw new Error(res.error);
      clearLocalAccountData();
      await signOutUser().catch(() => undefined);
      navigate({ to: "/", replace: true });
    } catch (e) {
      setAccountMessage(e instanceof Error ? e.message : "Could not delete your account");
    } finally {
      setAccountLoading(null);
    }
  }
  function openEditor() {
    setName(u.name);
    setAge(String(u.age));
    setSaved(false);
    setEditing(true);
  }
  function saveProfile() {
    const cleanName = name.trim();
    const nextAge = Math.min(100, Math.max(12, Number(age) || u.age));
    if (!cleanName) return;
    updateUser({ name: cleanName, age: nextAge });
    setSaved(true);
    setEditing(false);
  }
  return (
    <div className="pb-6">
      <header className="brand-gradient-strong px-5 pb-7 pt-7 text-primary-foreground">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/15 text-2xl font-extrabold backdrop-blur">
            {u.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xl font-extrabold">{u.name}</div>
            <div className="truncate text-sm opacity-85">{u.email}</div>
            <div className="text-xs opacity-75">Age {u.age}</div>
          </div>
        </div>
      </header>
      <div className="-mt-4 space-y-3 rounded-t-[2rem] bg-background px-5 pt-5">
        <Row
          icon={ClipboardList}
          label="Assessment & goals"
          value={`Goal: ${u.goal ?? "—"} · Focus: ${(u.questionnaire?.joints ?? []).join(", ") || "—"}`}
          onClick={() => {
            // Re-run the full onboarding flow in edit mode: PAR-Q → readiness →
            // joint focus → release of liability → goal. All screens are
            // pre-filled with the user's saved answers, and the final step
            // returns them to /app/profile instead of the scan.
            setOnboardingNextPath("/app/profile");
            navigate({ to: "/onboarding/parq" });
          }}
        />
        <Row icon={Settings2} label="Account settings" value="Edit profile" onClick={openEditor} />
        {!freeAccessMode && (
          <Row
            icon={CreditCard}
            label="Billing & purchases"
            value={accountLoading === "billing" ? "Opening…" : "Receipts, payment method, stop any recurring billing"}
            onClick={openBilling}
          />
        )}
        {editing && (
          <section className="rounded-3xl bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold">Edit profile</h2>
                <p className="text-xs text-muted-foreground">
                  Your email is managed by your account sign-in.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(false)}
                aria-label="Close profile editor"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-2xl bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-age">Age</Label>
                <Input
                  id="profile-age"
                  inputMode="numeric"
                  type="number"
                  min={12}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="h-12 rounded-2xl bg-background"
                />
              </div>
              <Button
                onClick={saveProfile}
                disabled={!name.trim()}
                className="h-12 w-full rounded-2xl brand-gradient text-base font-semibold shadow-soft"
              >
                <Save className="h-4 w-4" /> Save profile
              </Button>
            </div>
          </section>
        )}
        {saved && (
          <div className="rounded-2xl bg-success/10 p-3 text-center text-sm font-semibold text-foreground">
            Profile updated
          </div>
        )}
        {isAdminEmail(u.email) && (
          <Row
            icon={Shield}
            label="Admin"
            value="Open admin panel"
            onClick={() => navigate({ to: "/admin" })}
          />
        )}
        <div className="rounded-3xl bg-card p-5 shadow-card">
          <button
            onClick={() => setDataOpen((v) => !v)}
            className="flex w-full items-center gap-3 text-left"
            aria-expanded={dataOpen}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl brand-gradient-soft text-primary">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Your data
              </div>
              <div className="truncate font-semibold">Download report or delete account</div>
            </div>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${dataOpen ? "rotate-180" : ""}`}
            />
          </button>
          {dataOpen && (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                onClick={downloadAccountData}
                disabled={!!accountLoading}
                variant="secondary"
                className="h-11 rounded-2xl font-semibold"
              >
                {accountLoading === "export" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download data report
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={!!accountLoading}
                    variant="destructive"
                    className="h-11 rounded-2xl font-semibold"
                  >
                    {accountLoading === "delete" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="mx-4 max-w-[360px] rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes your SmartyMove profile, screening history, scores, and
                      training data. Active subscriptions are set to stop renewing.
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
          )}
          {dataOpen && hasDeviceRecord(u.email) && (
            <button
              type="button"
              onClick={() => {
                forgetDevice(u.email);
                setDeviceCleared(true);
              }}
              className="mt-2 w-full rounded-2xl border border-border px-4 py-3 text-left text-xs font-semibold text-muted-foreground"
            >
              {deviceCleared
                ? "Offline sign-in for this device cleared."
                : "Clear offline sign-in saved on this device"}
            </button>
          )}
          {accountMessage && (
            <div className="mt-3 rounded-2xl bg-secondary p-3 text-xs font-semibold text-foreground">
              {accountMessage}
            </div>
          )}
        </div>
        <Row
          icon={LogOut}
          label="Sign out"
          value="End your session"
          onClick={() => {
            void signOutUser().finally(() => navigate({ to: "/" }));
          }}
        />
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-card"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl brand-gradient-soft text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className="truncate font-semibold capitalize">{value.replace(/_/g, " ")}</div>
      </div>
    </button>
  );
}
