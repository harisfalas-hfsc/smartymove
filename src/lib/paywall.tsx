import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Crown, X } from "lucide-react";
import { useFreeAccessMode } from "@/hooks/useFreeAccessMode";

type Ctx = { requirePremium: (feature?: string) => void; close: () => void };
const PaywallCtx = createContext<Ctx | null>(null);

export function PaywallProvider({ children }: { children: ReactNode }) {
  const { freeAccessMode } = useFreeAccessMode();
  const [open, setOpen] = useState(false);
  const [feature, setFeature] = useState<string | undefined>(undefined);
  const requirePremium = useCallback((f?: string) => {
    // Global Free Access Mode: never show a paywall.
    if (freeAccessMode) return;
    setFeature(f);
    setOpen(true);
  }, [freeAccessMode]);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ requirePremium, close }), [requirePremium, close]);
  return (
    <PaywallCtx.Provider value={value}>
      {children}
      {open && !freeAccessMode && <PaywallModal feature={feature} onClose={close} />}
    </PaywallCtx.Provider>
  );
}

export function usePaywall(): Ctx {
  const ctx = useContext(PaywallCtx);
  if (!ctx) return { requirePremium: () => {}, close: () => {} };
  return ctx;
}

/** Returns true if access is allowed; otherwise opens the paywall and returns false. */
export function gate(premium: boolean | undefined, requirePremium: (f?: string) => void, feature?: string): boolean {
  if (premium) return true;
  requirePremium(feature);
  return false;
}

function PaywallModal({ feature, onClose }: { feature?: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-3xl bg-background shadow-2xl">
        <div className="brand-gradient-strong p-5 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              <div className="text-xs font-semibold uppercase tracking-widest opacity-90">Premium feature</div>
            </div>
            <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-white/20"><X className="h-4 w-4" /></button>
          </div>
          <h2 className="mt-2 text-xl font-extrabold">Upgrade to Premium to continue</h2>
          <p className="mt-1 text-sm opacity-90">
            {feature ? `${feature} is a Premium feature.` : "This action is part of Premium."} You can preview every page on Free — Premium unlocks the actions.
          </p>
        </div>
        <div className="space-y-3 p-5">
          <ul className="space-y-1.5 text-sm text-foreground/85">
            <li>• Full 2-week training program with all exercises</li>
            <li>• Run re-tests & rescans to build new programs</li>
            <li>• Mark workouts complete, track your streak</li>
            <li>• Future Projection & Movement Age trajectory</li>
          </ul>
          <Link
            to="/premium"
            onClick={onClose}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl brand-gradient font-semibold text-primary-foreground shadow-soft"
            style={{ textDecoration: "none" }}
          >
            <Crown className="h-4 w-4" /> See Premium · €4.99/mo
          </Link>
          <button onClick={onClose} className="h-11 w-full rounded-2xl bg-secondary text-sm font-semibold text-foreground">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}