// app/paywall.tsx
//
// Where a user actually subscribes. Reached from app/backup.tsx whenever
// a non-premium user tries to use a real cloud action (enable backup,
// back up now, restore, turn on scheduled backups) — see the gating
// there. Packages/pricing come entirely from RevenueCat's current
// offering, which in turn reflects whatever subscription products are
// configured in App Store Connect / Play Console — nothing here is
// hardcoded pricing.
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { PurchasesPackage } from "react-native-purchases";

import { useTheme, type } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/lib/toast";
import { logError } from "@/lib/monitoring";
import {
  getCurrentOffering,
  purchasePackage,
  restorePurchases,
  isPurchasesConfigured,
} from "@/lib/purchases";

import { PrimaryButton } from "@/components/PrimaryButton";

const BENEFITS = [
  { icon: "cloud-upload-outline" as const, text: "Automatic encrypted backups on your schedule" },
  { icon: "phone-portrait-outline" as const, text: "Restore everything on a new or reinstalled device" },
  { icon: "lock-closed-outline" as const, text: "Optional passphrase for extra-strong encryption" },
  { icon: "infinite-outline" as const, text: "Unlimited verses and categories, backed up" },
];

export default function PaywallScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [loadingOffering, setLoadingOffering] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const loadOffering = useCallback(async () => {
    setLoadingOffering(true);
    try {
      const offering = await getCurrentOffering();
      const pkgs = offering?.availablePackages ?? [];
      setPackages(pkgs);
      setSelected(pkgs[0] ?? null);
    } catch (e) {
      logError(e, { where: "paywall: loadOffering" });
    } finally {
      setLoadingOffering(false);
    }
  }, []);

  useEffect(() => {
    loadOffering();
  }, [loadOffering]);

  async function handleSubscribe() {
    if (!selected) return;
    setPurchasing(true);
    try {
      const result = await purchasePackage(selected);
      if (result.success) {
        toast.showSuccess("You're Premium!", "Cloud backup is ready to set up.");
        router.back();
      } else if (!result.userCancelled) {
        toast.showError("Purchase Failed", result.error ?? "Please try again.");
      }
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.success) {
        toast.showSuccess("Purchases Restored", "Your premium backup is active again.");
        router.back();
      } else {
        toast.showError("Nothing to Restore", result.error ?? "No previous purchase was found.");
      }
    } finally {
      setRestoring(false);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={[styles.closeBtn, { backgroundColor: theme.accentSoft }]}
        >
          <Ionicons name="close" size={20} color={theme.accent} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 60 }}>
        <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="shield-checkmark" size={32} color={theme.accent} />
        </View>
        <Text style={[type.screenTitle, { color: theme.text, textAlign: "center", marginTop: 16 }]}>
          Premium Backup
        </Text>
        <Text style={[type.body, { color: theme.textSecondary, textAlign: "center", marginTop: 8 }]}>
          Memorizing is free, forever, fully offline. This unlocks encrypted cloud backup — your safety
          net if you lose or switch devices.
        </Text>

        <View style={{ marginTop: 24 }}>
          {BENEFITS.map((b) => (
            <View key={b.text} style={styles.benefitRow}>
              <Ionicons name={b.icon} size={20} color={theme.accent} />
              <Text style={[type.body, { color: theme.text, marginLeft: 12, flex: 1 }]}>{b.text}</Text>
            </View>
          ))}
        </View>

        {!isPurchasesConfigured() ? (
          <View style={[styles.notice, { backgroundColor: theme.errorSurface, borderColor: theme.errorSoft }]}>
            <Ionicons name="information-circle-outline" size={18} color={theme.error} />
            <Text style={[type.caption, { color: theme.text, marginLeft: 8, flex: 1 }]}>
              Subscriptions aren't set up in this build yet — this screen previews the paywall UI, but
              purchases can't complete until App Store Connect / Play Console products and a RevenueCat
              API key are configured.
            </Text>
          </View>
        ) : loadingOffering ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 32 }} />
        ) : packages.length === 0 ? (
          <Text style={[type.body, { color: theme.textSecondary, textAlign: "center", marginTop: 24 }]}>
            No plans are available right now. Please try again later.
          </Text>
        ) : (
          <View style={{ marginTop: 24 }}>
            {packages.map((pkg) => {
              const isSelected = selected?.identifier === pkg.identifier;
              return (
                <Pressable
                  key={pkg.identifier}
                  onPress={() => setSelected(pkg)}
                  accessibilityRole="button"
                  accessibilityLabel={`${pkg.product.title}, ${pkg.product.priceString}`}
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.planCard,
                    {
                      borderColor: isSelected ? theme.accent : theme.border,
                      backgroundColor: isSelected ? theme.accentSoft : theme.surface,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planTitle, { color: theme.text }]}>{pkg.product.title}</Text>
                    {!!pkg.product.description && (
                      <Text style={[type.caption, { color: theme.textSecondary, marginTop: 2 }]}>
                        {pkg.product.description}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.planPrice, { color: theme.accent }]}>{pkg.product.priceString}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <PrimaryButton
          label="Subscribe"
          onPress={handleSubscribe}
          loading={purchasing}
          disabled={!selected || !isPurchasesConfigured()}
          style={{ marginTop: 20 }}
        />

        <Pressable onPress={handleRestore} disabled={restoring} style={styles.restoreLink}>
          {restoring ? (
            <ActivityIndicator color={theme.accent} size="small" />
          ) : (
            <Text style={[type.caption, { color: theme.accent, fontWeight: "700" }]}>
              Restore Previous Purchase
            </Text>
          )}
        </Pressable>

        <Text style={[type.caption, { color: theme.textSecondary, textAlign: "center", marginTop: 16 }]}>
          Cancel anytime from your {user ? "App Store or Play Store" : "device"} account settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 20, paddingBottom: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  benefitRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  notice: { flexDirection: "row", alignItems: "flex-start", borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 24 },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  planTitle: { fontSize: 16, fontWeight: "700" },
  planPrice: { fontSize: 16, fontWeight: "800" },
  restoreLink: { alignItems: "center", marginTop: 18, paddingVertical: 8 },
});
