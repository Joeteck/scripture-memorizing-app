import * as SQLite from "expo-sqlite";
import { Verse } from "@/types";

let database: Promise<SQLite.SQLiteDatabase> | null = null;

function getDatabase() {
  if (!database) {
    database = SQLite.openDatabaseAsync("scripture_memory.db");
  }

  return database;
}

/**
 * Every exported function in this file goes through this queue.
 *
 * useVerses(userId) is called independently from five different tab
 * screens (Today, Dashboard, Add, Categories, History), and expo-router's
 * Tabs navigator keeps all of them mounted at once rather than unmounting
 * inactive tabs. Each one calls refresh() on mount, and each refresh()
 * calls cacheVerses(), which opens a SQLite transaction. Without this
 * queue, two tabs refreshing close together can both try to open a
 * transaction on the same shared connection at once, which SQLite
 * rejects ("cannot start a transaction within a transaction"). Chaining
 * every call through one promise queue guarantees they run one at a time,
 * in call order, no matter how many screens are mounted simultaneously.
 */
let writeQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(task);
  // Swallow rejections here so one failed call doesn't permanently jam
  // the queue for everything after it — the actual error still propagates
  // to whoever called this function, via `result`.
  writeQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

export async function initDb() {
  return enqueue(async () => {
    const db = await getDatabase();

    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS verses_cache (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notification_map (
        verse_id TEXT PRIMARY KEY,
        notification_id TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS error_log_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        stack TEXT,
        context TEXT,
        created_at TEXT NOT NULL
      );
    `);
  });
}

/**
 * Local, on-device error log queue. This is the durability layer behind
 * src/lib/monitoring.ts: every error is written here first (so it survives
 * even if the device is offline or the Supabase insert fails), then
 * monitoring.ts tries to sync rows to Supabase and deletes them locally
 * once that succeeds. Capped at MAX_ERROR_LOG_ROWS so a device that's
 * offline for a long time doesn't grow this table forever.
 */
const MAX_ERROR_LOG_ROWS = 300;

export interface LocalErrorLogRow {
  id: number;
  severity: string;
  message: string;
  stack: string | null;
  context: string | null;
  created_at: string;
}

export async function queueErrorLog(row: {
  severity: string;
  message: string;
  stack?: string | null;
  context?: string | null;
}) {
  return enqueue(async () => {
    const db = await getDatabase();

    await db.runAsync(
      `
      INSERT INTO error_log_queue
      (severity,message,stack,context,created_at)
      VALUES(?,?,?,?,?)
      `,
      [
        row.severity,
        row.message,
        row.stack ?? null,
        row.context ?? null,
        new Date().toISOString(),
      ]
    );

    await db.runAsync(
      `
      DELETE FROM error_log_queue
      WHERE id NOT IN (
        SELECT id FROM error_log_queue ORDER BY id DESC LIMIT ?
      )
      `,
      [MAX_ERROR_LOG_ROWS]
    );
  });
}

export async function getQueuedErrorLogs(limit = 50): Promise<LocalErrorLogRow[]> {
  return enqueue(async () => {
    const db = await getDatabase();

    return db.getAllAsync<LocalErrorLogRow>(
      `
      SELECT id, severity, message, stack, context, created_at
      FROM error_log_queue
      ORDER BY id ASC
      LIMIT ?
      `,
      [limit]
    );
  });
}

export async function deleteQueuedErrorLogs(ids: number[]) {
  if (ids.length === 0) return;

  return enqueue(async () => {
    const db = await getDatabase();
    const placeholders = ids.map(() => "?").join(",");

    await db.runAsync(
      `DELETE FROM error_log_queue WHERE id IN (${placeholders})`,
      ids
    );
  });
}

export async function cacheVerses(verses: Verse[]) {
  return enqueue(async () => {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      await db.runAsync("DELETE FROM verses_cache");

      for (const verse of verses) {
        await db.runAsync(
          `
          INSERT INTO verses_cache
          (id,data,updated_at)
          VALUES(?,?,?)
          `,
          [verse.id, JSON.stringify(verse), now]
        );
      }
    });
  });
}

export async function getCachedVerses(): Promise<Verse[]> {
  return enqueue(async () => {
    const db = await getDatabase();

    const rows = await db.getAllAsync<{ data: string }>(
      `
      SELECT data
      FROM verses_cache
      ORDER BY updated_at DESC
      `
    );

    return rows.map((r) => JSON.parse(r.data));
  });
}

export async function cacheVerse(verse: Verse) {
  return enqueue(async () => {
    const db = await getDatabase();

    await db.runAsync(
      `
      INSERT OR REPLACE INTO verses_cache
      (id,data,updated_at)
      VALUES(?,?,?)
      `,
      [verse.id, JSON.stringify(verse), new Date().toISOString()]
    );
  });
}

export async function removeCachedVerse(verseId: string) {
  return enqueue(async () => {
    const db = await getDatabase();

    await db.runAsync(
      `
      DELETE FROM verses_cache
      WHERE id=?
      `,
      [verseId]
    );
  });
}

export async function clearVerseCache() {
  return enqueue(async () => {
    const db = await getDatabase();

    await db.runAsync(
      `
      DELETE FROM verses_cache
      `
    );
  });
}

export async function saveNotificationId(verseId: string, notificationId: string) {
  return enqueue(async () => {
    const db = await getDatabase();

    await db.runAsync(
      `
      INSERT OR REPLACE INTO notification_map
      (verse_id,notification_id)
      VALUES(?,?)
      `,
      [verseId, notificationId]
    );
  });
}

export async function getNotificationId(verseId: string): Promise<string | null> {
  return enqueue(async () => {
    const db = await getDatabase();

    const row = await db.getFirstAsync<{ notification_id: string }>(
      `
      SELECT notification_id
      FROM notification_map
      WHERE verse_id=?
      `,
      [verseId]
    );

    return row?.notification_id ?? null;
  });
}

export async function clearNotificationId(verseId: string) {
  return enqueue(async () => {
    const db = await getDatabase();

    await db.runAsync(
      `
      DELETE FROM notification_map
      WHERE verse_id=?
      `,
      [verseId]
    );
  });
}

export async function clearNotificationCache() {
  return enqueue(async () => {
    const db = await getDatabase();

    await db.runAsync(
      `
      DELETE FROM notification_map
      `
    );
  });
}

export async function resetLocalDatabase() {
  return enqueue(async () => {
    const db = await getDatabase();

    await db.execAsync(`
      DELETE FROM verses_cache;
      DELETE FROM notification_map;
    `);
  });
}