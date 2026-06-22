import { createFileRoute, Link } from "@tanstack/react-router";
import { useUser } from "@/lib/store";
import { CORE_TESTS, CONDITIONAL_TESTS } from "@/lib/movement";
import { Play, Info, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/app/screen/")({ component: ScreenIndex });

function ScreenIndex() {
  const u = useUser();
  if (!u) return null;
  const joints = (u.questionnaire?.joints ?? []).filter(j => j !== "none");
  const addOns = joints.slice(0, 2).map(j => CONDITIONAL_TESTS[j as keyof typeof CONDITIONAL_TESTS]);
  const last = u.sessions[u.sessions.length - 1];

  return (
    <div className="space-y-5 pb-6">
      <header className="brand-gradient-strong px-5 pb-7 pt-7 text-primary-foreground">
        <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Movement Screen</div>
        <h1 className="mt-1 text-2xl font-extrabold">Camera-based assessment</h1>
        <p className="mt-1 max-w-xs text-sm opacity-90">5 core tests + targeted add-ons for your selected areas. Stand 6–8 feet from the camera with your full body in frame.</p>
      </header>

      <div className="-mt-4 space-y-4 rounded-t-[2rem] bg-background px-5 pt-5">
        <div className="rounded-2xl bg-accent p-3 text-sm text-accent-foreground">
          <div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0" /><span>The browser will ask for camera permission. Footage stays on your device — pose detection runs locally.</span></div>
        </div>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Core Tests · 5</h3>
          <div className="space-y-2">
            {CORE_TESTS.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl brand-gradient text-sm font-bold text-primary-foreground">{i+1}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.duration}s · {t.focus.join(" + ")}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {addOns.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Add-on Tests · {addOns.length}</h3>
            <div className="space-y-2">
              {addOns.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-sm font-bold text-accent-foreground">{CORE_TESTS.length + i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{t.name}</div>
                    {t.note && <div className="text-xs text-warning">{t.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <Link to="/app/screen/run" className="flex items-center justify-center gap-2 rounded-2xl brand-gradient p-4 font-bold text-primary-foreground shadow-soft">
          <Play className="h-5 w-5" /> {last ? "Run re-test" : "Start screen"}
        </Link>

        {last && (
          <div className="rounded-2xl bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Last result</div>
                <div className="mt-0.5 font-bold">Score {last.overall} · {new Date(last.date).toLocaleDateString()}</div>
              </div>
              <Link to="/app/progress" className="text-sm font-semibold text-primary">View <ChevronRight className="inline h-4 w-4" /></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}