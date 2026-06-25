import { useUser } from "@/lib/store";
import { useSubscription } from "@/lib/useSubscription";

/** useUser() with `premium` overridden by live Stripe subscription status. */
export function useUserPremium() {
  const u = useUser();
  const { isActive } = useSubscription(u?.id);
  if (!u) return u;
  if (isActive && !u.premium) return { ...u, premium: true };
  return u;
}