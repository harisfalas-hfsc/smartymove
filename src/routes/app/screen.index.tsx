import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useUser } from "@/lib/store";
import { CORE_TESTS } from "@/lib/movement";
import { Play, Lock, Loader2, Camera, ShieldCheck, Smartphone, EyeOff, Ruler, Sparkles, Timer, HelpCircle, ListChecks, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getScanAccess, SCAN_PRICE_EUR } from "@/lib/scans.functions";
import { SmartyCard, SmartyRow } from "@/components/SmartyCard";
import { TestPreviewSheet } from "@/components/TestPreviewSheet";
import { isAdminEmail } from "@/lib/admin";
import { useBuyScan } from "@/components/BuyScanDialog";

export const Route = createFileRoute("/app/screen/")({ component: ScreenIndex });

function ScreenIndex() {
  const u = useUser();
  const navigate = useNavigate();
  const isAdmin = !!u && isAdminEmail(u.email);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFocus, setPreviewFocus] = useState<string | undefined>(undefined);
  const { openBuyScan, buyScanElement } = useBuyScan("/pricing?paid=1");
  const access = useQuery({
    queryKey: ["scan-access", u?.id ?? "pending"],
    queryFn: () => getScanAccess(),
    enabled: !!u && !isAdmin,
    staleTime: 30_000,
  });
  if (!u) return null;
  const last = u.sessions[u.sessions.length - 1];
  const canScan = isAdmin ? true : (access.data?.canScan ?? false);
  const credits = isAdmin ? 9999 : (access.data?.credits ?? 0);
  const accessLoading = !isAdmin && access.isLoading;
  function startScreen(e: React.MouseEvent) {
    if (canScan) return;
    e.preventDefault();
    void openBuyScan();
  }

  const primaryCta = canScan ? (
    <Link
      to="/app/screen/run"
      onClick={startScreen}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold text-white"
      style={{ background: "#FF6B4A", boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)" }}
    >
      <Play className="h-5 w-5" /> {last ? "Run re-scan" : "Start scan"}
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => void openBuyScan()}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold text-white"
      style={{ background: "#FF6B4A", boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)" }}
    >
      <Lock className="h-5 w-5" /> Buy a scan · €{SCAN_PRICE_EUR.toFixed(2)}
    </button>
  );

  return (
    <>
    <div className="space-y-4 px-5 pb-6 pt-4" style={{ background: "#ffffff" }}>
      {/* HERO CARD */}
      <SmartyCard
        Icon={Camera}
        iconColor="#0E7C86"
        iconBg="#E6F5F5"
        title="SmartyMove Scan"
        subtitle="A camera-based assessment. 8 movement patterns — done in about 8 minutes from your phone or laptop."
      >
        <div className="mt-1 rounded-2xl p-3 text-center text-sm" style={{ background: "#F1F7F8", color: "#14213A" }}>
          {accessLoading ? (
            <span className="inline-flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Checking scan access…</span>
          ) : isAdmin ? (
            <><span style={{ color: "#0E7C86" }}>✓</span> <strong>Admin access</strong> — unlimited scans.</>
          ) : canScan ? (
            <>✅ You have <strong>{credits}</strong> scan{credits === 1 ? "" : "s"} available.</>
          ) : (
            <>💳 Buy one scan for <strong>€{SCAN_PRICE_EUR.toFixed(2)}</strong> — includes a 2-week program you keep forever.</>
          )}
        </div>
        <div className="mt-4">{primaryCta}</div>
      </SmartyCard>

      {/* HEALTH & SAFETY */}
      <SmartyCard Icon={ShieldCheck} iconColor="#0F766E" iconBg="#DCFCE7" title="Health & safety check" subtitle="A quick reality check before you scan.">
        <div className="mt-2 space-y-1">
          <SmartyRow Icon={Ruler} color="#0E7C86" label="Stand 6–8 feet from the camera" sub="Full body should be visible top to bottom." />
          <SmartyRow Icon={Smartphone} color="#7A3EBA" label="Use a phone or laptop camera" sub="Prop it up so it doesn't move mid-test." />
          <SmartyRow Icon={EyeOff} color="#C2410C" label="Wear fitted clothing" sub="Baggy layers hide your joint angles." />
          <SmartyRow Icon={ShieldCheck} color="#0F766E" label="Stop if anything hurts" sub="Skip a test if you feel sharp pain." />
        </div>
      </SmartyCard>

      {/* CORE TESTS */}
      <SmartyCard Icon={ListChecks} iconColor="#1D4ED8" iconBg="#DBEAFE" title="The 8 movement patterns" subtitle="Tap any pattern to see the reference photo, setup, cues, and common mistakes before you scan.">
        <div className="mt-2 space-y-1.5">
          {CORE_TESTS.map((t, i) => {
            const palette = ["#0E7C86", "#7A3EBA", "#C2410C", "#0F766E", "#1D4ED8", "#B45309", "#0369A1"][i % 7];
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => { setPreviewFocus(t.id); setPreviewOpen(true); }}
                className="flex w-full items-center gap-3 rounded-xl py-1.5 text-left transition hover:bg-secondary/40 active:scale-[0.99]"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white"
                  style={{ background: palette, boxShadow: `0 6px 14px -8px ${palette}` }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold" style={{ color: "#14213A" }}>{t.name}</div>
                  <div className="text-xs" style={{ color: "#5A6B85" }}>⏱ {t.duration}s · {t.focus.join(" + ")}</div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => { setPreviewFocus(undefined); setPreviewOpen(true); }}
          className="mt-3 h-10 w-full rounded-xl bg-secondary text-sm font-semibold text-foreground"
        >
          Preview all 8 patterns
        </button>
      </SmartyCard>

      {/* PRIVACY */}
      <SmartyCard Icon={EyeOff} iconColor="#0F766E" iconBg="#DCFCE7" title="Private by design" subtitle="Pose detection runs on your device. Raw video never leaves your phone — only the numeric scores are saved.">
      </SmartyCard>

      {/* LAST RESULT */}
      {last && (
        <SmartyCard
          Icon={Timer}
          iconColor="#1D4ED8"
          iconBg="#DBEAFE"
          title={`Last result · Score ${last.overall}`}
          subtitle={`Taken on ${new Date(last.date).toLocaleDateString()}.`}
          cta={{ label: "See breakdown", to: "/app/progress" }}
        />
      )}

      {/* FAQ CARD */}
      <SmartyCard Icon={HelpCircle} iconColor="#C2410C" iconBg="#FDECD8" title="Common questions">
        <div className="mt-1 flex flex-col gap-2">
          {SCREEN_FAQ.map((f) => (
            <details key={f.q} style={{ borderTop: "1px solid #EEF1F2", paddingTop: 8 }}>
              <summary className="cursor-pointer text-sm font-bold" style={{ color: "#14213A", listStyle: "none" }}>
                {f.q}
              </summary>
              <p className="mt-1.5 text-sm" style={{ color: "#3B4A63", lineHeight: 1.55 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </SmartyCard>
    </div>
    <TestPreviewSheet
      open={previewOpen}
      onClose={() => setPreviewOpen(false)}
      testIds={CORE_TESTS.map((t) => t.id)}
      focusTestId={previewFocus}
    />
    {buyScanElement}
    </>
  );
}

const SCREEN_FAQ = [
  { q: "How long does a scan take?", a: "About 8 minutes for the 8 movement patterns." },
  { q: "Do I need any equipment?", a: "No. Just your phone or laptop camera, a bit of clear floor space, and fitted clothes so your joints are visible." },
  { q: "What happens after the scan?", a: "You get a Movement Score, Movement Age, sub-scores, and a 2-week corrective program built from your weakest areas." },
  { q: "Is my video uploaded?", a: "No. Pose detection runs on your device. Only numeric scores and joint-angle summaries are saved to your account." },
];
