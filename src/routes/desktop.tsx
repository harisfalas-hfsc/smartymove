import { createFileRoute } from "@tanstack/react-router";
import { DesktopProfile } from "@/components/DesktopProfile";

export const Route = createFileRoute("/desktop")({
  head: () => ({ meta: [{ title: "SmartyMove — Desktop Dashboard" }] }),
  component: DesktopProfile,
});
