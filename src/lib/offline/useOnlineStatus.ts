import { useEffect, useState } from "react";
import { getOnline, initConnectivity, subscribeConnectivity } from "./connectivity";

/**
 * Live online/offline flag, sourced from the one connectivity module so the
 * web app, the PWA and the native shell all agree.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    initConnectivity();
    setOnline(getOnline());
    return subscribeConnectivity(setOnline);
  }, []);

  return online;
}
