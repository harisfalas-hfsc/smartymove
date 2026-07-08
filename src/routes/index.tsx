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
  Camera,
  ShieldCheck,
  Dumbbell,
  HeartPulse,
  Clock,
  ArrowRight,
  Sparkles,
  Target,
  Repeat,
  Monitor,
  Smartphone,
  BookOpen,
  type LucideIcon,
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
        className={`mx-auto w-full flex-1 px-5 pb-6 pt-5 ${mode === "intro" ? "sm-home-shell max-w-[430px] lg:max-w-[1240px] lg:px-6" : "max-w-[420px]"}`}
      >
        {mode === "intro" ? (
          <>
            <div className="sm-wellness-grid">
              <section className="sm-panel sm-panel-hero sm-border-hero">
                <div className="sm-eyebrow"><Sparkles className="h-3 w-3" /> Movement diagnostic</div>
                <h1 className="sm-wellness-title">
                  <span>Know how you move.</span>
                  <span>Move smarter.</span>
                </h1>
              </section>

              <div className="sm-panel-score-picture sm-border-score">
                <div className="sm-score-card">
                  <div>Movement Score</div>
                  <strong>72<small>/100</small></strong>
                  <p>Movement Age 41 · Chronological 47</p>
                </div>
              </div>

              <section className="sm-panel sm-panel-mobile sm-border-mobile">
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

              <section className="sm-panel sm-panel-about sm-border-about">
                <div className="sm-card-topline"><span /> Assess <IconBubble Icon={Activity} /></div>
                <h2>Smarty <span>Move</span></h2>
                <p>
                  Your pocket movement coach. Use your phone, tablet, laptop, or desktop camera for
                  a guided movement screen — get your Movement Score, Movement Age, and a 5-minute
                  daily corrective workout built around what your body actually needs.
                </p>
                <div className="sm-feature-list">
                  <FeatureLine Icon={Camera} color="#2C99B3" title="Camera-based movement scan" text="Quick guided patterns from any device with a camera." />
                  <FeatureLine Icon={ShieldCheck} color="#43AD5C" title="Private by design" text="Pose detection runs on your device — video stays with you." />
                  <FeatureLine Icon={Clock} color="#FF8A4C" title="5-minute daily routine" text="Simple corrective work for mobility, stability, and strength." />
                  <FeatureLine Icon={Target} color="#7A3EBA" title="Personalized priority areas" text="Two focus areas selected from your real movement limits." />
                  <FeatureLine Icon={Repeat} color="#38A5C7" title="Retest every 14 days" text="Track changes and evolve your program as you improve." />
                  <FeatureLine Icon={Monitor} color="#4FB286" title="Works on any screen" text="Phone, tablet, laptop, or desktop — train wherever you are." />
                </div>
                <Link to="/about" className="sm-text-link">
                  Learn more about Smarty Move <ArrowRight className="h-4 w-4" />
                </Link>
              </section>

              <section className="sm-panel sm-panel-program sm-border-program">
                <div className="sm-card-topline"><span /> Train <IconBubble Icon={Dumbbell} /></div>
                <h2>Movement <span>Workouts</span></h2>
                <p>
                  A corrective exercise engine that builds Training Sessions from your real movement
                  limits — no guessing, no random routines.
                </p>
                <div className="sm-tile-grid">
                  <MiniTile Icon={Activity} label="Assess" color="#38A5C7" />
                  <MiniTile Icon={Dumbbell} label="Corrective Workouts" color="#4FB286" />
                  <MiniTile Icon={HeartPulse} label="Progress" color="#7A3EBA" />
                  <MiniTile Icon={CalendarCheck} label="Retest" color="#FF6B4A" />
                </div>
                <Link to="/about" className="sm-text-link">
                  See how workouts are built <ArrowRight className="h-4 w-4" />
                </Link>
              </section>

              <section className="sm-panel sm-panel-tools sm-border-tools">
                <div className="sm-card-topline"><span /> Routine <IconBubble Icon={Apple} /></div>
                <h2>Daily <span>Correctives</span></h2>
                <p>
                  Mobility, stability, and strength exercises selected from curated coach-built
                  libraries for your body’s top priority areas.
                </p>
                <div className="sm-feature-list">
                  <FeatureLine Icon={Activity} color="#2C99B3" title="Mobility focus" text="Open tight joints and restore range of motion." />
                  <FeatureLine Icon={ShieldCheck} color="#43AD5C" title="Stability focus" text="Build control and balance around key areas." />
                  <FeatureLine Icon={Dumbbell} color="#FF8A4C" title="Strength focus" text="Low-load strength work that supports clean movement." />
                  <FeatureLine Icon={BookOpen} color="#7A3EBA" title="Curated exercise library" text="Coach-built exercises organized by body area and goal." />
                  <FeatureLine Icon={Repeat} color="#38A5C7" title="Evolves with you" text="Your routine updates as your retests show improvement." />
                </div>
                <Link to="/about" className="sm-text-link">
                  Explore the corrective library <ArrowRight className="h-4 w-4" />
                </Link>
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
          .sm-home-shell{
            position: relative;
          }
          .sm-home-shell::before{
            content:"";
            position: fixed;
            inset: 0;
            pointer-events: none;
            background-image: radial-gradient(circle, rgba(20,33,58,.08) 1px, transparent 1px);
            background-size: 18px 18px;
            opacity: .55;
            z-index: -1;
          }
          .sm-wellness-grid{
            display: grid;
            gap: 14px;
          }
          .sm-panel{
            background: rgba(255,255,255,.94);
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 12px 36px -28px rgba(20,33,58,.45);
            transition: transform .2s ease, box-shadow .2s ease;
            will-change: transform;
          }
          .sm-panel:hover{
            transform: translateY(-4px) scale(1.01);
            box-shadow: 0 20px 40px -20px rgba(20,33,58,.35);
          }
          .sm-border-hero{ border: 1.5px solid #86D0EF; }
          .sm-border-score{ border: 1.5px solid #43AD5C; }
          .sm-border-mobile{ border: 1.5px solid #FF8A4C; }
          .sm-border-about{ border: 1.5px solid #7A3EBA; }
          .sm-border-program{ border: 1.5px solid #2C99B3; }
          .sm-border-tools{ border: 1.5px solid #F59E0B; }
          .sm-panel-score-picture{
            transition: transform .2s ease, box-shadow .2s ease;
            will-change: transform;
          }
          .sm-panel-score-picture:hover{
            transform: translateY(-4px) scale(1.01);
            box-shadow: 0 20px 40px -20px rgba(20,33,58,.35);
          }
          .sm-eyebrow{
            width: fit-content;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border: 1px solid #A5DDF4;
            border-radius: 999px;
            color: #2C99B3;
            background: #F7FCFE;
            padding: 4px 9px;
            font-size: 9px;
            line-height: 1;
            text-transform: uppercase;
            letter-spacing: .18em;
            font-weight: 800;
          }
          .sm-panel h2{
            color: #10213F;
            font-size: 22px;
            line-height: 1.05;
            font-weight: 900;
            margin: 14px 0 8px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .sm-panel h2 span{ color: #2B8FA3; }
          .sm-panel p{
            color: #4A5971;
            font-size: 13px;
            line-height: 1.6;
            margin: 0;
          }
          .sm-panel-hero{
            min-height: 200px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .sm-wellness-title{
            margin: 18px 0 0;
            color: #10213F;
            font-size: 44px;
            line-height: .96;
            font-weight: 900;
            letter-spacing: 0;
          }
          .sm-wellness-title span{ display:block; }
          .sm-wellness-title span:nth-child(1){ color:#43AD5C; }
          .sm-wellness-title span:nth-child(2){ color:#2B8FA3; }
          .sm-panel-mobile{
            min-height: 200px;
            display:flex;
            flex-direction:column;
            align-items:flex-start;
          }
          .sm-panel-mobile .sm-primary-cta{ margin-top:auto; }
          .sm-primary-cta{
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 38px;
            border: 1px solid #8FD4EA;
            border-radius: 999px;
            background: #F7FCFE;
            color: #1D7E95;
            padding: 0 16px;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            box-shadow: 0 8px 18px -14px rgba(44,153,179,.7);
          }
          .sm-card-topline{
            display:flex;
            align-items:center;
            gap: 8px;
            color:#78BED8;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: .2em;
            font-weight:800;
          }
          .sm-card-topline > span{
            display:block;
            width:22px;
            height:1px;
            background:#A5DDF4;
          }
          .sm-card-icon{
            margin-left:auto;
            display:grid;
            height:28px;
            width:28px;
            place-items:center;
            border-radius: 9px;
            color:#2C99B3;
            background:#F0FBFF;
            border:1px solid #A5DDF4;
          }
          .sm-panel-about,
          .sm-panel-program,
          .sm-panel-tools,
          .sm-panel-score-picture{ min-height: 240px; }
          .sm-panel-about{
            display: flex;
            flex-direction: column;
          }
          .sm-panel-about .sm-feature-list{ flex: 1 0 auto; }
          .sm-panel-about .sm-text-link{ margin-top: auto; }
          .sm-panel-program{ display:flex; flex-direction:column; }
          .sm-panel-program .sm-tile-grid{ flex:1 0 auto; align-content:stretch; }
          .sm-panel-program .sm-mini-tile{ min-height:40px; font-size:12px; }
          .sm-panel-program .sm-text-link{ margin-top:auto; }
          .sm-panel-tools{ display:flex; flex-direction:column; }
          .sm-panel-tools .sm-feature-list{ flex:1 0 auto; }
          .sm-panel-tools .sm-text-link{ margin-top:auto; }
          .sm-panel-score-picture{
            border-radius: 15px;
            overflow: hidden;
            display: flex;
            box-shadow: 0 12px 36px -28px rgba(20,33,58,.45);
          }
          .sm-panel-score-picture .sm-score-card{
            flex: 1;
            min-height: 0;
            margin-top: 0;
            border-radius: 15px;
          }
          .sm-feature-list{
            display:grid;
            gap:10px;
            margin-top:18px;
          }
          .sm-feature-line{
            display:grid;
            grid-template-columns: 32px minmax(0,1fr);
            gap:10px;
            align-items:start;
          }
          .sm-feature-line-icon,
          .sm-mini-icon{
            display:grid;
            place-items:center;
            border-radius:10px;
          }
          .sm-feature-line-icon{ width:28px; height:28px; }
          .sm-feature-line strong{
            display:block;
            color:#10213F;
            font-size:12px;
            line-height:1.25;
          }
          .sm-feature-line small{
            display:block;
            color:#5F6E84;
            font-size:11px;
            line-height:1.3;
          }
          .sm-text-link{
            display:inline-flex;
            align-items:center;
            gap:7px;
            color:#1D7E95;
            text-decoration:none;
            font-size:12px;
            font-weight:800;
            margin-top:18px;
          }
          .sm-tile-grid{
            display:grid;
            grid-template-columns: minmax(0,1fr);
            gap:8px;
            margin-top:18px;
          }
          .sm-mini-tile{
            display:flex;
            min-width:0;
            align-items:center;
            gap:8px;
            min-height:36px;
            border:1px solid #E4EEF3;
            border-radius:10px;
            background:#fff;
            padding:6px 8px;
            color:#10213F;
            font-size:11px;
            font-weight:800;
          }
          .sm-mini-icon{ width:22px; height:22px; flex:0 0 auto; }
          .sm-score-card{
            margin-top:18px;
            border-radius:14px;
            background: linear-gradient(160deg,#10213F 0%, #0C1729 100%);
            color:#fff;
            min-height:180px;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            text-align:center;
            overflow:hidden;
            position:relative;
          }
          .sm-score-card::before{
            content:"";
            position:absolute;
            left:16px;
            right:16px;
            top:18px;
            height:3px;
            border-radius:99px;
            background:linear-gradient(90deg, transparent, #4FB286 24%, #7CFFB8 50%, #4FB286 76%, transparent);
            box-shadow:0 0 16px 3px rgba(79,178,134,.72);
          }
          .sm-score-card div{
            color:rgba(255,255,255,.62);
            font-size:10px;
            text-transform:uppercase;
            letter-spacing:.16em;
            font-weight:800;
          }
          .sm-score-card strong{
            font-size:56px;
            line-height:1;
            font-weight:900;
            margin-top:5px;
          }
          .sm-score-card small{
            color:rgba(255,255,255,.52);
            font-size:16px;
          }
          .sm-score-card p{
            color:rgba(255,255,255,.78);
            font-size:12px;
            margin-top:8px;
          }
          @media (max-width: 1023px){
            .sm-wellness-grid{ gap:12px; }
            .sm-panel{ padding:18px; }
            .sm-panel-hero{ min-height:190px; }
            .sm-wellness-title{ font-size:42px; }
            .sm-primary-cta{ width:100%; margin-top:18px; min-height:46px; font-size:14px; }
            .sm-panel-score-picture{ min-height: 190px; }
            .sm-panel-about,
            .sm-panel-program,
            .sm-panel-tools{ display: none; }
          }
          @media (min-width: 1024px){
            .sm-wellness-grid{ grid-template-columns: repeat(12, minmax(0, 1fr)); gap:16px; }
            .sm-panel-hero{ grid-column: 1 / span 6; grid-row: 1; min-height: 200px; }
            .sm-panel-score-picture{ grid-column: 7 / span 3; grid-row: 1; min-height: 200px; }
            .sm-panel-mobile{ grid-column: 10 / span 3; grid-row: 1; min-height: 200px; }
            .sm-panel-about{ grid-column: 1 / span 4; grid-row: 2; min-height: 420px; }
            .sm-panel-program{ grid-column: 5 / span 4; grid-row: 2; min-height: 420px; }
            .sm-panel-tools{ grid-column: 9 / span 4; grid-row: 2; min-height: 420px; }
            .sm-panel h2{ font-size: 22px; }
          }
        `}</style>
      </main>
      <SiteFooter />
    </div>
  );
}

function IconBubble({ Icon }: { Icon: LucideIcon }) {
  return (
    <span className="sm-card-icon">
      <Icon className="h-4 w-4" strokeWidth={2.2} />
    </span>
  );
}

function FeatureLine({
  Icon,
  color,
  title,
  text,
}: {
  Icon: LucideIcon;
  color: string;
  title: string;
  text: string;
}) {
  return (
    <div className="sm-feature-line">
      <span className="sm-feature-line-icon" style={{ background: `${color}18`, color }}>
        <Icon className="h-4 w-4" strokeWidth={2.4} />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
    </div>
  );
}

function MiniTile({ Icon, label, color }: { Icon: LucideIcon; label: string; color: string }) {
  return (
    <div className="sm-mini-tile">
      <span className="sm-mini-icon" style={{ background: `${color}18`, color }}>
        <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
      </span>
      <span className="truncate">{label}</span>
    </div>
  );
}

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
