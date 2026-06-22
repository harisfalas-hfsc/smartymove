import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useUser, updateUser, setUser } from "@/lib/store";
import { Bell, Crown, LogOut, Settings2, Target, MapPin, Monitor, Database } from "lucide-react";

export const Route = createFileRoute("/app/profile")({ component: Profile });

function Profile() {
  const u = useUser();
  const navigate = useNavigate();
  if (!u) return null;
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
        <Row icon={Settings2} label="Account settings" value="Edit profile" />
        <Row icon={Monitor} label="Desktop view" value="Open" onClick={() => { window.location.href = "/desktop"; }} />
        <Row icon={Database} label="Admin · Exercise library" value="Upload JSON & GIFs" onClick={() => { window.location.href = "/admin/exercises"; }} />
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
              <button onClick={() => updateUser({ premium: false })} className="rounded-xl bg-secondary px-3 py-1.5 text-xs font-semibold">Manage</button>
            </div>
          </div>
        )}
        <button onClick={() => { setUser(null); navigate({ to: "/" }); }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary p-3 font-semibold text-foreground">
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
