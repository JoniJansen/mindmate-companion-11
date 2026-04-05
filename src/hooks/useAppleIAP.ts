import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Product IDs matching App Store Connect configuration
export const APPLE_PRODUCTS = {
  MONTHLY: 'de.soulvay.app.plus.monthly',
  YEARLY: 'de.soulvay.app.plus.yearly',
} as const;

interface AppleProduct {
  productId: string;
  localizedTitle: string;
  localizedDescription: string;
  price: string;
  priceLocale: string;
}

interface AppleTransaction {
  transactionId: string;
  productId: string;
  receiptData: string;
}

interface UseAppleIAPReturn {
  isAvailable: boolean;
  isLoading: boolean;
  products: AppleProduct[];
  hasRestoredOnce: boolean;
  purchaseProduct: (productId: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  verifyReceipt: (receiptData: string) => Promise<boolean>;
  autoRestoreOnAppStart: () => Promise<void>;
}

// Check if running in Capacitor iOS environment
const isCapacitorIOS = (): boolean => {
  return typeof window !== 'undefined' && 
    'Capacitor' in window && 
    (window as any).Capacitor?.getPlatform?.() === 'ios';
};

// Auto-restore check key
const AUTO_RESTORE_KEY = 'soulvay_ios_auto_restored';
const AUTO_RESTORE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

// Access native StoreKit plugin via Capacitor
const getStoreKitPlugin = (): any | null => {
  if (!isCapacitorIOS()) return null;
  try {
    const Capacitor = (window as any).Capacitor;
    if (Capacitor?.Plugins?.StoreKit) {
      return Capacitor.Plugins.StoreKit;
    }
    // Fallback: try registerPlugin pattern
    if (Capacitor?.registerPlugin) {
      return Capacitor.registerPlugin('StoreKit');
    }
  } catch (e) {
    console.warn('StoreKit plugin not available:', e);
  }
  return null;
};

// StoreKit bridge - calls native iOS StoreKit via Capacitor plugin
const StoreKitBridge = {
  isAvailable: async (): Promise<boolean> => {
    if (!isCapacitorIOS()) return false;
    const plugin = getStoreKitPlugin();
    if (!plugin) return false;
    try {
      const result = await plugin.isAvailable();
      return result?.available === true;
    } catch (e) {
      console.warn('StoreKit availability check failed:', e);
      return false;
    }
  },
  
  getProducts: async (productIds: string[]): Promise<AppleProduct[]> => {
    const plugin = getStoreKitPlugin();
    if (!plugin) return [];
    try {
      const result = await plugin.getProducts({ productIds });
      return result?.products || [];
    } catch (e) {
      console.error('StoreKit: Failed to fetch products', e);
      return [];
    }
  },
  
  purchaseProduct: async (productId: string): Promise<AppleTransaction | null> => {
    const plugin = getStoreKitPlugin();
    if (!plugin) {
      console.error('StoreKit plugin not available for purchase');
      return null;
    }
    try {
      const result = await plugin.purchaseProduct({ productId });
      if (result?.success) {
        return {
          transactionId: result.transactionId,
          productId: result.productId,
          receiptData: result.receiptData || '',
        };
      }
      // User cancelled
      if (result?.cancelled) {
        return null;
      }
      return null;
    } catch (e) {
      console.error('StoreKit: Purchase failed', e);
      throw e;
    }
  },
  
  restorePurchases: async (): Promise<AppleTransaction[]> => {
    const plugin = getStoreKitPlugin();
    if (!plugin) return [];
    try {
      const result = await plugin.restorePurchases();
      return result?.transactions || [];
    } catch (e) {
      console.error('StoreKit: Restore failed', e);
      return [];
    }
  },
  
  getReceipt: async (): Promise<string | null> => {
    const plugin = getStoreKitPlugin();
    if (!plugin) return null;
    try {
      const result = await plugin.restorePurchases();
      return result?.receiptData || null;
    } catch (e) {
      console.error('StoreKit: Failed to get receipt', e);
      return null;
    }
  },
};

export const useAppleIAP = (): UseAppleIAPReturn => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<AppleProduct[]>([]);
  const [hasRestoredOnce, setHasRestoredOnce] = useState(false);
  const { toast } = useToast();
  const hasCheckedRef = useRef(false);

