import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
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
        // Offline with a cached member: stay in the app.
        if (!u && navigator.onLine !== false) navigate({ to: "/" });
        return;
      }
      const incompletePath = getFirstIncompleteOnboardingPath(restored);
      if (incompletePath) {
        setOnboardingNextPath(location.pathname.startsWith("/app/screen") ? location.pathname : "/app/screen");
        navigate({ to: incompletePath });
      }
    }).catch(() => {
      if (!getUser() && navigator.onLine !== false) navigate({ to: "/" });
    });
  }, [location.pathname, navigate]);
  return (
    <div
      className="flex min-h-[100dvh] w-full flex-col bg-background text-foreground lg:!pb-0"
      style={
        !isScreenRun
          ? { paddingBottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }
          : undefined
      }
    >
      {!isScreenRun && <SiteHeader showBack={!isAppHome} />}
      <div className={`mx-auto flex w-full flex-1 flex-col bg-background ${isScreenRun ? "max-w-none" : "max-w-[440px] lg:max-w-6xl lg:px-8"}`}>
        <div className="flex flex-1 flex-col">
          <div className="flex-1"><Outlet /></div>
          {!isScreenRun && <SiteFooter />}
        </div>
      </div>
    </div>
  );
}
