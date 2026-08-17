import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";
import { isAdminEmail } from "@/lib/admin";

async function assertAdmin(ctx: { supabase: any; userId: string; claims: any }) {
  // 1. email allowlist
  let email = ctx.claims?.email as string | undefined;
  if (!email) {
    const { data } = await ctx.supabase.from("profiles").select("email").eq("id", ctx.userId).maybeSingle();
    email = (data as any)?.email;
  }
  if (isAdminEmail(email)) return;
  // 2. user_roles table
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: role } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) throw new Error("Forbidden: admin access required");
}

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  age: number;
  scan_credits: number;
  scans_purchased: number;
  created_at: string;
  is_admin: boolean;
  has_active_subscription: boolean;
  subscription_status: string | null;
  current_period_end: string | null;
};

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { search?: string; environment: StripeEnv }) => data)
  .handler(async ({ context, data }): Promise<{ users: AdminUserRow[] } | { error: string }> => {
    try {
      await assertAdmin(context as any);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      let q = supabaseAdmin.from("profiles").select("id,email,name,age,scan_credits,scans_purchased,created_at").order("created_at", { ascending: false }).limit(500);
      if (data.search) q = q.ilike("email", `%${data.search}%`);
      const { data: profiles, error } = await q;
      if (error) return { error: error.message };
      const ids = (profiles ?? []).map((p: any) => p.id);
      const [{ data: subs }, { data: roles }] = await Promise.all([
        supabaseAdmin.from("subscriptions").select("user_id,status,current_period_end,environment").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
        supabaseAdmin.from("user_roles").select("user_id,role").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
      ]);
      const now = Date.now();
      const subByUser = new Map<string, any>();
      for (const s of (subs ?? []) as any[]) {
        if (s.environment !== data.environment) continue;
        const prev = subByUser.get(s.user_id);
        if (!prev) subByUser.set(s.user_id, s);
      }
      const adminByUser = new Set<string>();
      for (const r of (roles ?? []) as any[]) if (r.role === "admin") adminByUser.add(r.user_id);
      const users: AdminUserRow[] = (profiles ?? []).map((p: any) => {
        const s = subByUser.get(p.id);
        const future = s?.current_period_end ? new Date(s.current_period_end).getTime() > now : true;
        const active = !!(s && (["active", "trialing", "past_due"].includes(s.status) && future || (s.status === "canceled" && future)));
        return {
          id: p.id,
          email: p.email,
          name: p.name,
          age: p.age,
          scan_credits: p.scan_credits ?? 0,
          scans_purchased: p.scans_purchased ?? 0,
          created_at: p.created_at,
          is_admin: isAdminEmail(p.email) || adminByUser.has(p.id),
          has_active_subscription: active,
          subscription_status: s?.status ?? null,
          current_period_end: s?.current_period_end ?? null,
        };
      });
      return { users };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to list users" };
    }
  });

