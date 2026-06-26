import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearOnboardingDraft, getOnboardingDraft, getUser, restoreUserFromBackend, signInWithEmailProfile, signUpWithEmailProfile } from "@/lib/store";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";

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
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: HOME_FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: Welcome,
});

const HOME_FAQ: { q: string; a: string }[] = [
  {
    q: "What is a movement screen and why does it matter?",
    a: "A movement screen is a short set of standardized tests (like a squat, hinge, single-leg balance, lunge, and overhead reach) that reveals where your body is restricted, unstable, or compensating. It matters because pain and injury usually start from the weakest link in your movement chain — not the spot that hurts.",
  },
  {
    q: "How does SmartyMove score my movement?",
    a: "Your phone camera tracks your joints during each test. SmartyMove measures range of motion, tempo, and compensations (heel rise, spine rounding, knee valgus, left/right asymmetry) and compares them to reference values for each movement. Those scores combine into a single 0–100 Movement Score.",
  },
  {
    q: "Is SmartyMove a replacement for physical therapy?",
    a: "No. SmartyMove is a wellness and education tool, not a medical device. It helps you understand how you move and gives you a corrective routine — but if you have pain, an injury, or a medical condition, see a qualified physiotherapist or physician.",
  },
  {
    q: "What is Movement Age?",
    a: "Movement Age is a motivational estimate of how old your movement quality looks, compared to your chronological age. It's based on your Movement Score and is designed to be lowered over time as your mobility, stability and strength improve.",
  },
  {
    q: "Does SmartyMove work for knee pain, low back pain, or starting to run?",
    a: "SmartyMove identifies the root cause behind common complaints — usually limited ankle mobility, weak hips, poor core control, or scapular dysfunction — and prescribes corrective work for that root cause. If you have acute pain or an undiagnosed injury, get cleared by a clinician first.",
  },
  {
    q: "Is my camera footage stored or sent anywhere?",
    a: "No. Pose detection runs on your device. Raw video is not uploaded to our servers — only the numeric movement scores and the joint-angle summaries needed to build your program are saved to your account.",
  },
];

