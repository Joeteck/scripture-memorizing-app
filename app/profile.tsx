import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

import { useTheme, useThemeMode, type, spacing } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { getDefaultReminderInterval, setDefaultReminderInterval } from "@/lib/preferences";
import { logError } from "@/lib/monitoring";
import { requestIgnoreBatteryOptimizations } from "@/lib/notifications";
import { useToast } from "@/lib/toast";
import { useConfirm } from "@/lib/confirm";

import { PrimaryButton } from "@/components/PrimaryButton";
import { CategoryPill } from "@/components/CategoryPill";
import { ModalHeader } from "@/components/ModalHeader";

const REMINDER_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 Hour", value: 60 },
  { label: "2 Hours", value: 120 },
];

const APPEARANCE_OPTIONS = [
  { label: "System", value: "system" as const, icon: "phone-portrait-outline" as const },
  { label: "Light", value: "light" as const, icon: "sunny" as const },
  { label: "Dark", value: "dark" as const, icon: "moon" as const },
];

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, signOut, resetPassword, deleteAccount } = useAuth();
  const { mode, setMode } = useThemeMode();
  const toast = useToast();
  const confirm = useConfirm();

  const [defaultInterval, setDefaultIntervalState] = useState(60);
  const [sendingReset, setSendingReset] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    getDefaultReminderInterval().then(setDefaultIntervalState);
  }, []);

  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString() : null;

  async function handleSelectInterval(minutes: number) {
    setDefaultIntervalState(minutes);
    await setDefaultReminderInterval(minutes);
  }

  async function handleFixNotifications() {
    const proceed = await confirm({
      title: "Allow background reminders?",
      message:
        "Android may stop this app when it's minimized, which silently blocks reminders. The next screen lets you allow this app to keep running — choose \"Allow\" or \"Don't optimize\" there.",
      confirmLabel: "Continue",
      icon: "battery-charging-outline",
    });
    if (!proceed) return;

    try {
      await requestIgnoreBatteryOptimizations();
    } catch (e: any) {
      logError(e, { where: "profile: fix notification reliability" });
      toast.showError("Couldn't open settings", "You can enable this manually in your phone's battery settings.");
    }
  }

  async function handleResetPassword() {
    if (!user?.email) return;
    try {
      setSendingReset(true);
      const { error } = await resetPassword(user.email);
      if (error) throw error;
      toast.showSuccess("Check your email", `A password reset link was sent to ${user.email}.`);
    } catch (e: any) {
      logError(e, { where: "profile: reset password" });
      toast.showError("Couldn't send reset email", e.message ?? "Something went wrong.");
    } finally {
      setSendingReset(false);
    }
  }

  async function handleSignOut() {
    const ok = await confirm({
      title: "Sign Out",
      message: "Are you sure you want to sign out?",
      confirmLabel: "Sign Out",
      destructive: true,
      icon: "log-out-outline",
    });
    if (!ok) return;

    try {
      setSigningOut(true);
      await signOut();
      // app/_layout.tsx's session listener handles the redirect to sign-in.
    } catch (e: any) {
      setSigningOut(false);
      logError(e, { where: "profile: sign out" });
      toast.showError("Couldn't sign out", e.message ?? "Something went wrong.");
    }
  }

  async function handleDeleteAccount() {
    const firstOk = await confirm({
      title: "Delete Account?",
      message: "This permanently deletes your account, verses, and categories. This can't be undone.",
      confirmLabel: "Continue",
      destructive: true,
      icon: "trash-outline",
    });
    if (!firstOk) return;

    // Second confirmation, deliberately — this is irreversible and easy
    // to tap by accident on the first dialog.
    const secondOk = await confirm({
      title: "Are you absolutely sure?",
      message: "There is no way to recover your account or data after this.",
      confirmLabel: "Delete My Account",
      destructive: true,
      icon: "warning-outline",
    });
    if (!secondOk) return;

    try {
      setDeletingAccount(true);
      await deleteAccount();
      await signOut();
      // app/_layout.tsx's session listener handles the redirect to sign-in.
    } catch (e: any) {
      setDeletingAccount(false);
      logError(e, { where: "profile: delete account" });
      toast.showError(
        "Couldn't delete account",
        e.message ?? "Something went wrong. Please try again, or contact support."
      );
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <ModalHeader title="Profile" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account header */}
        <View style={styles.accountRow}>
          <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
            <Text style={[type.sectionTitle, { color: theme.accent }]}>{initials}</Text>
          </View>
          <View style={styles.accountText}>
            <Text style={[type.bodyBold, { color: theme.text }]} numberOfLines={1}>
              {user?.email ?? "Signed in"}
            </Text>
            {memberSince && (
              <Text style={[type.caption, { color: theme.textSecondary, marginTop: 2 }]}>
                Member since {memberSince}
              </Text>
            )}
          </View>
        </View>

        {/* Appearance */}
        <Text style={[type.sectionLabel, { color: theme.textSecondary, marginTop: spacing.xl }]}>
          APPEARANCE
        </Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.wrapRow}>
            {APPEARANCE_OPTIONS.map((opt) => (
              <CategoryPill
                key={opt.value}
                label={opt.label}
                color={theme.accent}
                icon={opt.icon}
                selected={mode === opt.value}
                onPress={() => setMode(opt.value)}
              />
            ))}
          </View>
        </View>

        {/* Default reminder interval */}
        <Text style={[type.sectionLabel, { color: theme.textSecondary, marginTop: spacing.xl }]}>
          DEFAULT REMINDER
        </Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[type.body, { color: theme.textSecondary, marginBottom: spacing.sm }]}>
            New verses start with this reminder interval — you can still change it per verse on
            the Add Verse screen.
          </Text>
          <View style={styles.wrapRow}>
            {REMINDER_OPTIONS.map((opt) => (
              <CategoryPill
                key={opt.value}
                label={opt.label}
                color={theme.accent}
                selected={defaultInterval === opt.value}
                onPress={() => handleSelectInterval(opt.value)}
              />
            ))}
          </View>
        </View>

        {/* Notification reliability */}
        {Platform.OS === "android" && (
          <>
            <Text style={[type.sectionLabel, { color: theme.textSecondary, marginTop: spacing.xl }]}>
              NOTIFICATION RELIABILITY
            </Text>
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <Text style={[type.body, { color: theme.textSecondary, marginBottom: spacing.sm }]}>
                Some phones aggressively stop apps running in the background, which can silently
                block reminders. Allowing this app to run unrestricted fixes that.
              </Text>
              <Pressable onPress={handleFixNotifications} style={styles.actionRow}>
                <Ionicons name="battery-charging-outline" size={20} color={theme.accent} />
                <Text style={[type.body, { color: theme.accent, marginLeft: spacing.sm, flex: 1, fontWeight: "700" }]}>
                  Fix Notification Reliability
                </Text>
                <Ionicons name="chevron-forward" size={18} color={theme.accent} />
              </Pressable>
            </View>
          </>
        )}

        {/* Data & Backup */}
        <Text style={[type.sectionLabel, { color: theme.textSecondary, marginTop: spacing.xl }]}>
          DATA & BACKUP
        </Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[type.body, { color: theme.textSecondary, marginBottom: spacing.sm }]}>
            Your verses and progress are always stored on this device and work fully offline.
            Cloud backup is optional — turn it on here for disaster recovery.
          </Text>
          <Pressable onPress={() => router.push("/backup")} style={styles.actionRow}>
            <Ionicons name="cloud-upload-outline" size={20} color={theme.accent} />
            <Text style={[type.body, { color: theme.accent, marginLeft: spacing.sm, flex: 1, fontWeight: "700" }]}>
              Backup & Restore
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.accent} />
          </Pressable>
        </View>

        {/* Account actions */}
        <Text style={[type.sectionLabel, { color: theme.textSecondary, marginTop: spacing.xl }]}>
          ACCOUNT
        </Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Pressable
            onPress={handleResetPassword}
            disabled={sendingReset}
            style={[styles.actionRow, { opacity: sendingReset ? 0.6 : 1 }]}
          >
            <Ionicons name="key-outline" size={20} color={theme.text} />
            <Text style={[type.body, { color: theme.text, marginLeft: spacing.sm, flex: 1 }]}>
              {sendingReset ? "Sending reset email…" : "Reset password"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>

        <PrimaryButton
          label={signingOut ? "Signing out…" : "Sign Out"}
          onPress={handleSignOut}
          loading={signingOut}
          variant="ghost"
          icon="log-out-outline"
          style={{ marginTop: spacing.lg }}
        />

        {/* Legal */}
        <Text style={[type.sectionLabel, { color: theme.textSecondary, marginTop: spacing.xl }]}>
          LEGAL
        </Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Pressable
            onPress={() => router.push("/privacy-policy")}
            style={styles.actionRow}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.text} />
            <Text style={[type.body, { color: theme.text, marginLeft: spacing.sm, flex: 1 }]}>
              Privacy Policy
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/terms")}
            style={[styles.actionRow, { marginTop: 4 }]}
          >
            <Ionicons name="document-outline" size={20} color={theme.text} />
            <Text style={[type.body, { color: theme.text, marginLeft: spacing.sm, flex: 1 }]}>
              Terms of Service
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Danger zone */}
        <Text style={[type.sectionLabel, { color: theme.error, marginTop: spacing.xl }]}>
          DANGER ZONE
        </Text>
        <View style={[styles.card, { backgroundColor: theme.errorSurface, borderWidth: 1, borderColor: theme.errorSoft }]}>
          <Pressable
            onPress={handleDeleteAccount}
            disabled={deletingAccount}
            style={[styles.actionRow, { opacity: deletingAccount ? 0.6 : 1 }]}
          >
            <Ionicons name="trash-outline" size={20} color={theme.error} />
            <Text style={[type.body, { color: theme.error, marginLeft: spacing.sm, flex: 1, fontWeight: "700" }]}>
              {deletingAccount ? "Deleting account…" : "Delete Account"}
            </Text>
            {deletingAccount ? null : (
              <Ionicons name="chevron-forward" size={18} color={theme.error} />
            )}
          </Pressable>
        </View>
        <Text style={[type.caption, { color: theme.textSecondary, marginTop: 8, paddingHorizontal: 4 }]}>
          Permanently deletes your account, verses, and categories. This can't be undone.
        </Text>

        {/* About */}
        <View style={styles.aboutWrap}>
          <Text style={[type.caption, { color: theme.textSecondary }]}>
            Scripture Memory v{Constants.expoConfig?.version ?? "1.0.0"}
          </Text>
          <Text style={[type.caption, { color: theme.textSecondary, marginTop: 4 }]}>
            Made for memorizing God's Word.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, paddingTop: 0, paddingBottom: 60 },
  accountRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  accountText: { marginLeft: 16, flex: 1 },
  card: { borderRadius: 18, padding: 18, marginTop: 10 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap" },
  actionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  aboutWrap: { alignItems: "center", marginTop: spacing.xl, marginBottom: 10 },
});
