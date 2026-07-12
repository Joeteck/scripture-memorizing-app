// app/backup.tsx — Settings > Backup & Restore
//
// The premium value proposition lives here: the core memorization
// experience is free and fully offline (see src/hooks/useVerses.ts), and
// what this screen sells is *disaster recovery* — an encrypted copy of
// your data safely in the cloud, restorable on a new or reinstalled
// device. Subscription gating for this isn't wired up yet (see
// subscription_tier on the profiles table in supabase/schema.sql for the
// column it'll read from), so today everyone can use it — the screen is
// built so adding a paywall later is a small change here, not a rewrite.
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, Switch, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, type, spacing } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useVerses } from "@/hooks/useVerses";
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
} from "@/lib/backup";
import { BackupFrequency } from "@/lib/preferences";

import { CategoryPill } from "@/components/CategoryPill";
import { PrimaryButton } from "@/components/PrimaryButton";

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
  const toast = useToast();
  const confirm = useConfirm();

  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequencyState] = useState<BackupFrequency>("weekly");
  const [lastBackupAt, setLastBackupAtState] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [togglingEnabled, setTogglingEnabled] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const settings = await getSettings();
      setEnabled(settings.enabled);
      setFrequencyState(settings.frequency);
      setLastBackupAtState(settings.lastBackupAt);
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
    setTogglingEnabled(true);
    try {
      if (next) {
        await enableBackup(user.id);
        toast.showSuccess("Cloud Backup Enabled", "Your verses will be backed up on your chosen schedule.");
      } else {
        await disableBackup(user.id);
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

  async function handleBackupNow() {
    if (!user) return;
    setBackingUp(true);
    try {
      const { verseCount } = await backupNow(user.id);
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
      const { verseCount } = await restoreLatestBackup(user.id);
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
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={[styles.backBtn, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="chevron-back" size={22} color={theme.accent} />
        </Pressable>
        <Text style={[type.screenTitle, { color: theme.text, marginLeft: 12 }]}>Backup & Restore</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 60 }}>
        {/* How it works */}
        <View style={[styles.infoCard, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={theme.accent} />
          <Text style={[type.body, { color: theme.text, marginLeft: 10, flex: 1 }]}>
            Your verses live on this device and always work offline. Cloud backup is an optional,
            encrypted safety net — useful if you lose or switch devices.
          </Text>
        </View>

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
  headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
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
});
