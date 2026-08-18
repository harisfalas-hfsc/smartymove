import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";

/** Global strip shown whenever the device has no connection. */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="sticky top-0 z-[60] flex items-center justify-center gap-2 border-b-2 border-primary bg-primary/10 px-4 py-2 text-center text-xs font-semibold text-foreground">
      <WifiOff className="h-4 w-4 shrink-0 text-primary" />
      You're offline — showing everything saved on this device.
    </div>
  );
}

export const OFFLINE_ACTION_MESSAGE =
  "You're offline — you can view everything saved on this device. Creating new items needs an internet connection.";
