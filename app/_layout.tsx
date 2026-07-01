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
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/theme";
import { ToastProvider } from "@/lib/toast";
import { TabNavigationProvider } from "@/lib/tabNavigation";
import {
  hasCompletedOnboarding,
  markOnboardingComplete,
} from "@/lib/onboarding";
import { OnboardingScreen } from "@/components/OnboardingScreen";
import AppSplashScreen from "./splash";

SplashScreen.preventAutoHideAsync().catch(() => {});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
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

  // Deep-link logging only.
  // Supabase handles OAuth automatically because
  // detectSessionInUrl is true.
  useEffect(() => {
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
        console.error(e);
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

    console.log("Navigation:", {
      session: !!session,
      inAuth,
    });

    if (!session && !inAuth) {
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
          </Stack>
        </TabNavigationProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}