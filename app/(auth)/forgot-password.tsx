// app/(auth)/forgot-password.tsx
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, type } from "@/theme";
import { resetPassword } from "@/lib/auth";
import { PrimaryButton } from "@/components/PrimaryButton";

type Step = "email" | "sent";

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    setError("");
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const { error: supaErr } = await resetPassword(trimmed);
      if (supaErr) throw supaErr;
      setStep("sent");
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>

        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="lock-open-outline" size={44} color={theme.accent} />
        </View>

        {step === "email" ? (
          <>
            <Text style={[type.screenTitle, { color: theme.text, textAlign: "center" }]}>
              Forgot Password?
            </Text>
            <Text
              style={[
                type.body,
                { color: theme.textSecondary, textAlign: "center", marginTop: 10, marginBottom: 32 },
              ]}
            >
              Enter the email address you signed up with and we'll send you a reset link.
            </Text>

            <TextInput
              value={email}
              onChangeText={(t) => { setEmail(t); setError(""); }}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: theme.surface,
                  borderColor: error ? "#C0392B" : theme.border,
                },
              ]}
            />

            {!!error && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={16} color="#C0392B" />
                <Text style={styles.errorText}> {error}</Text>
              </View>
            )}

            <PrimaryButton
              label="Send Reset Link"
              onPress={handleSend}
              loading={loading}
              style={{ marginTop: 8 }}
            />

            <Pressable onPress={() => router.back()} style={{ marginTop: 24, alignSelf: "center" }}>
              <Text style={{ color: theme.accent, fontWeight: "600", fontSize: 15 }}>
                Back to Sign In
              </Text>
            </Pressable>
          </>
        ) : (
          // Sent confirmation
          <>
            <View style={[styles.sentBadge, { backgroundColor: "#F0FBF2", borderColor: "#B7DFC0" }]}>
              <Ionicons name="checkmark-circle" size={40} color="#3A7D44" />
            </View>
            <Text style={[type.screenTitle, { color: theme.text, textAlign: "center", marginTop: 20 }]}>
              Check Your Email
            </Text>
            <Text
              style={[
                type.body,
                { color: theme.textSecondary, textAlign: "center", marginTop: 12, lineHeight: 26 },
              ]}
            >
              We've sent a password reset link to{"\n"}
              <Text style={{ color: theme.text, fontWeight: "700" }}>{email}</Text>
              {"\n\n"}
              Click the link in that email to set a new password. Check your spam folder if you don't
              see it within a couple of minutes.
            </Text>

            <PrimaryButton
              label="Back to Sign In"
              onPress={() => router.replace("/(auth)/sign-in")}
              style={{ marginTop: 36 }}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 24 },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 28,
  },
  sentBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    borderWidth: 2,
    marginTop: 12,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  errorText: { color: "#C0392B", fontWeight: "600", fontSize: 14 },
});
