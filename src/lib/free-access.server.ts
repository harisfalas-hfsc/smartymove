/**
 * Server-side read of the Global Free Access Mode switch.
 * Fails CLOSED (false = normal paid behaviour) on any read error.
 * Never writes anything and never touches Stripe.
 */
export const FREE_ACCESS_BLOCK_MESSAGE =
  "All SmartyMove content is currently free for signed-in members. No purchase is required.";

export async function isFreeAccessMode(): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "free_access_mode")
      .maybeSingle();
    if (error) return false;
    const value = data?.setting_value;
    return value === true || value === "true";
  } catch {
    return false;
  }
}
