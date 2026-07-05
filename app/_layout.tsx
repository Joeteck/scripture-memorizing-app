import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import { useFonts } from "expo-font";
import { Platform, View, Text, StyleSheet, AppState } from "react-native";

import {
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
} from "@expo-google-fonts/lora";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import { initDb } from "@/lib/db";
import { ensureNotificationPermission, topUpAllReminders } from "@/lib/notifications";
import { initMonitoring, logError } from "@/lib/monitoring";
import { useAuth } from "@/hooks/useAuth";
import { useVerses } from "@/hooks/useVerses";
import { ThemeProvider, useTheme } from "@/theme";
import { ToastProvider } from "@/lib/toast";
import { ConfirmProvider } from "@/lib/confirm";
import { TabNavigationProvider } from "@/lib/tabNavigation";
import {
  hasCompletedOnboarding,
  markOnboardingComplete,
} from "@/lib/onboarding";
import { OnboardingScreen } from "@/components/OnboardingScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SUPABASE_CONFIGURED } from "@/lib/supabase";
import AppSplashScreen from "./splash";

SplashScreen.preventAutoHideAsync().catch(() => {});
initMonitoring();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Shown instead of the normal app when EXPO_PUBLIC_SUPABASE_URL /
 * EXPO_PUBLIC_SUPABASE_ANON_KEY were missing at build time. This is a
 * build-configuration problem, not something a restart or reinstall
 * fixes — the message says so plainly rather than looking like a normal
 * error the user could work around.
 */
function ConfigErrorScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.configError, { backgroundColor: theme.background }]}>
      <Text style={[styles.configErrorTitle, { color: theme.error }]}>
        App Isn't Configured
      </Text>
      <Text style={[styles.configErrorBody, { color: theme.textSecondary }]}>
        This build is missing required configuration (Supabase URL/key) and can't connect to its
        backend. This isn't something you can fix by restarting — it needs to be corrected in the
        build itself. If you're the developer: check that EXPO_PUBLIC_SUPABASE_URL and
        EXPO_PUBLIC_SUPABASE_ANON_KEY are set as EAS environment variables for this build profile.
      </Text>
    </View>
  );
}

function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, loading } = useAuth();
  const { learning } = useVerses(session?.user?.id ?? null);

  const [appReady, setAppReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [fontsLoaded] = useFonts({
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // If required env vars weren't present at build time, don't wait on the
  // rest of the init sequence — hide the splash and show a clear message
  // right away. See src/lib/supabase.ts for why this can't just throw.
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  // Deep-link logging only, dev builds — actual OAuth/reset-link handling
  // happens on the dedicated auth-callback and reset-password screens,
  // which read the incoming URL's params directly (detectSessionInUrl is
  // deliberately false in src/lib/supabase.ts, since that option has no
  // effect outside a browser).
  useEffect(() => {
    if (!__DEV__) return;

    const sub = Linking.addEventListener("url", ({ url }) => {
      console.log("Deep link:", url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("Initial URL:", url);
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    async function initialize() {
      try {
        await initDb();
        await ensureNotificationPermission();

        if (Platform.OS === "android") {
          const Notif = await import("expo-notifications");

          await Notif.setNotificationChannelAsync(
            "verse-reminders",
            {
              name: "Verse Reminders",
              importance: Notif.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              enableLights: true,
              enableVibrate: true,
              lockscreenVisibility:
                Notif.AndroidNotificationVisibility.PUBLIC,
              showBadge: true,
            }
          );
        }

        const done = await hasCompletedOnboarding();

        if (!done) {
          setShowOnboarding(true);
        }
      } catch (e) {
        logError(e, { where: "app initialization" });
      } finally {
        setAppReady(true);
      }
    }

    initialize();
  }, []);

  // Reminders are scheduled in finite batches (see topUpAllReminders in
  // src/lib/notifications.ts) rather than one indefinite repeating alarm,
  // since Android's repeating-alarm API is inexact and unreliable in the
  // background. This is what keeps that batch topped up: every time the
  // app comes to the foreground, check whether any verse is running low
  // on scheduled occurrences and extend it. Also runs once on mount so a
  // fresh sign-in or cold start tops up immediately rather than waiting
  // for the next foreground transition.
  useEffect(() => {
    if (!appReady || !session || learning.length === 0) return;

    topUpAllReminders(learning).catch((e) => {
      logError(e, { where: "topUpAllReminders: mount" });
    });

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        topUpAllReminders(learning).catch((e) => {
          logError(e, { where: "topUpAllReminders: foreground" });
        });
      }
    });

    return () => sub.remove();
  }, [appReady, session, learning]);

  useEffect(() => {
    if (!fontsLoaded || loading || !appReady) {
      return;
    }

    // Hide the splash the moment the app is actually ready to show
    // something — whether that's onboarding, sign-in, or the main tabs.
    // This used to also wait on `!showOnboarding`, which meant the splash
    // never hid on a fresh install (onboarding not yet completed) even
    // though the onboarding screen was already rendering underneath it.
    SplashScreen.hideAsync().catch(() => {});

    if (showOnboarding) {
      // Auth-routing below doesn't apply yet — let onboarding finish first.
      return;
    }

    const inAuth = segments[0] === "(auth)";
    // reset-password and auth-callback are reached via a deep link before
    // a session exists (the token exchange on those screens is what
    // creates the session), so they must be treated as public routes just
    // like the (auth) group — otherwise this guard boots the user back to
    // sign-in before the screen can process the link.
    const isPublicRoute =
      inAuth ||
      segments[0] === "reset-password" ||
      segments[0] === "auth-callback" ||
      segments[0] === "privacy-policy" ||
      segments[0] === "terms";

    if (!session && !isPublicRoute) {
      router.replace("/(auth)/sign-in");
      return;
    }

    if (session && inAuth) {
      router.replace("/(tabs)");
    }
  }, [
    fontsLoaded,
    loading,
    appReady,
    session,
    segments,
    showOnboarding,
  ]);

  if (!SUPABASE_CONFIGURED) {
    return (
      <ThemeProvider>
        <ToastProvider>
          <ConfigErrorScreen />
        </ToastProvider>
      </ThemeProvider>
    );
  }

  if (!fontsLoaded || loading || !appReady) {
    return (
      <ThemeProvider>
        <ToastProvider>
          <AppSplashScreen />
        </ToastProvider>
      </ThemeProvider>
    );
  }

  if (showOnboarding) {
    return (
      <ThemeProvider>
        <ToastProvider>
          <OnboardingScreen
            onComplete={async () => {
              await markOnboardingComplete();
              setShowOnboarding(false);
            }}
          />
        </ToastProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <TabNavigationProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="profile"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="feedback"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="donate"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="about"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="quiz"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="reset-password"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="privacy-policy"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="terms"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen
                name="auth-callback"
                options={{ presentation: "modal", gestureEnabled: false }}
              />
            </Stack>
          </TabNavigationProvider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

function AppRoot() {
  return (
    <ErrorBoundary>
      <RootLayout />
    </ErrorBoundary>
  );
}

export default AppRoot;

const styles = StyleSheet.create({
  configError: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  configErrorTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  configErrorBody: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
});