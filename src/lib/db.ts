import * as SQLite from "expo-sqlite";
import { Verse, Category } from "@/types";

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

      -- Local-first storage: this device's on-disk copy IS the app's data,
      -- not a cache of something else. Every verse, category, memorization
      -- status, and streak-relevant field lives here first and is written
      -- here synchronously on every add/edit/delete — the app works fully
      -- offline because there is no round trip to the cloud in that path.
      -- The cloud (see src/lib/backup.ts) only ever sees an encrypted
      -- snapshot of these two tables, made when the user backs up.
      CREATE TABLE IF NOT EXISTS local_verses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        reference TEXT NOT NULL,
        content TEXT NOT NULL,
        translation TEXT NOT NULL,
        category_id TEXT,
        status TEXT NOT NULL,
        date_started TEXT NOT NULL,
        date_mastered TEXT,
        reminder_interval_minutes INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS local_verses_user_idx ON local_verses (user_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS local_categories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS local_categories_user_idx ON local_categories (user_id, name);

      -- Legacy read-through cache from when Supabase was the primary
      -- store. Kept only so upgrading users don't lose data before their
      -- first local-first launch migrates it (see migrateLegacyCache
      -- below); no longer written to going forward.
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

/**
 * Local-first verse & category storage.
 *
 * These functions are the app's real database access layer now —
 * useVerses() reads and writes through these, not through Supabase. Every
 * function here resolves in a few milliseconds because it never touches
 * the network; that's what makes Add/Edit/Delete/Mark-as-mastered work
 * identically with wifi on, wifi off, or airplane mode.
 */
export async function getAllLocalVerses(userId: string): Promise<Verse[]> {
  return enqueue(async () => {
    const db = await getDatabase();
    return db.getAllAsync<Verse>(
      `SELECT * FROM local_verses WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
  });
}

export async function getAllLocalCategories(userId: string): Promise<Category[]> {
  return enqueue(async () => {
    const db = await getDatabase();
    return db.getAllAsync<Category>(
      `SELECT * FROM local_categories WHERE user_id = ? ORDER BY name`,
      [userId]
    );
  });
}

export async function insertLocalVerse(verse: Verse) {
  return enqueue(async () => {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO local_verses
       (id,user_id,reference,content,translation,category_id,status,date_started,date_mastered,reminder_interval_minutes,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        verse.id,
        verse.user_id,
        verse.reference,
        verse.content,
        verse.translation,
        verse.category_id,
        verse.status,
        verse.date_started,
        verse.date_mastered,
        verse.reminder_interval_minutes,
        verse.created_at,
      ]
    );
  });
}

export async function updateLocalVerse(verse: Verse) {
  return enqueue(async () => {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE local_verses SET
        reference = ?, content = ?, translation = ?, category_id = ?,
        status = ?, date_started = ?, date_mastered = ?, reminder_interval_minutes = ?
       WHERE id = ?`,
      [
        verse.reference,
        verse.content,
        verse.translation,
        verse.category_id,
        verse.status,
        verse.date_started,
        verse.date_mastered,
        verse.reminder_interval_minutes,
        verse.id,
      ]
    );
  });
}

export async function deleteLocalVerse(verseId: string) {
  return enqueue(async () => {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM local_verses WHERE id = ?`, [verseId]);
  });
}

export async function insertLocalCategory(category: Category) {
  return enqueue(async () => {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO local_categories (id,user_id,name,color,created_at) VALUES (?,?,?,?,?)`,
      [category.id, category.user_id, category.name, category.color, category.created_at]
    );
  });
}

export async function deleteLocalCategory(categoryId: string) {
  return enqueue(async () => {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM local_categories WHERE id = ?`, [categoryId]);
    // Verses in a deleted category fall back to "uncategorized" rather
    // than pointing at an id that no longer exists.
    await db.runAsync(`UPDATE local_verses SET category_id = NULL WHERE category_id = ?`, [
      categoryId,
    ]);
  });
}

/**
 * Wipes and replaces all of a user's local verses/categories in one
 * transaction. Used exclusively by Backup & Restore (src/lib/backup.ts)
 * when restoring a snapshot — e.g. after signing in on a new device.
 */
export async function replaceAllLocalData(
  userId: string,
  verses: Verse[],
  categories: Category[]
) {
  return enqueue(async () => {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM local_verses WHERE user_id = ?`, [userId]);
      await db.runAsync(`DELETE FROM local_categories WHERE user_id = ?`, [userId]);

      for (const category of categories) {
        await db.runAsync(
          `INSERT INTO local_categories (id,user_id,name,color,created_at) VALUES (?,?,?,?,?)`,
          [category.id, category.user_id, category.name, category.color, category.created_at]
        );
      }

      for (const verse of verses) {
        await db.runAsync(
          `INSERT INTO local_verses
           (id,user_id,reference,content,translation,category_id,status,date_started,date_mastered,reminder_interval_minutes,created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          [
            verse.id,
            verse.user_id,
            verse.reference,
            verse.content,
            verse.translation,
            verse.category_id,
            verse.status,
            verse.date_started,
            verse.date_mastered,
            verse.reminder_interval_minutes,
            verse.created_at,
          ]
        );
      }
    });
  });
}

/**
 * One-time upgrade path: if this device still has verses in the old
 * Supabase-backed cache table but nothing yet in local_verses, copy them
 * over so upgrading users don't see an empty app on first launch after
 * the local-first update. Safe to call on every startup — it's a no-op
 * once local_verses has data for this user.
 */
export async function migrateLegacyCacheIfNeeded(userId: string) {
  return enqueue(async () => {
    const db = await getDatabase();

    const existing = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM local_verses WHERE user_id = ?`,
      [userId]
    );
    if ((existing?.count ?? 0) > 0) return;

    const legacyRows = await db.getAllAsync<{ data: string }>(`SELECT data FROM verses_cache`);
    if (legacyRows.length === 0) return;

    const legacyVerses: Verse[] = legacyRows
      .map((r) => {
        try {
          return JSON.parse(r.data) as Verse;
        } catch {
          return null;
        }
      })
      .filter((v): v is Verse => v !== null && v.user_id === userId);

    for (const verse of legacyVerses) {
      await db.runAsync(
        `INSERT OR IGNORE INTO local_verses
         (id,user_id,reference,content,translation,category_id,status,date_started,date_mastered,reminder_interval_minutes,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          verse.id,
          verse.user_id,
          verse.reference,
          verse.content,
          verse.translation,
          verse.category_id,
          verse.status,
          verse.date_started,
          verse.date_mastered,
          verse.reminder_interval_minutes,
          verse.created_at,
        ]
      );
    }
  });
}

export async function saveNotificationIds(verseId: string, notificationIds: string[]) {
  return enqueue(async () => {
    const db = await getDatabase();

    // Replace, not append. This function is always meant to represent
    // "this verse's current full set of scheduled notification ids" —
    // callers (scheduleVerseReminder) already cancel + clear the previous
    // batch first, but doing the delete here too, in the same
    // transaction as the insert, means this table can never end up with
    // stale rows from a previous batch even if that invariant is ever
    // violated by a future caller. Stale rows here are exactly what would
    // make topUpAllReminders() miscount a verse's remaining reminders and
    // trigger an unnecessary, overlapping re-schedule.
    await db.withTransactionAsync(async () => {
      await db.runAsync(`DELETE FROM notification_schedule WHERE verse_id = ?`, [verseId]);

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
      DELETE FROM local_verses;
      DELETE FROM local_categories;
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