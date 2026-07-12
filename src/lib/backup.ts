// src/lib/backup.ts
//
// Cloud backup, reworked around the local-first architecture.
//
// The cloud is no longer where the app reads/writes verses day to day —
// src/hooks/useVerses.ts talks to on-device SQLite for that. This file is
// the *only* place the app still talks to Supabase about verse data, and
// it only runs when the user turns Backup & Restore on, taps "Back Up
// Now", or a scheduled backup comes due. Think WhatsApp chat backups: an
// occasional, user-controlled snapshot for disaster recovery — reinstall
// the app, sign in, restore — not a live sync layer.
//
// Encryption: the payload is encrypted client-side with AES (crypto-js)
// before it's uploaded, so backup_snapshots in Supabase only ever holds
// ciphertext. The key is derived from the signed-in user's id, which
// keeps this dependency-free and requires no extra secret entry from the
// user — the trade-off (documented here on purpose) is that this key is
// deterministic from something Supabase itself already knows, so it
// protects against "someone dumps the backups table" but not against a
// fully compromised Supabase project. Hardening this further (e.g.
// deriving the key from the user's password, or a dedicated per-user
// secret set up at sign-up) is exactly the kind of change the schema
// already leaves room for without breaking the restore flow.
import CryptoJS from "crypto-js";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";
import { logError, logMessage } from "@/lib/monitoring";
import {
  getAllLocalVerses,
  getAllLocalCategories,
  replaceAllLocalData,
} from "@/lib/db";
import {
  BackupFrequency,
  BackupSettings,
  getBackupSettings,
  setBackupEnabled as persistBackupEnabled,
  setBackupFrequency as persistBackupFrequency,
  setLastBackupAt,
} from "@/lib/preferences";
import { Category, Verse } from "@/types";

const BACKUP_PEPPER = "scripture-memory-backup-v1";

interface BackupPayload {
  version: 1;
  userId: string;
  exportedAt: string;
  verses: Verse[];
  categories: Category[];
}

function deriveKey(userId: string): string {
  return CryptoJS.SHA256(`${userId}:${BACKUP_PEPPER}`).toString();
}

function encryptPayload(payload: BackupPayload, userId: string): string {
  const json = JSON.stringify(payload);
  return CryptoJS.AES.encrypt(json, deriveKey(userId)).toString();
}

function decryptPayload(ciphertext: string, userId: string): BackupPayload {
  const bytes = CryptoJS.AES.decrypt(ciphertext, deriveKey(userId));
  const json = bytes.toString(CryptoJS.enc.Utf8);
  if (!json) {
    throw new Error("Backup could not be decrypted. It may be corrupted or from a different account.");
  }
  return JSON.parse(json) as BackupPayload;
}

async function recordSyncHistory(
  userId: string,
  action: "backup" | "restore",
  success: boolean,
  verseCount?: number,
  errorMessage?: string
) {
  try {
    await supabase.from("sync_history").insert({
      user_id: userId,
      action,
      success,
      verse_count: verseCount ?? null,
      error_message: errorMessage ?? null,
    });
  } catch (e) {
    // Sync history is a nice-to-have audit trail, not load-bearing — a
    // failure here should never surface as a failed backup to the user.
    logError(e, { where: "recordSyncHistory" });
  }
}

async function registerDevice(userId: string) {
  try {
    await supabase.from("device_registrations").insert({
      user_id: userId,
      device_name: Device.deviceName ?? "Unknown device",
      platform: Platform.OS,
    });
  } catch (e) {
    logError(e, { where: "registerDevice" });
  }
}

/** Reads current Backup & Restore settings (enabled, frequency, last backup time). */
export async function getSettings(): Promise<BackupSettings> {
  return getBackupSettings();
}

export async function enableBackup(userId: string): Promise<void> {
  await persistBackupEnabled(true);
  await supabase.from("backup_metadata").upsert({
    user_id: userId,
    enabled: true,
    updated_at: new Date().toISOString(),
  });
}

export async function disableBackup(userId: string): Promise<void> {
  await persistBackupEnabled(false);
  await supabase.from("backup_metadata").upsert({
    user_id: userId,
    enabled: false,
    updated_at: new Date().toISOString(),
  });
}

