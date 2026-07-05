// src/lib/notifications.ts

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as IntentLauncher from "expo-intent-launcher";
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

// How many individual future occurrences to schedule at once, instead of
// relying on a single indefinite `repeats: true` alarm. See the comment
// on scheduleVerseReminder below for why this matters.
const LOOKAHEAD_COUNT = 20;

export async function scheduleVerseReminder(verse: any) {
  if (!Notifications) return;

  try {
    const { saveNotificationIds } = await import("./db");

    await cancelVerseReminder(verse.id);
    await ensureNotificationChannel();

    // Immediate notification so user knows the verse is saved
    await Notifications.scheduleNotificationAsync({
      content: {
        title: verse.reference,
        body: verse.content?.slice(0, 120) + (verse.content?.length > 120 ? "…" : ""),
        data: { verseId: verse.id },
        ...(Platform.OS === "android" ? { channelId: "verse-reminders" } : {}),
      },
      trigger: null, // immediate
    });

    // Minimum 60 seconds (iOS hard requirement for repeating triggers;
    // Android allows shorter but we keep it consistent).
    const intervalSeconds = Math.max(60, verse.reminder_interval_minutes * 60);

    // Deliberately NOT a single `repeats: true` alarm. On Android,
    // repeating local notifications are scheduled via
    // AlarmManager.setRepeating(), which the OS treats as inexact by
    // design — it gets batched and delayed by Doze mode, sometimes by
    // hours, sometimes not firing for days, independent of whether
    // SCHEDULE_EXACT_ALARM is granted (that permission only affects
    // one-shot exact alarms, not the repeating variant). This is a
    // long-documented Android/Expo limitation, not something fixable by
    // adjusting this app's own permissions or code around a single
    // repeating trigger.
    //
    // Instead, schedule a batch of individual one-shot occurrences, each
    // of which gets its own exact alarm and fires far more reliably.
    // This batch is finite (LOOKAHEAD_COUNT occurrences), so it's
    // "topped up" — see topUpAllReminders() — every time the app comes
    // to the foreground, extending coverage as long as the user opens
    // the app at least once within the batch's time window.
    const ids: string[] = [];
    for (let i = 1; i <= LOOKAHEAD_COUNT; i++) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time to review: ${verse.reference}`,
          body: verse.content?.slice(0, 120) + (verse.content?.length > 120 ? "…" : ""),
          data: { verseId: verse.id },
          ...(Platform.OS === "android" ? { channelId: "verse-reminders" } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: intervalSeconds * i,
          repeats: false,
        },
      });
      ids.push(id);
    }

    await saveNotificationIds(verse.id, ids);
  } catch (e) {
    // A silent failure here means the user never gets reminded to
    // review this verse — worth tracking, not just a dev console note.
    logError(e, { where: "scheduleVerseReminder", verseId: verse?.id });
  }
}

export async function cancelVerseReminder(verseId: string) {
  if (!Notifications) return;

  try {
    const { getNotificationIds, clearNotificationIds } = await import("./db");
    const ids = await getNotificationIds(verseId);
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    }
    await clearNotificationIds(verseId);
  } catch (e) {
    if (__DEV__) console.warn("Cancel reminder failed:", e);
  }
}

/**
 * Re-tops-up each verse's batch of scheduled reminders if it's running
 * low. Call this whenever the app comes to the foreground (see
 * app/_layout.tsx) — it's cheap (one native call to list pending
 * notifications, then a quick per-verse check) and is what keeps
 * reminders flowing indefinitely despite each batch being finite.
 */
export async function topUpAllReminders(
  verses: { id: string; reference: string; content: string; reminder_interval_minutes: number }[]
) {
  if (!Notifications || verses.length === 0) return;

  try {
    const { getNotificationIds } = await import("./db");
    const pending: any[] = await Notifications.getAllScheduledNotificationsAsync();
    const pendingIds = new Set(pending.map((n) => n.identifier));

    const topUpThreshold = Math.ceil(LOOKAHEAD_COUNT / 2);

    for (const verse of verses) {
      const storedIds = await getNotificationIds(verse.id);
      const remaining = storedIds.filter((id) => pendingIds.has(id)).length;

      if (remaining < topUpThreshold) {
        await scheduleVerseReminder(verse);
      }
    }
  } catch (e) {
    logError(e, { where: "topUpAllReminders" });
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
 * Opens the OS dialog asking the user to exempt this app from battery
 * optimization. This is the single biggest real-world fix for "reminders
 * stop when the app is minimized" — Android's Doze mode and most OEM
 * skins (Xiaomi/MIUI, Huawei, Oppo, Samsung, etc.) aggressively suspend
 * or kill backgrounded apps unless explicitly exempted, independent of
 * how correctly notifications are scheduled.
 *
 * Uses the direct request intent rather than sending the user into
 * Settings to find it manually — legitimate for apps whose core function
 * is scheduled/background reminders, but Google Play requires this to be
 * declared in the Play Console's permissions declaration form before
 * submitting (see PRODUCTION_AUDIT_REPORT.md).
 */
export async function requestIgnoreBatteryOptimizations(): Promise<void> {
  if (Platform.OS !== "android") return;

  try {
    await IntentLauncher.startActivityAsync(
      "android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
      { data: `package:${Constants.expoConfig?.android?.package ?? ""}` }
    );
  } catch (e) {
    // Some OEMs/Android builds don't support this exact intent — fall
    // back to the general battery optimization list so the user can
    // still find and whitelist the app manually.
    try {
      await IntentLauncher.startActivityAsync(
        "android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS"
      );
    } catch (e2) {
      logError(e2, { where: "requestIgnoreBatteryOptimizations fallback" });
    }
  }
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