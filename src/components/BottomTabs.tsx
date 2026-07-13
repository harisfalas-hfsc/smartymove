import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Activity, Dumbbell, LineChart, Camera } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const tabs = [
  { to: "/app", label: "Home", icon: Home, exact: true, iconClass: "text-primary" },
  { to: "/app/screen", label: "Screen", icon: Activity, exact: false, iconClass: "text-blue-500" },
  { to: "/app/program", label: "Program", icon: Dumbbell, exact: false, iconClass: "text-orange-500" },
  { to: "/app/progress", label: "Progress", icon: LineChart, exact: false, iconClass: "text-emerald-500" },
] as const;

export function BottomTabs() {
  const pathname = useRouterState({ select: s => s.location.pathname });
  const navigate = useNavigate();
  const user = useUser();
  const [gateOpen, setGateOpen] = useState(false);

  // Hide during full-screen flows where the bar overlaps critical content.
  const hiddenRoutes = ["/app/screen/run", "/app/screen/setup"];
  if (hiddenRoutes.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

  const hasScan = !!user && (user.sessions?.length ?? 0) > 0;
  const gated = !user || !hasScan;

  const onTabClick = (e: MouseEvent<HTMLAnchorElement>, to: string) => {
    // Home is always accessible; other tabs require a completed scan.
    if (to === "/app") return;
    if (gated) {
      e.preventDefault();
      setGateOpen(true);
    }
  };

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/20 bg-background/95 backdrop-blur-md lg:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          boxShadow: "0 -4px 16px -4px hsl(195 82% 55% / 0.15)",
        }}
        aria-label="Mobile navigation bar"
      >
        <div className="mx-auto flex h-16 max-w-[440px] items-stretch justify-between gap-0.5 px-1">
          {tabs.map(t => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                aria-label={t.label}
                onClick={(e) => onTabClick(e, t.to)}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 transition-all duration-150 active:scale-95",
                  active ? "text-primary" : "text-foreground/75 hover:text-primary",
                )}
              >
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-primary/10", t.iconClass)}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-medium leading-none">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <Dialog open={gateOpen} onOpenChange={setGateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Camera className="h-7 w-7" />
            </div>
            <DialogTitle className="text-center">Scan first to unlock</DialogTitle>
            <DialogDescription className="text-center">
              Your Screen, Program, and Progress become available after your first movement scan — that's how we personalise everything for you.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:flex-col sm:space-x-0 gap-2">
            <Button
              className="w-full"
              onClick={() => {
                setGateOpen(false);
                navigate({ to: user ? "/app/screen" : "/" });
              }}
            >
              {user ? "Start my scan" : "Sign in & scan"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setGateOpen(false)}>
              Not now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
