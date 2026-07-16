// src/lib/purchases.ts
//
// Subscription payments, via RevenueCat (react-native-purchases).
//
// Why RevenueCat and not a payment processor like Paystack/Flutterwave
// (already used elsewhere in Joel's other apps): Apple's App Store Review
// Guideline 3.1.1 and Google Play's equivalent policy require that any
// subscription unlocking digital app functionality — which is exactly
// what premium cloud backup is — go through the platform's own in-app
// purchase system (StoreKit / Play Billing), not a third-party processor.
// RevenueCat is the standard way to do that: it wraps both platforms'
// native purchase APIs behind one interface, handles receipt validation,
// and gives a single "entitlement" concept to check against instead of
// reimplementing subscription-state bookkeeping by hand.
//
// This is a NATIVE module (not just JS) — it requires a custom dev client
// build to actually run, which this project already uses (expo-dev-client
// is already a dependency). It will not work in plain Expo Go.
//
// ENTITLEMENT: everything here checks a single entitlement identifier,
// "premium_backup", which must be created in the RevenueCat dashboard and
// attached to whatever App Store Connect / Play Console subscription
// products are set up there (e.g. monthly + annual). None of that
// dashboard configuration can be done from here — see PHASE_3_NOTES.md
// for the full list of what's left as a manual setup step.
import { Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";
import { logError, logMessage } from "@/lib/monitoring";

export const PREMIUM_ENTITLEMENT_ID = "premium_backup";

// Public (client-safe) API keys — RevenueCat's are designed to be
// embedded in the client, unlike a secret key. Set these as EAS
// build-time env vars (EXPO_PUBLIC_REVENUECAT_IOS_API_KEY /
// EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY); until they're set, purchases
// are simply unavailable and the app treats everyone as free tier rather
// than crashing.
const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? "";
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? "";

let configured = false;

export function isPurchasesConfigured(): boolean {
  return configured;
}

/**
 * Call once, after a user signs in (see app/_layout.tsx). Using the
 * Supabase user id as RevenueCat's appUserID keeps the two systems
 * referring to the same person without a separate mapping table — the
 * webhook (supabase/functions/revenuecat-webhook) relies on this.
 */
export async function initPurchases(userId: string): Promise<void> {
  const apiKey = Platform.OS === "ios" ? IOS_API_KEY : ANDROID_API_KEY;

  if (!apiKey) {
    if (__DEV__) {
      console.warn(
        "RevenueCat API key not set — subscriptions are disabled. Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY."
      );
    }
    return;
  }

  try {
    if (!configured) {
      Purchases.configure({ apiKey, appUserID: userId });
      configured = true;
    } else {
      // Already configured for a different session (e.g. a previous
      // user on a shared device) — re-link to this user.
      await Purchases.logIn(userId);
    }
  } catch (error) {
    logError(error, { where: "initPurchases" });
  }
}

/** Call on sign-out so the next sign-in doesn't inherit this user's cached entitlement state. */
export async function resetPurchasesUser(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch (error) {
    logError(error, { where: "resetPurchasesUser" });
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    logError(error, { where: "getCustomerInfo" });
    return null;
  }
}

export function hasActiveEntitlement(info: CustomerInfo | null): boolean {
  if (!info) return false;
  return Boolean(info.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
}

/** The current offering's packages (e.g. Monthly, Annual) for the paywall to render. */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    logError(error, { where: "getCurrentOffering" });
    return null;
  }
}

export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ success: boolean; customerInfo?: CustomerInfo; userCancelled?: boolean; error?: string }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    logMessage("Purchase completed", { productId: pkg.product.identifier });
    return { success: hasActiveEntitlement(customerInfo), customerInfo };
  } catch (error: any) {
    if (error?.userCancelled) {
      return { success: false, userCancelled: true };
    }
    logError(error, { where: "purchasePackage" });
    return { success: false, error: error?.message ?? "Purchase failed. Please try again." };
  }
}

export async function restorePurchases(): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> {
  if (!configured) {
    return { success: false, error: "Purchases aren't available right now." };
  }
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { success: hasActiveEntitlement(customerInfo), customerInfo };
  } catch (error: any) {
    logError(error, { where: "restorePurchases" });
    return { success: false, error: error?.message ?? "Restore failed. Please try again." };
  }
}

/**
 * Plain-async entitlement check for code that isn't a React component
 * (the background backup task, maybeAutoBackup's launch-time check) —
 * mirrors the fallback logic in useSubscription so both agree on the
 * answer. Checks RevenueCat first; if it's not configured in this
 * environment, falls back to the webhook-synced Supabase columns.
 */
export async function checkPremiumEntitlement(userId: string): Promise<boolean> {
  if (configured) {
    const info = await getCustomerInfo();
    return hasActiveEntitlement(info);
  }

  try {
    const { supabase } = await import("@/lib/supabase");
    const { data } = await supabase
      .from("profiles")
      .select("subscription_tier, subscription_status")
      .eq("id", userId)
      .maybeSingle();
    return (data?.subscription_tier ?? "free") !== "free" && (data?.subscription_status ?? "none") === "active";
  } catch (error) {
    logError(error, { where: "checkPremiumEntitlement" });
    return false;
  }
}
