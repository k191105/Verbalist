/**
 * Purchases context: RevenueCat entitlement state, offerings, and actions.
 * Use isPro for gating; sync with Firestore for backend limits.
 */

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  useRef,
  type ReactNode,
} from "react";
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from "react-native-purchases";
import {
  configurePurchases,
  logInUser,
  logOutUser,
  getCurrentOffering,
  getCustomerInfo,
  addCustomerInfoListener,
  hasProEntitlement,
  findPackage,
  PACKAGE_IDS,
  ENTITLEMENT_ID,
} from "../services/purchases";
import { updateUserTier } from "../services/firestore";

interface PurchasesContextValue {
  isPro: boolean;
  customerInfo: CustomerInfo | null;
  offering: PurchasesOffering | null;
  loading: boolean;
  refresh: () => Promise<void>;
  getMonthlyPackage: () => PurchasesPackage | null;
  getYearlyPackage: () => PurchasesPackage | null;
}

const PurchasesContext = createContext<PurchasesContextValue | undefined>(undefined);

interface PurchasesProviderProps {
  children: ReactNode;
  userId: string | null;
}

export function PurchasesProvider({ children, userId }: PurchasesProviderProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [info, currOffering] = await Promise.all([
        getCustomerInfo(),
        getCurrentOffering(),
      ]);
      setCustomerInfo(info);
      setOffering(currOffering);
    } catch (e) {
      console.warn("[Purchases] refresh failed:", e);
    }
  }, []);

  useEffect(() => {
    configurePurchases(userId);
  }, []);

  useEffect(() => {
    if (!userId) {
      logOutUser()
        .then(() => {
          setCustomerInfo(null);
          setOffering(null);
          userIdRef.current = null;
        })
        .catch(console.warn)
        .finally(() => setLoading(false));
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        await logInUser(userId);
        if (cancelled) return;
        await refresh();
      } catch (e) {
        if (!cancelled) console.warn("[Purchases] logIn failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    userIdRef.current = userId;
    return () => {
      cancelled = true;
    };
  }, [userId, refresh]);

  useEffect(() => {
    const remove = addCustomerInfoListener((info) => {
      setCustomerInfo(info);
    });
    return remove;
  }, []);

  const syncTierToFirestore = useCallback(async (isPro: boolean) => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      await updateUserTier(uid, isPro ? "premium" : "free");
    } catch (e) {
      console.warn("[Purchases] sync tier to Firestore failed:", e);
    }
  }, []);

  const isPro = hasProEntitlement(customerInfo);

  useEffect(() => {
    if (userId && !loading) {
      syncTierToFirestore(isPro);
    }
  }, [isPro, userId, loading, syncTierToFirestore]);

  const getMonthlyPackage = useCallback(() => {
    return offering?.monthly ?? findPackage(offering, PACKAGE_IDS.MONTHLY) ?? findPackage(offering, "$rc_monthly");
  }, [offering]);
  const getYearlyPackage = useCallback(() => {
    return offering?.annual ?? findPackage(offering, PACKAGE_IDS.YEARLY) ?? findPackage(offering, "$rc_annual");
  }, [offering]);

  const value: PurchasesContextValue = {
    isPro,
    customerInfo,
    offering,
    loading,
    refresh,
    getMonthlyPackage,
    getYearlyPackage,
  };

  return (
    <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>
  );
}

export function usePurchases() {
  const context = useContext(PurchasesContext);
  if (context === undefined) {
    throw new Error("usePurchases must be used within a PurchasesProvider");
  }
  return context;
}

export { ENTITLEMENT_ID };
