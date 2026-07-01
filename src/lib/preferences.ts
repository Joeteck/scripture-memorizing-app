import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "system" | "light" | "dark";

const THEME_MODE_KEY = "pref:themeMode";
const DEFAULT_REMINDER_KEY = "pref:defaultReminderInterval";

const FALLBACK_REMINDER_MINUTES = 60;

/** The user's appearance choice — defaults to following the OS setting. */
export async function getThemeMode(): Promise<ThemeMode> {
  try {
    const stored = await AsyncStorage.getItem(THEME_MODE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch (e) {
    console.warn("Failed to read theme mode preference", e);
  }
  return "system";
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_MODE_KEY, mode);
  } catch (e) {
    console.warn("Failed to save theme mode preference", e);
  }
}

/** Default reminder interval (minutes) pre-filled when adding a new verse. */
export async function getDefaultReminderInterval(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(DEFAULT_REMINDER_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (e) {
    console.warn("Failed to read default reminder interval", e);
  }
  return FALLBACK_REMINDER_MINUTES;
}

export async function setDefaultReminderInterval(minutes: number): Promise<void> {
  try {
    await AsyncStorage.setItem(DEFAULT_REMINDER_KEY, String(minutes));
  } catch (e) {
    console.warn("Failed to save default reminder interval", e);
  }
}
