import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/desktop")({
  head: () => ({ meta: [{ title: "SmartyMove — Desktop Dashboard" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
});
