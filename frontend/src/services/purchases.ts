/**
 * RevenueCat purchases service.
 * Handles subscription setup, offerings, purchases, and entitlement checks.
 */

import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
  type PurchasesOfferings,
  PURCHASES_ERROR_CODE,
} from "react-native-purchases";

export const REVENUECAT_API_KEY = "test_nTgRQDygsLKvSuAGTBMZXWDOEbK";
export const ENTITLEMENT_ID = "verbalist_pro";

/** Package identifiers expected in RevenueCat (configure in dashboard) */
export const PACKAGE_IDS = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const;

export type PackageType = keyof typeof PACKAGE_IDS;

let isConfigured = false;

/**
 * Configure RevenueCat. Call once at app startup, before any other Purchases calls.
 */
export function configurePurchases(appUserId?: string | null): void {
  if (isConfigured) return;

  Purchases.configure({
    apiKey: REVENUECAT_API_KEY,
    appUserID: appUserId ?? undefined,
  });
  isConfigured = true;
}

/**
 * Log in a user (e.g. Firebase UID). Call after auth state changes.
 * Links RevenueCat identity to your app user for cross-device sync.
 */
export async function logInUser(appUserId: string): Promise<{ customerInfo: CustomerInfo }> {
  const result = await Purchases.logIn(appUserId);
  return { customerInfo: result.customerInfo };
}

/**
 * Log out the current user. Call on sign out.
 */
export async function logOutUser(): Promise<CustomerInfo> {
  return Purchases.logOut();
}

/**
 * Get current offerings (products/packages from RevenueCat dashboard).
 */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (e) {
    console.warn("[Purchases] getOfferings failed:", e);
    return null;
  }
}

/**
 * Get the default/current offering.
 */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const offerings = await getOfferings();
  const current = offerings?.current;
  return current ?? null;
}

/**
 * Find package by identifier (monthly, yearly, or $rc_monthly, $rc_annual).
 */
export function findPackage(
  offering: PurchasesOffering | null,
  packageId: string
): PurchasesPackage | null {
  if (!offering?.availablePackages?.length) return null;
  const id = packageId.toLowerCase();
  return (
    offering.availablePackages.find(
      (pkg) =>
        pkg.identifier.toLowerCase() === id ||
        String(pkg.packageType).toLowerCase() === id ||
        (id === "yearly" && (pkg.packageType === "ANNUAL" || pkg.identifier.includes("annual")))
    ) ?? null
  );
}

/**
 * Purchase a package.
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ customerInfo: CustomerInfo }> {
  const result = await Purchases.purchasePackage(pkg);
  return { customerInfo: result.customerInfo };
}

/**
 * Restore previous purchases.
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

/**
 * Get current customer info.
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

/**
 * Check if the user has the Verbalist Pro entitlement.
 */
export function hasProEntitlement(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo) return false;
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
  return entitlement?.isActive === true;
}

/**
 * Subscribe to customer info updates (e.g. after purchase, restore, renewal).
 */
export function addCustomerInfoListener(
  listener: (info: CustomerInfo) => void
): () => void {
  const remove = Purchases.addCustomerInfoUpdateListener(listener);
  return remove;
}

/**
 * Check if an error is user cancellation (not a real failure).
 */
export function isUserCancelledError(error: unknown): boolean {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: string }).code;
    return code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
  }
  return false;
}
