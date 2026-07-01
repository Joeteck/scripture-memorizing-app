// src/components/VerseCard.tsx  — auto-sizing, premium feel, no fixed minHeight
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme, type } from "@/theme";
import { Verse, Category } from "@/types";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  verse: Verse;
  category?: Category;
}

function formatInterval(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  if (minutes === 60) return "1 hour";
  if (minutes % 60 === 0) return `${minutes / 60} hrs`;
  return `${minutes} min`;
}

export function VerseCard({ verse, category }: Props) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Accent top bar */}
      <View style={[styles.topBar, { backgroundColor: theme.accent }]} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.referenceWrap}>
          <Text style={[type.verseReference, { color: theme.accent }]}>{verse.reference}</Text>
          <Text style={[styles.translationBadge, { color: theme.textSecondary }]}>
            {verse.translation}
          </Text>
        </View>

        {category && (
          <View style={[styles.categoryPill, { backgroundColor: `${category.color}22`, borderColor: `${category.color}55` }]}>
            <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
            <Text style={[styles.categoryText, { color: category.color }]}>{category.name}</Text>
          </View>
        )}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* Scripture — auto-sizes, no minHeight imposed */}
      <Text style={[styles.scripture, { color: theme.text }]}>{verse.content}</Text>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={14} color={theme.mastered} />
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            {"  "}{formatInterval(verse.reminder_interval_minutes)}
          </Text>
        </View>

        <View style={styles.footerItem}>
          <Ionicons name="bookmark-outline" size={14} color={theme.accent} />
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            {"  "}{verse.status === "mastered" ? "Mastered" : "Learning"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  topBar: {
    height: 4,
    width: "100%",
    opacity: 0.85,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingBottom: 0,
  },
  referenceWrap: { flex: 1 },
  translationBadge: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
    marginTop: 2,
  },
  categoryDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  categoryText: { fontSize: 11, fontWeight: "700" },
  divider: { height: 1, marginHorizontal: 20, marginTop: 14, marginBottom: 0 },
  scripture: {
    fontSize: 22,
    lineHeight: 36,
    fontFamily: "Lora_400Regular",
    padding: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  footerItem: { flexDirection: "row", alignItems: "center" },
  footerText: { fontSize: 12, fontWeight: "600" },
});

export default VerseCard;
