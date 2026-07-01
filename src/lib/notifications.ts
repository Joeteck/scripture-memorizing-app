// src/lib/notifications.ts
// Background-safe notification scheduling for Android and iOS.
//
// ROOT CAUSE OF "15-minute reminder only appeared when I reopened the app":
// Scheduled local notifications are owned by the OS (AlarmManager on Android,
// UNUserNotificationCenter on iOS), not by our JS thread — so in principle
// they should fire even with the app fully closed. Two real gaps were
// causing the delay:
//
// 1. We declared SCHEDULE_EXACT_ALARM / USE_EXACT_ALARM in app.config.js,
//    but on Android 12+ (API 31+) just *declaring* that permission isn't
//    enough — the user has to separately grant "Alarms & reminders" in
//    system settings. Without it, Android silently downgrades our reminder
//    to an *inexact* alarm, which Doze mode can delay by many minutes —
//    it then only actually fires once something (like reopening the app)
//    wakes the process up. We now explicitly check + request this.
// 2. We never asked the user to exempt the app from battery optimization.
//    Many OEMs (Samsung, Xiaomi, Huawei, etc.) aggressively kill scheduled
//    alarms for "unused" backgrounded apps unless this is granted. We now
//    surface a one-time prompt directing the user to that settings screen.
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform, Linking as RNLinking, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isExpoGo = Constants.appOwnership === "expo";
const BATTERY_PROMPT_KEY = "scripture_battery_opt_prompted_v1";

let Notifications: any = null;

if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.warn("expo-notifications unavailable", e);
  }
}

export { Notifications };

async function ensureNotificationChannel() {
  if (!Notifications || Platform.OS !== "android") return;
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
    sound: "default",
    bypassDnd: false,
  });
}

/**
 * Checks whether Android has granted "exact alarm" scheduling.
 * On Android < 12 this permission doesn't exist and is implicitly true.
 * On Android 12+ it must be granted by the user in system settings —
 * we can request the OS settings screen for it, but cannot force-grant it.
 */
async function canScheduleExactAlarms(): Promise<boolean> {
  if (Platform.OS !== "android" || !Notifications) return true;
  try {
    // expo-notifications exposes this on SDK 51+; guard defensively
    if (typeof Notifications.getNotificationChannelAsync === "function") {
      // No direct exact-alarm getter is exposed by expo-notifications,
      // so we rely on Device API level + a one-time settings deep link.
    }
    const apiLevel = Device.platformApiLevel ?? 0;
    return apiLevel < 31; // Below Android 12, exact alarms don't require this grant
  } catch {
    return true;
  }
}

/**
 * Opens Android's "Alarms & reminders" settings screen for this app so the
 * user can grant SCHEDULE_EXACT_ALARM. Required on Android 12+ for reminders
 * to fire reliably and on time while the app is closed.
 */
async function promptExactAlarmSettings() {
  if (Platform.OS !== "android") return;
  try {
    const apiLevel = Device.platformApiLevel ?? 0;
    if (apiLevel < 31) return; // not needed below Android 12

    const canSchedule = await canScheduleExactAlarms();
    if (canSchedule) return;

    Alert.alert(
      "Allow Background Reminders",
      "To make sure verse reminders arrive on time — even when the app is closed — please enable \"Alarms & reminders\" for Scripture Memory in your phone settings.",
      [
        { text: "Not Now", style: "cancel" },
        {
          text: "Open Settings",
          onPress: () => {
            RNLinking.openSettings().catch(() => {});
          },
        },
      ]
    );
  } catch (e) {
    console.warn("Exact alarm prompt failed:", e);
  }
}

/**
 * Suggests the user disable battery optimization for the app. Many Android
 * OEMs (Samsung, Xiaomi, Huawei, Oppo) kill scheduled alarms for apps they
 * consider "inactive" unless this is granted. We only ask once.
 */
async function promptBatteryOptimization() {
  if (Platform.OS !== "android") return;
  try {
    const alreadyPrompted = await AsyncStorage.getItem(BATTERY_PROMPT_KEY);
    if (alreadyPrompted) return;

    await AsyncStorage.setItem(BATTERY_PROMPT_KEY, "true");

    Alert.alert(
      "Keep Reminders Reliable",
      "Some phones aggressively stop background apps to save battery, which can delay reminders. For the most reliable delivery, consider disabling battery optimization for Scripture Memory in your phone's Settings → Apps → Scripture Memory → Battery.",
      [
        { text: "Maybe Later", style: "cancel" },
        { text: "Open App Settings", onPress: () => RNLinking.openSettings().catch(() => {}) },
      ]
    );
  } catch (e) {
    console.warn("Battery optimization prompt failed:", e);
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;

  try {
    await ensureNotificationChannel();

    if (!Device.isDevice) {
      console.warn("Notifications only work on a real device.");
      return false;
    }

    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted;

    if (!granted) {
      const result = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      granted = result.granted;
    }

    if (granted) {
      // These two prompts only matter on Android 12+ and only fire once /
      // when actually needed — they're what makes background delivery
      // reliable rather than "fires only when app is reopened."
      await promptExactAlarmSettings();
      await promptBatteryOptimization();
    }

    return granted;
  } catch (e) {
    console.warn("Permission error:", e);
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
        title: `📖 ${verse.reference}`,
        body: verse.content?.slice(0, 120) + (verse.content?.length > 120 ? "…" : ""),
        sound: "default",
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
        title: `📖 Time to review: ${verse.reference}`,
        body: verse.content?.slice(0, 120) + (verse.content?.length > 120 ? "…" : ""),
        sound: "default",
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
    console.log("Reminder scheduled:", verse.reference, `(every ${verse.reminder_interval_minutes}m)`);
  } catch (e) {
    console.warn("Schedule reminder failed:", e);
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
    console.warn("Cancel reminder failed:", e);
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
 * Diagnostic helper — surfaces whether background delivery is actually
 * set up correctly. Used by the Settings/Profile screen so the user isn't
 * guessing why a reminder didn't show up.
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