export const adminGrantScans = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; credits: number }) => data)
  .handler(async ({ context, data }): Promise<{ ok: true; credits: number } | { error: string }> => {
    try {
      await assertAdmin(context as any);
      if (!data.userId || !Number.isFinite(data.credits) || data.credits === 0) return { error: "Invalid input" };
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: p } = await supabaseAdmin.from("profiles").select("scan_credits,scans_purchased").eq("id", data.userId).maybeSingle();
      if (!p) return { error: "User not found" };
      const nextCredits = Math.max(0, ((p as any).scan_credits ?? 0) + data.credits);
      const nextPurchased = Math.max(0, ((p as any).scans_purchased ?? 0) + Math.max(0, data.credits));
      const { error } = await supabaseAdmin.from("profiles").update({ scan_credits: nextCredits, scans_purchased: nextPurchased }).eq("id", data.userId);
      if (error) return { error: error.message };
      return { ok: true, credits: nextCredits };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; makeAdmin: boolean }) => data)
  .handler(async ({ context, data }): Promise<{ ok: true } | { error: string }> => {
    try {
      await assertAdmin(context as any);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      if (data.makeAdmin) {
        const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
        if (error) return { error: error.message };
      } else {
        const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
        if (error) return { error: error.message };
      }
      return { ok: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  });

export type AdminPurchaseRow = {
  id: string;
  created: string;
  amount: number;
  currency: string;
  email: string | null;
  description: string | null;
  status: string;
  type: "payment" | "subscription";
};

export type AdminAnalytics = {
  environment: StripeEnv;
  totalRevenue: number;
  currency: string;
  paymentsCount: number;
  activeSubscriptions: number;
  scanPurchases: number;
  subscriptionPurchases: number;
  revenueByMonth: Array<{ month: string; amount: number }>;
  recent: AdminPurchaseRow[];
};

export const adminGetStripeAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => data)
  .handler(async ({ context, data }): Promise<AdminAnalytics | { error: string }> => {
    try {
      await assertAdmin(context as any);
      const stripe = createStripeClient(data.environment);
      // Fetch up to ~300 recent successful charges
      const charges: any[] = [];
      let starting_after: string | undefined;
      for (let i = 0; i < 3; i++) {
        const page: any = await stripe.charges.list({ limit: 100, ...(starting_after ? { starting_after } : {}) });
        charges.push(...page.data);
        if (!page.has_more) break;
        starting_after = page.data[page.data.length - 1]?.id;
      }
      const paid = charges.filter((c) => c.paid && c.status === "succeeded" && !c.refunded);
      const currency = paid[0]?.currency?.toUpperCase() ?? "EUR";
      const totalRevenue = paid.reduce((s, c) => s + (c.amount ?? 0), 0) / 100;
      const byMonth = new Map<string, number>();
      let scanCount = 0;
      let subCount = 0;
      for (const c of paid) {
        const d = new Date((c.created ?? 0) * 1000);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        byMonth.set(key, (byMonth.get(key) ?? 0) + (c.amount ?? 0) / 100);
        const type = (c.metadata?.type ?? "").toLowerCase();
        const desc = (c.description ?? "").toLowerCase();
        if (type.includes("scan") || desc.includes("scan")) scanCount++;
        else if (type.includes("sub") || c.invoice) subCount++;
      }
      const revenueByMonth = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }));
      const activeSubs = await stripe.subscriptions.list({ status: "active", limit: 100 });
      const recent: AdminPurchaseRow[] = paid.slice(0, 30).map((c) => ({
        id: c.id,
        created: new Date((c.created ?? 0) * 1000).toISOString(),
        amount: (c.amount ?? 0) / 100,
        currency: (c.currency ?? "eur").toUpperCase(),
        email: c.billing_details?.email ?? c.receipt_email ?? null,
        description: c.description ?? null,
        status: c.status,
        type: c.invoice ? "subscription" : "payment",
      }));
      return {
        environment: data.environment,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        currency,
        paymentsCount: paid.length,
        activeSubscriptions: activeSubs.data.length,
        scanPurchases: scanCount,
        subscriptionPurchases: subCount,
        revenueByMonth,
        recent,
      };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });
// ---------------------------------------------------------------------------
// Global Free Access Mode (master switch)
// ---------------------------------------------------------------------------
export const adminGetFreeAccessMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ enabled: boolean } | { error: string }> => {
    try {
      await assertAdmin(context as any);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await (supabaseAdmin as any)
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "free_access_mode")
        .maybeSingle();
      if (error) return { error: error.message };
      const v = data?.setting_value;
      return { enabled: v === true || v === "true" };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  });

export const adminSetFreeAccessMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { enabled: boolean }) => data)
  .handler(async ({ context, data }): Promise<{ ok: true; enabled: boolean } | { error: string }> => {
    try {
      await assertAdmin(context as any);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await (supabaseAdmin as any)
        .from("system_settings")
        .upsert(
          { setting_key: "free_access_mode", setting_value: data.enabled, updated_at: new Date().toISOString() },
          { onConflict: "setting_key" },
        );
      if (error) return { error: error.message };
      return { ok: true, enabled: data.enabled };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed" };
    }
  });
