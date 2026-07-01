// hooks/useVerses.ts
//
// IMPORTANT: This is a shared singleton store, not a per-component hook
// with isolated state. The (tabs)/_layout.tsx pager keeps all 5 tab
// screens mounted at once (Today, Dashboard, Add, Categories, History),
// and each one calls useVerses(userId). If each call created its own
// independent useState, creating a category on the Categories tab would
// never be visible on the Add tab until that tab unmounted and remounted
// (or the user manually pulled-to-refresh) — exactly the stale-category
// bug we're fixing. Instead, all verses/categories state lives in one
// module-level store, and every component calling useVerses subscribes
// to it. Any mutation (addVerse, addCategory, markStatus, deleteVerse)
// updates the shared store once, and every mounted tab re-renders
// immediately with the new data — no manual refresh, no remount needed.
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  cacheVerses,
  cacheVerse,
  getCachedVerses,
  removeCachedVerse,
} from "@/lib/db";
import {
  scheduleVerseReminder,
  cancelVerseReminder,
} from "@/lib/notifications";
import { fetchVerse } from "@/lib/bibleApi";
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
    const [
      { data: verseRows, error: verseError },
      { data: categoryRows, error: categoryError },
    ] = await Promise.all([
      supabase
        .from("verses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),

      supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .order("name"),
    ]);

    if (verseError) throw verseError;
    if (categoryError) throw categoryError;

    const freshVerses = (verseRows as Verse[]) ?? [];
    const freshCategories = (categoryRows as Category[]) ?? [];

    setStore({ verses: freshVerses, categories: freshCategories, loading: false });

    await cacheVerses(freshVerses);
  } catch (error) {
    console.warn("Offline mode enabled:", error);
    const cached = await getCachedVerses();
    setStore({ verses: cached, loading: false });
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
    }) => {
      if (!userId) throw new Error("Not signed in.");

      const fetched = await fetchVerse(params.reference, params.translation);

      const { data, error } = await supabase
        .from("verses")
        .insert({
          user_id: userId,
          reference: fetched.reference,
          content: fetched.text,
          translation: fetched.translation,
          category_id: params.categoryId,
          status: "learning",
          date_started: new Date().toISOString().slice(0, 10),
          reminder_interval_minutes: params.reminderIntervalMinutes,
        })
        .select()
        .single();

      if (error) throw error;

      const verse = data as Verse;

      setStore({ verses: [verse, ...store.verses] });
      await cacheVerse(verse);
      await scheduleVerseReminder(verse);

      return verse;
    },
    [userId]
  );

  const markStatus = useCallback(async (verseId: string, status: VerseStatus) => {
    const update =
      status === "mastered"
        ? { status, date_mastered: new Date().toISOString().slice(0, 10) }
        : { status, date_mastered: null };

    const { data, error } = await supabase
      .from("verses")
      .update(update)
      .eq("id", verseId)
      .select()
      .single();

    if (error) throw error;

    const updated = data as Verse;

    setStore({ verses: store.verses.map((v) => (v.id === verseId ? updated : v)) });
    await cacheVerse(updated);

    if (status === "mastered") {
      await cancelVerseReminder(verseId);
    } else {
      await scheduleVerseReminder(updated);
    }
  }, []);

  const deleteVerse = useCallback(async (verseId: string) => {
    await cancelVerseReminder(verseId);

    const { error } = await supabase.from("verses").delete().eq("id", verseId);
    if (error) throw error;

    setStore({ verses: store.verses.filter((v) => v.id !== verseId) });
    await removeCachedVerse(verseId);
  }, []);

  const addCategory = useCallback(
    async (name: string, color: string) => {
      if (!userId) throw new Error("Not signed in.");

      const { data, error } = await supabase
        .from("categories")
        .insert({ user_id: userId, name, color })
        .select()
        .single();

      if (error) throw error;

      const category = data as Category;

      // Update the shared store immediately — every mounted tab
      // (Add Verse included) re-renders with the new category right away.
      setStore({ categories: [...store.categories, category].sort((a, b) => a.name.localeCompare(b.name)) });

      return category;
    },
    [userId]
  );

  const learning = store.verses.filter((v) => v.status === "learning");
  const mastered = store.verses.filter((v) => v.status === "mastered");

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
  };
}
