import React, { useMemo } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme, spacing } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useVerses } from "@/hooks/useVerses";
import { useStreak } from "@/hooks/useStreak";
import { useDrawer } from "@/lib/drawer";

import { DashboardHeader } from "@/components/DashboardHeader";
import { ProgressRing } from "@/components/ProgressRing";
import { StatsCard } from "@/components/StatsCard";
import { StreakCard } from "@/components/StreakCard";
import { QuickActions } from "@/components/QuickActions";

export default function Dashboard() {
  const theme = useTheme();
  const { user } = useAuth();
  const { open: openDrawer } = useDrawer();

  const { learning, mastered, categories, loading, refresh } = useVerses(user?.id ?? null);
  const streak = useStreak(useMemo(() => [...learning, ...mastered], [learning, mastered]));

  const userName = useMemo(() => {
    if (!user?.email) return undefined;
    return user.email.split("@")[0];
  }, [user]);

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      >
        <DashboardHeader
          userName={userName}
          userEmail={user?.email}
          onAvatarPress={openDrawer}
          onMenuPress={openDrawer}
        />

        <ProgressRing completed={mastered.length} total={learning.length + mastered.length} />

        <View style={styles.statsRow}>
          <StatsCard title="Learning" value={learning.length} icon="book-outline" color={theme.accent} />
          <StatsCard title="Mastered" value={mastered.length} icon="trophy-outline" color={theme.mastered} />
          <StatsCard title="Categories" value={categories.length} icon="pricetags-outline" color={theme.accent} />
        </View>

        <StreakCard
          currentStreak={streak.currentStreak}
          bestStreak={streak.bestStreak}
          completedToday={streak.completedToday}
        />

        <QuickActions />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 50 },
  statsRow: { flexDirection: "row", gap: spacing.md, marginTop: 28, marginBottom: 8 },
});
