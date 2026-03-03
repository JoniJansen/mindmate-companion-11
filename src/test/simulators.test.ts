import { describe, it, expect } from "vitest";
import { getSimulatedOnlineStatus } from "@/hooks/useNetworkSimulator";
import { getSimulatedPremiumOverride } from "@/hooks/useEntitlementSimulator";

// Helper to safely set/clear localStorage
function setSimMode(key: string, value: string | null) {
  if (value === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, value);
  }
}

describe("Network Simulator", () => {
  const KEY = "mindmate-dev-network-sim";

  afterEach(() => localStorage.removeItem(KEY));

  it("returns null (real network) when no simulator active", () => {
    expect(getSimulatedOnlineStatus()).toBeNull();
  });

  it("returns null for 'real' mode", () => {
    setSimMode(KEY, "real");
    expect(getSimulatedOnlineStatus()).toBeNull();
  });

  it("returns false for 'offline' mode", () => {
    setSimMode(KEY, "offline");
    expect(getSimulatedOnlineStatus()).toBe(false);
  });

  it("returns true for 'slow' mode (online but delayed)", () => {
    setSimMode(KEY, "slow");
    expect(getSimulatedOnlineStatus()).toBe(true);
  });
});

describe("Entitlement Simulator", () => {
  const KEY = "mindmate-dev-entitlement-sim";

  afterEach(() => localStorage.removeItem(KEY));

  it("returns null (real entitlement) when no simulator active", () => {
    expect(getSimulatedPremiumOverride()).toBeNull();
  });

  it("returns null for 'real' mode", () => {
    setSimMode(KEY, "real");
    expect(getSimulatedPremiumOverride()).toBeNull();
  });

  it("returns free state correctly", () => {
    setSimMode(KEY, "free");
    const result = getSimulatedPremiumOverride();
    expect(result).not.toBeNull();
    expect(result!.isPremium).toBe(false);
    expect(result!.subscriptionStatus).toBe("none");
  });

  it("returns trial state correctly", () => {
    setSimMode(KEY, "trial");
    const result = getSimulatedPremiumOverride();
    expect(result!.isPremium).toBe(true);
    expect(result!.subscriptionStatus).toBe("trialing");
  });

  it("returns active state correctly", () => {
    setSimMode(KEY, "active");
    const result = getSimulatedPremiumOverride();
    expect(result!.isPremium).toBe(true);
    expect(result!.subscriptionStatus).toBe("active");
  });

  it("returns cancelled state — still premium until period end", () => {
    setSimMode(KEY, "cancelled");
    const result = getSimulatedPremiumOverride();
    expect(result!.isPremium).toBe(true);
    expect(result!.subscriptionStatus).toBe("cancelled");
  });

  it("returns expired state — no longer premium", () => {
    setSimMode(KEY, "expired");
    const result = getSimulatedPremiumOverride();
    expect(result!.isPremium).toBe(false);
    expect(result!.subscriptionStatus).toBe("expired");
  });

  it("returns grace period state — still premium", () => {
    setSimMode(KEY, "grace");
    const result = getSimulatedPremiumOverride();
    expect(result!.isPremium).toBe(true);
    expect(result!.subscriptionStatus).toBe("past_due");
  });

  it("covers all entitlement states with correct premium mapping", () => {
    const premiumStates = ["trial", "active", "cancelled", "grace"];
    const freeStates = ["free", "expired"];

    premiumStates.forEach((state) => {
      setSimMode(KEY, state);
      expect(getSimulatedPremiumOverride()!.isPremium).toBe(true);
    });

    freeStates.forEach((state) => {
      setSimMode(KEY, state);
      expect(getSimulatedPremiumOverride()!.isPremium).toBe(false);
    });
  });
});
