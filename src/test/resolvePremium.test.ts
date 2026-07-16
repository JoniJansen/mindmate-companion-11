import { describe, it, expect } from "vitest";
import { resolvePremium, type ResolvePremiumInput } from "@/lib/resolvePremium";

/**
 * Base input where no premium source is active. Individual tests override
 * fields to drive specific priority paths.
 */
const noPremium: ResolvePremiumInput = {
  isDemoMode: false,
  isRevenueCatPremium: false,
  serverVerifiedPremium: false,
  simOverride: null,
  currentPlanType: null,
  currentSubscriptionStatus: null,
};

describe("resolvePremium — Priority rules (Elite-Audit #8)", () => {
  it("returns non-premium when nothing indicates premium", () => {
    const result = resolvePremium(noPremium);
    expect(result.isPremium).toBe(false);
  });

  it("returns premium when RevenueCat entitlement is true", () => {
    const result = resolvePremium({ ...noPremium, isRevenueCatPremium: true });
    expect(result.isPremium).toBe(true);
  });

  it("returns premium when server-verified subscription is true", () => {
    const result = resolvePremium({ ...noPremium, serverVerifiedPremium: true });
    expect(result.isPremium).toBe(true);
  });

  it("treats serverVerifiedPremium === null (not-checked-yet) as non-premium", () => {
    // null != true — we must not grant premium before the check completes
    const result = resolvePremium({ ...noPremium, serverVerifiedPremium: null });
    expect(result.isPremium).toBe(false);
  });

  it("returns premium if EITHER RevenueCat OR server is true", () => {
    const rcOnly = resolvePremium({ ...noPremium, isRevenueCatPremium: true, serverVerifiedPremium: false });
    const serverOnly = resolvePremium({ ...noPremium, isRevenueCatPremium: false, serverVerifiedPremium: true });
    expect(rcOnly.isPremium).toBe(true);
    expect(serverOnly.isPremium).toBe(true);
  });
});

describe("resolvePremium — Demo mode is a hard override (App-Review path)", () => {
  it("returns non-premium in demo mode even if RevenueCat says premium", () => {
    // Apple reviewer must never see premium features regardless of any signal
    const result = resolvePremium({
      ...noPremium,
      isDemoMode: true,
      isRevenueCatPremium: true,
    });
    expect(result.isPremium).toBe(false);
  });

  it("returns non-premium in demo mode even if server says premium", () => {
    const result = resolvePremium({
      ...noPremium,
      isDemoMode: true,
      serverVerifiedPremium: true,
    });
    expect(result.isPremium).toBe(false);
  });
});

describe("resolvePremium — Simulator override wins over everything (DEV only)", () => {
  it("simulator premium=true overrides demo mode (DEV can force premium for testing)", () => {
    // Simulator is DEV-only and its purpose is to bypass gates for local testing.
    const result = resolvePremium({
      ...noPremium,
      isDemoMode: true,
      simOverride: { isPremium: true, planType: "monthly", subscriptionStatus: "active" },
    });
    expect(result.isPremium).toBe(true);
    expect(result.planType).toBe("monthly");
  });

  it("simulator premium=false overrides real premium (DEV can force non-premium)", () => {
    const result = resolvePremium({
      ...noPremium,
      isRevenueCatPremium: true,
      serverVerifiedPremium: true,
      simOverride: { isPremium: false, planType: null, subscriptionStatus: null },
    });
    expect(result.isPremium).toBe(false);
  });

  it("simulator supplies its own planType and subscriptionStatus", () => {
    const result = resolvePremium({
      ...noPremium,
      currentPlanType: "yearly",
      currentSubscriptionStatus: "active",
      simOverride: { isPremium: true, planType: "monthly", subscriptionStatus: "trialing" },
    });
    expect(result.planType).toBe("monthly");
    expect(result.subscriptionStatus).toBe("trialing");
  });
});

describe("resolvePremium — Cache is NEVER a premium source (load-bearing invariant)", () => {
  // The single most important invariant: someone editing localStorage or
  // Chrome DevTools must not be able to grant themselves premium. Cached
  // planType/subscriptionStatus are just labels; only isRevenueCatPremium
  // and serverVerifiedPremium can authorize.

  it("having a cached planType does NOT grant premium", () => {
    const result = resolvePremium({
      ...noPremium,
      currentPlanType: "yearly",
    });
    expect(result.isPremium).toBe(false);
  });

  it("having a cached subscriptionStatus=active does NOT grant premium", () => {
    const result = resolvePremium({
      ...noPremium,
      currentSubscriptionStatus: "active",
    });
    expect(result.isPremium).toBe(false);
  });

  it("cache label passes through even when non-premium (UX display)", () => {
    // Cache is for showing 'you were on plan X' UI text, not authorization
    const result = resolvePremium({
      ...noPremium,
      currentPlanType: "monthly",
      currentSubscriptionStatus: "expired",
    });
    expect(result.isPremium).toBe(false);
    expect(result.planType).toBe("monthly");
    expect(result.subscriptionStatus).toBe("expired");
  });
});

describe("resolvePremium — Determinism (pure function)", () => {
  it("same input always yields same output", () => {
    const input: ResolvePremiumInput = {
      isDemoMode: false,
      isRevenueCatPremium: true,
      serverVerifiedPremium: false,
      simOverride: null,
      currentPlanType: "monthly",
      currentSubscriptionStatus: "active",
    };
    const a = resolvePremium(input);
    const b = resolvePremium(input);
    expect(a).toEqual(b);
  });

  it("does not mutate its input", () => {
    const input: ResolvePremiumInput = {
      isDemoMode: false,
      isRevenueCatPremium: false,
      serverVerifiedPremium: true,
      simOverride: { isPremium: true, planType: "yearly", subscriptionStatus: "active" },
      currentPlanType: "monthly",
      currentSubscriptionStatus: "active",
    };
    const snapshot = JSON.parse(JSON.stringify(input));
    resolvePremium(input);
    expect(input).toEqual(snapshot);
  });
});
