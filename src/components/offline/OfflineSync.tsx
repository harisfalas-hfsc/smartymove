import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { flushQueue, type QueuedAction } from "@/lib/offline/queue";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import { syncLocalProfile, useUser } from "@/lib/store";

/** Replays anything the member did while offline as soon as the network returns. */
export function OfflineSync() {
  const online = useOnlineStatus();
  const user = useUser();
  const userId = user?.id ?? null;
  const busy = useRef(false);

  useEffect(() => {
    if (!online || !userId || busy.current) return;
    busy.current = true;

    const run = async (action: QueuedAction) => {
      switch (action.kind) {
        case "profile-sync":
          await syncLocalProfile();
          return;
        case "notifications-read": {
          const readAt = (action.payload["readAt"] as string) ?? new Date().toISOString();
          const { error } = await supabase
            .from("notifications")
            .update({ read_at: readAt })
            .eq("user_id", userId)
            .is("read_at", null);
          if (error) throw error;
          return;
        }
        default:
          return;
      }
    };

    void flushQueue(run, userId).finally(() => {
      busy.current = false;
    });
  }, [online, userId]);

  return null;
}
