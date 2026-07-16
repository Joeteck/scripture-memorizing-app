// app/backup.tsx — Settings > Backup & Restore
//
// The premium value proposition lives here: the core memorization
// experience is free and fully offline (see src/hooks/useVerses.ts), and
// what this screen sells is *disaster recovery* — an encrypted copy of
// your data safely in the cloud, restorable on a new or reinstalled
// device. Every actual cloud action below (enable, back up, restore,
// scheduled backups) is gated behind `isPremium` from useSubscription —
// a non-subscriber can see and explore this whole screen, but tapping
// any of those routes them to app/paywall.tsx first. See src/lib/purchases.ts
// for how entitlement is actually determined.
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, Switch, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, type, spacing } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useVerses } from "@/hooks/useVerses";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/lib/toast";
import { useConfirm } from "@/lib/confirm";
import { logError } from "@/lib/monitoring";
import {
  backupNow,
  restoreLatestBackup,
  enableBackup,
  disableBackup,
  setFrequency,
  getSettings,
  isPassphraseProtected,
  setPassphraseProtected,
} from "@/lib/backup";
import {
  registerBackgroundBackupTask,
  unregisterBackgroundBackupTask,
} from "@/lib/backgroundBackup";
import { BackupFrequency } from "@/lib/preferences";

import { CategoryPill } from "@/components/CategoryPill";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ModalHeader } from "@/components/ModalHeader";

const FREQUENCY_OPTIONS: { label: string; value: BackupFrequency }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

