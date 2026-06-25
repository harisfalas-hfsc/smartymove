import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Crown,
  Check,
  Camera,
  Dumbbell,
  LineChart,
  RotateCcw,
  Sparkles,
  Zap,
  X,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { useUserPremium } from "@/lib/useUserPremium";
import { createBillingPortalSession } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "SmartyMove Premium — €4.99/month" },
      {
        name: "description",
        content:
          "Unlock the full SmartyMove experience. Daily corrective program, re-tests, Movement Age trajectory, and your full 2-week training schedule — €4.99/month.",
      },
      { property: "og:title", content: "SmartyMove Premium" },
      {
        property: "og:description",
        content: "Daily corrective program, re-tests, full schedule — €4.99/month. Cancel anytime.",
      },
      { property: "og:url", content: "https://smartymove.com/premium" },
    ],
    links: [{ rel: "canonical", href: "https://smartymove.com/premium" }],
  }),
  component: Premium,
});

function Premium() {
  const u = useUserPremium();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const isTestMode = (import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined)?.startsWith(
    "pk_test_",
  );

  function handleUpgrade() {
    if (!u) {
      window.location.href = "/";
      return;
    }
    setCheckoutOpen(true);
  }

  async function handleManage() {
    if (!u) return;
    setPortalLoading(true);
    const portalWindow = window.open("about:blank", "_blank");
    try {
      const result = await createBillingPortalSession({
        data: {
          environment: getStripeEnvironment(),
          returnUrl: `${window.location.origin}/premium`,
        },
      });
      if ("error" in result) throw new Error(result.error);
      if (portalWindow) portalWindow.location.href = result.url;
      else window.location.assign(result.url);
    } catch (e) {
      portalWindow?.close();
      alert(e instanceof Error ? e.message : "Could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-[100dvh] w-full flex-col"
      style={{ background: "#E7ECEC", color: "#14213A" }}
    >
      <SiteHeader showBack />
      {isTestMode && (
        <div
          className="w-full border-b text-center text-xs"
          style={{
            background: "#FFF4E5",
            borderColor: "#F5C99B",
            color: "#7A4B00",
            padding: "8px 12px",
          }}
        >
          Test mode — use card <strong>4242 4242 4242 4242</strong>, any future date, any CVC.
        </div>
      )}
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
          <div
            className="flex items-center gap-2"
            style={{
              fontSize: 11,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              fontWeight: 700,
              opacity: 0.9,
            }}
          >
            <Crown className="h-3.5 w-3.5" /> SmartyMove Premium
          </div>
          <h1
            style={{
              fontWeight: 800,
              fontSize: 28,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              margin: "10px 0 10px",
            }}
          >
            Train smarter. Move better.
            <br />
            <span style={{ color: "#7CFFB8" }}>€4.99 / month.</span>
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.55, opacity: 0.95, margin: 0 }}>
            Less than a coffee. Your personalized movement program, every day, evolving with your
            body.
          </p>
          {u?.premium ? (
            <button
              type="button"
              onClick={handleManage}
              disabled={portalLoading}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold"
              style={{
                background: "#7CFFB8",
                color: "#0A3D2A",
                boxShadow: "0 14px 24px -10px rgba(124,255,184,0.55)",
              }}
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crown className="h-4 w-4" />
              )}
              {portalLoading ? "Opening..." : "Manage subscription"}
            </button>
          ) : (
            <button
              type="button"
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold"
              style={{
                background: "#FF6B4A",
                color: "#fff",
                boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)",
              }}
              onClick={handleUpgrade}
            >
              <Crown className="h-4 w-4" /> Upgrade to Premium
            </button>
          )}
          <p className="mt-2 text-center text-[11px]" style={{ opacity: 0.85 }}>
            Cancel anytime. No commitment.
          </p>
        </div>

        <section
          className="mt-4 rounded-3xl bg-white p-6 shadow"
          style={{ border: "1px solid #E5EAEC" }}
        >
          <h2 className="text-lg font-extrabold" style={{ color: "#14213A" }}>
            What's included
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Feature icon={<Dumbbell className="h-4 w-4" />} title="Full 2-week program">
              All 7 exercises per session, every day, instead of just a preview.
            </Feature>
            <Feature icon={<RotateCcw className="h-4 w-4" />} title="Re-tests & rescans">
              Retake the screen every 14 days to build a fresh program around your new results.
            </Feature>
            <Feature icon={<LineChart className="h-4 w-4" />} title="Future Projection">
              See where your Movement Age is heading — and what to do to lower it.
            </Feature>
            <Feature icon={<Camera className="h-4 w-4" />} title="All add-on tests">
              Joint-specific assessments for ankle, knee, hip, low back, shoulder, elbow, wrist.
            </Feature>
            <Feature icon={<Sparkles className="h-4 w-4" />} title="Root-cause clustering">
              Smart prioritization: fix one root cause that resolves multiple symptoms.
            </Feature>
            <Feature icon={<Zap className="h-4 w-4" />} title="Progress tracking">
              Mark workouts complete, keep a streak, share your wins.
            </Feature>
          </div>
        </section>

        <section
          className="mt-4 rounded-3xl bg-white p-6 shadow"
          style={{ border: "1px solid #E5EAEC" }}
        >
          <h2 className="text-lg font-extrabold" style={{ color: "#14213A" }}>
            Why it's worth it
          </h2>
          <ul className="mt-3 space-y-2.5 text-sm" style={{ color: "#3B4A63", lineHeight: 1.55 }}>
            <Li>
              One physio session typically costs €50–€90. SmartyMove gives you a screen + daily
              corrective plan for an entire month at €4.99.
            </Li>
            <Li>
              Built around <strong>root causes</strong>, not symptoms — your program targets the one
              limitation that fixes the most things at once.
            </Li>
            <Li>5 minutes a day. No equipment. No commute. Works around your life.</Li>
            <Li>
              Re-tests every 14 days keep the program honest — you see real progress in your
              Movement Score.
            </Li>
          </ul>
        </section>

        <section
          className="mt-4 rounded-3xl bg-white p-6 shadow"
          style={{ border: "1px solid #E5EAEC" }}
        >
          <h2 className="text-lg font-extrabold" style={{ color: "#14213A" }}>
            Free vs Premium
          </h2>
          <div className="mt-3 overflow-hidden rounded-2xl" style={{ border: "1px solid #E5EAEC" }}>
            <Row head label="" left="Free" right="Premium" />
            <Row
              label="Movement Screen"
              left={<Check className="mx-auto h-4 w-4" />}
              right={<Check className="mx-auto h-4 w-4" />}
            />
            <Row
              label="Score & Movement Age"
              left={<Check className="mx-auto h-4 w-4" />}
              right={<Check className="mx-auto h-4 w-4" />}
            />
            <Row
              label="Preview the program"
              left={<Check className="mx-auto h-4 w-4" />}
              right={<Check className="mx-auto h-4 w-4" />}
            />
            <Row
              label="Open daily workouts"
              left="—"
              right={<Check className="mx-auto h-4 w-4" />}
            />
            <Row
              label="Mark sessions complete"
              left="—"
              right={<Check className="mx-auto h-4 w-4" />}
            />
            <Row
              label="Re-tests & rescans"
              left="—"
              right={<Check className="mx-auto h-4 w-4" />}
            />
            <Row label="Future Projection" left="—" right={<Check className="mx-auto h-4 w-4" />} />
            <Row
              label="All add-on joint tests"
              left="—"
              right={<Check className="mx-auto h-4 w-4" />}
            />
          </div>
        </section>

        <div className="mt-5 text-center">
          {!u?.premium && (
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-7 font-bold text-white"
              style={{
                background: "#FF6B4A",
                boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)",
              }}
              onClick={handleUpgrade}
            >
              <Crown className="h-4 w-4" /> Upgrade to Premium · €4.99/mo
            </button>
          )}
          <div className="mt-3 text-[12px]" style={{ color: "#6B7A90" }}>
            Questions?{" "}
            <Link to="/contact" style={{ color: "#0E7C86", fontWeight: 600 }}>
              Contact us
            </Link>
          </div>
        </div>

        <SiteFooter />
      </main>
      {checkoutOpen && u && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 bg-black/60" onClick={() => setCheckoutOpen(false)} />
          <div className="relative w-full max-w-[640px] max-h-[92dvh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ background: "#0E7C86", color: "#fff" }}
            >
              <div className="flex items-center gap-2 font-semibold">
                <Crown className="h-4 w-4" /> SmartyMove Premium · €4.99/mo
              </div>
              <button
                onClick={() => setCheckoutOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <StripeEmbeddedCheckout
                email={u.email}
                returnUrl={`${window.location.origin}/premium/return?session_id={CHECKOUT_SESSION_ID}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#F1F5F4",
        border: "1px solid #D9E0E2",
        borderRadius: 14,
        padding: "12px 14px",
      }}
    >
      <div
        className="flex items-center gap-2"
        style={{ color: "#0E7C86", fontWeight: 700, fontSize: 14 }}
      >
        <span
          className="grid place-items-center"
          style={{ width: 24, height: 24, borderRadius: 8, background: "#0E7C86", color: "#fff" }}
        >
          {icon}
        </span>
        {title}
      </div>
      <div style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.5, color: "#3B4A63" }}>
        {children}
      </div>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#0E7C86" }} />
      <span>{children}</span>
    </li>
  );
}

function Row({
  label,
  left,
  right,
  head,
}: {
  label: string;
  left: React.ReactNode;
  right: React.ReactNode;
  head?: boolean;
}) {
  const base = {
    background: head ? "#0E7C86" : "#fff",
    color: head ? "#fff" : "#14213A",
    fontWeight: head ? 700 : 500,
  } as const;
  return (
    <div
      className="grid grid-cols-[1.5fr_1fr_1fr] items-center"
      style={{ borderTop: head ? "none" : "1px solid #E5EAEC", ...base }}
    >
      <div className="px-3 py-2.5 text-sm">{label}</div>
      <div
        className="px-3 py-2.5 text-center text-sm"
        style={{ borderLeft: "1px solid #E5EAEC", color: head ? "#fff" : "#6B7A90" }}
      >
        {left}
      </div>
      <div
        className="px-3 py-2.5 text-center text-sm font-semibold"
        style={{ borderLeft: "1px solid #E5EAEC", color: head ? "#fff" : "#0E7C86" }}
      >
        {right}
      </div>
    </div>
  );
}
