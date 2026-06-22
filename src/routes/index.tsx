import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser, getUser } from "@/lib/store";
import { Activity, Sparkles, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartyMove — Know how you move. Move smarter." },
      { name: "description", content: "Mobile-first movement screening and corrective training. Pose-based assessment, daily 5-minute routines, and a Movement Age you can improve." },
      { property: "og:title", content: "SmartyMove" },
      { property: "og:description", content: "Know how you move. Move smarter." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"intro" | "signup">("intro");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [pw, setPw] = useState("");

  useEffect(() => {
    const u = getUser();
    if (u && u.questionnaire && u.goal) navigate({ to: "/app" });
  }, [navigate]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !age || !pw) return;
    createUser(name, email, Number(age));
    navigate({ to: "/onboarding/questionnaire" });
  }

  return (
    <PhoneFrame>
      <div className="flex h-full min-h-[100dvh] flex-col">
        <div className="relative flex-1 brand-gradient-strong px-6 pb-10 pt-14 text-primary-foreground">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] opacity-90">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <Activity className="h-4 w-4" />
            </span>
            SmartyMove
          </div>
          <h1 className="mt-10 text-[2.5rem] font-extrabold leading-[1.05] tracking-tight">
            Know how you move.<br/>
            <span className="opacity-90">Move smarter.</span>
          </h1>
          <p className="mt-4 max-w-sm text-base/relaxed opacity-90">
            A pocket physio. Scan your movement with your camera, get a Movement Score and Movement Age, and a 5-minute daily routine that actually fits.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
              <Sparkles className="mb-1.5 h-4 w-4" />
              <div className="font-semibold">5 core tests</div>
              <div className="opacity-80">Pose-based, on-device</div>
            </div>
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
              <ShieldCheck className="mb-1.5 h-4 w-4" />
              <div className="font-semibold">Private by design</div>
              <div className="opacity-80">Runs in your browser</div>
            </div>
          </div>
        </div>

        <div className="-mt-6 flex-1 rounded-t-[2rem] bg-card p-6 shadow-soft">
          {mode === "intro" ? (
            <div className="flex h-full flex-col">
              <h2 className="text-xl font-bold">Let's set up your profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Takes about 2 minutes. You'll get a personalized Movement Profile at the end.
              </p>
              <div className="mt-auto space-y-3 pt-6">
                <Button onClick={() => setMode("signup")} className="h-12 w-full rounded-2xl brand-gradient text-base font-semibold shadow-soft">
                  Get started
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Already have an account? <button className="font-semibold text-primary" onClick={() => setMode("signup")}>Sign in</button>
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="flex h-full flex-col gap-3">
              <h2 className="text-xl font-bold">Create your account</h2>
              <p className="text-sm text-muted-foreground -mt-1">Saved locally on this device for now.</p>
              <div className="space-y-1.5">
                <Label htmlFor="n">Name</Label>
                <Input id="n" value={name} onChange={e => setName(e.target.value)} required className="h-11 rounded-xl" />
              </div>
              <div className="grid grid-cols-[1fr_90px] gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="e">Email</Label>
                  <Input id="e" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="a">Age</Label>
                  <Input id="a" type="number" min={12} max={100} value={age} onChange={e => setAge(e.target.value ? Number(e.target.value) : "")} required className="h-11 rounded-xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p">Password</Label>
                <Input id="p" type="password" value={pw} onChange={e => setPw(e.target.value)} required minLength={6} className="h-11 rounded-xl" />
              </div>
              <Button type="submit" className="mt-auto h-12 w-full rounded-2xl brand-gradient text-base font-semibold shadow-soft">
                Continue
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Connect Lovable Cloud to enable real accounts, sync, and cloud-stored history.
              </p>
            </form>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}
