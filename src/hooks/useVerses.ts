// hooks/useVerses.ts
//
// Local-first data store for verses and categories.
//
// IMPORTANT: This is a shared singleton store, not a per-component hook
// with isolated state. The (tabs)/_layout.tsx pager keeps all 5 tab
// screens mounted at once (Today, Dashboard, Add, Categories, History),
// and each one calls useVerses(userId). If each call created its own
// independent useState, creating a category on the Categories tab would
// never be visible on the Add tab until that tab unmounted and remounted.
// Instead, all verses/categories state lives in one module-level store,
// and every component calling useVerses subscribes to it. Any mutation
// (addVerse, addCategory, markStatus, deleteVerse) updates the shared
// store once, and every mounted tab re-renders immediately.
//
// LOCAL-FIRST: every mutation below writes to the on-device SQLite
// database (src/lib/db.ts) and nothing else. There is no Supabase insert
// on the add/edit/delete path, so all of it — including creating a new
// verse — works with no network connection. The only thing that still
// needs the network is fetching the scripture text itself for a *new*
// reference (src/lib/bibleApi.ts hits a public Bible API), because the
// app doesn't bundle the text of the whole Bible; once a verse has been
// fetched once, it's saved locally and never needs the network again.
//
// The cloud is no longer this store's data source. It's an optional,
// user-initiated backup target — see src/lib/backup.ts and app/backup.tsx.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { logError } from "@/lib/monitoring";
import {
  getAllLocalVerses,
  getAllLocalCategories,
  insertLocalVerse,
  updateLocalVerse,
  deleteLocalVerse,
  insertLocalCategory,
  deleteLocalCategory,
  migrateLegacyCacheIfNeeded,
} from "@/lib/db";
import {
  scheduleVerseReminder,
  cancelVerseReminder,
} from "@/lib/notifications";
import { fetchVerse } from "@/lib/bibleApi";
import { generateId } from "@/lib/id";
import { Category, Verse, VerseStatus } from "@/types";

interface StoreState {
  userId: string | null;
  verses: Verse[];
  categories: Category[];
  loading: boolean;
}

const store: StoreState = {
  userId: null,
  verses: [],
  categories: [],
  loading: true,
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function setStore(partial: Partial<StoreState>) {
  Object.assign(store, partial);
  notify();
}

async function refreshStore(userId: string | null) {
  if (!userId) {
    setStore({ userId, verses: [], categories: [], loading: false });
    return;
  }

  setStore({ userId, loading: true });

  try {
    await migrateLegacyCacheIfNeeded(userId);

    const [verses, categories] = await Promise.all([
      getAllLocalVerses(userId),
      getAllLocalCategories(userId),
    ]);

    setStore({ verses, categories, loading: false });
  } catch (error) {
    logError(error, { where: "refreshStore (local-first read)" });
    setStore({ loading: false });
  }
}

export function useVerses(userId: string | null) {
  const [, forceRender] = useState(0);
  const mountedUserId = useRef<string | null>(null);

  useEffect(() => {
    const listener = () => forceRender((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Refresh when the active user changes (e.g. sign-in/out), or on first
  // mount if the store hasn't been loaded for this user yet.
  useEffect(() => {
    if (mountedUserId.current === userId && store.userId === userId) return;
    mountedUserId.current = userId;
    refreshStore(userId);
  }, [userId]);

  const refresh = useCallback(() => refreshStore(userId), [userId]);

  const addVerse = useCallback(
    async (params: {
      reference: string;
      categoryId: string | null;
      reminderIntervalMinutes: number;
      translation?: string;
      /** Pass an already-fetched preview (see Add Verse's search-then-preview
       * flow) to avoid a duplicate network call for text that's already on
       * screen. */
      fetched?: { reference: string; text: string; translation: string };
    }) => {
      if (!userId) throw new Error("Not signed in.");

      const fetched = params.fetched ?? (await fetchVerse(params.reference, params.translation));

      const verse: Verse = {
        id: generateId(),
        user_id: userId,
        reference: fetched.reference,
        content: fetched.text,
        translation: fetched.translation,
        category_id: params.categoryId,
        status: "learning",
        date_started: new Date().toISOString().slice(0, 10),
        date_mastered: null,
        reminder_interval_minutes: params.reminderIntervalMinutes,
        created_at: new Date().toISOString(),
      };

      await insertLocalVerse(verse);
      setStore({ verses: [verse, ...store.verses] });
      await scheduleVerseReminder(verse);

      return verse;
    },
    [userId]
  );

  const markStatus = useCallback(async (verseId: string, status: VerseStatus) => {
    const existing = store.verses.find((v) => v.id === verseId);
    if (!existing) throw new Error("Verse not found.");

    const updated: Verse = {
      ...existing,
      status,
      date_mastered: status === "mastered" ? new Date().toISOString().slice(0, 10) : null,
    };

    await updateLocalVerse(updated);
    setStore({ verses: store.verses.map((v) => (v.id === verseId ? updated : v)) });

    if (status === "mastered") {
      await cancelVerseReminder(verseId);
    } else {
      await scheduleVerseReminder(updated);
    }
  }, []);

  const deleteVerse = useCallback(async (verseId: string) => {
    await cancelVerseReminder(verseId);
    await deleteLocalVerse(verseId);
    setStore({ verses: store.verses.filter((v) => v.id !== verseId) });
  }, []);

  const addCategory = useCallback(
    async (name: string, color: string) => {
      if (!userId) throw new Error("Not signed in.");

      const category: Category = {
        id: generateId(),
        user_id: userId,
        name,
        color,
        created_at: new Date().toISOString(),
      };

      await insertLocalCategory(category);

      // Update the shared store immediately — every mounted tab
      // (Add Verse included) re-renders with the new category right away.
      setStore({
        categories: [...store.categories, category].sort((a, b) => a.name.localeCompare(b.name)),
      });

      return category;
    },
    [userId]
  );

  const removeCategory = useCallback(async (categoryId: string) => {
    await deleteLocalCategory(categoryId);
    setStore({
      categories: store.categories.filter((c) => c.id !== categoryId),
      verses: store.verses.map((v) =>
        v.category_id === categoryId ? { ...v, category_id: null } : v
      ),
    });
  }, []);

  // Memoized on store.verses so these keep a stable reference across
  // re-renders that don't actually change the verse list.
  const learning = useMemo(
    () => store.verses.filter((v) => v.status === "learning"),
    [store.verses]
  );
  const mastered = useMemo(
    () => store.verses.filter((v) => v.status === "mastered"),
    [store.verses]
  );

  return {
    verses: store.verses,
    learning,
    mastered,
    categories: store.categories,
    loading: store.loading,
    refresh,
    addVerse,
    markStatus,
    deleteVerse,
    addCategory,
    removeCategory,
  };
}
