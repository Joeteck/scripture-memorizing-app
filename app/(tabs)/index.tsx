// app/(tabs)/index.tsx — Today screen, fixed swipe-after-master bug
import React, { useMemo } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, type } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useVerses } from "@/hooks/useVerses";

import SwipeDeck from "@/components/SwipeDeck";
import { EmptyState } from "@/components/EmptyState";
import { AppHeader } from "@/components/AppHeader";

export default function Today() {
  const theme = useTheme();
  const router = useRouter();
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
        <AppHeader subtitle={greeting} title="Today's Memory" />

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

        {/* Test Yourself — picks a random verse from today's learning list
            each time it's tapped, so repeat testing cycles through
            everything rather than always quizzing the same one. */}
        {learning.length > 0 && (
          <Pressable
            onPress={() => {
              const target = learning[Math.floor(Math.random() * learning.length)];
              router.push({ pathname: "/quiz", params: { verseId: target.id } });
            }}
            style={({ pressed }) => [
              styles.testCard,
              {
                backgroundColor: theme.accentSoft,
                borderColor: theme.accent,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.testIcon, { backgroundColor: theme.accent }]}>
              <Ionicons name="flash" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[type.bodyBold, { color: theme.text }]}>Test Yourself</Text>
              <Text style={[type.caption, { color: theme.textSecondary, marginTop: 2 }]}>
                Fill in the missing words from memory
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.accent} />
          </Pressable>
        )}
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
  testCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  testIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
