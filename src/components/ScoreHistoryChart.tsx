import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type ScorePoint = { name: string; score: number };

export function ScoreHistoryChart({
  data,
  height = 176,
  gradientId = "scoreGradient",
}: {
  data: ScorePoint[];
  height?: number;
  gradientId?: string;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.62 0.13 210)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="oklch(0.62 0.13 210)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="oklch(0.92 0.012 220)" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={false} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={10} width={28} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.92 0.012 220)" }} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="oklch(0.52 0.14 235)"
            strokeWidth={3}
            fill={`url(#${gradientId})`}
            dot={{ r: 3, fill: "oklch(0.62 0.13 210)" }}
            activeDot={{ r: 5, fill: "oklch(0.62 0.13 210)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScoreHistoryTimeline({
  sessions,
  onSelect,
}: {
  sessions: { overall: number; date: string }[];
  onSelect?: (idx: number) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 pt-2">
      {sessions.map((s, i) => {
        const isLatest = i === sessions.length - 1;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect?.(i)}
            className={`shrink-0 rounded-2xl px-3 py-2 text-left transition-transform duration-150 hover:scale-[1.02] ${
              isLatest
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-foreground hover:bg-muted"
            }`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Scan #{i + 1}</div>
            <div className="text-lg font-extrabold leading-tight">{s.overall}</div>
          </button>
        );
      })}
    </div>
  );
}
