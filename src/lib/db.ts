import * as SQLite from "expo-sqlite";
import { Verse } from "@/types";

let database: Promise<SQLite.SQLiteDatabase> | null = null;

function getDatabase() {
  if (!database) {
    database = SQLite.openDatabaseAsync(
      "scripture_memory.db"
    );
  }

  return database;
}

export async function initDb() {
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
  `);
}

export async function cacheVerses(
  verses: Verse[]
) {
  const db = await getDatabase();

  const now =
    new Date().toISOString();

  await db.withTransactionAsync(
    async () => {
      await db.runAsync(
        "DELETE FROM verses_cache"
      );

      for (const verse of verses) {
        await db.runAsync(
          `
          INSERT INTO verses_cache
          (id,data,updated_at)
          VALUES(?,?,?)
          `,
          [
            verse.id,
            JSON.stringify(
              verse
            ),
            now,
          ]
        );
      }
    }
  );
}

export async function getCachedVerses(): Promise<
  Verse[]
> {
  const db =
    await getDatabase();

  const rows =
    await db.getAllAsync<{
      data: string;
    }>(
      `
      SELECT data
      FROM verses_cache
      ORDER BY updated_at DESC
      `
    );

  return rows.map((r) =>
    JSON.parse(r.data)
  );
}

export async function cacheVerse(
  verse: Verse
) {
  const db =
    await getDatabase();

  await db.runAsync(
    `
    INSERT OR REPLACE INTO verses_cache
    (id,data,updated_at)
    VALUES(?,?,?)
    `,
    [
      verse.id,
      JSON.stringify(
        verse
      ),
      new Date().toISOString(),
    ]
  );
}

export async function removeCachedVerse(
  verseId: string
) {
  const db =
    await getDatabase();

  await db.runAsync(
    `
    DELETE FROM verses_cache
    WHERE id=?
    `,
    [verseId]
  );
}

export async function clearVerseCache() {
  const db =
    await getDatabase();

  await db.runAsync(
    `
    DELETE FROM verses_cache
    `
  );
}

export async function saveNotificationId(
  verseId: string,
  notificationId: string
) {
  const db =
    await getDatabase();

  await db.runAsync(
    `
    INSERT OR REPLACE INTO notification_map
    (verse_id,notification_id)
    VALUES(?,?)
    `,
    [
      verseId,
      notificationId,
    ]
  );
}

export async function getNotificationId(
  verseId: string
): Promise<string | null> {
  const db =
    await getDatabase();

  const row =
    await db.getFirstAsync<{
      notification_id: string;
    }>(
      `
      SELECT notification_id
      FROM notification_map
      WHERE verse_id=?
      `,
      [verseId]
    );

  return (
    row?.notification_id ??
    null
  );
}

export async function clearNotificationId(
  verseId: string
) {
  const db =
    await getDatabase();

  await db.runAsync(
    `
    DELETE FROM notification_map
    WHERE verse_id=?
    `,
    [verseId]
  );
}

export async function clearNotificationCache() {
  const db =
    await getDatabase();

  await db.runAsync(
    `
    DELETE FROM notification_map
    `
  );
}

export async function resetLocalDatabase() {
  const db =
    await getDatabase();

  await db.execAsync(`
    DELETE FROM verses_cache;
    DELETE FROM notification_map;
  `);
}