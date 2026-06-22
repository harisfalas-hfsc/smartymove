export function ScoreRing({ value, size = 180, label = "Movement Score" }: { value: number; size?: number; label?: string }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  const valueFontPx = Math.round(size * 0.32);
  const labelFontPx = Math.max(9, Math.round(size * 0.07));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.52 0.14 235)" />
            <stop offset="100%" stopColor="oklch(0.74 0.13 195)" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="oklch(0.92 0.012 220)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#ring)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 800ms ease" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center px-2 text-center">
        <div className="flex flex-col items-center leading-none">
          <div className="font-extrabold tracking-tight brand-text" style={{ fontSize: valueFontPx, lineHeight: 1 }}>{value}</div>
          <div className="mt-1 font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontSize: labelFontPx, lineHeight: 1.1 }}>{label}</div>
        </div>
      </div>
    </div>
  );
}
