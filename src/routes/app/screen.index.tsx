import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useUser } from "@/lib/store";
import { CORE_TESTS, CONDITIONAL_TESTS } from "@/lib/movement";
import { Play, Lock, Loader2, Camera, ShieldCheck, Smartphone, EyeOff, Ruler, Sparkles, Timer, HelpCircle, ListChecks } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getScanAccess, SCAN_PRICE_EUR } from "@/lib/scans.functions";
import { SmartyCard, SmartyRow } from "@/components/SmartyCard";

export const Route = createFileRoute("/app/screen/")({ component: ScreenIndex });

function ScreenIndex() {
  const u = useUser();
  const navigate = useNavigate();
  const access = useQuery({
    queryKey: ["scan-access", u?.id ?? "pending"],
    queryFn: () => getScanAccess(),
    enabled: !!u,
    staleTime: 30_000,
  });
  if (!u) return null;
  const joints = (u.questionnaire?.joints ?? []).filter(j => j !== "none");
  const addOns = joints.slice(0, 2).map(j => CONDITIONAL_TESTS[j as keyof typeof CONDITIONAL_TESTS]);
  const last = u.sessions[u.sessions.length - 1];
  const canScan = access.data?.canScan ?? false;
  const credits = access.data?.credits ?? 0;
  const grandfathered = !!access.data?.hasActiveSubscription;
  function startScreen(e: React.MouseEvent) {
    if (canScan) return;
    e.preventDefault();
    navigate({ to: "/pricing" });
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
    <Link
      to="/pricing"
      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold text-white"
      style={{ background: "#FF6B4A", boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)" }}
    >
      <Lock className="h-5 w-5" /> Buy a scan · €{SCAN_PRICE_EUR.toFixed(2)}
    </Link>
  );

  return (
    <div className="space-y-4 px-5 pb-6 pt-4" style={{ background: "#E7ECEC" }}>
      {/* HERO CARD */}
      <SmartyCard
        Icon={Camera}
        iconColor="#0E7C86"
        iconBg="#E6F5F5"
        title="Movement Screen"
        subtitle="A camera-based assessment. 5 core tests plus targeted add-ons — done in about 5 minutes from your phone or laptop."
      >
        <div className="mt-1 rounded-2xl p-3 text-center text-sm" style={{ background: "#F1F7F8", color: "#14213A" }}>
          {access.isLoading ? (
            <span className="inline-flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Checking scan access…</span>
          ) : grandfathered ? (
            <><span style={{ color: "#0E7C86" }}>✓</span> <strong>Unlimited scans</strong> included with your legacy plan.</>
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
      <SmartyCard Icon={ListChecks} iconColor="#1D4ED8" iconBg="#DBEAFE" title="Core Tests · 5" subtitle="Everyone runs the same 5 fundamentals — every scan.">
        <div className="mt-2 space-y-1.5">
          {CORE_TESTS.map((t, i) => {
            const palette = ["#0E7C86", "#7A3EBA", "#C2410C", "#0F766E", "#1D4ED8"][i % 5];
            return (
              <div key={t.id} className="flex items-center gap-3 py-1.5">
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
              </div>
            );
          })}
        </div>
      </SmartyCard>

      {addOns.length > 0 && (
        <SmartyCard Icon={Sparkles} iconColor="#7A3EBA" iconBg="#F1E9FA" title={`Add-on Tests · ${addOns.length}`} subtitle="Targeted checks based on the areas you flagged.">
          <div className="mt-2 space-y-1.5">
            {addOns.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 py-1.5">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white"
                  style={{ background: "#7A3EBA", boxShadow: "0 6px 14px -8px #7A3EBA" }}
                >
                  +{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold" style={{ color: "#14213A" }}>{t.name}</div>
                  {t.note && <div className="text-xs" style={{ color: "#C2410C" }}>⚠ {t.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </SmartyCard>
      )}

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
  );
}

const SCREEN_FAQ = [
  { q: "How long does a scan take?", a: "About 5 minutes for the 5 core tests, plus 1–2 minutes if you have add-on tests for a flagged joint." },
  { q: "Do I need any equipment?", a: "No. Just your phone or laptop camera, a bit of clear floor space, and fitted clothes so your joints are visible." },
  { q: "What happens after the scan?", a: "You get a Movement Score, Movement Age, sub-scores, and a 2-week corrective program built from your weakest areas." },
  { q: "Is my video uploaded?", a: "No. Pose detection runs on your device. Only numeric scores and joint-angle summaries are saved to your account." },
];
