import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

import { useTheme, useThemeMode, type, spacing } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { getDefaultReminderInterval, setDefaultReminderInterval } from "@/lib/preferences";

import { PrimaryButton } from "@/components/PrimaryButton";
import { CategoryPill } from "@/components/CategoryPill";

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
  const { user, signOut, resetPassword } = useAuth();
  const { mode, setMode } = useThemeMode();

  const [defaultInterval, setDefaultIntervalState] = useState(60);
  const [sendingReset, setSendingReset] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    getDefaultReminderInterval().then(setDefaultIntervalState);
  }, []);

  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString() : null;

  async function handleSelectInterval(minutes: number) {
    setDefaultIntervalState(minutes);
    await setDefaultReminderInterval(minutes);
  }

  async function handleResetPassword() {
    if (!user?.email) return;
    try {
      setSendingReset(true);
      const { error } = await resetPassword(user.email);
      if (error) throw error;
      Alert.alert("Check your email", `A password reset link was sent to ${user.email}.`);
    } catch (e: any) {
      Alert.alert("Couldn't send reset email", e.message ?? "Something went wrong.");
    } finally {
      setSendingReset(false);
    }
  }

  function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            setSigningOut(true);
            await signOut();
            // app/_layout.tsx's session listener handles the redirect to sign-in.
          } catch (e: any) {
            setSigningOut(false);
            Alert.alert("Couldn't sign out", e.message ?? "Something went wrong.");
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={[type.screenTitle, { color: theme.text }]}>Profile</Text>
        <View style={{ width: 26 }} />
      </View>

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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: { padding: 4 },
  content: { padding: 20, paddingTop: 4, paddingBottom: 60 },
  accountRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  accountText: { marginLeft: 16, flex: 1 },
  card: { borderRadius: 18, padding: 18, marginTop: 10 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap" },
  actionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  aboutWrap: { alignItems: "center", marginTop: spacing.xl, marginBottom: 10 },
});
