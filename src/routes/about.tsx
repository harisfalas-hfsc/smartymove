import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Camera, Activity, Target, ShieldCheck, Repeat } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About SmartyMove — Your pocket movement coach" },
      { name: "description", content: "SmartyMove is a camera-based movement screen and corrective training app. Find out what's holding your body back, then fix it in 5 minutes a day." },
      { property: "og:title", content: "About SmartyMove" },
      { property: "og:description", content: "Know how you move. Move smarter. The pocket movement coach for everyday humans." },
      { property: "og:url", content: "https://smartymove.com/about" },
    ],
    links: [{ rel: "canonical", href: "https://smartymove.com/about" }],
  }),
  component: About,
});

function About() {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col" style={{ background: "#E7ECEC", color: "#14213A" }}>
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[760px] px-5 pb-8 pt-5">
        <div
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(160deg,#0E7C86 0%, #1f6fa8 100%)",
            borderRadius: 22,
            padding: "26px 22px 28px",
            color: "#fff",
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 700, opacity: 0.85 }}>
            About SmartyMove
          </div>
          <h1 style={{ fontWeight: 800, fontSize: 28, lineHeight: 1.15, letterSpacing: "-0.02em", margin: "10px 0 10px" }}>
            Know how you move.<br />
            <span style={{ color: "#7CFFB8" }}>Move smarter.</span>
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.55, opacity: 0.95, margin: 0 }}>
            Your pocket movement coach — a camera-based screen plus a short daily routine built around what your body actually needs.
          </p>
        </div>

        <section
          className="mt-4"
          style={{ background: "#fff", border: "1px solid #E5EAEC", borderRadius: 22, padding: "22px 22px 24px", fontSize: 15, lineHeight: 1.65, color: "#3B4A63" }}
        >
          <h2 style={h2}>Why SmartyMove exists</h2>
          <p>
            Most people don't know how their body actually moves. They feel stiff, sore, or stuck — but they
            don't know <strong>where</strong> the limit is, <strong>why</strong> it's there, or <strong>what</strong> to do about it.
            Getting a real assessment usually means booking a physio, paying for a session, and waiting weeks
            for a plan.
          </p>
          <p>
            SmartyMove turns your phone camera into a movement screen. In about 5 minutes you get a clear
            picture of how you move, where the weak links are, and a short daily routine that targets the
            <strong> root cause</strong> — not just the symptoms.
          </p>

          <h2 style={h2}>What it does</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Feature icon={<Camera className="h-4 w-4" />} title="Camera-based screen">
              Five core movement tests scored from your phone, on-device. No wearables, no clinic visit.
            </Feature>
            <Feature icon={<Activity className="h-4 w-4" />} title="Movement Score & Age">
              An overall score plus a motivational Movement Age you can lower over time.
            </Feature>
            <Feature icon={<Target className="h-4 w-4" />} title="Root-cause program">
              We cluster your findings and prioritize the issue that fixes the most things at once.
            </Feature>
            <Feature icon={<Repeat className="h-4 w-4" />} title="5 minutes a day">
              Short corrective sessions in phases — Foundation, Build, Maintain & Perform.
            </Feature>
            <Feature icon={<Sparkles className="h-4 w-4" />} title="Compensation detection">
              We check if your range was real — not faked by your lower back, shoulder, or heel lifting.
            </Feature>
            <Feature icon={<ShieldCheck className="h-4 w-4" />} title="Private by design">
              Pose detection runs on your device. No raw video is uploaded to our servers.
            </Feature>
          </div>

          <h2 style={h2}>How it works</h2>
          <ol style={{ margin: "0 0 12px", paddingLeft: 18 }}>
            <li><strong>Set up.</strong> Quick readiness questionnaire and goal selection.</li>
            <li><strong>Screen.</strong> Prop your phone, follow the prompts, do 5 short tests.</li>
            <li><strong>See your results.</strong> Score, Movement Age, and the real root cause behind any failed tests.</li>
            <li><strong>Train.</strong> Follow your 5-minute daily routine — mobility, stability, and strength in the right ratio for your phase.</li>
            <li><strong>Retest every 14 days.</strong> Watch your score improve and your program evolve.</li>
          </ol>

          <h2 style={h2}>Who it's for</h2>
          <p>
            Anyone who wants to move better — desk workers with stiff hips, lifters protecting their joints,
            runners chasing efficiency, parents who want to keep up, or anyone who's tired of generic
            stretching routines that don't match their actual body.
          </p>
          <p style={{ marginBottom: 0, color: "#6B7A90", fontSize: 13.5 }}>
            SmartyMove is a wellness and education tool — not a medical device. See our{" "}
            <Link to="/disclaimer" style={link}>disclaimer</Link> for the safety details.
          </p>
        </section>

        <div className="mt-5 text-center">
          <Link
            to="/"
            style={{
              display: "inline-block",
              background: "#FF6B4A", color: "#fff",
              fontWeight: 700, fontSize: 15,
              padding: "14px 26px", borderRadius: 16,
              boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)",
              textDecoration: "none",
            }}
          >
            Take the Movement Screen
          </Link>
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#F1F5F4", border: "1px solid #D9E0E2", borderRadius: 14, padding: "12px 14px" }}>
      <div className="flex items-center gap-2" style={{ color: "#0E7C86", fontWeight: 700, fontSize: 14 }}>
        <span className="grid place-items-center" style={{ width: 24, height: 24, borderRadius: 8, background: "#0E7C86", color: "#fff" }}>
          {icon}
        </span>
        {title}
      </div>
      <div style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.5, color: "#3B4A63" }}>{children}</div>
    </div>
  );
}

const h2: React.CSSProperties = { fontWeight: 700, fontSize: 18, color: "#14213A", margin: "20px 0 8px" };
const link: React.CSSProperties = { color: "#0E7C86", fontWeight: 600, textDecoration: "none" };