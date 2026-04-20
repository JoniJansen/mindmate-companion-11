import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// RevenueCat Product IDs - must match App Store Connect & RevenueCat Dashboard
// NOTE: historical product IDs used the "mindmate_plus_*" prefix (before the rename).
// Lookup is tolerant of both prefixes — see findPackageForPlan() below.
export const REVENUECAT_PRODUCTS = {
  MONTHLY: 'soulvay_plus_monthly',
  YEARLY: 'soulvay_plus_yearly',
} as const;

// Legacy product IDs kept for backwards compatibility with existing
// App Store Connect configuration.
export const LEGACY_REVENUECAT_PRODUCTS = {
  MONTHLY: 'mindmate_plus_monthly',
  YEARLY: 'mindmate_plus_yearly',
} as const;

// RevenueCat Entitlement ID - must match RevenueCat Dashboard
export const PREMIUM_ENTITLEMENT = 'premium';

/**
 * Find a RevenueCat package for a given plan type.
 * Tolerant of both the current ("soulvay_plus_*") and legacy ("mindmate_plus_*")
 * product-ID conventions, AND of package identifier naming in the RevenueCat
 * dashboard (e.g. "monthly", "$rc_monthly", "yearly", "$rc_annual").
 *
 * This is the single source of truth for matching plan -> package.
 */
export function findPackageForPlan(
  offerings: { availablePackages: Array<{ identifier: string; product: { identifier: string } }> } | null,
  plan: 'monthly' | 'yearly'
): any | null {
  if (!offerings?.availablePackages?.length) return null;

  const pkgs = offerings.availablePackages;

  // 1. Exact identifier match on package (most reliable)
  const packageIdentifierMatch = pkgs.find(
    (p) => p.identifier === plan ||
           p.identifier === `$rc_${plan}` ||
           (plan === 'yearly' && (p.identifier === '$rc_annual' || p.identifier === 'annual')) ||
           (plan === 'monthly' && p.identifier === '$rc_monthly'),
  );
  if (packageIdentifierMatch) return packageIdentifierMatch;

  // 2. Exact product identifier match (current or legacy ID)
  const currentId = plan === 'yearly' ? REVENUECAT_PRODUCTS.YEARLY : REVENUECAT_PRODUCTS.MONTHLY;
  const legacyId = plan === 'yearly' ? LEGACY_REVENUECAT_PRODUCTS.YEARLY : LEGACY_REVENUECAT_PRODUCTS.MONTHLY;
  const productIdentifierMatch = pkgs.find(
    (p) => p.product.identifier === currentId || p.product.identifier === legacyId,
  );
  if (productIdentifierMatch) return productIdentifierMatch;

  // 3. Substring match on product identifier (e.g. "…_monthly" anywhere)
  const substringMatch = pkgs.find((p) => p.product.identifier.toLowerCase().includes(plan));
  if (substringMatch) return substringMatch;

  // 4. If only one package is available, return it as a last resort
  if (pkgs.length === 1) return pkgs[0];

  return null;
}

interface Package {
  identifier: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    priceString: string;
    price: number;
  };
}

interface Offering {
  identifier: string;
  availablePackages: Package[];
}

interface CustomerInfo {
  entitlements: {
    active: {
      [key: string]: {
        identifier: string;
        isActive: boolean;
        willRenew: boolean;
        periodType: string;
        latestPurchaseDate: string;
        expirationDate: string | null;
        productIdentifier: string;
      };
    };
  };
  originalAppUserId: string;
  activeSubscriptions: string[];
}

interface UseRevenueCatReturn {
  isAvailable: boolean;
  isLoading: boolean;
  isPremium: boolean;
  offerings: Offering | null;
  customerInfo: CustomerInfo | null;
  purchasePackage: (packageToPurchase: Package) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  checkEntitlements: () => Promise<boolean>;
  syncSubscriptionToBackend: (customerInfo: CustomerInfo) => Promise<void>;
}

// Check if running in Capacitor iOS environment
const isCapacitorIOS = (): boolean => {
  return typeof window !== 'undefined' && 
    'Capacitor' in window && 
    (window as any).Capacitor?.getPlatform?.() === 'ios';
};

// Get RevenueCat Purchases plugin
const getPurchasesPlugin = async (): Promise<any | null> => {
  if (!isCapacitorIOS()) return null;
  try {
    // Dynamic import to avoid issues on web
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    return Purchases;
  } catch (e) {
    if (import.meta.env.DEV) console.warn('RevenueCat plugin not available:', e);
    return null;
  }
};

// RevenueCat Public API Key (safe to include in client code)
const REVENUECAT_PUBLIC_KEY = 'appl_VatNsFmCDlJPOPkBGnzmhHyZrYy';

