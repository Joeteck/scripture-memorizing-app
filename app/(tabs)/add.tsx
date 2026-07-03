// app/(tabs)/add.tsx
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, type } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useVerses } from "@/hooks/useVerses";
import { getDefaultReminderInterval } from "@/lib/preferences";
import { useToast } from "@/lib/toast";
import { validateReference } from "@/lib/bibleApi";
import { logError } from "@/lib/monitoring";

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
  const [loading, setLoading] = useState(false);
  const [quickAddVisible, setQuickAddVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getDefaultReminderInterval().then((minutes) => {
        setDefaultInterval(minutes);
        setInterval(minutes);
      });
    }, [])
  );

  async function handleAdd() {
    const ref = reference.trim();
    
    if (!ref) {
      toast.showError("Verse Required", "Enter something like John 3:16.");
      return;
    }

    // Validate the reference format first
    const validation = validateReference(ref);
    if (!validation.valid) {
      toast.showError("Invalid Reference", validation.error ?? "Please check the format.");
      return;
    }

    try {
      setLoading(true);
      
      // fetchVerse in bibleApi.ts now automatically handles both single verses
      // and ranges (e.g., "Romans 5:1-2"). It will:
      // - Single: fetch one verse -> save as "John 3:16"
      // - Range: fetch all verses -> concatenate -> save as "Romans 5:1-2"
      await addVerse({ 
        reference: ref,  // Pass the reference as-is, whether single or range
        categoryId, 
        reminderIntervalMinutes: interval, 
        translation 
      });
      
      toast.showSuccess("Verse Added!", "Your reminder has been scheduled.");
      setReference("");
      setCategoryId(null);
      setInterval(defaultInterval);
    } catch (err: any) {
      logError(err, { where: "add verse", reference: ref });
      toast.showError("Couldn't Add Verse", err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={[type.sectionLabel, { color: theme.textSecondary }]}>NEW VERSE</Text>
        <Text style={[type.screenTitle, { color: theme.text, marginBottom: 28 }]}>Add Scripture</Text>

        {/* Smart Reference */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.label, { color: theme.text }]}>Bible Reference</Text>
          <SmartReferenceInput
            value={reference}
            onChange={setReference}
          />
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
                onPress={() => setTranslation(item)} 
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
          loading={loading} 
          style={{ marginTop: 20 }} 
        />
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
});