// app/(tabs)/index.tsx — Today screen, fixed swipe-after-master bug
import React, { useMemo } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, type } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useVerses } from "@/hooks/useVerses";

import SwipeDeck from "@/components/SwipeDeck";
import { EmptyState } from "@/components/EmptyState";

export default function Today() {
  const theme = useTheme();
  const { user } = useAuth();

  const { learning, mastered, categories, loading, refresh, markStatus } = useVerses(user?.id ?? null);

  const categoriesById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  );

  useFocusEffect(
    React.useCallback(() => { refresh(); }, [refresh])
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return <>Good Morning <Ionicons name="sunny" size={20} color={theme.mastered} /></>;
    if (hour < 17) return <>Good Afternoon <Ionicons name="partly-sunny" size={20} color={theme.mastered} /></>;
    return <>Good Evening <Ionicons name="moon" size={20} color={theme.mastered} /></>;
  }, [theme.mastered]);

  const completion =
    learning.length + mastered.length === 0
      ? 0
      : Math.round((mastered.length / (learning.length + mastered.length)) * 100);

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      >
        <Text style={[type.sectionLabel, { color: theme.textSecondary }]}>{greeting}</Text>
        <Text style={[type.screenTitle, { color: theme.text, marginTop: 6 }]}>Today's Memory</Text>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {[
            { value: learning.length, label: "Learning" },
            { value: mastered.length, label: "Mastered" },
            { value: `${completion}%`, label: "Progress" },
          ].map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.stat}>
                <Text style={[styles.number, { color: theme.accent }]}>{stat.value}</Text>
                <Text style={[styles.label, { color: theme.textSecondary }]}>{stat.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Deck — bug fix: onMastered calls markStatus which updates useVerses.
            SwipeDeck now manages its own local queue so the rest of the deck
            stays visible after a swipe. */}
        <View style={{ marginTop: 28 }}>
          {learning.length === 0 ? (
            <EmptyState
              title="You're all caught up!"
              description="No verses waiting for review. Add a new Scripture to keep your streak going."
            />
          ) : (
            <SwipeDeck
              verses={learning}
              categoriesById={categoriesById}
              onMastered={(v) => markStatus(v.id, "mastered")}
              onSkip={() => {}}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  statsCard: {
    marginTop: 24, borderWidth: 1, borderRadius: 22,
    flexDirection: "row", justifyContent: "space-around",
    alignItems: "center", paddingVertical: 22,
  },
  stat: { alignItems: "center", flex: 1 },
  divider: { width: 1, height: 45, backgroundColor: "#D6D6D6" },
  number: { fontSize: 28, fontWeight: "700" },
  label: { marginTop: 5, fontSize: 13, fontWeight: "600" },
});
