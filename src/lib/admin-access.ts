import { useEffect, useState } from "react";
import { getIsAdmin } from "@/lib/admin-access.functions";

/**
 * Client-side admin flag. The answer always comes from the server; the last
 * answer is cached on the device so admin UI keeps working offline and does
 * not flicker between renders.
 */
const CACHE_KEY = "smartymove.is-admin";
const EVENT = "smartymove:is-admin";

export function getCachedIsAdmin(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CACHE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeCachedIsAdmin(value: boolean) {
  try {
    localStorage.setItem(CACHE_KEY, String(value));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

let inflight: Promise<boolean> | null = null;

export async function refreshIsAdmin(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const r = await getIsAdmin();
      writeCachedIsAdmin(r.isAdmin);
      return r.isAdmin;
    } catch {
      // Offline or signed out: keep whatever this device already knew.
      return getCachedIsAdmin();
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** `null` while the first server answer is still unknown on this device. */
export function useIsAdmin(): boolean | null {
  const [state, setState] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    setState(getCachedIsAdmin() ? true : null);
    void refreshIsAdmin().then((v) => {
      if (active) setState(v);
    });
    const onChange = () => setState(getCachedIsAdmin());
    window.addEventListener(EVENT, onChange);
    return () => {
      active = false;
      window.removeEventListener(EVENT, onChange);
    };
  }, []);

  return state;
}
