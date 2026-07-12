import React, { useMemo } from "react";
import { RefreshControl, SectionList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, type } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useVerses } from "@/hooks/useVerses";
import { Seal } from "@/components/Seal";
import { EmptyState } from "@/components/EmptyState";
import { AppHeader } from "@/components/AppHeader";
import { Verse } from "@/types";

function formatDate(date?: string | null) {
  if (!date) return "Unknown";
  const today = new Date();
  const target = new Date(date);
  if (today.toDateString() === target.toDateString()) return "Today";
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (yesterday.toDateString() === target.toDateString()) return "Yesterday";
  return target.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

function buildSections(verses: Verse[]) {
  const grouped: Record<string, Verse[]> = {};
  verses.forEach((v) => {
    const key = v.date_mastered ?? "Unknown";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(v);
  });
  return Object.entries(grouped)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, data]) => ({ title: formatDate(date), data }));
}

export default function HistoryScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { mastered, loading, refresh } = useVerses(user?.id ?? null);
  const sections = useMemo(() => buildSections(mastered), [mastered]);

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Fixed header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <AppHeader subtitle="HISTORY" title="Mastered Verses" />

        {/* Summary banner */}
        <View style={[styles.summaryBanner, { backgroundColor: theme.accentSoft }]}>
          <View style={styles.summaryItem}>
            <Ionicons name="trophy" size={20} color={theme.mastered} />
            <Text style={[styles.summaryNum, { color: theme.text }]}>{mastered.length}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              verse{mastered.length !== 1 ? "s" : ""} mastered
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
          <View style={styles.summaryItem}>
            <Ionicons name="calendar" size={20} color={theme.accent} />
            <Text style={[styles.summaryNum, { color: theme.text }]}>{sections.length}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>active day{sections.length !== 1 ? "s" : ""}</Text>
          </View>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
            <View style={[styles.sectionLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{section.title}</Text>
            <View style={[styles.sectionLine, { backgroundColor: theme.border }]} />
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Seal date={item.date_mastered ?? item.date_started} />
            <View style={styles.info}>
              <Text style={[type.verseReference, { color: theme.text }]}>{item.reference}</Text>
              <Text numberOfLines={3} style={[styles.content, { color: theme.textSecondary }]}>
                {item.content}
              </Text>
              <View style={styles.badges}>
                {item.translation ? (
                  <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
                    <Text style={[styles.badgeText, { color: theme.accent }]}>{item.translation}</Text>
                  </View>
                ) : null}
                <View style={[styles.badge, { backgroundColor: "#F0FBF2" }]}>
                  <Ionicons name="checkmark-circle" size={12} color="#3A7D44" />
                  <Text style={[styles.badgeText, { color: "#3A7D44" }]}> Mastered</Text>
                </View>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="trophy-outline"
            title="No mastered verses yet"
            description="Keep memorizing. Every verse you master will appear here as part of your journey."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  summaryBanner: {
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  summaryNum: { fontSize: 18, fontWeight: "800" },
  summaryLabel: { fontSize: 13, fontWeight: "600" },
  summaryDivider: { width: 1, height: 30, marginHorizontal: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginTop: 24, marginBottom: 12 },
  sectionLine: { flex: 1, height: 1 },
  sectionTitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginHorizontal: 10, letterSpacing: 0.5 },
  card: { flexDirection: "row", borderRadius: 18, padding: 16, marginBottom: 12, alignItems: "flex-start", borderWidth: 1 },
  info: { flex: 1, marginLeft: 14 },
  content: { marginTop: 6, lineHeight: 20, fontSize: 14 },
  badges: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: "700" },
});
