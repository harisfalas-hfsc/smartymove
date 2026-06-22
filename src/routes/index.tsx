import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser, getUser } from "@/lib/store";
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
    links: [
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap" },
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
    <div
      className="flex min-h-[100dvh] w-full justify-center px-4 py-8"
      style={{ background: "#E7ECEC", fontFamily: "'IBM Plex Sans', sans-serif", color: "#14213A" }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{
          maxWidth: 390,
          background: "#F4F6F7",
          borderRadius: 36,
          boxShadow: "0 30px 60px -20px rgba(20,33,58,0.25)",
          padding: "28px 22px 32px",
        }}
      >
        {/* notch */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: 14, width: 90, height: 5, borderRadius: 3, background: "rgba(20,33,58,0.15)" }}
        />

        <div className="mt-7">
          <SiteHeader onSignIn={() => setMode("signup")} />
        </div>

        {mode === "intro" ? (
          <>
            <div
              className="flex items-center gap-2"
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#0E7C86", fontWeight: 600 }}
            >
              <span
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF6B4A", boxShadow: "0 0 0 3px rgba(255,107,74,0.18)" }}
              />
              Movement Diagnostic
            </div>

            <h1
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 30, lineHeight: 1.12, letterSpacing: "-0.01em", margin: "14px 0 16px" }}
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
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
                  Movement Score
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 54, lineHeight: 1, margin: "2px 0 10px" }}>
                  72<sup style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", marginLeft: 2 }}>/100</sup>
                </div>
                <div className="flex items-baseline justify-center gap-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
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
              onClick={() => setMode("signup")}
              style={{
                display: "block", width: "100%", textAlign: "center",
                background: "#FF6B4A", color: "#fff",
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16,
                padding: "16px 0", borderRadius: 16, border: "none",
                boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)",
                marginBottom: 14, cursor: "pointer",
              }}
            >
              Get started
            </button>
            <div className="text-center" style={{ fontSize: 13.5, color: "#6B7A90" }}>
              Already have an account?{" "}
              <button onClick={() => setMode("signup")} style={{ color: "#0E7C86", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Sign in
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit} className="mt-7 flex flex-col gap-3">
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, color: "#14213A" }}>
              Create your account
            </h2>
            <p className="-mt-1 text-sm" style={{ color: "#6B7A90" }}>Saved locally on this device for now.</p>
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
              style={{ background: "#FF6B4A", boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)" }}
              className="mt-2 h-12 w-full rounded-2xl text-base font-semibold text-white hover:opacity-95"
            >
              Continue
            </Button>
          </form>
        )}

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
      </div>
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
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 11, letterSpacing: ".02em",
  padding: "7px 11px", borderRadius: 999,
  background: "#fff", border: "1px solid #D9E0E2",
  color: "#3B4A63", display: "inline-flex",
  alignItems: "center", gap: 6,
};
