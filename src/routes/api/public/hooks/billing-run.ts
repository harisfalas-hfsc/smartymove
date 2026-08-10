import { createFileRoute } from "@tanstack/react-router";

/**
 * Daily scheduler for billing notifications.
 * Sends the "renews in 3 days" and "renews tomorrow" reminders.
 * Called by pg_cron with the project's publishable key in the `apikey` header.
 */
export const Route = createFileRoute("/api/public/hooks/billing-run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected =
          process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"] ?? "";
        const presented =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        if (!expected || presented !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { runRenewalReminders } = await import("@/lib/billing-notify.server");
        try {
          const sent = await runRenewalReminders(
            supabaseAdmin as never as import("@supabase/supabase-js").SupabaseClient,
          );
          return Response.json({ ok: true, renewalReminders: sent });
        } catch (e) {
          console.error("billing-run failed", e);
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : "error" },
            { status: 500 },
          );
        }
      },
    },
  },
});