function Welcome() {
  const navigate = useNavigate();
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
    const requestedMode = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("auth") : null;
    if (requestedMode === "signin" || requestedMode === "signup") {
      setMode(requestedMode);
      window.history.replaceState(null, "", "/");
      return;
    }
    const cached = getUser();
    if (cached && cached.questionnaire && cached.goal) navigate({ to: "/app" });
    void restoreUserFromBackend()
      .then((u) => { if (u?.questionnaire && u.goal) navigate({ to: "/app" }); })
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
      navigate({ to: (u.questionnaire || draft.questionnaire) && (u.goal || draft.goal) ? "/app" : "/onboarding/parq" });
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
      setAuthError(error instanceof Error ? error.message : "Sign in failed. Check your email and password.");
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
    <div
      className="flex min-h-[100dvh] w-full flex-col"
     
    >
      <SiteHeader
        onSignIn={() => setMode("signin")}
        onSignUp={() => setMode("signup")}
        onBack={mode === "intro" ? undefined : () => setMode("intro")}
      />
      <main className="mx-auto w-full max-w-[420px] px-5 pb-8 pt-5">

        {mode === "intro" ? (
          <>
            <div
              className="flex items-center gap-2"
              style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#0E7C86", fontWeight: 700 }}
            >
              <span
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF6B4A", boxShadow: "0 0 0 3px rgba(255,107,74,0.18)" }}
              />
              Movement Diagnostic
            </div>

            <h1
              style={{ fontWeight: 800, fontSize: 32, lineHeight: 1.1, letterSpacing: "-0.02em", margin: "14px 0 16px" }}
            >
              Know how you move.<br />
              <span style={{ color: "#0E7C86" }}>Move smarter.</span>
            </h1>

            {/* Scan viewfinder card */}
            <div
              className="relative overflow-hidden"
              style={{
                background: "linear-gradient(160deg,#13283A 0%, #0E1D2B 100%)",
                borderRadius: 22,
                padding: "22px 18px 20px",
                color: "#fff",
                marginBottom: 18,
              }}
            >
              <span style={cornerStyle({ top: 14, left: 14, borderRight: "none", borderBottom: "none", borderRadius: "6px 0 0 0" })} />
              <span style={cornerStyle({ top: 14, right: 14, borderLeft: "none", borderBottom: "none", borderRadius: "0 6px 0 0" })} />
              <span style={cornerStyle({ bottom: 14, left: 14, borderRight: "none", borderTop: "none", borderRadius: "0 0 0 6px" })} />
              <span style={cornerStyle({ bottom: 14, right: 14, borderLeft: "none", borderTop: "none", borderRadius: "0 0 6px 0" })} />
              <span className="sm-scanline" />
              <div className="relative text-center" style={{ zIndex: 2, padding: "14px 0 6px" }}>
                <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
                  Movement Score
                </div>
                <div style={{ fontWeight: 800, fontSize: 56, lineHeight: 1, margin: "4px 0 10px", letterSpacing: "-0.02em" }}>
                  72<sup style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", marginLeft: 2 }}>/100</sup>
                </div>
                <div className="flex items-baseline justify-center gap-1.5" style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                  Movement Age <b style={{ color: "#4FB286", fontSize: 15 }}>41</b> · Chronological 47
                </div>
              </div>
            </div>

            <p style={{ fontSize: 15, lineHeight: 1.55, color: "#3B4A63", margin: "4px 0 18px" }}>
              <b style={{ color: "#14213A" }}>Your pocket movement coach.</b> Scan your movement with your camera, get your score, and a 5-minute daily routine built around what your body actually needs.
            </p>

            <div className="mb-[22px] flex flex-wrap gap-2">
              {["5 core tests", "On-device", "Private by design"].map((p) => (
                <span key={p} style={pillStyle}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4FB286" }} />
                  {p}
                </span>
              ))}
            </div>

            <button
              onClick={() => navigate({ to: "/onboarding/parq" })}
              style={{
                display: "block", width: "100%", textAlign: "center",
                background: "#FF6B4A", color: "#fff",
                fontWeight: 700, fontSize: 16,
                padding: "16px 0", borderRadius: 16, border: "none",
                boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)",
                marginBottom: 14, cursor: "pointer",
              }}
            >
              Get started
            </button>
            <div className="mb-3 text-center">
              <Link
                to="/about"
                style={{ color: "#0E7C86", fontWeight: 700, fontSize: 14, textDecoration: "none", borderBottom: "1.5px solid rgba(14,124,134,0.35)", paddingBottom: 1 }}
              >
                About SmartyMove
              </Link>
            </div>
            <div className="text-center" style={{ fontSize: 13.5, color: "#6B7A90" }}>
              Already have an account?{" "}
              <button onClick={() => setMode("signin")} style={{ color: "#0E7C86", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Sign in
              </button>
            </div>

            {/* FAQ — rendered for SEO/GEO; wrapped in FAQPage JSON-LD in head() */}
            <section
              aria-labelledby="faq-heading"
              className="mt-8"
              style={{ background: "#fff", border: "1px solid #E5EAEC", borderRadius: 18, padding: "20px 18px" }}
            >
              <h2 id="faq-heading" style={{ fontWeight: 800, fontSize: 20, color: "#14213A", margin: "0 0 12px" }}>
                Frequently asked questions
              </h2>
              <div className="flex flex-col gap-3">
                {HOME_FAQ.map((f) => (
                  <details key={f.q} style={{ borderTop: "1px solid #EEF1F2", paddingTop: 10 }}>
                    <summary style={{ fontWeight: 700, color: "#14213A", fontSize: 14.5, cursor: "pointer", listStyle: "none" }}>
                      {f.q}
                    </summary>
                    <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55, color: "#3B4A63" }}>{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          </>
        ) : mode === "signup" ? (
          <form onSubmit={submit} className="mt-2 flex flex-col gap-3">
            <h2 style={{ fontWeight: 800, fontSize: 24, color: "#14213A", letterSpacing: "-0.01em" }}>
              Create your account
            </h2>
            <p className="-mt-1 text-sm" style={{ color: "#6B7A90" }}>Saved securely to your account.</p>
            <div className="space-y-1.5">
              <Label htmlFor="n">Name</Label>
              <Input id="n" value={name} onChange={(e) => setName(e.target.value)} required className="h-11 rounded-xl" />
            </div>
            <div className="grid grid-cols-[1fr_90px] gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="e">Email</Label>
                <Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a">Age</Label>
                <Input id="a" type="number" min={12} max={100} value={age} onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")} required className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p">Password</Label>
              <PasswordField id="p" value={pw} onChange={setPw} show={showPw} onToggle={() => setShowPw((s) => !s)} />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              style={{ background: "#FF6B4A", boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)" }}
              className="mt-2 h-12 w-full rounded-2xl text-base font-semibold text-white hover:opacity-95"
            >
              {submitting ? "Saving..." : "Continue"}
            </Button>
            {authError && <p className="text-center text-sm font-semibold text-destructive">{authError}</p>}
            <p className="mt-1 text-center text-sm" style={{ color: "#6B7A90" }}>
              Have an account?{" "}
              <button type="button" onClick={() => setMode("signin")} style={{ color: "#0E7C86", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Sign in
              </button>
            </p>
          </form>
        ) : mode === "signin" ? (
          <form onSubmit={submitSignin} className="mt-2 flex flex-col gap-3">
            <h2 style={{ fontWeight: 800, fontSize: 24, color: "#14213A", letterSpacing: "-0.01em" }}>
              Welcome back
            </h2>
            <p className="-mt-1 text-sm" style={{ color: "#6B7A90" }}>Sign in to continue your movement journey.</p>
            <div className="space-y-1.5">
              <Label htmlFor="se">Email</Label>
              <Input id="se" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="sp">Password</Label>
                <button
                  type="button"
                  onClick={() => { setAuthError(""); setResetSent(false); setMode("forgot"); }}
                  style={{ color: "#0E7C86", fontWeight: 700, fontSize: 13, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>
              <PasswordField id="sp" value={pw} onChange={setPw} show={showPw} onToggle={() => setShowPw((s) => !s)} />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              style={{ background: "#FF6B4A", boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)" }}
              className="mt-2 h-12 w-full rounded-2xl text-base font-semibold text-white hover:opacity-95"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
            {authError && <p className="text-center text-sm font-semibold text-destructive">{authError}</p>}
            <p className="mt-1 text-center text-sm" style={{ color: "#6B7A90" }}>
              New here?{" "}
              <button type="button" onClick={() => setMode("signup")} style={{ color: "#0E7C86", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Create an account
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={submitForgot} className="mt-2 flex flex-col gap-3">
            <h2 style={{ fontWeight: 800, fontSize: 24, color: "#14213A", letterSpacing: "-0.01em" }}>
              Reset your password
            </h2>
            <p className="-mt-1 text-sm" style={{ color: "#6B7A90" }}>
              Enter your account email. We'll send you a link to set a new password.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="fe">Email</Label>
              <Input id="fe" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-xl" />
            </div>
            <Button
              type="submit"
              disabled={submitting || resetSent}
              style={{ background: "#FF6B4A", boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)" }}
              className="mt-2 h-12 w-full rounded-2xl text-base font-semibold text-white hover:opacity-95"
            >
              {resetSent ? "Email sent ✓" : submitting ? "Sending..." : "Send reset link"}
            </Button>
            {resetSent && (
              <p className="text-center text-sm" style={{ color: "#0E7C86" }}>
                Check your inbox (and spam folder) for the reset link.
              </p>
            )}
            {authError && <p className="text-center text-sm font-semibold text-destructive">{authError}</p>}
            <p className="mt-1 text-center text-sm" style={{ color: "#6B7A90" }}>
              Remembered it?{" "}
              <button type="button" onClick={() => { setAuthError(""); setResetSent(false); setMode("signin"); }} style={{ color: "#0E7C86", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Back to sign in
              </button>
            </p>
          </form>
        )}

        <SiteFooter />

        <style>{`
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
        `}</style>
      </main>
    </div>
  );
}

function cornerStyle(extra: React.CSSProperties): React.CSSProperties {
  return {
    position: "absolute",
    width: 22, height: 22,
    border: "2.5px solid rgba(255,255,255,0.55)",
    ...extra,
  };
}

const pillStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, letterSpacing: ".01em",
  padding: "7px 11px", borderRadius: 999,
  background: "#fff", border: "1px solid #D9E0E2",
  color: "#3B4A63", display: "inline-flex",
  alignItems: "center", gap: 6,
};

function PasswordField({ id, value, onChange, show, onToggle }: { id: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) {
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
