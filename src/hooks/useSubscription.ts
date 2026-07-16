// src/hooks/useSubscription.ts
//
// Reads real subscription/entitlement state. There are two sources,
// deliberately used for different things:
//
// 1. RevenueCat's on-device CustomerInfo (src/lib/purchases.ts) — the
//    authoritative, real-time answer to "does this device's signed-in
//    user currently have the premium_backup entitlement?" This is what
//    actually gates the app's UI.
// 2. `profiles.subscription_tier` / `subscription_status` in Supabase —
//    kept in sync by supabase/functions/revenuecat-webhook whenever
//    RevenueCat sends a purchase/renewal/cancellation event server-side.
//    This is what the rest of the backend (or a future admin view) can
//    read without needing device-side RevenueCat access, and it's the
//    fallback used here if RevenueCat isn't configured yet (e.g. no API
//    key set for this environment) or a customer-info fetch fails.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { logError } from "@/lib/monitoring";
import {
  getCustomerInfo,
  hasActiveEntitlement,
  isPurchasesConfigured,
} from "@/lib/purchases";

export type SubscriptionTier = "free" | "backup_monthly" | "backup_annual";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "none";

interface SubscriptionState {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  isPremium: boolean;
  loading: boolean;
}

export function useSubscription(userId: string | null) {
  const [state, setState] = useState<SubscriptionState>({
    tier: "free",
    status: "active",
    isPremium: false,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!userId) {
      setState({ tier: "free", status: "active", isPremium: false, loading: false });
      return;
    }

    setState((s) => ({ ...s, loading: true }));

    // Fall back values from the Supabase-side record — always fetched,
    // since it's also what populates `tier` for display purposes (e.g.
    // "Backup Monthly" vs "Backup Annual") even when RevenueCat is the
    // one deciding `isPremium`.
    let tier: SubscriptionTier = "free";
    let status: SubscriptionStatus = "active";

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_tier, subscription_status")
        .eq("id", userId)
        .maybeSingle();

      if (error) logError(error, { where: "useSubscription: profile fetch" });
      tier = (data?.subscription_tier as SubscriptionTier) ?? "free";
      status = (data?.subscription_status as SubscriptionStatus) ?? "active";
    } catch (error) {
      logError(error, { where: "useSubscription: profile fetch" });
    }

    let isPremium: boolean;
    if (isPurchasesConfigured()) {
      const info = await getCustomerInfo();
      isPremium = hasActiveEntitlement(info);
    } else {
      // No RevenueCat API key set in this environment — trust the
      // webhook-synced database record instead of hard-blocking the
      // feature during development/testing.
      isPremium = tier !== "free" && status === "active";
    }

    setState({ tier, status, isPremium, loading: false });
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
