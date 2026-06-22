import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useLibraryExercise } from "@/lib/exercises";
import { Loader2 } from "lucide-react";

interface Props {
  exerciseId: string | null;
  onClose: () => void;
}

export function ExerciseSheet({ exerciseId, onClose }: Props) {
  const { data, isLoading } = useLibraryExercise(exerciseId);
  const open = !!exerciseId;

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent className="max-h-[92dvh]">
        <DrawerHeader className="pb-2 text-left">
          <DrawerTitle className="text-lg font-extrabold capitalize">
            {data?.row?.name ?? (isLoading ? "Loading…" : "Exercise")}
          </DrawerTitle>
          {data?.row && (
            <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
              {data.row.body_part && <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold capitalize">{data.row.body_part}</span>}
              {data.row.target && <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold capitalize">Target: {data.row.target}</span>}
              {data.row.equipment && <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold capitalize">{data.row.equipment}</span>}
            </div>
          )}
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-8">
          <div className="mx-auto mt-2 aspect-square w-[calc(100%-1rem)] max-w-[420px] overflow-hidden rounded-2xl bg-secondary">
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
      </DrawerContent>
    </Drawer>
  );
}