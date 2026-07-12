// app/(tabs)/add.tsx — search, preview, then add (never saves blind)
import React, { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, type } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useVerses } from "@/hooks/useVerses";
import { getDefaultReminderInterval } from "@/lib/preferences";
import { useToast } from "@/lib/toast";
import { validateReference, fetchVerse } from "@/lib/bibleApi";
import { logError } from "@/lib/monitoring";
import { BibleApiResult } from "@/types";

import { AppHeader } from "@/components/AppHeader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { CategoryPill } from "@/components/CategoryPill";
import { SmartReferenceInput } from "@/components/SmartReferenceInput";
import { QuickAddCategoryModal } from "@/components/QuickAddCategoryModal";

const REMINDER_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 Hour", value: 60 },
  { label: "2 Hours", value: 120 },
];

const TRANSLATIONS = ["KJV", "NKJV", "ESV", "NIV"];

type PreviewState =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "found"; result: BibleApiResult }
  | { status: "not_found"; message: string };

export default function AddVerseScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const toast = useToast();

  const { addVerse, addCategory, categories } = useVerses(user?.id ?? null);

  const [reference, setReference] = useState("");
  const [translation, setTranslation] = useState("KJV");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [interval, setInterval] = useState(60);
  const [defaultInterval, setDefaultInterval] = useState(60);
  const [saving, setSaving] = useState(false);
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });

  useFocusEffect(
    useCallback(() => {
      getDefaultReminderInterval().then((minutes) => {
        setDefaultInterval(minutes);
        setInterval(minutes);
      });
    }, [])
  );

  // Editing the reference (or switching translation) after a preview was
  // shown invalidates it — the user needs to search again before Add
  // becomes available, so they're never one tap away from saving
  // something that no longer matches what's on screen.
  function handleReferenceChange(text: string) {
    setReference(text);
    if (preview.status !== "idle") {
      setPreview({ status: "idle" });
    }
  }

  function handleTranslationChange(code: string) {
    setTranslation(code);
    if (preview.status !== "idle") {
      setPreview({ status: "idle" });
    }
  }

  // The core of the redesign: pressing search/enter fetches and previews
  // the verse immediately — nothing is saved yet. Works for both a single
  // verse ("John 3:16") and a range ("Romans 5:1-2"); fetchVerse already
  // detects and handles both.
  async function handleSearch(rawRef?: string) {
    const ref = (rawRef ?? reference).trim();

    if (!ref) {
      setPreview({ status: "idle" });
      return;
    }

    const validation = validateReference(ref);
    if (!validation.valid) {
      setPreview({
        status: "not_found",
        message: validation.error ?? "That doesn't look like a valid reference. Check the spelling and format, e.g. \"John 3:16\" or \"Romans 5:1-2\".",
      });
      return;
    }

    setPreview({ status: "searching" });

    try {
      const result = await fetchVerse(ref, translation);
      setPreview({ status: "found", result });
    } catch (err: any) {
      logError(err, { where: "add verse: preview search", reference: ref });
      setPreview({
        status: "not_found",
        message:
          err?.message ??
          "We couldn't find that verse. Double-check the reference and try again.",
      });
    }
  }

  async function handleAdd() {
    if (preview.status !== "found") return;

    try {
      setSaving(true);

      await addVerse({
        reference: preview.result.reference,
        categoryId,
        reminderIntervalMinutes: interval,
        translation: preview.result.translation,
        fetched: preview.result,
      });

      toast.showSuccess("Verse Added!", "Your reminder has been scheduled.");
      setReference("");
      setCategoryId(null);
      setInterval(defaultInterval);
      setPreview({ status: "idle" });
    } catch (err: any) {
      logError(err, { where: "add verse: save", reference: preview.result.reference });
      toast.showError("Couldn't Add Verse", err.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <AppHeader subtitle="NEW VERSE" title="Add Scripture" />

        {/* Smart Reference + inline preview/error */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.label, { color: theme.text }]}>Bible Reference</Text>
          <SmartReferenceInput
            value={reference}
            onChange={handleReferenceChange}
            onSubmit={handleSearch}
          />
          <Pressable
            onPress={() => handleSearch()}
            disabled={!reference.trim() || preview.status === "searching"}
            style={[
              styles.searchBtn,
              {
                backgroundColor: theme.accent,
                opacity: !reference.trim() || preview.status === "searching" ? 0.5 : 1,
              },
            ]}
          >
            {preview.status === "searching" ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={16} color="#fff" />
                <Text style={styles.searchBtnText}>Search Verse</Text>
              </>
            )}
          </Pressable>

          {/* Preview */}
          {preview.status === "found" && (
            <View style={[styles.previewCard, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
              <View style={styles.previewHeader}>
                <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
                <Text style={[styles.previewRef, { color: theme.text }]}>{preview.result.reference}</Text>
                <View style={[styles.translationBadge, { backgroundColor: theme.accent }]}>
                  <Text style={styles.translationBadgeText}>{preview.result.translation}</Text>
                </View>
              </View>
              <Text style={[styles.previewText, { color: theme.text }]}>{preview.result.text}</Text>
              <Text style={[styles.previewHint, { color: theme.textSecondary }]}>
                This is exactly what will be saved. Edit the reference above to search again.
              </Text>
            </View>
          )}

          {/* Themed not-found error — never a system alert */}
          {preview.status === "not_found" && (
            <View style={[styles.errorCard, { backgroundColor: theme.errorSurface, borderColor: theme.errorSoft }]}>
              <View style={styles.previewHeader}>
                <Ionicons name="alert-circle" size={18} color={theme.error} />
                <Text style={[styles.previewRef, { color: theme.error }]}>Verse Not Found</Text>
              </View>
              <Text style={[styles.previewText, { color: theme.text }]}>{preview.message}</Text>
            </View>
          )}
        </View>

        {/* Translation */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.label, { color: theme.text }]}>Translation</Text>
          <View style={styles.wrap}>
            {TRANSLATIONS.map((item) => (
              <CategoryPill
                key={item}
                label={item}
                color={theme.accent}
                selected={translation === item}
                onPress={() => handleTranslationChange(item)}
              />
            ))}
          </View>
        </View>

        {/* Categories — live shared store: refreshes instantly across tabs */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.categoryHeader}>
            <Text style={[styles.label, { color: theme.text, marginBottom: 0 }]}>Category</Text>
            <Pressable
              onPress={() => setQuickAddVisible(true)}
              style={[styles.quickAddBtn, { backgroundColor: theme.accentSoft }]}
              hitSlop={6}
            >
              <Ionicons name="add" size={16} color={theme.accent} />
              <Text style={[styles.quickAddText, { color: theme.accent }]}> New Category</Text>
            </Pressable>
          </View>
          <View style={[styles.wrap, { marginTop: 12 }]}>
            {categories.map((category) => (
              <CategoryPill
                key={category.id}
                label={category.name}
                color={category.color}
                selected={category.id === categoryId}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
          </View>
          {categories.length === 0 && (
            <Text style={{ color: theme.textSecondary, marginTop: 10 }}>
              No categories yet — tap "New Category" above to create one.
            </Text>
          )}
        </View>

        {/* Reminder */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.label, { color: theme.text }]}>Reminder Interval</Text>
          <View style={styles.wrap}>
            {REMINDER_OPTIONS.map((item) => (
              <CategoryPill
                key={item.value}
                label={item.label}
                color={theme.accent}
                selected={interval === item.value}
                onPress={() => setInterval(item.value)}
              />
            ))}
          </View>
          <Text style={{ marginTop: 14, color: theme.textSecondary }}>
            You'll receive a notification every {interval} minutes until this verse is marked as mastered.
          </Text>
        </View>

        <PrimaryButton
          label="Add Verse"
          onPress={handleAdd}
          loading={saving}
          disabled={preview.status !== "found"}
          style={{ marginTop: 20 }}
        />
        {preview.status !== "found" && (
          <Text style={[styles.addHint, { color: theme.textSecondary }]}>
            Search for a verse above to preview it before adding.
          </Text>
        )}
      </ScrollView>

      <QuickAddCategoryModal
        visible={quickAddVisible}
        onClose={() => setQuickAddVisible(false)}
        onCreate={async (name, color) => {
          const created = await addCategory(name, color);
          setCategoryId(created.id);
          toast.showSuccess("Category Created", `"${name}" is ready and selected.`);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { borderRadius: 18, padding: 18, marginBottom: 18 },
  label: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  wrap: { flexDirection: "row", flexWrap: "wrap" },
  categoryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  quickAddBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  quickAddText: { fontSize: 13, fontWeight: "700" },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
  },
  searchBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  previewCard: { marginTop: 16, borderRadius: 14, borderWidth: 1, padding: 14 },
  errorCard: { marginTop: 16, borderRadius: 14, borderWidth: 1, padding: 14 },
  previewHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  previewRef: { fontSize: 15, fontWeight: "800", flex: 1 },
  translationBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  translationBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  previewText: { fontSize: 15, lineHeight: 22 },
  previewHint: { fontSize: 12, marginTop: 10, fontStyle: "italic" },
  addHint: { textAlign: "center", marginTop: 10, fontSize: 13 },
});
