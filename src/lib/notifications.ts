// src/lib/notifications.ts

import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { logError } from "@/lib/monitoring";

const isExpoGo = Constants.appOwnership === "expo";

let Notifications: any = null;

if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,  // Don't play custom sounds
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    if (__DEV__) console.warn("expo-notifications unavailable", e);
  }
}

export { Notifications };

async function ensureNotificationChannel() {
  if (!Notifications || Platform.OS !== "android") return;
  
  try {
    // Check if channel already exists to avoid duplicate errors
    const existingChannel = await Notifications.getNotificationChannelAsync("verse-reminders");
    if (existingChannel) {
      return;
    }
  } catch (e) {
    // Channel doesn't exist, which is fine - we'll create it
  }
  
  await Notifications.setNotificationChannelAsync("verse-reminders", {
    name: "Verse Reminders",
    description: "Scripture memory reminders that repeat until a verse is mastered",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    enableLights: true,
    lightColor: "#3D4B8C",
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: true,
    // Remove "sound" property or set to null to use system default
    sound: null,  // Use system default notification sound
    bypassDnd: false,
  });
}

/**
 * Whether exact alarm scheduling is available. On Android < 12 this is
 * implicitly true; on 12+ it depends on a system grant we can't force.
 * Informational only — never used to trigger a popup.
 */
async function canScheduleExactAlarms(): Promise<boolean> {
  if (Platform.OS !== "android" || !Notifications) return true;
  try {
    const apiLevel = Device.platformApiLevel ?? 0;
    return apiLevel < 31;
  } catch {
    return true;
  }
}

/**
 * Requests notification permission using the standard OS dialog only.
 * No custom pre-prompt, no follow-up settings nudges.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;

  try {
    await ensureNotificationChannel();

    if (!Device.isDevice) {
      if (__DEV__) console.warn("Notifications only work on a real device.");
      return false;
    }

    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted;

    if (!granted && existing.canAskAgain !== false) {
      const result = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      granted = result.granted;
    }

    return granted;
  } catch (e) {
    if (__DEV__) console.warn("Permission error:", e);
    return false;
  }
}

export async function scheduleVerseReminder(verse: any) {
  if (!Notifications) return;

  try {
    const { saveNotificationId } = await import("./db");

    await cancelVerseReminder(verse.id);
    await ensureNotificationChannel();

    // Immediate notification so user knows the verse is saved
    await Notifications.scheduleNotificationAsync({
      content: {
        title: verse.reference,
        body: verse.content?.slice(0, 120) + (verse.content?.length > 120 ? "…" : ""),
        // Remove custom sound - use system default
        // sound: "default",  
        data: { verseId: verse.id },
        ...(Platform.OS === "android" ? { channelId: "verse-reminders" } : {}),
      },
      trigger: null, // immediate
    });

    // Repeating reminder — minimum 60 seconds (iOS hard requirement when
    // repeats: true; Android allows shorter but we keep it consistent).
    const intervalSeconds = Math.max(60, verse.reminder_interval_minutes * 60);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time to review: ${verse.reference}`,
        body: verse.content?.slice(0, 120) + (verse.content?.length > 120 ? "…" : ""),
        // Remove custom sound - use system default
        // sound: "default",
        data: { verseId: verse.id },
        ...(Platform.OS === "android" ? { channelId: "verse-reminders" } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: intervalSeconds,
        repeats: true,
      },
    });

    await saveNotificationId(verse.id, id);
  } catch (e) {
    // A silent failure here means the user never gets reminded to
    // review this verse — worth tracking, not just a dev console note.
    logError(e, { where: "scheduleVerseReminder", verseId: verse?.id });
  }
}

export async function cancelVerseReminder(verseId: string) {
  if (!Notifications) return;

  try {
    const { getNotificationId, clearNotificationId } = await import("./db");
    const id = await getNotificationId(verseId);
    if (!id) return;
    await Notifications.cancelScheduledNotificationAsync(id);
    await clearNotificationId(verseId);
  } catch (e) {
    if (__DEV__) console.warn("Cancel reminder failed:", e);
  }
}

export async function cancelAllReminders() {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledReminders() {
  if (!Notifications) return [];
  return Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Diagnostic helper — surfaces whether background delivery is set up
 * correctly. Intended for a Settings/Profile screen so a user who goes
 * looking can see why a reminder might be late; never shown as a popup.
 */
export async function getBackgroundReliabilityStatus(): Promise<{
  permissionGranted: boolean;
  exactAlarmsAvailable: boolean;
  platform: string;
}> {
  if (!Notifications) {
    return { permissionGranted: false, exactAlarmsAvailable: false, platform: Platform.OS };
  }
  const perms = await Notifications.getPermissionsAsync();
  const exact = await canScheduleExactAlarms();
  return {
    permissionGranted: !!perms.granted,
    exactAlarmsAvailable: exact,
    platform: Platform.OS,
  };
}