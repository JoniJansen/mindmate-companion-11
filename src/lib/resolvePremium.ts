/**
 * resolvePremium — pure function that combines all premium-status inputs
 * into a final premium decision. Extracted from usePremium.ts so we can
 * unit-test the priority rules without mounting the whole hook.
 *
 * Priority (highest first):
 *   1. Simulator override (DEV only) — full override of everything
 *   2. Demo mode — hard force to non-premium (Apple reviewer path)
 *   3. RevenueCat entitlement (native IAP source of truth)
 *   4. Server-verified backend subscription (Stripe / server sync)
 *
 * localStorage cache is NOT an input here — cache is UX only, never
 * authorizes premium. This is a load-bearing invariant: if cache could
 * authorize, we would grant premium to anyone who edited localStorage.
 *
 * Elite-Audit #8: this used to be inline in the hook and had no test
 * coverage despite being revenue- and review-critical.
 */

export interface SimOverride {
  isPremium: boolean;
  planType: string | null;
  subscriptionStatus: string | null;
}

export interface ResolvePremiumInput {
  /** Demo mode = Apple reviewer session; must never see premium. */
  isDemoMode: boolean;
  /** RevenueCat SDK's server-validated entitlement (native IAPs). */
  isRevenueCatPremium: boolean;
  /** Backend-verified subscription status (Stripe / server sync). null = not checked yet. */
  serverVerifiedPremium: boolean | null;
  /** DEV-only simulator override; null in production. */
  simOverride: SimOverride | null;
  /** Cached plan type from last successful server check. */
  currentPlanType: string | null;
  /** Cached subscription status from last successful server check. */
  currentSubscriptionStatus: string | null;
}

export interface PremiumResolution {
  isPremium: boolean;
  planType: string | null;
  subscriptionStatus: string | null;
}

export function resolvePremium(input: ResolvePremiumInput): PremiumResolution {
  // 1. Simulator wins everything (DEV only)
  if (input.simOverride !== null) {
    return {
      isPremium: input.simOverride.isPremium,
      planType: input.simOverride.planType,
      subscriptionStatus: input.simOverride.subscriptionStatus,
    };
  }

  // 2. Demo mode = never premium (reviewer path)
  if (input.isDemoMode) {
    return {
      isPremium: false,
      planType: input.currentPlanType,
      subscriptionStatus: input.currentSubscriptionStatus,
    };
  }

  // 3+4. RevenueCat OR server-verified backend
  const verifiedPremium =
    input.isRevenueCatPremium || input.serverVerifiedPremium === true;

  return {
    isPremium: verifiedPremium,
    planType: input.currentPlanType,
    subscriptionStatus: input.currentSubscriptionStatus,
  };
}
