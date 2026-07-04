import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import { useFonts } from "expo-font";
import { Platform } from "react-native";

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
import { ensureNotificationPermission } from "@/lib/notifications";
import { initMonitoring, logError } from "@/lib/monitoring";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/theme";
import { ToastProvider } from "@/lib/toast";
import { TabNavigationProvider } from "@/lib/tabNavigation";
import {
  hasCompletedOnboarding,
  markOnboardingComplete,
} from "@/lib/onboarding";
import { OnboardingScreen } from "@/components/OnboardingScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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

function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, loading } = useAuth();

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

  useEffect(() => {
    if (!fontsLoaded || loading || !appReady || showOnboarding) {
      return;
    }

    SplashScreen.hideAsync().catch(() => {});

    const inAuth = segments[0] === "(auth)";
    // reset-password and auth-callback are reached via a deep link before
    // a session exists (the token exchange on those screens is what
    // creates the session), so they must be treated as public routes just
    // like the (auth) group — otherwise this guard boots the user back to
    // sign-in before the screen can process the link.
    const isPublicRoute =
      inAuth ||
      segments[0] === "reset-password" ||
      segments[0] === "auth-callback";

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
              name="reset-password"
              options={{ presentation: "modal" }}
            />
            <Stack.Screen
              name="auth-callback"
              options={{ presentation: "modal", gestureEnabled: false }}
            />
          </Stack>
        </TabNavigationProvider>
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