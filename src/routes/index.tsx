import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearOnboardingDraft,
  getOnboardingDraft,
  getUser,
  restoreUserFromBackend,
  signInWithEmailProfile,
  signUpWithEmailProfile,
  useUser,
} from "@/lib/store";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  Apple,
  CalendarCheck,
  Eye,
  EyeOff,
  Smartphone,
  Camera,
  ShieldCheck,
  Dumbbell,
  HeartPulse,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartyMove — Movement Screening App, Movement Score & Corrective Exercise" },
      {
        name: "description",
        content:
          "Camera-based movement screening app. Get your Movement Score, Movement Age, and a 5-minute daily corrective exercise program — built around your real mobility limits.",
      },
      { property: "og:title", content: "SmartyMove — Movement Screening App & Corrective Coach" },
      {
        property: "og:description",
        content:
          "Scan your movement with your phone camera. Get a Movement Score, Movement Age, and a personalized corrective exercise plan.",
      },
      { property: "og:url", content: "https://smartymove.com/" },
    ],
    links: [{ rel: "canonical", href: "https://smartymove.com/" }],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const user = useUser();
  const [mode, setMode] = useState<"intro" | "signup" | "signin" | "forgot">("intro");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [pw, setPw] = useState("");
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const requestedMode =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("auth")
        : null;
    if (requestedMode === "signin" || requestedMode === "signup") {
      setMode(requestedMode);
      window.history.replaceState(null, "", "/");
      return;
    }
    const cached = getUser();
    if (cached && cached.questionnaire && cached.goal) navigate({ to: "/app" });
    void restoreUserFromBackend()
      .then((u) => {
        if (u?.questionnaire && u.goal) navigate({ to: "/app" });
      })
      .catch(() => undefined);
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !age || !pw) return;
    setAuthError("");
    setSubmitting(true);
    try {
      const u = await signUpWithEmailProfile(name, email, Number(age), pw);
      const draft = getOnboardingDraft();
      clearOnboardingDraft();
      navigate({
        to:
          (u.questionnaire || draft.questionnaire) && (u.goal || draft.goal)
            ? "/app"
            : "/onboarding/parq",
      });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Account creation failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitSignin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !pw) return;
    setAuthError("");
    setSubmitting(true);
    try {
      const u = await signInWithEmailProfile(email, pw);
      navigate({ to: u.questionnaire && u.goal ? "/app" : "/onboarding/parq" });
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "Sign in failed. Check your email and password.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function submitForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setAuthError("");
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Couldn't send reset email.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] w-full flex-col">
      <SiteHeader
        onSignIn={() => setMode("signin")}
        onSignUp={() => setMode("signup")}
        onBack={mode === "intro" ? undefined : () => setMode("intro")}
      />
      <main
        className={`mx-auto w-full flex-1 px-5 pb-6 pt-5 ${mode === "intro" ? "sm-home-shell max-w-[430px] lg:max-w-[866px] lg:px-0" : "max-w-[420px]"}`}
      >
        {mode === "intro" ? (
          <>
            <div className="sm-wellness-grid">
              <section className="sm-panel sm-panel-hero sm-blue-border">
                <div className="sm-eyebrow"><Sparkles className="h-3 w-3" /> Movement diagnostic</div>
                <h1 className="sm-wellness-title">
                  <span>Know how</span>
                  <span>you move.</span>
                  <span>Move smarter.</span>
                </h1>
              </section>

              <section className="sm-panel sm-panel-mobile sm-green-border">
                <div className="sm-eyebrow">Best experience</div>
                <h2><span>SMARTY</span> MOVE</h2>
                <p className="hidden lg:block">
                  For better results, open SmartyMove on your phone. The camera scan is easier,
                  the movement test fits naturally in your space, and your daily training sessions
                  stay with you wherever you are.
                </p>
                <p className="lg:hidden">
                  Scan movement, get your score, and follow your corrective workout from your pocket.
                </p>
                <button className="sm-primary-cta" onClick={() => navigate({ to: "/onboarding/parq" })}>
                  Get started <ArrowRight className="h-4 w-4" />
                </button>
              </section>

              <section className="sm-panel sm-panel-about sm-blue-border">
                <div className="sm-card-topline"><span /> Assess <IconBubble Icon={Activity} /></div>
                <h2>Smarty <span>Move</span></h2>
                <p>
                  Your pocket movement coach. Turn your phone camera into a movement screen — get
                  your Movement Score, Movement Age, and a 5-minute daily corrective workout built
                  around what your body actually needs.
                </p>
                <div className="sm-feature-list">
                  <FeatureLine Icon={Camera} color="#2C99B3" title="Camera-based movement scan" text="Quick guided patterns from your phone or laptop." />
                  <FeatureLine Icon={ShieldCheck} color="#43AD5C" title="Private by design" text="Pose detection runs on your device — video stays with you." />
                  <FeatureLine Icon={Clock} color="#FF8A4C" title="5-minute daily routine" text="Simple corrective work for mobility, stability, and strength." />
                </div>
                <Link to="/about" className="sm-text-link">
                  Learn more about Smarty Move <ArrowRight className="h-4 w-4" />
                </Link>
              </section>

              <section className="sm-panel sm-panel-program sm-green-border">
                <div className="sm-card-topline"><span /> Train <IconBubble Icon={Dumbbell} /></div>
                <h2>Movement <span>Workouts</span></h2>
                <p>
                  A corrective exercise engine that builds Training Sessions from your real movement
                  limits — no guessing, no random routines.
                </p>
                <div className="sm-tile-grid">
                  <MiniTile Icon={Activity} label="Screen" color="#38A5C7" />
                  <MiniTile Icon={Dumbbell} label="Workouts" color="#4FB286" />
                  <MiniTile Icon={HeartPulse} label="Progress" color="#7A3EBA" />
                  <MiniTile Icon={CalendarCheck} label="Retest" color="#FF6B4A" />
                </div>
              </section>

              <section className="sm-panel sm-panel-score sm-blue-border">
                <div className="sm-card-topline"><span /> Score <IconBubble Icon={HeartPulse} /></div>
                <div className="sm-score-card">
                  <div>Movement Score</div>
                  <strong>72<small>/100</small></strong>
                  <p>Movement Age 41 · Chronological 47</p>
                </div>
              </section>

              <section className="sm-panel sm-panel-tools sm-blue-border">
                <div className="sm-card-topline"><span /> Routine <IconBubble Icon={Apple} /></div>
                <h2>Daily <span>Correctives</span></h2>
                <p>
                  Mobility, stability, and strength exercises selected from curated coach-built
                  libraries for your body’s top priority areas.
                </p>
              </section>
            </div>
          </>
        ) : mode === "signup" ? (
          <form onSubmit={submit} className="mt-2 flex flex-col gap-3">
            <h2
              style={{ fontWeight: 800, fontSize: 24, color: "#14213A", letterSpacing: "-0.01em" }}
            >
              Create your account
            </h2>
            <p className="-mt-1 text-sm" style={{ color: "#6B7A90" }}>
              Saved securely to your account.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="n">Name</Label>
              <Input
                id="n"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-[1fr_90px] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="e">Email</Label>
                <Input
                  id="e"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a">Age</Label>
                <Input
                  id="a"
                  type="number"
                  min={12}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p">Password</Label>
              <PasswordField
                id="p"
                value={pw}
                onChange={setPw}
                show={showPw}
                onToggle={() => setShowPw((s) => !s)}
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              style={{
                background: "#FF6B4A",
                boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)",
              }}
              className="mt-2 h-12 w-full rounded-2xl text-base font-semibold text-white hover:opacity-95"
            >
              {submitting ? "Saving..." : "Continue"}
            </Button>
            {authError && (
              <p className="text-center text-sm font-semibold text-destructive">{authError}</p>
            )}
            <p className="mt-1 text-center text-sm" style={{ color: "#6B7A90" }}>
              Have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                style={{
                  color: "#0E7C86",
                  fontWeight: 700,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Sign in
              </button>
            </p>
          </form>
        ) : mode === "signin" ? (
          <form onSubmit={submitSignin} className="mt-2 flex flex-col gap-3">
            <h2
              style={{ fontWeight: 800, fontSize: 24, color: "#14213A", letterSpacing: "-0.01em" }}
            >
              Welcome back
            </h2>
            <p className="-mt-1 text-sm" style={{ color: "#6B7A90" }}>
              Sign in to continue your movement journey.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="se">Email</Label>
              <Input
                id="se"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="sp">Password</Label>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError("");
                    setResetSent(false);
                    setMode("forgot");
                  }}
                  style={{
                    color: "#0E7C86",
                    fontWeight: 700,
                    fontSize: 13,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <PasswordField
                id="sp"
                value={pw}
                onChange={setPw}
                show={showPw}
                onToggle={() => setShowPw((s) => !s)}
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              style={{
                background: "#FF6B4A",
                boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)",
              }}
              className="mt-2 h-12 w-full rounded-2xl text-base font-semibold text-white hover:opacity-95"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
            {authError && (
              <p className="text-center text-sm font-semibold text-destructive">{authError}</p>
            )}
            <p className="mt-1 text-center text-sm" style={{ color: "#6B7A90" }}>
              New here?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                style={{
                  color: "#0E7C86",
                  fontWeight: 700,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Create an account
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={submitForgot} className="mt-2 flex flex-col gap-3">
            <h2
              style={{ fontWeight: 800, fontSize: 24, color: "#14213A", letterSpacing: "-0.01em" }}
            >
              Reset your password
            </h2>
            <p className="-mt-1 text-sm" style={{ color: "#6B7A90" }}>
              Enter your account email. We'll send you a link to set a new password.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="fe">Email</Label>
              <Input
                id="fe"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || resetSent}
              style={{
                background: "#FF6B4A",
                boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)",
              }}
              className="mt-2 h-12 w-full rounded-2xl text-base font-semibold text-white hover:opacity-95"
            >
              {resetSent ? "Email sent ✓" : submitting ? "Sending..." : "Send reset link"}
            </Button>
            {resetSent && (
              <p className="text-center text-sm" style={{ color: "#0E7C86" }}>
                Check your inbox (and spam folder) for the reset link.
              </p>
            )}
            {authError && (
              <p className="text-center text-sm font-semibold text-destructive">{authError}</p>
            )}
            <p className="mt-1 text-center text-sm" style={{ color: "#6B7A90" }}>
              Remembered it?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthError("");
                  setResetSent(false);
                  setMode("signin");
                }}
                style={{
                  color: "#0E7C86",
                  fontWeight: 700,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Back to sign in
              </button>
            </p>
          </form>
        )}

        <style>{`
          @media (min-width: 1024px){
            .sm-hero-title{ font-size: 40px !important; }
            .sm-hero-cta{ max-width: 280px !important; }
            .sm-hero-card{ width: 522px; max-width: 100%; height: 228px; margin-left: auto; margin-right: 0; padding: 28px 28px !important; }
            .sm-hero-score{ font-size: 84px !important; }
          }
          .sm-scanline{
            position:absolute; left:14px; right:14px; height:3px; top:18px;
            background:linear-gradient(90deg, transparent, #4FB286 20%, #7CFFB8 50%, #4FB286 80%, transparent);
            box-shadow:0 0 18px 3px rgba(79,178,134,0.85), 0 0 40px 6px rgba(79,178,134,0.35);
            border-radius:2px;
            will-change: transform;
            transform: translate3d(0,0,0);
            animation: sm-sweep 2.2s ease-in-out infinite;
          }
          @keyframes sm-sweep{
            0%   { transform: translate3d(0, 0, 0); opacity:.95 }
            50%  { transform: translate3d(0, 110px, 0); opacity:1 }
            100% { transform: translate3d(0, 0, 0); opacity:.95 }
          }
          @media (min-width: 1024px){
            .sm-scanline{ animation: sm-sweep-lg 2.6s ease-in-out infinite; }
            @keyframes sm-sweep-lg{
              0%   { transform: translate3d(0, 0, 0); opacity:.95 }
              50%  { transform: translate3d(0, 154px, 0); opacity:1 }
              100% { transform: translate3d(0, 0, 0); opacity:.95 }
            }
          }
        `}</style>
      </main>
      <SiteFooter />
    </div>
  );
}

function cornerStyle(extra: React.CSSProperties): React.CSSProperties {
  return {
    position: "absolute",
    width: 22,
    height: 22,
    border: "2.5px solid rgba(255,255,255,0.55)",
    ...extra,
  };
}

const pillStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: ".01em",
  padding: "7px 11px",
  borderRadius: 999,
  background: "#fff",
  border: "1px solid #D9E0E2",
  color: "#3B4A63",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

function PasswordField({
  id,
  value,
  onChange,
  show,
  onToggle,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={6}
        className="h-11 rounded-xl pr-11"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
