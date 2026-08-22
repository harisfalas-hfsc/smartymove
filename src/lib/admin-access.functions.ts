import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-side admin check. Keeps admin identity off the public bundle:
 * the client only learns a boolean about itself.
 */
export const getIsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean }> => {
    const { isAdminEmail } = await import("@/lib/admin.server");
    let email = (context.claims as { email?: string } | null)?.email;
    if (!email) {
      const { data } = await context.supabase.from("profiles").select("email").eq("id", context.userId).maybeSingle();
      email = (data as { email?: string } | null)?.email;
    }
    if (isAdminEmail(email)) return { isAdmin: true };
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: Boolean(role) };
  });
