import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  head: () => ({ meta: [{ title: "Reset password — SmartyMove" }] }),
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash; the client picks it up automatically.
    const sub = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => { sub.data.subscription.unsubscribe(); };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setErr(""); setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate({ to: "/" }), 1500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't update password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] w-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[420px] px-5 pb-8 pt-5">
        <h2 style={{ fontWeight: 800, fontSize: 24, color: "#14213A", letterSpacing: "-0.01em" }}>
          Set a new password
        </h2>
        <p className="-mt-1 mb-4 text-sm" style={{ color: "#6B7A90" }}>
          {ready ? "Choose a new password for your account." : "Verifying your reset link..."}
        </p>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="np">New password</Label>
            <div className="relative">
              <Input
                id="np"
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
                minLength={6}
                disabled={!ready}
                className="h-11 rounded-xl pr-11"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={!ready || submitting || done}
            style={{ background: "#FF6B4A", boxShadow: "0 14px 24px -10px rgba(255,107,74,0.55)" }}
            className="mt-2 h-12 w-full rounded-2xl text-base font-semibold text-white hover:opacity-95"
          >
            {done ? "Password updated ✓" : submitting ? "Updating..." : "Update password"}
          </Button>
          {err && <p className="text-center text-sm font-semibold text-destructive">{err}</p>}
        </form>
        <SiteFooter />
      </main>
    </div>
  );
}