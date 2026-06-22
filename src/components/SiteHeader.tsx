import { Link, useNavigate } from "@tanstack/react-router";
import { Activity, ChevronLeft, LogOut } from "lucide-react";
import { useUser, setUser } from "@/lib/store";

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
  const handleSignOut = () => { setUser(null); navigate({ to: "/" }); };

  return (
    <header
      className="sticky top-0 z-30 flex w-full items-center justify-between"
      style={{
        padding: "12px 18px",
        background: "rgba(231,236,236,0.85)",
        backdropFilter: "saturate(180%) blur(12px)",
        WebkitBackdropFilter: "saturate(180%) blur(12px)",
        borderBottom: "1px solid rgba(20,33,58,0.06)",
      }}
    >
      <div className="flex items-center gap-2">
        {(showBack || onBack) && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="grid place-items-center"
            style={{
              width: 34, height: 34, borderRadius: 12,
              background: "#fff", border: "1px solid #D9E0E2",
              color: "#14213A", cursor: "pointer",
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        <Link
        to="/"
        className="flex items-center gap-2"
        style={{
          fontWeight: 800,
          fontSize: 17,
          letterSpacing: 0,
          color: "#14213A",
          textDecoration: "none",
        }}
      >
        <span
          className="grid place-items-center"
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: "linear-gradient(160deg,#0E7C86,#1f6fa8)",
            color: "#fff",
          }}
        >
          <Activity className="h-4 w-4" />
        </span>
        SmartyMove
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Link
              to="/app/profile"
              aria-label="Profile"
              className="grid place-items-center"
              style={{
                width: 34, height: 34, borderRadius: 999,
                background: "linear-gradient(160deg,#0E7C86,#1f6fa8)",
                color: "#fff", fontWeight: 800, fontSize: 13, textDecoration: "none",
              }}
            >
              {user.name.slice(0,1).toUpperCase()}
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              className="grid place-items-center"
              style={{
                width: 34, height: 34, borderRadius: 12,
                background: "#fff", border: "1px solid #D9E0E2",
                color: "#14213A", cursor: "pointer",
              }}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <button
          type="button"
          onClick={handleSignIn}
          style={{
            background: "transparent",
            border: "none",
            color: "#14213A",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            padding: "8px 6px",
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={handleSignUp}
          style={{
            background: "linear-gradient(160deg,#0E7C86,#1f6fa8)",
            border: "none",
            color: "#fff",
            borderRadius: 999,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 6px 14px -6px rgba(31,111,168,0.55)",
          }}
        >
          Sign up
        </button>
          </>
        )}
      </div>
    </header>
  );
}
