import { useCallback, useEffect, useState } from "react";
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

export function useVerses(userId: string | null) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setVerses([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [
        { data: verseRows, error: verseError },
        { data: categoryRows, error: categoryError },
      ] = await Promise.all([
        supabase
          .from("verses")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("categories")
          .select("*")
          .order("name"),
      ]);

      if (verseError) throw verseError;
      if (categoryError) throw categoryError;

      const freshVerses =
        (verseRows as Verse[]) ?? [];

      const freshCategories =
        (categoryRows as Category[]) ?? [];

      setVerses(freshVerses);
      setCategories(freshCategories);

      await cacheVerses(freshVerses);
    } catch (error) {
      console.warn(
        "Offline mode enabled:",
        error
      );

      const cached =
        await getCachedVerses();

      setVerses(cached);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addVerse = useCallback(
    async (params: {
      reference: string;
      categoryId: string | null;
      reminderIntervalMinutes: number;
      translation?: string;
    }) => {
      if (!userId) {
        throw new Error(
          "Not signed in."
        );
      }

      const fetched =
        await fetchVerse(
          params.reference,
          params.translation
        );

      const { data, error } =
        await supabase
          .from("verses")
          .insert({
            user_id: userId,
            reference:
              fetched.reference,
            content: fetched.text,
            translation:
              fetched.translation,
            category_id:
              params.categoryId,
            status: "learning",
            date_started:
              new Date()
                .toISOString()
                .slice(0, 10),
            reminder_interval_minutes:
              params.reminderIntervalMinutes,
          })
          .select()
          .single();

      if (error) throw error;

      const verse =
        data as Verse;

      setVerses((current) => [
        verse,
        ...current,
      ]);

      await cacheVerse(verse);

      await scheduleVerseReminder(
        verse
      );

      return verse;
    },
    [userId]
  );

  const markStatus = useCallback(
    async (
      verseId: string,
      status: VerseStatus
    ) => {
      const update =
        status === "mastered"
          ? {
              status,
              date_mastered:
                new Date()
                  .toISOString()
                  .slice(0, 10),
            }
          : {
              status,
              date_mastered:
                null,
            };

      const { data, error } =
        await supabase
          .from("verses")
          .update(update)
          .eq("id", verseId)
          .select()
          .single();

      if (error) throw error;

      const updated =
        data as Verse;

      setVerses((current) =>
        current.map((v) =>
          v.id === verseId
            ? updated
            : v
        )
      );

      await cacheVerse(updated);

      if (
        status === "mastered"
      ) {
        await cancelVerseReminder(
          verseId
        );
      } else {
        await scheduleVerseReminder(
          updated
        );
      }
    },
    []
  );

  const deleteVerse = useCallback(
    async (
      verseId: string
    ) => {
      await cancelVerseReminder(
        verseId
      );

      const { error } =
        await supabase
          .from("verses")
          .delete()
          .eq("id", verseId);

      if (error) throw error;

      setVerses((current) =>
        current.filter(
          (v) =>
            v.id !== verseId
        )
      );

      await removeCachedVerse(
        verseId
      );
    },
    []
  );

  const addCategory =
    useCallback(
      async (
        name: string,
        color: string
      ) => {
        if (!userId) {
          throw new Error(
            "Not signed in."
          );
        }

        const { data, error } =
          await supabase
            .from("categories")
            .insert({
              user_id: userId,
              name,
              color,
            })
            .select()
            .single();

        if (error) throw error;

        setCategories(
          (current) => [
            ...current,
            data as Category,
          ]
        );
      },
      [userId]
    );

  const learning =
    verses.filter(
      (v) =>
        v.status ===
        "learning"
    );

  const mastered =
    verses.filter(
      (v) =>
        v.status ===
        "mastered"
    );

  return {
    verses,
    learning,
    mastered,
    categories,
    loading,

    refresh,

    addVerse,

    markStatus,

    deleteVerse,

    addCategory,
  };
}