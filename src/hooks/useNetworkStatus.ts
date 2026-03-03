import { useState, useEffect, useCallback } from "react";
import { getSimulatedOnlineStatus } from "./useNetworkSimulator";

function resolveOnline(): boolean {
  // DEV simulator override
  const simulated = getSimulatedOnlineStatus();
  if (simulated !== null) return simulated;
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(resolveOnline);

  useEffect(() => {
    const handleOnline = () => setIsOnline(resolveOnline());
    const handleOffline = () => setIsOnline(resolveOnline());

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // DEV: listen for simulator events
    const handleSim = () => setIsOnline(resolveOnline());
    window.addEventListener("dev-network-sim", handleSim);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("dev-network-sim", handleSim);
    };
  }, []);

  const retry = useCallback(() => {
    const online = resolveOnline();
    if (online) {
      setIsOnline(true);
      window.location.reload();
    }
  }, []);

  return { isOnline, retry };
}
