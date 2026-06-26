import React, { useMemo } from "react";
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme, type } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useVerses } from "@/hooks/useVerses";
import { Seal } from "@/components/Seal";
import { EmptyState } from "@/components/EmptyState";
import { Verse } from "@/types";

function formatDate(date?: string | null) {
  if (!date) return "Unknown";

  const today = new Date();
  const target = new Date(date);

  const todayString = today.toDateString();
  const targetString = target.toDateString();

  if (todayString === targetString) {
    return "Today";
  }

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (yesterday.toDateString() === targetString) {
    return "Yesterday";
  }

  return target.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildSections(verses: Verse[]) {
  const grouped: Record<string, Verse[]> = {};

  verses.forEach((verse) => {
    const key = verse.date_mastered ?? "Unknown";

    if (!grouped[key]) {
      grouped[key] = [];
    }

    grouped[key].push(verse);
  });

  return Object.entries(grouped)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, data]) => ({
      title: formatDate(date),
      data,
    }));
}

export default function HistoryScreen() {
  const theme = useTheme();

  const { user } = useAuth();

  const {
    mastered,
    loading,
    refresh,
  } = useVerses(user?.id ?? null);

  const sections = useMemo(
    () => buildSections(mastered),
    [mastered]
  );

  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        styles.container,
        {
          backgroundColor:
            theme.background,
        },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            type.sectionLabel,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          HISTORY
        </Text>

        <Text
          style={[
            type.screenTitle,
            {
              color: theme.text,
            },
          ]}
        >
          Mastered Verses
        </Text>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor:
                theme.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.summaryNumber,
              {
                color: theme.accent,
              },
            ]}
          >
            {mastered.length}
          </Text>

          <Text
            style={[
              styles.summaryLabel,
              {
                color: theme.text,
              },
            ]}
          >
            Verse{mastered.length === 1 ? "" : "s"} Mastered
          </Text>

          <Text
            style={{
              color:
                theme.textSecondary,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            Every mastered verse is another
            step toward hiding God's Word in
            your heart.
          </Text>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
          />
        }
        renderSectionHeader={({ section }) => (
          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              {
                backgroundColor:
                  theme.surface,
              },
            ]}
          >
            <Seal
              date={
                item.date_mastered ??
                item.date_started
              }
            />

            <View style={styles.info}>
              <Text
                style={[
                  type.verseReference,
                  {
                    color:
                      theme.text,
                  },
                ]}
              >
                {item.reference}
              </Text>

              <Text
                numberOfLines={2}
                style={[
                  styles.content,
                  {
                    color:
                      theme.textSecondary,
                  },
                ]}
              >
                {item.content}
              </Text>

              {item.translation ? (
                <Text
                  style={{
                    color:
                      theme.accent,
                    marginTop: 6,
                    fontWeight: "600",
                  }}
                >
                  {item.translation}
                </Text>
              ) : null}
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
  container: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  summaryCard: {
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },

  summaryNumber: {
    fontSize: 42,
    fontWeight: "800",
  },

  summaryLabel: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 6,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 10,
    textTransform: "uppercase",
  },

  card: {
    flexDirection: "row",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    alignItems: "center",
  },

  info: {
    flex: 1,
    marginLeft: 14,
  },

  content: {
    marginTop: 6,
    lineHeight: 22,
    fontSize: 15,
  },
});