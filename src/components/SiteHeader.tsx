import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Menu, X, Home, Activity, Dumbbell, LineChart, User as UserIcon, Crown, Mail, Info, Shield, FileText, AlertTriangle, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useUser } from "@/lib/store";

type Props = {
  onSignIn?: () => void;
  onSignUp?: () => void;
  onBack?: () => void;
  showBack?: boolean;
};

export function SiteHeader({ onSignIn, onSignUp, onBack, showBack = false }: Props) {
  const navigate = useNavigate();
  const user = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) window.history.back();
    else navigate({ to: "/" });
  };
  const handleSignIn = () => onSignIn ? onSignIn() : window.location.assign("/?auth=signin");
  const handleSignUp = () => onSignUp ? onSignUp() : window.location.assign("/?auth=signup");
  return (
    <header
      className="sticky top-0 z-30 w-full bg-background"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-11 items-center justify-between gap-2 px-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-primary/10"
          >
            <Menu className="h-5 w-5" />
          </button>
          {(showBack || onBack) && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <Link
            to="/"
            aria-label="SmartyMove home"
            className="text-lg font-extrabold tracking-tight leading-none"
            style={{ textDecoration: "none" }}
          >
            <span className="text-primary">SMARTY</span>
            <span className="text-green-500">MOVE</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Link
              to="/app/profile"
              aria-label="Profile"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-primary text-xs font-bold text-primary-foreground"
              style={{ textDecoration: "none" }}
            >
              {user.name.slice(0,1).toUpperCase()}
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSignIn}
                className="inline-flex h-7 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3 text-xs font-semibold text-foreground/80 hover:text-primary"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                className="inline-flex h-7 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-primary px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
      {menuOpen && <NavDrawer onClose={() => setMenuOpen(false)} isAuthed={!!user} />}
    </header>
  );
}

function NavDrawer({ onClose, isAuthed }: { onClose: () => void; isAuthed: boolean }) {
  const sections: { heading: string; items: { to: string; label: string; Icon: any }[] }[] = [
    ...(isAuthed
      ? [{
          heading: "App",
          items: [
            { to: "/app", label: "Home", Icon: Home },
            { to: "/app/screen", label: "Movement Screen", Icon: Activity },
            { to: "/app/program", label: "Training Program", Icon: Dumbbell },
            { to: "/app/progress", label: "Progress", Icon: LineChart },
          ],
        }]
      : []),
    {
      heading: "SmartyMove",
      items: [
        { to: "/about", label: "About", Icon: Info },
        { to: "/pricing", label: "Pricing", Icon: Crown },
        { to: "/faq", label: "FAQ", Icon: HelpCircle },
        { to: "/contact", label: "Contact us", Icon: Mail },
      ],
    },
    {
      heading: "Legal",
      items: [
        { to: "/privacy", label: "Privacy Policy", Icon: Shield },
        { to: "/terms", label: "Terms of Service", Icon: FileText },
        { to: "/disclaimer", label: "Disclaimer", Icon: AlertTriangle },
      ],
    },
  ];
  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside
        className="absolute left-0 top-0 flex h-full w-[85%] max-w-[340px] flex-col bg-background shadow-2xl"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex h-12 items-center justify-between px-4">
          <div className="text-base font-extrabold">
            <span className="text-primary">SMARTY</span><span className="text-green-500">MOVE</span>
          </div>
          <button onClick={onClose} aria-label="Close menu" className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          {sections.map((s) => (
            <div key={s.heading} className="mt-2">
              <div className="px-2 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.heading}</div>
              <ul className="space-y-1">
                {s.items.map(({ to, label, Icon }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-primary/10"
                      style={{ textDecoration: "none" }}
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-xl brand-gradient-soft text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}
