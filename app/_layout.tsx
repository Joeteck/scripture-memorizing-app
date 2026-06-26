import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { useFonts } from "expo-font";

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

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const {
    session,
    loading,
  } = useAuth();

  const [appReady, setAppReady] =
    useState(false);

  const [fontsLoaded] = useFonts({
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,

    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    async function initialize() {
      try {
        console.log(
          "Initializing app..."
        );

        await initDb();

        await ensureNotificationPermission();

        console.log(
          "Initialization complete."
        );

        setAppReady(true);
      } catch (e) {
        console.error(
          "Initialization failed",
          e
        );

        setAppReady(true);
      }
    }

    initialize();
  }, []);

  useEffect(() => {
    if (
      !fontsLoaded ||
      loading ||
      !appReady
    ) {
      return;
    }

    SplashScreen.hideAsync().catch(
      () => {}
    );

    const inAuthGroup =
      segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace(
        "/(auth)/sign-in"
      );
      return;
    }

    if (session && inAuthGroup) {
      router.replace(
        "/(tabs)"
      );
    }
  }, [
    fontsLoaded,
    loading,
    appReady,
    session,
    segments,
  ]);

  useEffect(() => {
    const received =
      Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log(
            "Notification received:",
            notification
          );
        }
      );

    const response =
      Notifications.addNotificationResponseReceivedListener(
        (response) => {
          console.log(
            "Notification opened:",
            response
          );

          const verseId =
            response.notification.request
              .content.data
              ?.verseId;

          if (verseId) {
            console.log(
              "Verse opened:",
              verseId
            );

            // Later:
            // router.push(`/verse/${verseId}`)
          }
        }
      );

    return () => {
      received.remove();
      response.remove();
    };
  }, []);

  if (
    !fontsLoaded ||
    loading ||
    !appReady
  ) {
    return null;
  }

  return <Slot />;
}