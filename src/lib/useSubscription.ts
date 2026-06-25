import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";

export type SubRow = {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  price_id: string;
};

export function isActiveSub(s: SubRow | null): boolean {
  if (!s) return false;
  const future = !s.current_period_end || new Date(s.current_period_end) > new Date();
  if (["active", "trialing", "past_due"].includes(s.status) && future) return true;
  if (s.status === "canceled" && future) return true;
  return false;
}

export function useSubscription(userId?: string) {
  const [sub, setSub] = useState<SubRow | null>(null);
  const [loading, setLoading] = useState<boolean>(!!userId);

  useEffect(() => {
    if (!userId) { setSub(null); setLoading(false); return; }
    let cancelled = false;
    let env: "sandbox" | "live";
    try { env = getStripeEnvironment(); } catch { setLoading(false); return; }

    async function refetch() {
      const { data } = await supabase
        .from("subscriptions")
        .select("status,current_period_end,cancel_at_period_end,price_id")
        .eq("user_id", userId!)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) { setSub((data as SubRow | null) ?? null); setLoading(false); }
    }
    refetch();
    const ch = supabase
      .channel(`sub:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` }, () => refetch())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [userId]);

  return { sub, isActive: isActiveSub(sub), loading };
}