import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { BottomTabs } from "@/components/BottomTabs";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getFirstIncompleteOnboardingPath, getUser, restoreUserFromBackend, setOnboardingNextPath } from "@/lib/store";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isScreenRun = location.pathname === "/app/screen/run";
  const isAppHome = location.pathname === "/app" || location.pathname === "/app/";
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const u = getUser();
    void restoreUserFromBackend().then((restored) => {
      if (!restored) {
        if (!u) navigate({ to: "/" });
        return;
      }
      const incompletePath = getFirstIncompleteOnboardingPath(restored);
      if (incompletePath) {
        setOnboardingNextPath(location.pathname.startsWith("/app/screen") ? location.pathname : "/app/screen");
        navigate({ to: incompletePath });
      }
    }).catch(() => navigate({ to: "/" }));
  }, [location.pathname, navigate]);
  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background text-foreground">
      {!isScreenRun && <SiteHeader showBack={!isAppHome} />}
      <div className={`mx-auto flex w-full flex-1 flex-col bg-background ${isScreenRun ? "max-w-none" : "max-w-[440px] lg:max-w-6xl lg:px-8"}`}>
        <div className={`flex flex-1 flex-col overflow-y-auto ${isScreenRun ? "pb-0" : "pb-24 lg:pb-0"}`}>
          <div className="flex-1"><Outlet /></div>
          {!isScreenRun && <SiteFooter />}
        </div>
        {!isScreenRun && <div className="lg:hidden"><BottomTabs /></div>}
      </div>
    </div>
  );
}
