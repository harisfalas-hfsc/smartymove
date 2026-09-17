import { type ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export function LegalLayout({ title, icon, lastUpdated, children }: { title: string; icon: ReactNode; lastUpdated: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background text-foreground">
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-6 pt-5">
        <div className="flex items-center gap-3">
          <span
            className="grid place-items-center"
            style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(160deg,#0E7C86,#1f6fa8)", color: "#fff" }}
          >
            {icon}
          </span>
          <h1 className="m-0 text-foreground" style={{ fontWeight: 700, fontSize: 26, lineHeight: 1.1, letterSpacing: 0 }}>
            {title}
          </h1>
        </div>

        <div
          className="mt-4 rounded-2xl border border-border bg-card px-[18px] py-4 text-sm text-muted-foreground"
          style={{ fontSize: 13 }}
        >
          <strong className="text-foreground">Last updated:</strong> {lastUpdated} ·{" "}
          <strong className="text-foreground">Operator:</strong> SmartyMove (smartymove.com), part of the{" "}
          <a href="https://smartywellness.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary">Smarty Wellness</a>{" "}
          family of brands (with SmartyGym and SmartyDiet) ·{" "}
          <strong className="text-foreground">Contact:</strong>{" "}
          <a href="mailto:smartymove@outlook.com" className="font-semibold text-primary">smartymove@outlook.com</a>
        </div>

        <article
          className="legal-prose mt-6 rounded-[22px] border border-border bg-card text-foreground"
          style={{ padding: "22px 22px 26px", fontSize: 15, lineHeight: 1.65 }}
        >
          {children}
        </article>

        <style>{`
          .legal-prose h2{ font-weight:700; font-size:18px; color:var(--foreground); margin:22px 0 8px; letter-spacing:0; }
          .legal-prose h2:first-child{ margin-top:0; }
          .legal-prose h3{ font-weight:600; font-size:15px; color:var(--foreground); margin:16px 0 6px; }
          .legal-prose p{ margin:0 0 10px; color:var(--foreground); }
          .legal-prose ul{ margin:0 0 12px; padding-left:18px; color:var(--foreground); }
          .legal-prose li{ margin-bottom:6px; color:var(--foreground); }
          .legal-prose strong{ color:var(--foreground); }
          .legal-prose a{ color:var(--primary); font-weight:600; text-decoration:none; }
          .legal-prose a:hover{ text-decoration:underline; }
          .legal-prose .callout{
            background: color-mix(in oklab, var(--destructive) 12%, var(--card));
            border:1px solid color-mix(in oklab, var(--destructive) 35%, transparent);
            border-radius:14px; padding:14px 16px; margin:14px 0;
            color:var(--foreground);
          }
          .legal-prose .callout strong{ color:var(--destructive); }
          .legal-prose .note{
            background: var(--muted);
            border:1px solid var(--border);
            border-radius:14px; padding:12px 14px; margin:14px 0;
            font-size:13.5px; color:var(--muted-foreground);
          }
          .legal-prose .note strong{ color:var(--foreground); }
        `}</style>
      </main>
      <SiteFooter />
    </div>
  );
}