function formatLastBackup(iso: string | null): string {
  if (!iso) return "Never backed up";
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return `Today at ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function BackupScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { refresh: refreshVerses } = useVerses(user?.id ?? null);
  const { isPremium, loading: subscriptionLoading } = useSubscription(user?.id ?? null);
  const toast = useToast();
  const confirm = useConfirm();

  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequencyState] = useState<BackupFrequency>("weekly");
  const [lastBackupAt, setLastBackupAtState] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [togglingEnabled, setTogglingEnabled] = useState(false);
  const [passphraseProtected, setPassphraseProtectedState] = useState(false);
  const [passphrase, setPassphrase] = useState("");

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const [settings, protectedFlag] = await Promise.all([getSettings(), isPassphraseProtected()]);
      setEnabled(settings.enabled);
      setFrequencyState(settings.frequency);
      setLastBackupAtState(settings.lastBackupAt);
      setPassphraseProtectedState(protectedFlag);
    } catch (e) {
      logError(e, { where: "backup screen: loadSettings" });
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  async function handleToggleEnabled(next: boolean) {
    if (!user) return;

    if (next && !isPremium) {
      router.push("/paywall");
      return;
    }

    setTogglingEnabled(true);
    try {
      if (next) {
        await enableBackup(user.id);
        await registerBackgroundBackupTask();
        toast.showSuccess("Cloud Backup Enabled", "Your verses will be backed up on your chosen schedule.");
      } else {
        await disableBackup(user.id);
        await unregisterBackgroundBackupTask();
        toast.showInfo("Cloud Backup Disabled", "Your data stays local. Existing backups aren't deleted.");
      }
      setEnabled(next);
    } catch (e) {
      logError(e, { where: "backup screen: toggle enabled" });
      toast.showError("Couldn't Update Setting", "Please try again.");
    } finally {
      setTogglingEnabled(false);
    }
  }

  async function handleSelectFrequency(value: BackupFrequency) {
    if (!user) return;
    setFrequencyState(value);
    try {
      await setFrequency(user.id, value);
    } catch (e) {
      logError(e, { where: "backup screen: set frequency" });
    }
  }

  async function handleTogglePassphraseProtected(next: boolean) {
    await setPassphraseProtected(next);
    setPassphraseProtectedState(next);
    setPassphrase("");
    if (next) {
      toast.showInfo(
        "Extra Protection Enabled",
        "Scheduled backups are paused — back up manually with your passphrase from now on."
      );
    }
  }

  async function handleBackupNow() {
    if (!user) return;
    if (!isPremium) {
      router.push("/paywall");
      return;
    }
    if (passphraseProtected && !passphrase.trim()) {
      toast.showError("Passphrase Required", "Enter your backup passphrase to continue.");
      return;
    }
    setBackingUp(true);
    try {
      const { verseCount } = await backupNow(user.id, passphraseProtected ? passphrase.trim() : undefined);
      setLastBackupAtState(new Date().toISOString());
      toast.showSuccess(
        "Backup Complete",
        verseCount === 1 ? "1 verse backed up." : `${verseCount} verses backed up.`
      );
    } catch (e: any) {
      logError(e, { where: "backup screen: backup now" });
      toast.showError("Backup Failed", e?.message ?? "Check your connection and try again.");
    } finally {
      setBackingUp(false);
    }
  }

  async function handleRestore() {
    if (!user) return;
    if (!isPremium) {
      router.push("/paywall");
      return;
    }
    if (passphraseProtected && !passphrase.trim()) {
      toast.showError("Passphrase Required", "Enter your backup passphrase to continue.");
      return;
    }

    const ok = await confirm({
      title: "Restore Previous Backup?",
      message:
        "This replaces every verse and category on this device with what's in your last cloud backup. This can't be undone.",
      confirmLabel: "Restore",
      destructive: true,
      icon: "cloud-download-outline",
    });
    if (!ok) return;

    setRestoring(true);
    try {
      const { verseCount } = await restoreLatestBackup(
        user.id,
        passphraseProtected ? passphrase.trim() : undefined
      );
      await refreshVerses();
      toast.showSuccess(
        "Restore Complete",
        verseCount === 1 ? "1 verse restored." : `${verseCount} verses restored.`
      );
    } catch (e: any) {
      logError(e, { where: "backup screen: restore" });
      toast.showError("Restore Failed", e?.message ?? "Check your connection and try again.");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <ModalHeader title="Backup & Restore" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 60 }}>
        {/* How it works */}
        <View style={[styles.infoCard, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={theme.accent} />
          <Text style={[type.body, { color: theme.text, marginLeft: 10, flex: 1 }]}>
            Your verses live on this device and always work offline. Cloud backup is an optional,
            encrypted safety net — useful if you lose or switch devices.
          </Text>
        </View>

        {/* Premium status */}
        {!subscriptionLoading && !isPremium && (
          <Pressable
            onPress={() => router.push("/paywall")}
            style={[
              styles.infoCard,
              { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.accent, marginTop: 12 },
            ]}
          >
            <Ionicons name="sparkles-outline" size={20} color={theme.accent} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={[type.body, { color: theme.text, fontWeight: "700" }]}>
                Backup & Restore is a premium feature
              </Text>
              <Text style={[type.caption, { color: theme.textSecondary, marginTop: 2 }]}>
                Tap to see plans and subscribe.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.accent} />
          </Pressable>
        )}

        {/* Enable / disable */}
        <View style={[styles.card, { backgroundColor: theme.surface, marginTop: 18 }]}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.label, { color: theme.text }]}>Cloud Backup</Text>
              <Text style={[type.caption, { color: theme.textSecondary, marginTop: 2 }]}>
                {enabled ? "Enabled — backing up on your schedule" : "Disabled — data stays on this device only"}
              </Text>
            </View>
            {loadingSettings || togglingEnabled ? (
              <ActivityIndicator color={theme.accent} />
            ) : (
              <Switch
                value={enabled}
                onValueChange={handleToggleEnabled}
                trackColor={{ false: theme.border, true: theme.accent }}
                thumbColor="#fff"
              />
            )}
          </View>
        </View>

        {/* Frequency */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.label, { color: theme.text, marginBottom: 12 }]}>Backup Frequency</Text>
          <View style={styles.wrap}>
            {FREQUENCY_OPTIONS.map((opt) => (
              <CategoryPill
                key={opt.value}
                label={opt.label}
                color={theme.accent}
                selected={frequency === opt.value}
                onPress={() => handleSelectFrequency(opt.value)}
              />
            ))}
          </View>
        </View>

        {/* Last backup date */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={[styles.label, { color: theme.text }]}>Last Backup</Text>
              <Text style={[type.caption, { color: theme.textSecondary, marginTop: 2 }]}>
                {loadingSettings ? "Checking…" : formatLastBackup(lastBackupAt)}
              </Text>
            </View>
            <Ionicons name="time-outline" size={22} color={theme.textSecondary} />
          </View>
        </View>

        {/* Advanced: optional passphrase protection */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.label, { color: theme.text }]}>Extra Passphrase Protection</Text>
              <Text style={[type.caption, { color: theme.textSecondary, marginTop: 2 }]}>
                Advanced — encrypts backups with a passphrase only you know, instead of your account
                alone. Requires entering it for every backup/restore, so scheduled backups pause while
                this is on.
              </Text>
            </View>
            <Switch
              value={passphraseProtected}
              onValueChange={handleTogglePassphraseProtected}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor="#fff"
            />
          </View>

          {passphraseProtected && (
            <TextInput
              value={passphrase}
              onChangeText={setPassphrase}
              placeholder="Enter your backup passphrase"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Backup passphrase"
              style={[
                styles.passphraseInput,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
              ]}
            />
          )}
        </View>

        {/* Manual actions */}
        <PrimaryButton
          label="Back Up Now"
          onPress={handleBackupNow}
          loading={backingUp}
          style={{ marginTop: 8 }}
        />

        <Pressable
          onPress={handleRestore}
          disabled={restoring}
          style={[styles.restoreBtn, { borderColor: theme.border, opacity: restoring ? 0.6 : 1 }]}
        >
          {restoring ? (
            <ActivityIndicator color={theme.accent} />
          ) : (
            <>
              <Ionicons name="cloud-download-outline" size={18} color={theme.accent} />
              <Text style={[styles.restoreText, { color: theme.accent }]}>Restore Previous Backup</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  infoCard: { flexDirection: "row", alignItems: "flex-start", borderRadius: 16, padding: 16 },
  card: { borderRadius: 18, padding: 18, marginBottom: 18 },
  label: { fontSize: 16, fontWeight: "700" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  wrap: { flexDirection: "row", flexWrap: "wrap" },
  restoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  restoreText: { fontSize: 15, fontWeight: "700" },
  passphraseInput: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
});
