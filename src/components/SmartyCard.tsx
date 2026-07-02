import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, type LucideIcon } from "lucide-react";

/**
 * SmartyCard — the shared "SmartyGym umbrella" card look.
 * White surface, light-blue border, centered header icon in a colored chip,
 * bold centered title, body content, optional colored CTA link at the bottom.
 */
export function SmartyCard({
  Icon,
  iconColor = "#0E7C86",
  iconBg = "#E6F5F5",
  title,
  subtitle,
  children,
  cta,
  className = "",
}: {
  Icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  cta?: { label: string; to?: string; onClick?: () => void; color?: string };
  className?: string;
}) {
  return (
    <section
      className={`rounded-[22px] bg-white p-5 shadow-sm ${className}`}
      style={{ border: "1.5px solid #CDE6EB" }}
    >
      {Icon && (
        <div className="flex justify-center">
          <div
            className="grid h-14 w-14 place-items-center rounded-2xl"
            style={{ background: iconBg, color: iconColor }}
          >
            <Icon className="h-6 w-6" strokeWidth={2.2} />
          </div>
        </div>
      )}
      {title && (
        <h2
          className="mt-3 text-center"
          style={{ color: "#14213A", fontWeight: 800, fontSize: 20, letterSpacing: "-0.01em" }}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="mx-auto mt-1 max-w-[36ch] text-center text-sm" style={{ color: "#5A6B85", lineHeight: 1.55 }}>
          {subtitle}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
      {cta && (
        <div className="mt-4 text-center">
          {cta.to ? (
            <Link
              to={cta.to}
              className="inline-flex items-center gap-1 text-sm font-bold"
              style={{ color: cta.color ?? "#0E7C86", textDecoration: "none" }}
            >
              {cta.label} <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={cta.onClick}
              className="inline-flex items-center gap-1 text-sm font-bold"
              style={{ color: cta.color ?? "#0E7C86", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              {cta.label} <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/** Vertical list item with colored lucide icon + label — SmartyGym "What We Stand For" style. */
export function SmartyRow({
  Icon,
  color = "#0E7C86",
  label,
  sub,
}: {
  Icon: LucideIcon;
  color?: string;
  label: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
        style={{ background: `${color}18`, color }}
      >
        <Icon className="h-4 w-4" strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold" style={{ color: "#14213A" }}>{label}</div>
        {sub && <div className="text-xs" style={{ color: "#5A6B85" }}>{sub}</div>}
      </div>
    </div>
  );
}