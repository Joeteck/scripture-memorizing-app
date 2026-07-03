// app/auth-callback.tsx
// Deep-link target for Google OAuth: scripturememory://auth-callback?code=...
//
// This screen is the single source of truth for completing Google
// sign-in. It's registered as a public route in app/_layout.tsx (so the
// global session guard doesn't boot the user to Sign In while this runs),
// and it owns navigating to the signed-in area itself once the exchange
// succeeds — it doesn't rely on the sign-in screen or the root layout to
// notice the new session and redirect, which removes the race condition
// that used to send Google sign-ins back to the Sign In screen instead of
// Home.
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/theme";
import { logError } from "@/lib/monitoring";

type CallbackStatus = "working" | "success" | "error";

export default function AuthCallbackScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
  }>();

  const [status, setStatus] = useState<CallbackStatus>("working");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function complete() {
      // Google/Supabase redirects here with ?error=... if the user denied
      // access or the provider itself failed.
      if (params.error) {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          params.error_description || "Google sign-in was not completed."
        );
        return;
      }

      try {
        // Another instance of this flow (or a fast browser-side redirect)
        // may have already completed the exchange — check first so we
        // never try to consume the single-use code twice.
        const { data: existing } = await supabase.auth.getSession();
        if (existing.session) {
          if (cancelled) return;
          setStatus("success");
          setTimeout(() => !cancelled && router.replace("/(tabs)"), 400);
          return;
        }

        if (!params.code) {
          if (cancelled) return;
          setStatus("error");
          setMessage("This sign-in link is missing required information.");
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(params.code);
        if (error) throw error;

        if (cancelled) return;
        setStatus("success");
        setTimeout(() => !cancelled && router.replace("/(tabs)"), 400);
      } catch (e: any) {
        logError(e, { where: "auth-callback" });
        if (cancelled) return;
        setStatus("error");
        setMessage("We couldn't complete Google sign-in. Please try again.");
      }
    }

    complete();
    return () => {
      cancelled = true;
    };
  }, [params.code, params.error]);

  if (status === "error") {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle-outline" size={52} color="#C0392B" />
        <Text style={[styles.title, { color: theme.text }]}>Sign-In Interrupted</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{message}</Text>
        <Pressable
          style={[styles.button, { backgroundColor: theme.accent }]}
          onPress={() => router.replace("/(auth)/sign-in")}
        >
          <Text style={styles.buttonText}>Back to Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.flex, styles.center, { backgroundColor: theme.background }]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.accentSoft }]}>
        <Ionicons
          name={status === "success" ? "checkmark-circle" : "book"}
          size={40}
          color={theme.accent}
        />
      </View>
      {status === "working" && (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginBottom: 20 }} />
      )}
      <Text style={[styles.title, { color: theme.text }]}>
        {status === "success" ? "You're in" : "Completing sign-in"}
      </Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        {status === "success"
          ? "Taking you to your verses…"
          : "Just a moment while we finish setting up your account."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  body: { fontSize: 15, textAlign: "center", lineHeight: 21, marginBottom: 28 },
  button: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 999 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
