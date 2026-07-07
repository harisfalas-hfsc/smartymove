import { ExternalLink, Sparkles, Trophy, Rocket } from "lucide-react";
import type { SmartyGymRecommendation } from "@/lib/graduation";

type Variant = "cleared" | "performance-track" | "program-complete";

interface Props {
  variant: Variant;
  recommendation: SmartyGymRecommendation;
}

const VARIANT_STYLE: Record<Variant, { Icon: any; iconBg: string; iconColor: string; badge: string }> = {
  cleared: { Icon: Trophy, iconBg: "#DCFCE7", iconColor: "#0F766E", badge: "Cleared for performance" },
  "performance-track": { Icon: Rocket, iconBg: "#E6F5F5", iconColor: "#0E7C86", badge: "Performance track" },
  "program-complete": { Icon: Sparkles, iconBg: "#F1E9FA", iconColor: "#7A3EBA", badge: "What's next" },
};

export function SmartyGymHandoff({ variant, recommendation }: Props) {
  const style = VARIANT_STYLE[variant];
  const { Icon, iconBg, iconColor, badge } = style;
  return (
    <section
      className="rounded-3xl border p-5 shadow-card"
      style={{ background: "#ffffff", borderColor: "#EEF1F2" }}
      aria-label="SmartyGym recommendation"
    >
      <div className="flex items-start gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
          style={{ background: iconBg, color: iconColor }}
        >
          <Icon className="h-5 w-5" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: iconColor }}>{badge}</div>
          <h3 className="mt-0.5 text-base font-extrabold" style={{ color: "#14213A" }}>{recommendation.headline}</h3>
          <p className="mt-1 text-sm" style={{ color: "#3B4A63", lineHeight: 1.5 }}>{recommendation.blurb}</p>
        </div>
      </div>

      <a
        href={recommendation.program.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold text-white"
        style={{ background: "#0E7C86", boxShadow: "0 14px 24px -10px rgba(14,124,134,0.55)" }}
      >
        Start {recommendation.program.title} <ExternalLink className="h-4 w-4" />
      </a>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {recommendation.workouts.map((w) => (
          <a
            key={w.slug}
            href={w.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-semibold"
            style={{ background: "#F1F7F8", color: "#14213A" }}
          >
            <span>{w.title}</span>
            <ExternalLink className="h-3.5 w-3.5" style={{ color: "#0E7C86" }} />
          </a>
        ))}
      </div>

      <p className="mt-3 text-[11px]" style={{ color: "#5A6B85" }}>
        Opens SmartyGym in a new tab. SmartyMove stays your scanner and corrective home.
      </p>
    </section>
  );
}