export const useRevenueCat = (): UseRevenueCatReturn => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [offerings, setOfferings] = useState<Offering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const { toast } = useToast();
  const hasInitializedRef = useRef(false);
  const purchasesRef = useRef<any>(null);

  // Sync subscription status to backend
  const syncSubscriptionToBackend = useCallback(async (info: CustomerInfo) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const premiumEntitlement = info.entitlements.active[PREMIUM_ENTITLEMENT];
      const isActive = !!premiumEntitlement?.isActive;
      
      // Determine plan type from product identifier
      let planType = 'monthly';
      if (premiumEntitlement?.productIdentifier?.includes('yearly')) {
        planType = 'yearly';
      }

      const subscriptionData = {
        user_id: user.id,
        user_session_id: user.id,
        status: isActive ? 'active' : 'inactive',
        plan_type: planType,
        current_period_start: premiumEntitlement?.latestPurchaseDate || null,
        current_period_end: premiumEntitlement?.expirationDate || null,
        cancel_at_period_end: !premiumEntitlement?.willRenew,
        // Store RevenueCat identifiers
        stripe_customer_id: `rc_${info.originalAppUserId}`,
        stripe_subscription_id: `rc_sub_${premiumEntitlement?.productIdentifier || 'none'}`,
      };

      const { error } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData, { onConflict: 'user_id' });

      if (error) {
        if (import.meta.env.DEV) console.error('Failed to sync subscription:', error);
      } else {
        if (import.meta.env.DEV) console.log('Subscription synced to backend');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Sync subscription error:', error);
    }
  }, []);

  // Check if user has premium entitlement
  const checkEntitlements = useCallback(async (): Promise<boolean> => {
    if (!purchasesRef.current) return false;

    try {
      const { customerInfo: info } = await purchasesRef.current.getCustomerInfo();
      setCustomerInfo(info);
      
      const hasPremium = !!info.entitlements.active[PREMIUM_ENTITLEMENT];
      setIsPremium(hasPremium);
      
      if (hasPremium) {
        await syncSubscriptionToBackend(info);
      }
      
      return hasPremium;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to check entitlements:', error);
      return false;
    }
  }, [syncSubscriptionToBackend]);

  // Initialize RevenueCat
  useEffect(() => {
    const initializeRevenueCat = async () => {
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      const Purchases = await getPurchasesPlugin();
      if (!Purchases) {
        if (import.meta.env.DEV) console.log('RevenueCat: Not available (not on iOS)');
        return;
      }

      try {
        // Configure RevenueCat
        await Purchases.configure({
          apiKey: REVENUECAT_PUBLIC_KEY,
        });

        purchasesRef.current = Purchases;
        setIsAvailable(true);
        if (import.meta.env.DEV) console.log('RevenueCat: Initialized successfully');

        // Identify user with Supabase user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await Purchases.logIn({ appUserID: user.id });
          if (import.meta.env.DEV) console.log('RevenueCat: User identified:', user.id);
        }

        // Get offerings
        const { offerings: offeringsData } = await Purchases.getOfferings();
        if (offeringsData.current) {
          setOfferings(offeringsData.current);
          if (import.meta.env.DEV) console.log('RevenueCat: Offerings loaded');
        }

        // Check current entitlements
        await checkEntitlements();

      } catch (error) {
        if (import.meta.env.DEV) console.error('RevenueCat initialization failed:', error);
      }
    };

    initializeRevenueCat();
  }, [checkEntitlements]);

  // Purchase a package
  const purchasePackage = useCallback(async (packageToPurchase: Package): Promise<boolean> => {
    if (!purchasesRef.current) {
      toast({
        title: 'Nicht verfügbar',
        description: 'In-App-Käufe sind nur in der iOS App verfügbar',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);

    try {
      const { customerInfo: info } = await purchasesRef.current.purchasePackage({
        aPackage: packageToPurchase,
      });

      setCustomerInfo(info);
      
      const hasPremium = !!info.entitlements.active[PREMIUM_ENTITLEMENT];
      setIsPremium(hasPremium);

      if (hasPremium) {
        await syncSubscriptionToBackend(info);
        toast({
          title: 'Abo aktiviert',
          description: 'Dein Soulvay Plus Abo ist jetzt aktiv!',
        });
        return true;
      }

      return false;
    } catch (error: any) {
      // User cancelled
      if (error.code === 'PURCHASE_CANCELLED') {
        if (import.meta.env.DEV) console.log('Purchase cancelled by user');
        return false;
      }

      if (import.meta.env.DEV) console.error('Purchase failed:', error);
      toast({
        title: 'Kauf fehlgeschlagen',
        description: error.message || 'Der Kauf konnte nicht abgeschlossen werden',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [syncSubscriptionToBackend, toast]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!purchasesRef.current) {
      toast({
        title: 'Nicht verfügbar',
        description: 'Diese Funktion ist nur in der iOS App verfügbar',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);

    try {
      const { customerInfo: info } = await purchasesRef.current.restorePurchases();
      setCustomerInfo(info);

      const hasPremium = !!info.entitlements.active[PREMIUM_ENTITLEMENT];
      setIsPremium(hasPremium);

      if (hasPremium) {
        await syncSubscriptionToBackend(info);
        toast({
          title: 'Käufe wiederhergestellt',
          description: 'Dein Abo wurde erfolgreich wiederhergestellt',
        });
        return true;
      }

      toast({
        title: 'Keine Käufe gefunden',
        description: 'Es wurden keine vorherigen Käufe gefunden',
      });
      return false;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Restore failed:', error);
      toast({
        title: 'Fehler',
        description: 'Käufe konnten nicht wiederhergestellt werden',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [syncSubscriptionToBackend, toast]);

  return {
    isAvailable,
    isLoading,
    isPremium,
    offerings,
    customerInfo,
    purchasePackage,
    restorePurchases,
    checkEntitlements,
    syncSubscriptionToBackend,
  };
};
