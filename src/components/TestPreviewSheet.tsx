import { useEffect, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { TEST_GUIDES } from "@/lib/movement";
import squatImg from "@/assets/fms/squat.png.asset.json";
import hingeImg from "@/assets/fms/hinge.jpg.asset.json";
import balanceImg from "@/assets/fms/balance.png.asset.json";
import lungeImg from "@/assets/fms/lunge.png.asset.json";
import overheadImg from "@/assets/fms/overhead.png.asset.json";
import hipAbdImg from "@/assets/fms/hip_abd.png.asset.json";
import bridgeHoldImg from "@/assets/fms/bridge_hold.png.asset.json";
import rotaryImg from "@/assets/fms/rotary_stability.png.asset.json";

export const TEST_DEMO_IMAGES: Record<string, string> = {
  squat: squatImg.url,
  hinge: hingeImg.url,
  balance: balanceImg.url,
  lunge: lungeImg.url,
  overhead: overheadImg.url,
  hip_abd: hipAbdImg.url,
  bridge_hold: bridgeHoldImg.url,
  rotary_stability: rotaryImg.url,
};

type Props = {
  open: boolean;
  onClose: () => void;
  testIds: string[];
  /** When provided, only this test is expanded initially. */
  focusTestId?: string;
  title?: string;
};

export function TestPreviewSheet({ open, onClose, testIds, focusTestId, title }: Props) {
  const [expanded, setExpanded] = useState<string | null>(focusTestId ?? testIds[0] ?? null);

  useEffect(() => {
    if (open) setExpanded(focusTestId ?? testIds[0] ?? null);
  }, [open, focusTestId, testIds.join("|")]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex max-h-[86dvh] w-full max-w-[440px] flex-col overflow-hidden rounded-3xl bg-background text-foreground shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">SmartyMove Scan</div>
            <div className="mt-0.5 truncate text-lg font-extrabold">{title ?? (focusTestId ? TEST_GUIDES[focusTestId]?.name : "Movement patterns")}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-foreground active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-3">
            {testIds.map((id, i) => {
              const g = TEST_GUIDES[id];
              if (!g) return null;
              const isOpen = expanded === id;
              const img = TEST_DEMO_IMAGES[id];
              return (
                <div key={id} className="overflow-hidden rounded-2xl border border-border">
                  <button
                    onClick={() => setExpanded(isOpen ? null : id)}
                    className="flex w-full items-center gap-3 bg-secondary/40 px-4 py-3 text-left"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg brand-gradient text-xs font-black text-primary-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">{g.name}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{g.reps}</div>
                    </div>
                    <span className="text-xs font-semibold text-primary">{isOpen ? "Hide" : "View"}</span>
                  </button>
                  {isOpen && (
                    <div className="space-y-3 px-4 pb-4 pt-3">
                      {img && (
                        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-border">
                          <img src={img} alt={`${g.name} reference`} className="mx-auto h-48 w-auto object-contain" />
                        </div>
                      )}
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">What you do</div>
                        <p className="mt-1 text-sm">{g.what}</p>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Why it matters</div>
                        <p className="mt-1 text-sm">{g.why}</p>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Set up</div>
                        <ul className="mt-1 space-y-1 text-sm">
                          {g.setup.map((s, k) => <li key={k} className="flex gap-2"><span className="text-primary">•</span>{s}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Do this</div>
                        <ol className="mt-1 space-y-1 text-sm">
                          {g.steps.map((s, k) => <li key={k} className="flex gap-2"><span className="font-bold text-primary">{k + 1}.</span>{s}</li>)}
                        </ol>
                      </div>
                      {g.mistakes.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-warning"><AlertCircle className="h-3 w-3" />Common mistakes</div>
                          <ul className="mt-1 space-y-1 text-sm">
                            {g.mistakes.map((s, k) => <li key={k} className="flex gap-2"><span className="text-warning">×</span>{s}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}