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

// ---------------------------------------------------------------------
// Backup & Restore preferences (see src/lib/backup.ts, app/backup.tsx)
// ---------------------------------------------------------------------
export type BackupFrequency = "daily" | "weekly" | "monthly";

const BACKUP_ENABLED_KEY = "pref:backupEnabled";
const BACKUP_FREQUENCY_KEY = "pref:backupFrequency";
const BACKUP_LAST_AT_KEY = "pref:backupLastAt";

const DEFAULT_BACKUP_FREQUENCY: BackupFrequency = "weekly";

export interface BackupSettings {
  enabled: boolean;
  frequency: BackupFrequency;
  /** ISO timestamp of the last successful backup, or null if never backed up. */
  lastBackupAt: string | null;
}

export async function getBackupSettings(): Promise<BackupSettings> {
  try {
    const [enabledRaw, frequencyRaw, lastAt] = await Promise.all([
      AsyncStorage.getItem(BACKUP_ENABLED_KEY),
      AsyncStorage.getItem(BACKUP_FREQUENCY_KEY),
      AsyncStorage.getItem(BACKUP_LAST_AT_KEY),
    ]);

    const frequency: BackupFrequency =
      frequencyRaw === "daily" || frequencyRaw === "weekly" || frequencyRaw === "monthly"
        ? frequencyRaw
        : DEFAULT_BACKUP_FREQUENCY;

    return {
      enabled: enabledRaw === "true",
      frequency,
      lastBackupAt: lastAt,
    };
  } catch (e) {
    console.warn("Failed to read backup settings", e);
    return { enabled: false, frequency: DEFAULT_BACKUP_FREQUENCY, lastBackupAt: null };
  }
}

export async function setBackupEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BACKUP_ENABLED_KEY, enabled ? "true" : "false");
}

export async function setBackupFrequency(frequency: BackupFrequency): Promise<void> {
  await AsyncStorage.setItem(BACKUP_FREQUENCY_KEY, frequency);
}

export async function setLastBackupAt(iso: string): Promise<void> {
  await AsyncStorage.setItem(BACKUP_LAST_AT_KEY, iso);
}
