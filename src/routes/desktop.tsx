import { createFileRoute } from "@tanstack/react-router";
import { DesktopProfile } from "@/components/DesktopProfile";

export const Route = createFileRoute("/desktop")({
  head: () => ({ meta: [{ title: "SmartyMove — Account" }] }),
  component: DesktopProfile,
});
