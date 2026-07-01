// app/reset-password.tsx
// Deep-link target: scripturememory://reset-password?access_token=...&type=recovery
// Supabase sends this URL after the user clicks the email reset link.
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useTheme, type } from "@/theme";
import { PrimaryButton } from "@/components/PrimaryButton";

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ access_token?: string; type?: string }>();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Exchange the token from the deep link for a session so we can call
  // supabase.auth.updateUser() — which requires an active session.
  useEffect(() => {
    async function init() {
      const token = params.access_token;
      const type = params.type;

      if (!token || type !== "recovery") {
        setError("Invalid or expired reset link. Please request a new one.");
        setSessionReady(false);
        return;
      }

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(token);
        if (error) throw error;
        setSessionReady(true);
      } catch (e: any) {
        setError("This link has expired. Please request a new password reset.");
        setSessionReady(false);
      }
    }
    init();
  }, [params.access_token, params.type]);

  async function handleReset() {
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
    } catch (e: any) {
      setError(e.message ?? "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!params.access_token) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle-outline" size={52} color="#C0392B" />
        <Text style={[styles.heading, { color: theme.text, marginTop: 16 }]}>
          Invalid Reset Link
        </Text>
        <Text style={[{ color: theme.textSecondary, textAlign: "center", marginTop: 10, lineHeight: 22 }]}>
          This link is invalid or has already been used.{"\n"}Please request a new password reset.
        </Text>
        <PrimaryButton
          label="Back to Sign In"
          onPress={() => router.replace("/(auth)/sign-in")}
          style={{ marginTop: 28, alignSelf: "stretch", marginHorizontal: 32 }}
        />
      </View>
    );
  }

  if (!sessionReady && !error) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[{ color: theme.textSecondary, marginTop: 16 }]}>Verifying reset link…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={[styles.iconWrap, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name={done ? "checkmark-circle" : "lock-closed-outline"} size={44} color={done ? "#3A7D44" : theme.accent} />
        </View>

        {done ? (
          <>
            <Text style={[styles.heading, { color: theme.text }]}>Password Updated!</Text>
            <Text style={[{ color: theme.textSecondary, textAlign: "center", marginTop: 10, lineHeight: 24 }]}>
              Your password has been changed successfully. You can now sign in with your new password.
            </Text>
            <PrimaryButton
              label="Sign In"
              onPress={() => router.replace("/(auth)/sign-in")}
              style={{ marginTop: 32 }}
            />
          </>
        ) : (
          <>
            <Text style={[styles.heading, { color: theme.text }]}>Set New Password</Text>
            <Text style={[{ color: theme.textSecondary, textAlign: "center", marginTop: 8, marginBottom: 28, lineHeight: 22 }]}>
              Choose a strong password with at least 8 characters.
            </Text>

            {!!error && (
              <View style={[styles.errorBox, { backgroundColor: "#FFF1F0", borderColor: "#FFCDD2" }]}>
                <Ionicons name="alert-circle-outline" size={18} color="#C0392B" />
                <Text style={[styles.errorText, { flex: 1 }]}> {error}</Text>
              </View>
            )}

            {sessionReady && (
              <>
                {/* New password */}
                <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  <TextInput
                    value={password}
                    onChangeText={(t) => { setPassword(t); setError(""); }}
                    placeholder="New password"
                    secureTextEntry={!showPw}
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text }]}
                  />
                  <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={8}>
                    <Ionicons name={showPw ? "eye-off" : "eye"} size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>

                {/* Confirm */}
                <View style={[styles.inputRow, { borderColor: confirm && confirm !== password ? "#C0392B" : theme.border, backgroundColor: theme.surface }]}>
                  <TextInput
                    value={confirm}
                    onChangeText={(t) => { setConfirm(t); setError(""); }}
                    placeholder="Confirm password"
                    secureTextEntry={!showPw}
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, { color: theme.text }]}
                  />
                  {confirm.length > 0 && (
                    <Ionicons
                      name={confirm === password ? "checkmark-circle" : "close-circle"}
                      size={20}
                      color={confirm === password ? "#3A7D44" : "#C0392B"}
                    />
                  )}
                </View>

                <PrimaryButton label="Update Password" onPress={handleReset} loading={loading} style={{ marginTop: 8 }} />
              </>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", padding: 32 },
  container: { flexGrow: 1, padding: 24, paddingTop: 80 },
  iconWrap: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: 24,
  },
  heading: { fontSize: 26, fontWeight: "800", textAlign: "center" },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 16, marginBottom: 14,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 15 },
  errorBox: {
    flexDirection: "row", alignItems: "flex-start",
    borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 18,
  },
  errorText: { color: "#C0392B", fontWeight: "600", fontSize: 14, lineHeight: 20 },
});
