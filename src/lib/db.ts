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

      -- Replaced by notification_schedule below (batch scheduling needs
      -- many notification ids per verse, not one). This data is a pure
      -- cache of scheduled-notification IDs — nothing a user would
      -- notice losing — so a clean drop is simpler and safer than a
      -- row-by-row migration.
      DROP TABLE IF EXISTS notification_map;

      CREATE TABLE IF NOT EXISTS notification_schedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        verse_id TEXT NOT NULL,
        notification_id TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS notification_schedule_verse_idx
        ON notification_schedule (verse_id);

      CREATE TABLE IF NOT EXISTS error_log_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        stack TEXT,
        context TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        verse_id TEXT NOT NULL,
        correct_count INTEGER NOT NULL,
        total_blanks INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS quiz_attempts_verse_idx ON quiz_attempts (verse_id, id DESC);
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

export async function saveNotificationIds(verseId: string, notificationIds: string[]) {
  return enqueue(async () => {
    const db = await getDatabase();

    for (const notificationId of notificationIds) {
      await db.runAsync(
        `
        INSERT INTO notification_schedule
        (verse_id,notification_id)
        VALUES(?,?)
        `,
        [verseId, notificationId]
      );
    }
  });
}

export async function getNotificationIds(verseId: string): Promise<string[]> {
  return enqueue(async () => {
    const db = await getDatabase();

    const rows = await db.getAllAsync<{ notification_id: string }>(
      `
      SELECT notification_id
      FROM notification_schedule
      WHERE verse_id=?
      `,
      [verseId]
    );

    return rows.map((r) => r.notification_id);
  });
}

export async function clearNotificationIds(verseId: string) {
  return enqueue(async () => {
    const db = await getDatabase();

    await db.runAsync(
      `
      DELETE FROM notification_schedule
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
      DELETE FROM notification_schedule
      `
    );
  });
}

export async function resetLocalDatabase() {
  return enqueue(async () => {
    const db = await getDatabase();

    await db.execAsync(`
      DELETE FROM verses_cache;
      DELETE FROM notification_schedule;
      DELETE FROM quiz_attempts;
    `);
  });
}

/**
 * "Test Yourself" quiz history — device-local only (not synced to
 * Supabase). Good enough for v1: streaks and best-score are just used to
 * nudge the user toward marking a verse mastered, not as a source of
 * truth that needs to survive a reinstall or follow them across devices.
 */
export interface QuizAttemptRow {
  id: number;
  verse_id: string;
  correct_count: number;
  total_blanks: number;
  created_at: string;
}

export async function recordQuizAttempt(
  verseId: string,
  correctCount: number,
  totalBlanks: number
) {
  return enqueue(async () => {
    const db = await getDatabase();

    await db.runAsync(
      `
      INSERT INTO quiz_attempts (verse_id, correct_count, total_blanks, created_at)
      VALUES (?,?,?,?)
      `,
      [verseId, correctCount, totalBlanks, new Date().toISOString()]
    );
  });
}

export async function getQuizAttemptsForVerse(
  verseId: string,
  limit = 20
): Promise<QuizAttemptRow[]> {
  return enqueue(async () => {
    const db = await getDatabase();

    return db.getAllAsync<QuizAttemptRow>(
      `
      SELECT id, verse_id, correct_count, total_blanks, created_at
      FROM quiz_attempts
      WHERE verse_id = ?
      ORDER BY id DESC
      LIMIT ?
      `,
      [verseId, limit]
    );
  });
}