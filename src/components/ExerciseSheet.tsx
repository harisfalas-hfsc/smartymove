import { useLibraryExercise } from "@/lib/exercises";
import { Loader2, X } from "lucide-react";
import { useEffect } from "react";

interface Props {
  exerciseId: string | null;
  onClose: () => void;
}

export function ExerciseSheet({ exerciseId, onClose }: Props) {
  const { data, isLoading } = useLibraryExercise(exerciseId);
  const open = !!exerciseId;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex max-h-[82dvh] w-full max-w-[380px] flex-col overflow-hidden rounded-3xl bg-background shadow-2xl">
        <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-5">
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-extrabold capitalize">
              {data?.row?.name ?? (isLoading ? "Loading…" : "Exercise")}
            </div>
          {data?.row && (
              <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
              {data.row.body_part && <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold capitalize">{data.row.body_part}</span>}
              {data.row.target && <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold capitalize">Target: {data.row.target}</span>}
              {data.row.equipment && <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold capitalize">{data.row.equipment}</span>}
              </div>
          )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-foreground active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-6">
          <div className="mx-auto mt-2 aspect-square w-full overflow-hidden rounded-2xl bg-secondary">
            {isLoading && (
              <div className="grid h-full w-full place-items-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoading && data?.signedUrl && (
              <img src={data.signedUrl} alt={data.row?.name ?? ""} className="h-full w-full object-contain" />
            )}
            {!isLoading && !data?.signedUrl && (
              <div className="grid h-full w-full place-items-center text-sm text-muted-foreground">
                Demonstration unavailable
              </div>
            )}
          </div>

          {!!data?.row?.secondary_muscles?.length && (
            <div className="mt-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Secondary muscles</div>
              <div className="mt-1 text-sm capitalize">{data.row.secondary_muscles.join(", ")}</div>
            </div>
          )}

          {!!data?.row?.instructions?.length && (
            <div className="mt-4">
              <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">How to perform</div>
              <ol className="mt-2 space-y-2">
                {data.row.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 rounded-xl bg-card p-3 text-sm shadow-card">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full brand-gradient text-xs font-bold text-primary-foreground">{i + 1}</span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}