// app/(auth)/sign-in.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
import { useAuth } from "@/hooks/useAuth";
import { PrimaryButton } from "@/components/PrimaryButton";

export default function SignIn() {
  const theme = useTheme();
  const router = useRouter();
  const { signInWithPassword, signUp, signInWithGoogle, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [confirmSecure, setConfirmSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleState, setGoogleState] = useState<"idle" | "waiting" | "completing">("idle");
  const [error, setError] = useState("");

  // Pulse animation for the Google button when waiting
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (googleState !== "waiting") {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [googleState]);

  // Safety net: if the OS never delivers the auth-callback redirect at all
  // (e.g. the user backgrounds the app mid-flow and doesn't return), don't
  // leave the screen stuck on "Completing sign-in" forever.
  //
  // NOTE: this must stay above the `authLoading` early return below — all
  // hooks in a component have to run in the same order on every render,
  // and an early return placed between two useEffect calls means the
  // second one gets skipped on some renders and not others, which is
  // exactly what caused the "Rendered more hooks than during the
  // previous render" crash.
  useEffect(() => {
    if (googleState !== "completing") return;
    const timeout = setTimeout(() => {
      setGoogleState("idle");
      setError("Sign-in didn't complete. Please try again.");
    }, 15000);
    return () => clearTimeout(timeout);
  }, [googleState]);

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <View style={[styles.flex, styles.centerContent, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  async function submit() {
    setError("");
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (!password.trim()) { setError("Please enter your password."); return; }

    if (mode === "signup") {
      if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (!confirmPassword.trim()) { setError("Please confirm your password."); return; }
      if (password !== confirmPassword) { setError("Passwords don't match."); return; }
    } else {
      if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    }

    try {
      setLoading(true);
      
      const { error } =
        mode === "signin"
          ? await signInWithPassword(email.trim(), password)
          : await signUp(email.trim(), password);

      if (error) throw error;
      // Root layout will handle navigation
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function googleLogin() {
    try {
      setError("");

      if (Platform.OS === "android") {
        setGoogleState("waiting");
      } else {
        setGoogleState("completing");
      }

      const outcome = await signInWithGoogle();

      if (outcome === "cancelled") {
        setGoogleState("idle");
        return;
      }

      // "opened": the browser flow ran. app/auth-callback.tsx (opened
      // directly by the OS via the redirect) owns finishing the sign-in
      // and navigating to Home from here — we just wait, with the
      // timeout above as a safety net.
      setGoogleState("completing");
    } catch (err: any) {
      setGoogleState("idle");
      setError(err.message ?? "Unable to continue with Google.");
    }
  }

  // When googleState is "completing", show a full-screen transition
  // This prevents the form from flashing while root layout navigates
  if (googleState === "completing") {
    return (
      <View style={[styles.flex, styles.centerContent, { backgroundColor: theme.background }]}>
        <View style={[styles.logoWrap, { backgroundColor: theme.accentSoft, marginBottom: 24 }]}>
          <Ionicons name="book" size={40} color={theme.accent} />
        </View>
        <ActivityIndicator size="large" color={theme.accent} style={{ marginBottom: 20 }} />
        <Text style={[styles.completingTitle, { color: theme.text }]}>
          Completing sign-in
        </Text>
        <Text style={[styles.completingSub, { color: theme.textSecondary }]}>
          Setting up your account...
        </Text>
      </View>
    );
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
        {/* Logo */}
        <View style={[styles.logoWrap, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="book" size={40} color={theme.accent} />
        </View>

        <Text style={[type.screenTitle, { color: theme.text, textAlign: "center" }]}>
          Scripture Memory
        </Text>
        <Text style={[type.body, { color: theme.textSecondary, marginTop: 8, marginBottom: 36, textAlign: "center" }]}>
          {mode === "signin" ? "Welcome back." : "Create an account to begin memorizing Scripture."}
        </Text>

        {/* Email */}
        <TextInput
          value={email}
          onChangeText={(t) => { setEmail(t); setError(""); }}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
          editable={googleState === "idle"}
        />

        {/* Password */}
        <View style={[styles.passwordBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TextInput
            value={password}
            onChangeText={(t) => { setPassword(t); setError(""); }}
            placeholder="Password"
            secureTextEntry={secure}
            style={[styles.passwordInput, { color: theme.text }]}
            placeholderTextColor={theme.textSecondary}
            editable={googleState === "idle"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
          <Pressable onPress={() => setSecure(!secure)} hitSlop={8}>
            <Ionicons size={22} color={theme.textSecondary} name={secure ? "eye-off" : "eye"} />
          </Pressable>
        </View>

        {/* Confirm password — sign up only */}
        {mode === "signup" && (
          <>
            <View
              style={[
                styles.passwordBox,
                {
                  backgroundColor: theme.surface,
                  borderColor: confirmPassword && confirmPassword !== password ? "#C0392B" : theme.border,
                },
              ]}
            >
              <TextInput
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setError(""); }}
                placeholder="Confirm password"
                secureTextEntry={confirmSecure}
                style={[styles.passwordInput, { color: theme.text }]}
                placeholderTextColor={theme.textSecondary}
                editable={googleState === "idle"}
                autoComplete="new-password"
              />
              {confirmPassword.length > 0 && (
                <Ionicons
                  size={22}
                  color={confirmPassword === password ? "#3A7D44" : "#C0392B"}
                  name={confirmPassword === password ? "checkmark-circle" : "close-circle"}
                  style={{ marginRight: 4 }}
                />
              )}
              <Pressable onPress={() => setConfirmSecure(!confirmSecure)} hitSlop={8}>
                <Ionicons size={22} color={theme.textSecondary} name={confirmSecure ? "eye-off" : "eye"} />
              </Pressable>
            </View>
            <Text style={[styles.hintText, { color: theme.textSecondary }]}>
              Use at least 8 characters.
            </Text>
          </>
        )}

        {/* Forgot password */}
        {mode === "signin" && (
          <Pressable onPress={() => router.push("/(auth)/forgot-password")} style={styles.forgotBtn}>
            <Text style={[styles.forgotText, { color: theme.accent }]}>Forgot password?</Text>
          </Pressable>
        )}

        {/* Error */}
        {!!error && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={16} color="#C0392B" />
            <Text style={styles.errorText}> {error}</Text>
          </View>
        )}

        <PrimaryButton
          label={mode === "signin" ? "Sign In" : "Create Account"}
          loading={loading}
          onPress={submit}
        />

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.textSecondary }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        </View>

        {/* Google button */}
        <Pressable
          style={[
            styles.googleBtn,
            {
              backgroundColor: googleState === "waiting" ? theme.accentSoft : theme.surface,
              borderColor: googleState === "waiting" ? theme.accent : theme.border,
            },
          ]}
          onPress={googleState === "idle" ? googleLogin : undefined}
          disabled={googleState !== "idle" || loading}
        >
          {googleState === "waiting" ? (
            <>
              <Animated.View style={{ opacity: pulseAnim, marginRight: 10 }}>
                <Ionicons name="logo-google" size={20} color={theme.accent} />
              </Animated.View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.googleText, { color: theme.text }]}>
                  Waiting for Google…
                </Text>
                <Text style={[styles.googleSubText, { color: theme.textSecondary }]}>
                  Complete sign-in in the browser
                </Text>
              </View>
              <Pressable 
                onPress={() => setGoogleState("idle")} 
                hitSlop={10}
                style={{ marginLeft: 8 }}
              >
                <Ionicons name="close" size={18} color={theme.textSecondary} />
              </Pressable>
            </>
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#DB4437" style={{ marginRight: 10 }} />
              <Text style={[styles.googleText, { color: theme.text }]}>
                Continue with Google
              </Text>
            </>
          )}
        </Pressable>

        {/* Mode toggle */}
        <Pressable
          style={{ marginTop: 28, alignSelf: "center" }}
          onPress={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
            setConfirmPassword("");
          }}
        >
          <Text style={{ color: theme.accent, fontWeight: "600", fontSize: 15 }}>
            {mode === "signin" ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </Text>
        </Pressable>

        {/* Terms & privacy consent */}
        <Text style={[styles.consentText, { color: theme.textSecondary }]}>
          By continuing, you agree to our{" "}
          <Text style={{ color: theme.accent, fontWeight: "600" }} onPress={() => router.push("/terms")}>
            Terms of Service
          </Text>{" "}
          and{" "}
          <Text style={{ color: theme.accent, fontWeight: "600" }} onPress={() => router.push("/privacy-policy")}>
            Privacy Policy
          </Text>
          .
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: "center", padding: 24, paddingTop: 60 },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logoWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: 24,
  },
  completingTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    marginBottom: 8,
    textAlign: "center",
  },
  completingSub: { 
    fontSize: 15, 
    textAlign: "center",
    lineHeight: 20,
  },
  input: {
    borderWidth: 1, borderRadius: 14, padding: 16,
    marginBottom: 14, fontSize: 16,
  },
  passwordBox: {
    borderWidth: 1, borderRadius: 14,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, marginBottom: 6,
  },
  passwordInput: { flex: 1, fontSize: 16, paddingVertical: 16 },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 18, paddingVertical: 4 },
  hintText: { fontSize: 12, marginBottom: 10, marginTop: -4 },
  forgotText: { fontSize: 14, fontWeight: "600" },
  errorRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  errorText: { color: "#C0392B", fontWeight: "600", fontSize: 14 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontWeight: "600" },
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20,
  },
  googleText: { fontSize: 16, fontWeight: "600" },
  googleSubText: { fontSize: 12, marginTop: 2 },
  consentText: { fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 24, paddingHorizontal: 8 },
});