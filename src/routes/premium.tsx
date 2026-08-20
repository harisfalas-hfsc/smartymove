import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy premium page — pricing model changed to per-scan (€5.99).
// Any /premium visit sends the user to the new pricing page which also
// surfaces the "Manage subscription" flow for grandfathered subscribers.
export const Route = createFileRoute("/premium")({
  head: () => ({ meta: [{ title: "SmartyMove Premium" }, { name: "robots", content: "noindex, nofollow" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/pricing" });
  },
});