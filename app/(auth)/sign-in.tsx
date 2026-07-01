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
  const { signInWithPassword, signUp, signInWithGoogle, session } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // Android: browser opens and signInWithGoogle() returns immediately.
  // We keep a "waiting for browser" state so the UI doesn't snap back to
  // the normal sign-in button while the user is choosing their account.
  const [waitingForBrowser, setWaitingForBrowser] = useState(false);
  const [error, setError] = useState("");

  // Pulse animation for the "Complete sign-in in browser" banner
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!waitingForBrowser) { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [waitingForBrowser]);

  // Once the Linking listener in _layout.tsx exchanges the OAuth code,
  // Supabase fires onAuthStateChange → useAuth updates session → navigation
  // guard in _layout.tsx redirects to (tabs). We just need to clear our
  // loading state if the session appears while we're waiting.
  useEffect(() => {
    if (session && (googleLoading || waitingForBrowser)) {
      setGoogleLoading(false);
      setWaitingForBrowser(false);
    }
  }, [session]);

  async function submit() {
    setError("");
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (!password.trim()) { setError("Please enter your password."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    try {
      setLoading(true);
      const { error } =
        mode === "signin"
          ? await signInWithPassword(email.trim(), password)
          : await signUp(email.trim(), password);

      if (error) throw error;
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function googleLogin() {
    try {
      setGoogleLoading(true);
      setError("");

      if (Platform.OS === "android") {
        // On Android, signInWithGoogle opens the browser and returns
        // immediately. We switch to "waiting" state so the UI shows a
        // clear message instead of snapping back to the normal button.
        // The session will arrive via the Linking listener in _layout.tsx.
        setWaitingForBrowser(true);
        await signInWithGoogle();
        // signInWithGoogle() has returned — browser is open.
        // Don't clear googleLoading here; let the session useEffect do it
        // once the OAuth code is exchanged and the session arrives.
        setGoogleLoading(false);
      } else {
        // iOS: signInWithGoogle() awaits the full redirect before returning.
        await signInWithGoogle();
        setGoogleLoading(false);
        setWaitingForBrowser(false);
      }
    } catch (err: any) {
      setGoogleLoading(false);
      setWaitingForBrowser(false);
      setError(err.message ?? "Unable to continue with Google.");
    }
  }

  function cancelGoogleWait() {
    setWaitingForBrowser(false);
    setGoogleLoading(false);
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

        {/* ── Android "waiting for browser" banner ── */}
        {waitingForBrowser && (
          <View style={[styles.browserBanner, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
            <Animated.View style={{ opacity: pulseAnim }}>
              <Ionicons name="logo-google" size={20} color={theme.accent} />
            </Animated.View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.bannerTitle, { color: theme.text }]}>
                Complete sign-in in the browser
              </Text>
              <Text style={[styles.bannerSub, { color: theme.textSecondary }]}>
                Choose your Google account to continue. The app will update automatically.
              </Text>
            </View>
            <Pressable onPress={cancelGoogleWait} hitSlop={10}>
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>
        )}

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
          editable={!waitingForBrowser}
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
            editable={!waitingForBrowser}
          />
          <Pressable onPress={() => setSecure(!secure)} hitSlop={8}>
            <Ionicons size={22} color={theme.textSecondary} name={secure ? "eye-off" : "eye"} />
          </Pressable>
        </View>

        {/* Forgot password */}
        {mode === "signin" && !waitingForBrowser && (
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

        {!waitingForBrowser && (
          <PrimaryButton
            label={mode === "signin" ? "Sign In" : "Create Account"}
            loading={loading}
            onPress={submit}
          />
        )}

        {/* Divider */}
        {!waitingForBrowser && (
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textSecondary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>
        )}

        {/* Google button */}
        <Pressable
          style={[
            styles.googleBtn,
            {
              backgroundColor: waitingForBrowser ? theme.accentSoft : theme.surface,
              borderColor: waitingForBrowser ? theme.accent : theme.border,
              opacity: waitingForBrowser ? 0.6 : 1,
            },
          ]}
          onPress={waitingForBrowser ? undefined : googleLogin}
          disabled={googleLoading || waitingForBrowser}
        >
          {googleLoading && !waitingForBrowser ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color={waitingForBrowser ? theme.accent : "#DB4437"} style={{ marginRight: 10 }} />
              <Text style={[styles.googleText, { color: theme.text }]}>
                {waitingForBrowser ? "Waiting for Google…" : "Continue with Google"}
              </Text>
            </>
          )}
        </Pressable>

        {/* Mode toggle */}
        {!waitingForBrowser && (
          <Pressable
            style={{ marginTop: 28, alignSelf: "center" }}
            onPress={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
          >
            <Text style={{ color: theme.accent, fontWeight: "600", fontSize: 15 }}>
              {mode === "signin" ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: "center", padding: 24, paddingTop: 60 },
  logoWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: 24,
  },
  browserBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  bannerTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  bannerSub: { fontSize: 13, lineHeight: 18 },
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
});
