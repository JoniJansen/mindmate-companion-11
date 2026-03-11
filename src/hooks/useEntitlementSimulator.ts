/**
 * DEV-only Entitlement Simulator
 * Provides deterministic control over premium/subscription states for testing.
 * In production builds, this returns null (no-op).
 */
import { useState, useCallback } from "react";

export type SimulatedEntitlement = "real" | "free" | "trial" | "active" | "cancelled" | "expired" | "grace";

const STORAGE_KEY = "soulvay-dev-entitlement-sim";

function getStoredEntitlement(): SimulatedEntitlement {
  if (!import.meta.env.DEV) return "real";
  try {
    return (localStorage.getItem(STORAGE_KEY) as SimulatedEntitlement) || "real";
  } catch {
    return "real";
  }
}

/**
 * Maps a simulated entitlement to the premium state shape.
 */
export function getSimulatedPremiumOverride(): {
  isPremium: boolean;
  planType: string;
  subscriptionStatus: string;
} | null {
  if (!import.meta.env.DEV) return null;
  try {
    const sim = localStorage.getItem(STORAGE_KEY) as SimulatedEntitlement;
    if (!sim || sim === "real") return null;

    switch (sim) {
      case "free":
        return { isPremium: false, planType: "free", subscriptionStatus: "none" };
      case "trial":
        return { isPremium: true, planType: "trial", subscriptionStatus: "trialing" };
      case "active":
        return { isPremium: true, planType: "monthly", subscriptionStatus: "active" };
      case "cancelled":
        return { isPremium: true, planType: "monthly", subscriptionStatus: "cancelled" };
      case "expired":
        return { isPremium: false, planType: "monthly", subscriptionStatus: "expired" };
      case "grace":
        return { isPremium: true, planType: "monthly", subscriptionStatus: "past_due" };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Returns simulator controls in DEV, or null in production.
 */
export function useEntitlementSimulator() {
  if (!import.meta.env.DEV) return null;

  const [entitlement, setEntitlementState] = useState<SimulatedEntitlement>(getStoredEntitlement);

  const setEntitlement = useCallback((newEntitlement: SimulatedEntitlement) => {
    setEntitlementState(newEntitlement);
    try {
      localStorage.setItem(STORAGE_KEY, newEntitlement);
    } catch {}
    // Force reload to re-evaluate premium state
    window.dispatchEvent(new CustomEvent("dev-entitlement-sim", { detail: { entitlement: newEntitlement } }));
  }, []);

  return { entitlement, setEntitlement };
}
