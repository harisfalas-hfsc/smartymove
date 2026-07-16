import { useEffect, useState } from "react";
import { ChevronLeft, ExternalLink, Sparkles } from "lucide-react";
import logoDiet from "@/assets/smartydiet-logo.png";
import logoGym from "@/assets/smartygym-icon.png";

const CURRENT_APP: "gym" | "move" | "diet" = "move";
const DELAY_MS = 10000;

type SisterApp = {
  id: "gym" | "move" | "diet";
  name: string;
  tagline: string;
  url: string;
  image: string;
};

const SISTER_APPS: SisterApp[] = [
  {
    id: "gym",
    name: "SmartyGym",
    tagline: "Train smart. Get stronger. Feel younger.",
    url: "https://smartygym.com",
    image: logoGym,
  },
  {
    id: "diet",
    name: "SmartyDiet",
    tagline: "Eat smart. Fuel your body. Live longer.",
    url: "https://smarty-meals-hub.lovable.app",
    image: logoDiet,
  },
];

export const SisterAppsPopup = () => {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  const others = SISTER_APPS.filter((a) => a.id !== CURRENT_APP);

  if (!visible) return null;

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center pointer-events-none">
      {/* Panel */}
      <div
        className={`pointer-events-auto bg-white shadow-2xl rounded-r-2xl overflow-hidden transition-transform duration-500 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: 260 }}
      >
        <div className="p-4">
          <div className="flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-wide mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Smarty Family
          </div>
          <p className="text-[13px] text-slate-600 mb-3 leading-snug">
            Complete your wellness journey
          </p>
          <div className="flex flex-col gap-2">
            {others.map((app) => (
              <a
                key={app.id}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 py-1.5 hover:opacity-90 transition-opacity"
              >
                <div className="w-14 h-14 shrink-0 flex items-center justify-center bg-white">
                  <img
                    src={app.image}
                    alt={app.name}
                    loading="lazy"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-slate-900 font-semibold text-sm">
                    {app.name}
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                    {app.tagline}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Tuck / reopen handle */}
      {open ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Hide Smarty Family"
          className="pointer-events-auto bg-white shadow-md rounded-r-lg py-3 px-1 border-l border-slate-100 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Show Smarty Family"
          className="pointer-events-auto bg-primary hover:bg-primary/90 transition-colors w-1.5 h-24 rounded-r-full"
        />
      )}
    </div>
  );
};

export default SisterAppsPopup;