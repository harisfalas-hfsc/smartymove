import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/store";
import { getScanAccess } from "@/lib/scans.functions";
import { fetchFreeAccessMode } from "@/hooks/useFreeAccessMode";
import { scopedKey, trimCache, writeCache } from "@/lib/offline/store";
import { LIBRARY } from "@/lib/corrective/libraries";
import { getOnline, initConnectivity } from "@/lib/offline/connectivity";

/**
 * Downloads the signed-in member's entire world in the background as soon as
 * the app is online, so every page works with no internet afterwards.
 */
export function OfflineBootstrap() {
  const user = useUser();
  const userId = user?.id ?? null;
  const loadAccess = useServerFn(getScanAccess);
  const running = useRef(false);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    initConnectivity();
    let active = true;

    const prefetch = async () => {
      if (running.current || !getOnline()) return;
      running.current = true;
      const save = (key: string, value: unknown) => writeCache(scopedKey(userId, key), value);
      try {
        // Profile + everything it carries (scans, program, streak, settings).
        if (user) void save("profile", user);
        void save("sessions:list", user?.sessions ?? []);
        for (const session of user?.sessions ?? []) {
          void save(`session:${session.date}`, session);
        }
        void save("program:days", user?.programDays ?? []);
        void save("program:completed", user?.programCompletedDays ?? []);
        void save("progress:overview", {
          sessions: user?.sessions ?? [],
          streak: user?.streak ?? 0,
          nextRetestDate: user?.nextRetestDate ?? null,
        });

        // Reference library (bundled, but mirrored so pages can read it the
        // same way whether online or not) + its filter values.
        void writeCache(scopedKey(null, "library:correctives"), LIBRARY);
        void writeCache(scopedKey(null, "library:filters"), {
          areas: Object.keys(LIBRARY ?? {}),
        });

        const [access, subscription, notifications, freeAccess] = await Promise.allSettled([
          loadAccess({}),
          supabase
            .from("subscriptions")
            .select("status,current_period_end,cancel_at_period_end,price_id")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(3),
          supabase
            .from("notifications")
            .select("id,kind,title,body,read_at,created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(50),
          fetchFreeAccessMode(true),
        ]);
        if (!active) return;

        if (access.status === "fulfilled") void save("account:access", access.value);
        if (subscription.status === "fulfilled" && !subscription.value.error)
          void save("account:subscription", subscription.value.data ?? []);
        if (notifications.status === "fulfilled" && !notifications.value.error)
          void save("inbox:notifications", notifications.value.data ?? []);
        if (freeAccess.status === "fulfilled")
          void writeCache(scopedKey(null, "account:free-access"), freeAccess.value);

        void trimCache(800);
      } finally {
        running.current = false;
      }
    };

    void prefetch();
    const onOnline = () => void prefetch();
    window.addEventListener("online", onOnline);
    return () => {
      active = false;
      window.removeEventListener("online", onOnline);
    };
  }, [userId, user, loadAccess]);

  return null;
}