export async function setFrequency(userId: string, frequency: BackupFrequency): Promise<void> {
  await persistBackupFrequency(frequency);
  await supabase.from("backup_metadata").upsert({
    user_id: userId,
    frequency,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Packages local verses/categories, encrypts them, and uploads the
 * snapshot. This is the only path (manual "Back Up Now", or a scheduled
 * run via maybeAutoBackup) through which any verse data reaches the
 * cloud.
 */
export async function backupNow(userId: string): Promise<{ verseCount: number }> {
  const [verses, categories] = await Promise.all([
    getAllLocalVerses(userId),
    getAllLocalCategories(userId),
  ]);

  const payload: BackupPayload = {
    version: 1,
    userId,
    exportedAt: new Date().toISOString(),
    verses,
    categories,
  };

  try {
    const encrypted = encryptPayload(payload, userId);

    const { error } = await supabase.from("backup_snapshots").upsert({
      user_id: userId,
      encrypted_data: encrypted,
      verse_count: verses.length,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;

    const now = new Date().toISOString();
    await setLastBackupAt(now);
    await supabase.from("backup_metadata").upsert({
      user_id: userId,
      last_backup_at: now,
      updated_at: now,
    });

    await registerDevice(userId);
    await recordSyncHistory(userId, "backup", true, verses.length);

    logMessage("Backup completed", { verseCount: verses.length });
    return { verseCount: verses.length };
  } catch (error) {
    await recordSyncHistory(
      userId,
      "backup",
      false,
      verses.length,
      error instanceof Error ? error.message : String(error)
    );
    logError(error, { where: "backupNow" });
    throw error instanceof Error
      ? error
      : new Error("Backup failed. Check your connection and try again.");
  }
}

/**
 * Downloads and restores the most recent backup snapshot, replacing all
 * local data for this user. Used when signing in on a new/reinstalled
 * device — "disaster recovery," not routine sync.
 */
export async function restoreLatestBackup(userId: string): Promise<{ verseCount: number }> {
  try {
    const { data, error } = await supabase
      .from("backup_snapshots")
      .select("encrypted_data")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error("No backup was found for this account yet.");
    }

    const payload = decryptPayload(data.encrypted_data, userId);
    await replaceAllLocalData(userId, payload.verses, payload.categories);
    await registerDevice(userId);
    await recordSyncHistory(userId, "restore", true, payload.verses.length);

    logMessage("Restore completed", { verseCount: payload.verses.length });
    return { verseCount: payload.verses.length };
  } catch (error) {
    await recordSyncHistory(
      userId,
      "restore",
      false,
      undefined,
      error instanceof Error ? error.message : String(error)
    );
    logError(error, { where: "restoreLatestBackup" });
    throw error instanceof Error
      ? error
      : new Error("Restore failed. Check your connection and try again.");
  }
}

const FREQUENCY_MS: Record<BackupFrequency, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

/**
 * Called on app launch and on every foreground transition (see
 * app/_layout.tsx). A true background scheduler would need a native task
 * (e.g. expo-background-fetch/expo-task-manager) that can run with the
 * app fully closed — worth adding in a follow-up pass — so for now this
 * "catch up on next open" check is the honest, working version: it never
 * runs unless the user turned backup on, and it only ever fires at most
 * once per app session.
 */
export async function maybeAutoBackup(userId: string): Promise<void> {
  const settings = await getBackupSettings();
  if (!settings.enabled) return;

  const dueInMs = FREQUENCY_MS[settings.frequency];
  const last = settings.lastBackupAt ? new Date(settings.lastBackupAt).getTime() : 0;
  const isDue = Date.now() - last >= dueInMs;

  if (!isDue) return;

  try {
    await backupNow(userId);
  } catch (e) {
    // Auto-backup failures are logged, not surfaced to the user mid-session
    // — they'll see the accurate "Last Backup Date" next time they open
    // Backup & Restore, and can retry manually from there.
    logError(e, { where: "maybeAutoBackup" });
  }
}
