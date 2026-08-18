import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

/** Small "new version available" prompt shown when a new app build is waiting. */
export function UpdatePrompt() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    let cancelled = false;
    void navigator.serviceWorker.getRegistration("/").then((reg) => {
      if (!reg || cancelled) return;
      if (reg.waiting) setWaiting(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const next = reg.installing;
        if (!next) return;
        next.addEventListener("statechange", () => {
          if (next.state === "installed" && navigator.serviceWorker.controller) setWaiting(next);
        });
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!waiting) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-[70] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-2xl lg:bottom-6">
      <span className="text-sm font-semibold text-foreground">A new version is available.</span>
      <button
        type="button"
        onClick={() => {
          waiting.postMessage({ type: "SKIP_WAITING" });
          window.location.reload();
        }}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Refresh
      </button>
    </div>
  );
}
