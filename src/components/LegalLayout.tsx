import { type ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export function LegalLayout({ title, icon, lastUpdated, children }: { title: string; icon: ReactNode; lastUpdated: string; children: ReactNode }) {
  return (
    <div
      className="flex min-h-[100dvh] w-full flex-col"
      style={{ background: "#ffffff", color: "#14213A" }}
    >
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-6 pt-5">
        <div className="flex items-center gap-3">
          <span
            className="grid place-items-center"
            style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(160deg,#0E7C86,#1f6fa8)", color: "#fff" }}
          >
            {icon}
          </span>
          <h1 style={{ fontWeight: 700, fontSize: 26, lineHeight: 1.1, letterSpacing: 0, margin: 0 }}>
            {title}
          </h1>
        </div>

        <div
          className="mt-4"
          style={{ background: "#fff", border: "1px solid #E5EAEC", borderRadius: 18, padding: "16px 18px", fontSize: 13, color: "#3B4A63" }}
        >
          <strong>Last updated:</strong> {lastUpdated} ·{" "}
          <strong>Operator:</strong> SmartyMove (smartymove.com), part of the{" "}
          <a href="https://smartywellness.com" target="_blank" rel="noopener noreferrer" style={{ color: "#0E7C86", fontWeight: 600 }}>Smarty Wellness</a>{" "}
          family of brands (with SmartyGym and SmartyDiet) ·{" "}
          <strong>Contact:</strong>{" "}
          <a href="mailto:smartymove@outlook.com" style={{ color: "#0E7C86", fontWeight: 600 }}>smartymove@outlook.com</a>
        </div>

        <article
          className="legal-prose mt-6"
          style={{ background: "#fff", border: "1px solid #E5EAEC", borderRadius: 22, padding: "22px 22px 26px", fontSize: 15, lineHeight: 1.65, color: "#3B4A63" }}
        >
          {children}
        </article>

        <style>{`
          .legal-prose h2{ font-weight:700; font-size:18px; color:#14213A; margin:22px 0 8px; letter-spacing:0; }
          .legal-prose h2:first-child{ margin-top:0; }
          .legal-prose h3{ font-weight:600; font-size:15px; color:#14213A; margin:16px 0 6px; }
          .legal-prose p{ margin:0 0 10px; }
          .legal-prose ul{ margin:0 0 12px; padding-left:18px; }
          .legal-prose li{ margin-bottom:6px; }
          .legal-prose strong{ color:#14213A; }
          .legal-prose a{ color:#0E7C86; font-weight:600; text-decoration:none; }
          .legal-prose a:hover{ text-decoration:underline; }
          .legal-prose .callout{ background:#FFF4F0; border:1px solid #FFD7CB; border-radius:14px; padding:14px 16px; margin:14px 0; color:#7A2C13; }
          .legal-prose .callout strong{ color:#B23A1A; }
          .legal-prose .note{ background:#F1F5F4; border:1px solid #D9E0E2; border-radius:14px; padding:12px 14px; margin:14px 0; font-size:13.5px; }
        `}</style>
      </main>
      <SiteFooter />
    </div>
  );
}
