import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearOnboardingDraft, getOnboardingDraft, getUser, restoreUserFromBackend, signInWithEmailProfile, signUpWithEmailProfile } from "@/lib/store";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartyMove — Know how you move. Move smarter." },
      { name: "description", content: "Mobile-first movement screening and corrective training. Pose-based assessment, daily 5-minute routines, and a Movement Age you can improve." },
      { property: "og:title", content: "SmartyMove" },
      { property: "og:description", content: "Know how you move. Move smarter." },
    ],
    links: [],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"intro" | "signup" | "signin">("intro");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [pw, setPw] = useState("");
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div
      className="flex min-h-[100dvh] w-full flex-col"
      style={{ background: "#E7ECEC", color: "#14213A" }}
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
            <div className="text-center" style={{ fontSize: 13.5, color: "#6B7A90" }}>
              Already have an account?{" "}
              <button onClick={() => setMode("signin")} style={{ color: "#0E7C86", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Sign in
              </button>
            </div>
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
              <Input id="p" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} className="h-11 rounded-xl" />
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
        ) : (
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
              <Label htmlFor="sp">Password</Label>
              <Input id="sp" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={6} className="h-11 rounded-xl" />
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
        )}

        <SiteFooter />

        <style>{`
          .sm-scanline{
            position:absolute; left:14px; right:14px; height:2px;
            background:linear-gradient(90deg, transparent, #4FB286, transparent);
            box-shadow:0 0 14px 2px rgba(79,178,134,0.7);
            top:18px; animation: sm-sweep 2.6s ease-in-out infinite;
          }
          @keyframes sm-sweep{
            0%{ top:18px; opacity:.9 }
            50%{ top:calc(100% - 22px); opacity:.5 }
            100%{ top:18px; opacity:.9 }
          }
          @media (prefers-reduced-motion: reduce){ .sm-scanline{ animation:none; top:50% } }
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
