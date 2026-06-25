import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createBillingPortalSession } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { useUser, updateUser, signOutUser, type User } from "@/lib/store";
import { Bell, Crown, LogOut, Settings2, Target, MapPin, Monitor, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/app/profile")({ component: Profile });

function Profile() {
  const u = useUser();
  const navigate = useNavigate();
  if (!u) return null;
  return <ProfileInner u={u} navigate={navigate} />;
}

function ProfileInner({ u, navigate }: { u: User; navigate: ReturnType<typeof useNavigate> }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(u.name);
  const [age, setAge] = useState(String(u.age));
  const [saved, setSaved] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const openPortal = useServerFn(createBillingPortalSession);
  async function manageSubscription() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await openPortal({ data: { environment: getStripeEnvironment(), returnUrl: window.location.href } });
      if ("error" in res) throw new Error(res.error);
      window.open(res.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setPortalError(e?.message ?? "Could not open billing portal");
    } finally {
      setPortalLoading(false);
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
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/15 text-2xl font-extrabold backdrop-blur">{u.name.slice(0,1).toUpperCase()}</div>
          <div className="min-w-0">
            <div className="truncate text-xl font-extrabold">{u.name}</div>
            <div className="truncate text-sm opacity-85">{u.email}</div>
            <div className="text-xs opacity-75">Age {u.age} · {u.premium ? "Premium" : "Free"}</div>
          </div>
        </div>
      </header>
      <div className="-mt-4 space-y-3 rounded-t-[2rem] bg-background px-5 pt-5">
        <Row icon={Target} label="Goal" value={u.goal ?? "—"} onClick={() => navigate({ to: "/onboarding/goal" })} />
        <Row icon={MapPin} label="Joint focus" value={(u.questionnaire?.joints ?? []).join(", ") || "—"} onClick={() => navigate({ to: "/onboarding/joints" })} />
        <Row icon={Bell} label="Notifications" value="Daily reminder" />
        <Row icon={Settings2} label="Account settings" value="Edit profile" onClick={openEditor} />
        <Row icon={Monitor} label="Desktop view" value="Open" onClick={() => { window.location.href = "/desktop"; }} />
        {editing && (
          <section className="rounded-3xl bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold">Edit profile</h2>
                <p className="text-xs text-muted-foreground">Your email is managed by your account sign-in.</p>
              </div>
              <button type="button" onClick={() => setEditing(false)} aria-label="Close profile editor" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-name">Name</Label>
                <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-2xl bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-age">Age</Label>
                <Input id="profile-age" inputMode="numeric" type="number" min={12} max={100} value={age} onChange={(e) => setAge(e.target.value)} className="h-12 rounded-2xl bg-background" />
              </div>
              <Button onClick={saveProfile} disabled={!name.trim()} className="h-12 w-full rounded-2xl brand-gradient text-base font-semibold shadow-soft">
                <Save className="h-4 w-4" /> Save profile
              </Button>
            </div>
          </section>
        )}
        {saved && <div className="rounded-2xl bg-success/10 p-3 text-center text-sm font-semibold text-foreground">Profile updated</div>}
        {!u.premium ? (
          <div className="rounded-3xl brand-gradient p-5 text-primary-foreground shadow-soft">
            <Crown className="h-5 w-5" />
            <div className="mt-1 text-base font-extrabold">Go Premium · €4.99/mo</div>
            <p className="text-sm opacity-90">Daily routines, re-tests, joint tests, Movement Age, Future Projection.</p>
            <button onClick={() => updateUser({ premium: true })} className="mt-3 h-11 w-full rounded-2xl bg-white font-semibold text-primary">Start free trial</button>
          </div>
        ) : (
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">Premium active</div>
                <div className="text-xs text-muted-foreground">€4.99/mo · cancel anytime</div>
              </div>
              <button onClick={manageSubscription} disabled={portalLoading} className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60">
                {portalLoading ? "Opening…" : "Manage"}
              </button>
            </div>
            {portalError && <div className="mt-2 text-xs text-destructive">{portalError}</div>}
            <p className="mt-3 text-xs text-muted-foreground">Update your card, download invoices, or cancel — opens your secure billing portal.</p>
          </div>
        )}
        <button onClick={() => { void signOutUser().finally(() => navigate({ to: "/" })); }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary p-3 font-semibold text-foreground">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value, onClick }: { icon: any; label: string; value: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-card">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl brand-gradient-soft text-primary"><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="truncate font-semibold capitalize">{value.replace(/_/g, " ")}</div>
      </div>
    </button>
  );
}
