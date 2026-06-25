import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";

type AccountExportResult =
  | {
      data: {
        exportedAt: string;
        account: {
          id: string;
          email: string | null;
        };
        profile: unknown;
        subscriptions: unknown[];
        notes: string[];
      };
    }
  | { error: string };

type DeleteAccountResult =
  | { ok: true; canceledSubscriptions: number }
  | { error: string };

async function cancelKnownSubscriptions(subscriptions: Array<{ stripe_subscription_id: string; environment: StripeEnv; status?: string | null }>) {
  let canceled = 0;
  for (const subscription of subscriptions) {
    if (!subscription.stripe_subscription_id || !["active", "trialing", "past_due", "incomplete"].includes(subscription.status ?? "")) continue;
    try {
      const stripe = createStripeClient(subscription.environment);
      await stripe.subscriptions.update(subscription.stripe_subscription_id, { cancel_at_period_end: true });
      canceled += 1;
    } catch (error) {
      console.error("Could not cancel subscription during account deletion", getStripeErrorMessage(error));
    }
  }
  return canceled;
}

export const exportAccountData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccountExportResult> => {
    try {
      const { supabase, userId, claims } = context;
      const [{ data: profile, error: profileError }, { data: subscriptions, error: subscriptionError }] = await Promise.all([
        supabase.from("profiles").select("id,email,name,age,app_user,created_at,updated_at").eq("id", userId).maybeSingle(),
        supabase
          .from("subscriptions")
          .select("status,price_id,product_id,stripe_customer_id,stripe_subscription_id,environment,cancel_at_period_end,current_period_start,current_period_end,created_at,updated_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);
      if (profileError) return { error: profileError.message };
      if (subscriptionError) return { error: subscriptionError.message };

      return {
        data: {
          exportedAt: new Date().toISOString(),
          account: {
            id: userId,
            email: typeof claims?.email === "string" ? claims.email : profile?.email ?? null,
          },
          profile: profile ?? null,
          subscriptions: subscriptions ?? [],
          notes: [
            "Raw camera video is not included because SmartyMove processes movement screens on your device and does not store video frames.",
            "Payment card numbers are not included because payments are handled by Stripe and SmartyMove does not store full card details.",
          ],
        },
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Could not export account data" };
    }
  });

export const deleteAccountAndData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DeleteAccountResult> => {
    try {
      const { supabase, userId } = context;
      const { data: subscriptions, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id,environment,status")
        .eq("user_id", userId);
      if (subscriptionError) return { error: subscriptionError.message };

      const normalizedSubscriptions = ((subscriptions ?? []) as Array<{ stripe_subscription_id: string; environment: string; status?: string | null }>)
        .filter((subscription) => subscription.environment === "sandbox" || subscription.environment === "live")
        .map((subscription) => ({ ...subscription, environment: subscription.environment as StripeEnv }));
      const canceledSubscriptions = await cancelKnownSubscriptions(normalizedSubscriptions);

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const deleteSubscriptions = await supabaseAdmin.from("subscriptions").delete().eq("user_id", userId);
      if (deleteSubscriptions.error) return { error: deleteSubscriptions.error.message };

      const deleteProfile = await supabaseAdmin.from("profiles").delete().eq("id", userId);
      if (deleteProfile.error) return { error: deleteProfile.error.message };

      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteUserError) return { error: deleteUserError.message };

      return { ok: true, canceledSubscriptions };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Could not delete account" };
    }
  });