import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Activity, Dumbbell, LineChart, User } from "lucide-react";

const tabs = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/screen", label: "Screen", icon: Activity, exact: false },
  { to: "/app/program", label: "Program", icon: Dumbbell, exact: false },
  { to: "/app/progress", label: "Progress", icon: LineChart, exact: false },
  { to: "/app/profile", label: "Profile", icon: User, exact: false },
] as const;

export function BottomTabs() {
  const pathname = useRouterState({ select: s => s.location.pathname });
  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <ul className="grid grid-cols-5 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {tabs.map(t => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          const Icon = t.icon;
          return (
            <li key={t.to}>
              <Link to={t.to} className="flex flex-col items-center gap-1 py-1.5">
                <span className={`grid h-9 w-12 place-items-center rounded-2xl transition-all ${active ? "brand-gradient text-primary-foreground shadow-soft" : "text-muted-foreground"}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className={`text-[10px] font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
