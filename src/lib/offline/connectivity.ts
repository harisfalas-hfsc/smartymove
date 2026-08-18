/**
 * Single source of truth for "is this device online?".
 *
 * Native (Capacitor) WebViews lie: `navigator.onLine` is often `true` in a
 * shell that has no reachable network, and there are no `online` / `offline`
 * events. So on native we ask the Capacitor Network plugin, and on the web we
 * use the browser events. Everything in the app reads this module — never
 * `navigator.onLine` directly.
 */

type Listener = (online: boolean) => void;

let current = true;
let started = false;
const listeners = new Set<Listener>();

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  try {
    return Boolean(cap?.isNativePlatform?.());
  } catch {
    return false;
  }
}

function emit(next: boolean) {
  if (next === current) return;
  current = next;
  listeners.forEach((fn) => {
    try {
      fn(next);
    } catch {
      /* listener errors must never break connectivity */
    }
  });
}

/** Starts connectivity detection. Safe to call many times. */
export function initConnectivity(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  if (isNativeApp()) {
    void (async () => {
      try {
        const { Network } = await import("@capacitor/network");
        const status = await Network.getStatus();
        current = status.connected;
        emit(status.connected);
        await Network.addListener("networkStatusChange", (s) => emit(s.connected));
      } catch {
        current = true;
      }
    })();
    return;
  }

  current = navigator.onLine;
  const update = () => emit(navigator.onLine);
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
}

export function getOnline(): boolean {
  return current;
}

export function subscribeConnectivity(fn: Listener): () => void {
  initConnectivity();
  listeners.add(fn);
  return () => listeners.delete(fn);
}