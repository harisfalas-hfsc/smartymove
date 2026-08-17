import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearOnboardingDraft,
  clearOnboardingNextPath,
  getFirstIncompleteOnboardingPath,
  getOnboardingDraft,
  getOnboardingNextPath,
  getUser,
  isOnboardingComplete,
  restoreUserFromBackend,
  signInWithEmailProfile,
  signUpWithEmailProfile,
  useUser,
} from "@/lib/store";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useFreeAccessMode } from "@/hooks/useFreeAccessMode";
import heroSquat from "@/assets/hero-squat-camera.jpg";
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
  LineChart as LineChartIcon,
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
  const { freeAccessMode } = useFreeAccessMode();
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
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [emailUnverified, setEmailUnverified] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);

  useEffect(() => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const requestedMode = params?.get("auth") ?? null;
    if (requestedMode === "signin" || requestedMode === "signup") {
      const next = sanitizeNextPath(params?.get("next"));
      setNextPath(next);
      setMode(requestedMode);
      window.history.replaceState(null, "", "/");
      return;
    }
    const cached = getUser();
    if (isOnboardingComplete(cached)) navigate({ to: "/app" });
    void restoreUserFromBackend()
      .then((u) => {
        if (isOnboardingComplete(u)) navigate({ to: "/app" });
      })
      .catch(() => undefined);
  }, [navigate]);

  useEffect(() => {
    const handler = () => {
      setMode("intro");
      setAuthError("");
      setResetSent(false);
      setVerificationSent(false);
      setResendSent(false);
      setEmailUnverified(false);
    };
    window.addEventListener("smartymove:home", handler);
    return () => window.removeEventListener("smartymove:home", handler);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !age || !pw) return;
    setAuthError("");
    setVerificationSent(false);
    setResendSent(false);
    setEmailUnverified(false);
    setSubmitting(true);
    try {
      const result = await signUpWithEmailProfile(name, email, Number(age), pw, getEmailRedirectTo(nextPath));
      if (result.emailVerificationRequired) {
        setVerificationSent(true);
        return;
      }
      const draft = getOnboardingDraft();
      clearOnboardingDraft();
      const merged = { ...result.user, parq: result.user.parq ?? draft.parq, questionnaire: result.user.questionnaire ?? draft.questionnaire, goal: result.user.goal ?? draft.goal };
      const destination = nextPath ?? (isOnboardingComplete(merged) ? getOnboardingNextPath("/app/screen") : (getFirstIncompleteOnboardingPath(merged) ?? "/app/screen"));
      if (isOnboardingComplete(merged)) clearOnboardingNextPath();
      navigate({ to: destination });
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
    setEmailUnverified(false);
    setResendSent(false);
    setSubmitting(true);
    try {
      const u = await signInWithEmailProfile(email, pw);
      const destination = nextPath ?? (isOnboardingComplete(u) ? "/app" : (getFirstIncompleteOnboardingPath(u) ?? "/app"));
      if (isOnboardingComplete(u)) clearOnboardingNextPath();
      navigate({ to: destination });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign in failed. Check your email and password.";
      if (/email not (confirmed|verified)/i.test(message)) {
        setEmailUnverified(true);
        setAuthError("Please verify your email before signing in. Check your inbox, or resend the verification email below.");
        return;
      }
      setAuthError(
        message,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function resendVerification() {
    if (!email) return;
    setAuthError("");
    setResendSent(false);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: getEmailRedirectTo(nextPath) },
      });
      if (error) throw error;
      setResendSent(true);
      setVerificationSent(true);
      setEmailUnverified(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Couldn't resend the verification email.");
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
        className={`mx-auto w-full flex-1 pb-6 pt-5 ${mode === "intro" ? "px-5 max-w-[430px] lg:max-w-[1080px] lg:px-6 lg:pt-16 lg:pb-20" : "px-5 max-w-[420px]"}`}
      >
        {mode === "intro" ? (
          <>
          {/* FULL-BLEED HERO — image with content on top (SmartyGym concept) */}
          <section className="relative left-1/2 -mt-5 mb-4 hidden h-[280px] w-screen -translate-x-1/2 overflow-hidden lg:-mt-16 lg:mb-14 lg:block lg:h-auto">
            <img
              src={heroSquat}
              alt="Man performing a squat in front of a phone camera running a movement scan"
              width={1920}
              height={1088}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-[68%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/75 to-black/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />
            <div className="relative mx-auto hidden w-full max-w-[430px] px-5 py-16 lg:block lg:max-w-[1080px] lg:px-6 lg:py-36">
              <div className="max-w-xl">
                <h1 className="text-[38px] font-extrabold leading-[1.05] tracking-tight text-white lg:text-[60px]">
                  Know how you move,
                  <br />
                  <span className="text-primary">move smarter.</span>
                </h1>
                <p className="mt-5 text-base leading-relaxed text-white/80 lg:mt-6 lg:text-lg">
                  Run a camera-based Movement Screen. Get your Movement Score, Movement Age, and a
                  personalized 2-week corrective program — built around your real mobility limits.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => navigate({ to: "/onboarding/parq" })}
                    className="h-12 rounded-full bg-primary px-8 text-base font-bold text-primary-foreground hover:opacity-95"
                  >
                    Get started
                  </button>
                  <Link
                    to="/about"
                    className="inline-flex h-12 items-center rounded-full border-2 border-primary px-8 text-base font-bold text-primary hover:bg-primary/10"
                  >
                    How it works
                  </Link>
                </div>
                {!freeAccessMode && (
                  <p className="mt-4 text-sm text-white/60">One-time €9.99 per scan. No subscription.</p>
                )}
              </div>
            </div>
          </section>

          {/* MOBILE — centered, image-free header + CTAs (SmartyWorkout/Diet style) */}
          <div className="lg:hidden">
            <section className="py-4 text-center">
              <h1 className="text-[34px] font-extrabold uppercase leading-[1.05] tracking-tight text-foreground">
                Know how you move,
                <br />
                <span className="text-primary">move smarter.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[22rem] text-[15px] leading-relaxed text-muted-foreground">
                Run a camera-based Movement Screen. Get your Movement Score, Movement Age, and a
                personalized 2-week corrective program — built around your real mobility limits.
              </p>
              <div className="mx-auto mt-8 flex max-w-xs flex-col gap-3">
                <button
                  onClick={() => navigate({ to: "/onboarding/parq" })}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-[16px] font-extrabold text-primary-foreground"
                >
                  <Camera className="h-4 w-4 shrink-0" />
                  Get started
                </button>
                <Link
                  to="/about"
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-primary text-[16px] font-bold text-primary no-underline"
                  style={{ textDecoration: "none" }}
                >
                  How it works
                </Link>
              </div>
              {!freeAccessMode && (
                <p className="mx-auto mt-5 max-w-[22rem] text-[12px] leading-snug text-muted-foreground/70">
                  One-time €9.99 per scan. No subscription.
                </p>
              )}
            </section>

            <div className="sm-wellness-grid">

              <div className="sm-panel-score-picture sm-border-score">
                <div className="sm-score-card">
                  <div>Movement Score</div>
                  <strong>72<small>/100</small></strong>
                  <p>Movement Age 41 · Chronological 47</p>
                </div>
              </div>


              <section className="sm-panel sm-panel-about sm-border-about">
                <div className="sm-card-topline"><span /> Assess <IconBubble Icon={Activity} /></div>
                <h2>Smarty <span>Move</span></h2>
                <p>
                  Your pocket movement coach. Use your phone, tablet, laptop, or desktop camera for
                  a guided movement screen — get your Movement Score, Movement Age, and a 5-minute
                  daily corrective workout built around what your body actually needs.
                </p>
                <div className="sm-feature-list">
                  <FeatureLine Icon={Camera} color="#2C99B3" title="Camera movement scan" text="Guided patterns, any camera." />
                  <FeatureLine Icon={ShieldCheck} color="#43AD5C" title="Private by design" text="Runs on your device." />
                  <FeatureLine Icon={Clock} color="#FF8A4C" title="5-minute daily routine" text="Short corrective work." />
                  <FeatureLine Icon={Target} color="#7A3EBA" title="Personalized focus areas" text="Built on your real limits." />
                  <FeatureLine Icon={Repeat} color="#38A5C7" title="Retest every 14 days" text="Program evolves with you." />
                  <FeatureLine Icon={Monitor} color="#4FB286" title="Works on any screen" text="Phone, tablet, or laptop." />
                  <FeatureLine Icon={LineChartIcon} color="#3B82F6" title="Progress you can see" text="Score history and trends." />
                  <FeatureLine Icon={HeartPulse} color="#E46B5A" title="Built on movement science" text="Functional screening roots." />
                  <FeatureLine Icon={Sparkles} color="#F59E0B" title="Small wins, daily" text="A habit that lasts." />
                </div>
                <Link to="/about" className="sm-text-link">
                  Learn more about Smarty Move <ArrowRight className="h-4 w-4" />
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
                  <FeatureLine Icon={Activity} color="#2C99B3" title="Mobility focus" text="Restore range of motion." />
                  <FeatureLine Icon={ShieldCheck} color="#43AD5C" title="Stability focus" text="Control around key joints." />
                  <FeatureLine Icon={Dumbbell} color="#FF8A4C" title="Strength focus" text="Low-load, clean movement." />
                  <FeatureLine Icon={BookOpen} color="#7A3EBA" title="Curated exercise library" text="Coach-built by body area." />
                  <FeatureLine Icon={Repeat} color="#38A5C7" title="Evolves with you" text="Updates after each retest." />
                </div>
                <Link to="/learn" className="sm-text-link">
                  Learn how the program works <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            </div>
          </div>

          {/* DESKTOP — SmartyDiet-inspired layout */}
          <div className="hidden lg:block">
            {/* Big framed card: How it works */}
            <div className="rounded-[32px] border-2 border-primary bg-card p-12">
              <div className="flex items-center gap-4">
                <div className="flex-1 inline-flex items-center gap-3 rounded-full border-2 border-primary/40 px-6 py-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-[11px] font-extrabold tracking-[0.28em] uppercase text-primary">HOW IT WORKS</span>
                </div>
                <div className="grid place-items-center h-14 w-14 rounded-full border-2 border-primary/40 bg-primary/5">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
              </div>

              <h2 className="mt-10 text-[34px] leading-tight font-extrabold text-[#0f172a]">
                From scan <span className="text-primary">to program.</span>
              </h2>
              <p className="mt-3 text-slate-500">
                {freeAccessMode ? "Three steps. Scan, get your plan, train." : "Three steps. One payment. No subscription."}
              </p>

              <div className="mt-10 grid grid-cols-3 gap-10">
                <div className="text-center">
                  <div className="text-[64px] leading-none font-extrabold text-orange-500">1</div>
                  <div className="mt-3 text-lg font-bold text-[#0f172a]">Scan</div>
                  <p className="mt-1 text-sm text-slate-500">Run the 5-pattern Movement Screen with any camera.</p>
                </div>
                <div className="text-center">
                  <div className="text-[64px] leading-none font-extrabold text-blue-500">2</div>
                  <div className="mt-3 text-lg font-bold text-[#0f172a]">Score</div>
                  <p className="mt-1 text-sm text-slate-500">Get your Movement Score, Movement Age, and priority areas.</p>
                </div>
                <div className="text-center">
                  <div className="text-[64px] leading-none font-extrabold text-emerald-500">3</div>
                  <div className="mt-3 text-lg font-bold text-[#0f172a]">Train</div>
                  <p className="mt-1 text-sm text-slate-500">Follow a personalized 5-min daily corrective program.</p>
                </div>
              </div>

              <div className="mt-12 border-t border-slate-200 pt-10">
                <h3 className="text-center text-2xl font-extrabold text-[#0f172a]">What's included</h3>
                <div className="mt-6 grid grid-cols-2 gap-x-10 gap-y-4">
                  {[
                    { Icon: Camera, label: "Camera movement scan" },
                    { Icon: Sparkles, label: "Movement Score & Movement Age" },
                    { Icon: Target, label: "Personalized focus areas" },
                    { Icon: Clock, label: "5-minute daily corrective routine" },
                    { Icon: Repeat, label: "Retest every 14 days" },
                    { Icon: LineChartIcon, label: "Progress history you keep forever" },
                    { Icon: BookOpen, label: "Curated coach-built exercise library" },
                    { Icon: ShieldCheck, label: "Private by design — runs on your device" },
                  ].map(({ Icon, label }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="grid place-items-center h-8 w-8 rounded-full border-2 border-primary/40 bg-primary/5">
                        <Icon className="h-4 w-4 text-primary" />
                      </span>
                      <span className="text-[15.5px] font-semibold text-[#0f172a]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
            {verificationSent && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm" style={{ color: "#14213A" }}>
                <strong>Verify your email to continue.</strong>
                <p className="mt-1" style={{ color: "#6B7A90" }}>
                  We sent a verification link to {email.trim().toLowerCase()}. You cannot buy a scan or enter the app until that email is verified.
                </p>
              </div>
            )}
            <Button
              type="submit"
              disabled={submitting || verificationSent}
              style={{
                background: "#FF6B4A",
                boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)",
              }}
              className="mt-2 h-12 w-full rounded-2xl text-base font-semibold text-white hover:opacity-95"
            >
              {verificationSent ? "Check your email" : submitting ? "Saving..." : "Continue"}
            </Button>
            {verificationSent && (
              <button
                type="button"
                onClick={resendVerification}
                disabled={submitting || resendSent}
                className="text-center text-sm font-semibold disabled:opacity-60"
                style={{ color: "#0E7C86" }}
              >
                {resendSent ? "Verification email resent ✓" : "Resend verification email"}
              </button>
            )}
            {authError && (
              <p className="text-center text-sm font-semibold text-destructive">{authError}</p>
            )}
            {emailUnverified && (
              <button
                type="button"
                onClick={resendVerification}
                disabled={submitting || resendSent}
                className="text-center text-sm font-semibold disabled:opacity-60"
                style={{ color: "#0E7C86" }}
              >
                {resendSent ? "Verification email resent ✓" : "Resend verification email"}
              </button>
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
            font-size: 15px;
            line-height: 1.6;
            margin: 0;
          }
          .sm-panel-hero{
            min-height: 200px;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }
          .sm-wellness-title{
            margin: 14px 0 0;
            color: #10213F;
            font-size: 32px;
            line-height: 1.05;
            font-weight: 900;
            letter-spacing: 0;
          }
          .sm-wellness-title span{ display:block; white-space:nowrap; }
          .sm-wellness-title span:nth-child(1){ color:#43AD5C; }
          .sm-wellness-title span:nth-child(2){ color:#2B8FA3; }
          .sm-hero-motto{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-top: 14px;
            color: #4A5971;
            font-size: 14px;
            font-weight: 700;
          }
          .sm-hero-motto svg{ color: #2B8FA3; }
          .sm-read-more-link{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 10px;
            color: #1D7E95;
            font-size: 13px;
            font-weight: 800;
            text-decoration: none;
          }
          .sm-read-more-link:hover{ color: #156578; }
          .sm-read-more-link svg{ color: #2B8FA3; }

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
          .sm-panel-tools,
          .sm-panel-score-picture{ min-height: 240px; }
          .sm-panel-about{
            display: flex;
            flex-direction: column;
          }
          .sm-panel-about .sm-feature-list{ flex: 1 0 auto; }
          .sm-panel-about .sm-text-link{ margin-top: auto; }
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
          .sm-feature-line-icon{ width:32px; height:32px; }
          .sm-feature-line strong{
            display:block;
            color:#10213F;
            font-size:14px;
            line-height:1.3;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
          }
          .sm-feature-line small{
            display:block;
            color:#5F6E84;
            font-size:13px;
            line-height:1.35;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
          }
          .sm-text-link{
            display:inline-flex;
            align-items:center;
            gap:7px;
            color:#1D7E95;
            text-decoration:none;
            font-size:14px;
            font-weight:800;
            margin-top:18px;
          }
          .sm-score-card{
            margin-top:18px;
            border-radius:14px;
            background: linear-gradient(160deg,#F7FCFE 0%, #E6F5F5 100%);
            color:#10213F;
            min-height:180px;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            text-align:center;
            overflow:hidden;
            position:relative;
            border: 1px solid #A5DDF4;
          }
          .sm-score-card::before{
            content:"";
            position:absolute;
            left:16px;
            right:16px;
            top:18px;
            height:3px;
            border-radius:99px;
            background:linear-gradient(90deg, transparent, #43AD5C 24%, #7CFFB8 50%, #43AD5C 76%, transparent);
            box-shadow:0 0 16px 3px rgba(79,178,134,.72);
            animation: sm-score-pulse 2.4s ease-in-out infinite;
          }
          @keyframes sm-score-pulse{
            0%,100%{
              opacity:.5;
              box-shadow:0 0 8px 1px rgba(79,178,134,.35);
              transform:translateY(0) scaleX(.9);
            }
            50%{
              opacity:1;
              box-shadow:0 0 24px 6px rgba(124,255,184,.95);
              transform:translateY(4px) scaleX(1);
            }
          }
          .sm-score-card div{
            color:rgba(16,33,63,.62);
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
            color:rgba(16,33,63,.52);
            font-size:16px;
          }
          .sm-score-card p{
            color:rgba(16,33,63,.78);
            font-size:12px;
            margin-top:8px;
          }
          .dark .sm-score-card{
            background: linear-gradient(160deg,#10213F 0%, #0C1729 100%);
            color:#fff;
            border-color: transparent;
          }
          .dark .sm-score-card div{ color:rgba(255,255,255,.62); }
          .dark .sm-score-card small{ color:rgba(255,255,255,.52); }
          .dark .sm-score-card p{ color:rgba(255,255,255,.78); }
          @media (max-width: 1023px){
            .sm-wellness-grid{ gap:12px; }
            .sm-panel{ padding:18px; }
            .sm-panel-hero{ min-height:190px; }
            .sm-wellness-title{ font-size: 28px; }
            .sm-primary-cta{ width:100%; margin-top:18px; min-height:46px; font-size:14px; }

            .sm-panel-score-picture{ min-height: 190px; }
            .sm-panel-about,
            .sm-panel-tools{ display: none; }
          }
          @media (min-width: 1024px){
            .sm-wellness-grid{ grid-template-columns: repeat(12, minmax(0, 1fr)); grid-template-rows: auto 1fr; gap:16px; }
            .sm-panel-hero{ grid-column: 1 / span 6; grid-row: 1; min-height: 200px; }
            .sm-panel-mobile{ grid-column: 7 / span 3; grid-row: 1; min-height: 200px; }
            .sm-panel-score-picture{ grid-column: 10 / span 3; grid-row: 1; min-height: 200px; }
            .sm-panel-about{ grid-column: 1 / span 8; grid-row: 2; min-height: 420px; }
            .sm-panel-tools{ grid-column: 9 / span 4; grid-row: 2; min-height: 420px; }
            .sm-panel-about .sm-feature-list{ grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 18px; }
            .sm-panel h2{ font-size: 22px; }
          }
        `}</style>
      </main>
      <SiteFooter />
    </div>
  );
}

function sanitizeNextPath(value?: string | null) {
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value);
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
    if (decoded.includes("\\")) return null;
    return decoded;
  } catch {
    return null;
  }
}

function getEmailRedirectTo(nextPath: string | null) {
  if (typeof window === "undefined") return undefined;
  if (!nextPath) return window.location.origin;
  return `${window.location.origin}/?auth=signin&next=${encodeURIComponent(nextPath)}`;
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
