import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Product IDs matching App Store Connect configuration
export const APPLE_PRODUCTS = {
  MONTHLY: 'de.mindmate.app.plus.monthly',
  YEARLY: 'de.mindmate.app.plus.yearly',
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
  purchaseProduct: (productId: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  verifyReceipt: (receiptData: string) => Promise<boolean>;
}

// Check if running in Capacitor iOS environment
const isCapacitorIOS = (): boolean => {
  return typeof window !== 'undefined' && 
    'Capacitor' in window && 
    (window as any).Capacitor?.getPlatform?.() === 'ios';
};

// Mock StoreKit bridge - will be replaced by actual Capacitor plugin
const StoreKitBridge = {
  isAvailable: async (): Promise<boolean> => {
    return isCapacitorIOS();
  },
  
  getProducts: async (productIds: string[]): Promise<AppleProduct[]> => {
    // This would be implemented by native StoreKit code
    console.log('StoreKit: Fetching products', productIds);
    return [];
  },
  
  purchaseProduct: async (productId: string): Promise<AppleTransaction | null> => {
    // This would trigger native StoreKit purchase flow
    console.log('StoreKit: Purchasing', productId);
    return null;
  },
  
  restorePurchases: async (): Promise<AppleTransaction[]> => {
    // This would restore previous purchases
    console.log('StoreKit: Restoring purchases');
    return [];
  },
  
  getReceipt: async (): Promise<string | null> => {
    // This would get the current receipt data
    console.log('StoreKit: Getting receipt');
    return null;
  },
};

export const useAppleIAP = (): UseAppleIAPReturn => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<AppleProduct[]>([]);
  const { toast } = useToast();

  // Check availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await StoreKitBridge.isAvailable();
      setIsAvailable(available);
      
      if (available) {
        // Fetch products from App Store
        const productIds = Object.values(APPLE_PRODUCTS);
        const fetchedProducts = await StoreKitBridge.getProducts(productIds);
        setProducts(fetchedProducts);
      }
    };
    
    checkAvailability();
  }, []);

  const verifyReceipt = useCallback(async (receiptData: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('verify-apple-receipt', {
        body: { receiptData, userId: user.id },
      });

      if (error) throw error;

      if (data?.success && data?.isActive) {
        toast({
          title: 'Abo aktiviert',
          description: 'Dein MindMate Plus Abo ist jetzt aktiv!',
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Receipt verification failed:', error);
      toast({
        title: 'Fehler',
        description: 'Abo-Verifizierung fehlgeschlagen',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const purchaseProduct = useCallback(async (productId: string): Promise<boolean> => {
    if (!isAvailable) {
      toast({
        title: 'Nicht verfügbar',
        description: 'In-App-Käufe sind nur in der iOS App verfügbar',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);
    
    try {
      const transaction = await StoreKitBridge.purchaseProduct(productId);
      
      if (transaction?.receiptData) {
        const verified = await verifyReceipt(transaction.receiptData);
        return verified;
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
        description: 'Diese Funktion ist nur in der iOS App verfügbar',
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
    purchaseProduct,
    restorePurchases,
    verifyReceipt,
  };
};
