import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
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
                className="inline-flex h-7 items-center justify-center rounded-full px-3 text-xs font-semibold text-foreground/80 hover:text-primary"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                className="inline-flex h-7 items-center justify-center rounded-full border-2 border-primary px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
