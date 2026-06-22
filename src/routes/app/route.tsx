import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomTabs } from "@/components/BottomTabs";
import { DesktopProfile } from "@/components/DesktopProfile";
import { SiteHeader } from "@/components/SiteHeader";
import { getUser, restoreUserFromBackend } from "@/lib/store";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const navigate = useNavigate();
  useEffect(() => {
    const u = getUser();
    if (u?.questionnaire && u.goal) return;
    void restoreUserFromBackend().then((restored) => {
      if (!restored) navigate({ to: "/" });
      else if (!restored.questionnaire || !restored.goal) navigate({ to: "/onboarding/questionnaire" });
    }).catch(() => navigate({ to: "/" }));
  }, [navigate]);
  return (
    <>
      <div className="hidden lg:block"><DesktopProfile /></div>
      <div className="lg:hidden flex min-h-[100dvh] w-full flex-col" style={{ background: "#E7ECEC", color: "#14213A" }}>
        <SiteHeader />
        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col bg-background">
          <div className="flex-1 overflow-y-auto pb-20"><Outlet /></div>
          <BottomTabs />
        </div>
      </div>
    </>
  );
}
