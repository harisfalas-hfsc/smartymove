import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Activity, Dumbbell, LineChart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/app", label: "Home", icon: Home, exact: true, iconClass: "text-primary" },
  { to: "/app/screen", label: "Screen", icon: Activity, exact: false, iconClass: "text-blue-500" },
  { to: "/app/program", label: "Program", icon: Dumbbell, exact: false, iconClass: "text-orange-500" },
  { to: "/app/progress", label: "Progress", icon: LineChart, exact: false, iconClass: "text-emerald-500" },
  { to: "/app/profile", label: "Profile", icon: User, exact: false, iconClass: "text-purple-500" },
] as const;

export function BottomTabs() {
  const pathname = useRouterState({ select: s => s.location.pathname });
  return (
    <nav
      className="sticky bottom-0 z-40 border-t border-primary/20 bg-background/95 backdrop-blur-md"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -4px 16px -4px hsl(195 82% 55% / 0.15)",
      }}
      aria-label="Mobile navigation bar"
    >
      <div className="flex h-16 items-stretch justify-between gap-0.5 px-1">
        {tabs.map(t => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              aria-label={t.label}
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
  );
}
