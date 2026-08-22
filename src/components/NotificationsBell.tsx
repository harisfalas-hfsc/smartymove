import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/store";
import { readCache, scopedKey, writeCache } from "@/lib/offline/store";
import { enqueueAction } from "@/lib/offline/queue";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import { getOnline, initConnectivity } from "@/lib/offline/connectivity";

type Note = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationsBell() {
  const user = useUser();
  const userId = user?.id;
  const online = useOnlineStatus();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Note[]>([]);
  const [fromCache, setFromCache] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    const key = scopedKey(userId, "inbox:notifications");
    try {
      initConnectivity();
      if (!getOnline()) throw new Error("offline");
      const { data, error } = await supabase
        .from("notifications")
        .select("id,kind,title,body,read_at,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      const rows = (data as Note[] | null) ?? [];
      setItems(rows);
      setFromCache(false);
      void writeCache(key, rows);
    } catch {
      // Offline: show the copy saved on this device.
      const cached = await readCache<Note[]>(key);
      setItems(cached?.data ?? []);
      setFromCache(true);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }
    void load();
    const id = window.setInterval(() => void load(), 120_000);
    return () => window.clearInterval(id);
  }, [userId, load]);

  const unread = items.filter((n) => !n.read_at).length;

  const markAllRead = async () => {
    if (!userId || !unread) return;
    const now = new Date().toISOString();
    const next = items.map((n) => (n.read_at ? n : { ...n, read_at: now }));
    setItems(next);
    void writeCache(scopedKey(userId, "inbox:notifications"), next);
    try {
      if (!online) throw new Error("offline");
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: now })
        .eq("user_id", userId)
        .is("read_at", null);
      if (error) throw error;
    } catch {
      // Queued and replayed automatically when the connection returns.
      await enqueueAction("notifications-read", { readAt: now }, userId);
    }
  };

  const openPanel = () => {
    setOpen(true);
    void load();
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!userId) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label="Notifications"
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-primary/10"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-green-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 z-50 mt-2 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="text-sm font-bold text-foreground">Notifications</div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="grid h-7 w-7 place-items-center rounded-full bg-foreground/5 text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="max-h-[65vh] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                {fromCache && !online
                  ? "You're offline and this device has no saved notifications yet. Connect once and they'll be stored here."
                  : "You're all caught up. Billing updates and reminders will appear here."}
              </p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-border px-4 py-3 last:border-b-0 ${n.read_at ? "" : "bg-primary/5"}`}
                >
                  <div className="text-sm font-bold text-foreground">{n.title}</div>
                  {n.body && (
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{n.body}</p>
                  )}
                  <div className="mt-1.5 text-[11px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}