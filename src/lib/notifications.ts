import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

const isExpoGo = Constants.appOwnership === "expo";

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

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(
        "verse-reminders",
        {
          name: "Verse Reminders",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          enableLights: true,
          enableVibrate: true,
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
        }
      );
    }

    const existing =
      await Notifications.getPermissionsAsync();

    if (existing.granted) {
      return true;
    }

    if (!Device.isDevice) {
      console.warn(
        "Notifications only work on a real device."
      );
      return false;
    }

    const request =
      await Notifications.requestPermissionsAsync();

    return request.granted;
  } catch (e) {
    console.warn(e);
    return false;
  }
}

export async function scheduleVerseReminder(
  verse: any
) {
  if (!Notifications) return;

  try {
    const {
      saveNotificationId,
    } = await import("./db");

    await cancelVerseReminder(verse.id);

    // Immediate notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: verse.reference,
        body: verse.content,
        sound: "default",
        data: {
          verseId: verse.id,
        },
      },
      trigger: null,
    });

    // Repeating notification
    const id =
      await Notifications.scheduleNotificationAsync({
        content: {
          title: verse.reference,
          body: verse.content,
          sound: "default",
          data: {
            verseId: verse.id,
          },
        },
        trigger: {
          type:
            Notifications
              .SchedulableTriggerInputTypes
              .TIME_INTERVAL,
          seconds: Math.max(
            60,
            verse.reminder_interval_minutes * 60
          ),
          repeats: true,
        },
      });

    await saveNotificationId(
      verse.id,
      id
    );

    console.log(
      "Reminder scheduled:",
      verse.reference
    );
  } catch (e) {
    console.warn(
      "Schedule reminder failed",
      e
    );
  }
}

export async function cancelVerseReminder(
  verseId: string
) {
  if (!Notifications) return;

  try {
    const {
      getNotificationId,
      clearNotificationId,
    } = await import("./db");

    const id =
      await getNotificationId(verseId);

    if (!id) return;

    await Notifications.cancelScheduledNotificationAsync(
      id
    );

    await clearNotificationId(
      verseId
    );

    console.log(
      "Reminder cancelled:",
      verseId
    );
  } catch (e) {
    console.warn(
      "Cancel reminder failed",
      e
    );
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