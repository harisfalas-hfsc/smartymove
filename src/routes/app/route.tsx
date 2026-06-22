import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BottomTabs } from "@/components/BottomTabs";
import { DesktopProfile } from "@/components/DesktopProfile";
import { getUser } from "@/lib/store";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const navigate = useNavigate();
  useEffect(() => {
    const u = getUser();
    if (!u) navigate({ to: "/" });
    else if (!u.questionnaire || !u.goal) navigate({ to: "/onboarding/questionnaire" });
  }, [navigate]);
  return (
    <>
      <div className="hidden lg:block"><DesktopProfile /></div>
      <div className="lg:hidden">
        <PhoneFrame>
          <div className="flex h-full min-h-[100dvh] flex-col bg-background">
            <div className="flex-1 overflow-y-auto"><Outlet /></div>
            <BottomTabs />
          </div>
        </PhoneFrame>
      </div>
    </>
  );
}
