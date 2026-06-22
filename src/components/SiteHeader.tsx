import { Link } from "@tanstack/react-router";
import { Activity, User } from "lucide-react";

export function SiteHeader({ onSignIn }: { onSignIn?: () => void }) {
  return (
    <header
      className="flex w-full items-center justify-between"
      style={{ padding: "10px 4px 18px" }}
    >
      <Link
        to="/"
        className="flex items-center gap-2"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: 16,
          letterSpacing: "-0.01em",
          color: "#14213A",
          textDecoration: "none",
        }}
      >
        <span
          className="grid place-items-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 10,
            background: "linear-gradient(160deg,#0E7C86,#1f6fa8)",
            color: "#fff",
          }}
        >
          <Activity className="h-4 w-4" />
        </span>
        SmartyMove
      </Link>

      <button
        type="button"
        onClick={onSignIn}
        className="flex items-center gap-2"
        style={{
          background: "#fff",
          border: "1px solid #D9E0E2",
          borderRadius: 999,
          padding: "6px 12px 6px 6px",
          color: "#14213A",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "'IBM Plex Sans', sans-serif",
          cursor: "pointer",
        }}
      >
        <span
          className="grid place-items-center"
          style={{
            width: 24, height: 24, borderRadius: "50%",
            background: "#E7ECEC", color: "#0E7C86",
          }}
        >
          <User className="h-3.5 w-3.5" />
        </span>
        Sign in
      </button>
    </header>
  );
}
