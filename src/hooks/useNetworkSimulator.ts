/**
 * DEV-only Network Simulator
 * Provides deterministic control over network status for testing.
 * In production builds, this returns null (no-op).
 */
import { useState, useCallback, useEffect } from "react";

export type NetworkSimMode = "real" | "offline" | "slow";

const STORAGE_KEY = "mindmate-dev-network-sim";

interface NetworkSimState {
  mode: NetworkSimMode;
  /** If true, the simulated status overrides real navigator.onLine */
  isSimulatedOffline: boolean;
}

function getStoredMode(): NetworkSimMode {
  if (!import.meta.env.DEV) return "real";
  try {
    return (localStorage.getItem(STORAGE_KEY) as NetworkSimMode) || "real";
  } catch {
    return "real";
  }
}

/**
 * Returns simulator controls in DEV, or null in production.
 * Components should check `if (simulator)` before rendering UI.
 */
export function useNetworkSimulator() {
  // Always return null in production — tree-shaken by bundler
  if (!import.meta.env.DEV) return null;

  const [mode, setModeState] = useState<NetworkSimMode>(getStoredMode);

  const setMode = useCallback((newMode: NetworkSimMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {}
    // Dispatch custom event so useNetworkStatus picks it up
    window.dispatchEvent(new CustomEvent("dev-network-sim", { detail: { mode: newMode } }));
  }, []);

  return { mode, setMode };
}

/**
 * Returns the simulated online status if simulator is active.
 * Called from useNetworkStatus to override real status in DEV.
 */
export function getSimulatedOnlineStatus(): boolean | null {
  if (!import.meta.env.DEV) return null;
  try {
    const mode = localStorage.getItem(STORAGE_KEY) as NetworkSimMode;
    if (mode === "offline") return false;
    if (mode === "slow") return true; // slow = online but delayed
  } catch {}
  return null; // "real" mode — use actual navigator.onLine
}