  // Verify receipt with backend
  const verifyReceipt = useCallback(async (receiptData: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-apple-receipt', {
        body: { receiptData },
      });

      if (error) throw error;

      if (data?.success && data?.isActive) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Receipt verification failed:', error);
      return false;
    }
  }, []);

  // Auto-restore on app start - silent check for existing subscription
  const autoRestoreOnAppStart = useCallback(async () => {
    if (!isAvailable || hasCheckedRef.current) return;
    
    hasCheckedRef.current = true;

    try {
      // Check if we've restored recently
      const lastRestore = localStorage.getItem(AUTO_RESTORE_KEY);
      if (lastRestore) {
        const lastRestoreTime = parseInt(lastRestore, 10);
        if (Date.now() - lastRestoreTime < AUTO_RESTORE_INTERVAL) {
          if (import.meta.env.DEV) console.log('StoreKit: Skipping auto-restore, restored recently');
          return;
        }
      }

      if (import.meta.env.DEV) console.log('StoreKit: Auto-restoring purchases on app start');
      const receiptData = await StoreKitBridge.getReceipt();
      
      if (receiptData) {
        const verified = await verifyReceipt(receiptData);
        if (verified) {
          if (import.meta.env.DEV) console.log('StoreKit: Auto-restore successful, subscription active');
          setHasRestoredOnce(true);
          localStorage.setItem(AUTO_RESTORE_KEY, Date.now().toString());
        }
      }
    } catch (error) {
      console.error('Auto-restore failed:', error);
      // Silent failure - don't show toast on auto-restore
    }
  }, [isAvailable, verifyReceipt]);

  // Check availability and auto-restore on mount
  useEffect(() => {
    const initializeIAP = async () => {
      const available = await StoreKitBridge.isAvailable();
      setIsAvailable(available);
      
      if (available) {
        // Fetch products from App Store
        const productIds = Object.values(APPLE_PRODUCTS);
        const fetchedProducts = await StoreKitBridge.getProducts(productIds);
        setProducts(fetchedProducts);
        
        // Auto-restore on app start
        await autoRestoreOnAppStart();
      }
    };
    
    initializeIAP();
  }, [autoRestoreOnAppStart]);

  const purchaseProduct = useCallback(async (productId: string): Promise<boolean> => {
    if (!isAvailable) {
      toast({
        title: 'Nicht verfügbar',
        description: 'In-App-Käufe sind nur in der App verfügbar',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);
    
    try {
      const transaction = await StoreKitBridge.purchaseProduct(productId);
      
      if (transaction?.receiptData) {
        const verified = await verifyReceipt(transaction.receiptData);
        if (verified) {
          toast({
            title: 'Abo aktiviert',
            description: 'Dein Soulvay Plus Abo ist jetzt aktiv!',
          });
          localStorage.setItem(AUTO_RESTORE_KEY, Date.now().toString());
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Purchase failed:', error);
      toast({
        title: 'Kauf fehlgeschlagen',
        description: 'Der Kauf konnte nicht abgeschlossen werden',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, verifyReceipt, toast]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) {
      toast({
        title: 'Nicht verfügbar',
        description: 'Diese Funktion ist nur in der App verfügbar',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);
    
    try {
      const receiptData = await StoreKitBridge.getReceipt();
      
      if (receiptData) {
        const verified = await verifyReceipt(receiptData);
        if (verified) {
          toast({
            title: 'Käufe wiederhergestellt',
            description: 'Dein Abo wurde erfolgreich wiederhergestellt',
          });
          setHasRestoredOnce(true);
          localStorage.setItem(AUTO_RESTORE_KEY, Date.now().toString());
          return true;
        }
      }
      
      toast({
        title: 'Keine Käufe gefunden',
        description: 'Es wurden keine vorherigen Käufe gefunden',
      });
      return false;
    } catch (error) {
      console.error('Restore failed:', error);
      toast({
        title: 'Fehler',
        description: 'Käufe konnten nicht wiederhergestellt werden',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, verifyReceipt, toast]);

  return {
    isAvailable,
    isLoading,
    products,
    hasRestoredOnce,
    purchaseProduct,
    restorePurchases,
    verifyReceipt,
    autoRestoreOnAppStart,
  };
};
