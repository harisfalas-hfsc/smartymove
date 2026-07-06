export function SubScoreBar({
  label,
  value,
  hint,
}: {
  label: string;
  /** 0–100. A value < 0 means "Insufficient data" — nothing to score. */
  value: number;
  /** Optional inline hint shown under the label. */
  hint?: string;
}) {
  const insufficient = value < 0 || !Number.isFinite(value);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span
          className={
            insufficient
              ? "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              : "text-sm font-bold tabular-nums text-foreground"
          }
        >
          {insufficient ? "Insufficient data" : value}
        </span>
      </div>
      {hint && <div className="mt-0.5 text-[10px] text-muted-foreground">{hint}</div>}
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        {!insufficient && (
          <div
            className="h-full rounded-full brand-gradient transition-[width] duration-700"
            style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
          />
        )}
      </div>
    </div>
  );
}
