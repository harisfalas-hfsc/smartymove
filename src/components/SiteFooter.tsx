import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  const linkStyle: React.CSSProperties = {
    color: "#6B7A90",
    textDecoration: "none",
    fontSize: 12,
    ,
  };
  return (
    <footer
      className="flex flex-col items-center gap-2"
      style={{ padding: "22px 4px 4px", borderTop: "1px solid #D9E0E2", marginTop: 18 }}
    >
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link to="/terms" style={linkStyle}>Terms &amp; Conditions</Link>
        <span style={{ color: "#D9E0E2" }}>·</span>
        <Link to="/privacy" style={linkStyle}>Privacy Policy</Link>
        <span style={{ color: "#D9E0E2" }}>·</span>
        <Link to="/disclaimer" style={linkStyle}>Disclaimer</Link>
      </nav>
      <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>
        © {new Date().getFullYear()} SmartyMove · Part of the Smarty family
      </p>
    </footer>
  );
}
