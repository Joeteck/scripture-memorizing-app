import React, { useMemo } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme, type } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useVerses } from "@/hooks/useVerses";

import SwipeDeck from "@/components/SwipeDeck";
import { EmptyState } from "@/components/EmptyState";

export default function Today() {
  const theme = useTheme();

  const { user } = useAuth();

  const {
    learning,
    mastered,
    categories,
    loading,
    refresh,
    markStatus,
  } = useVerses(user?.id ?? null);

  const categoriesById = useMemo(
    () =>
      Object.fromEntries(
        categories.map((c) => [c.id, c])
      ),
    [categories]
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12)
      return "Good Morning ☀️";

    if (hour < 17)
      return "Good Afternoon 🌤";

    return "Good Evening 🌙";
  }, []);

  const completion =
    learning.length + mastered.length === 0
      ? 0
      : Math.round(
          (mastered.length /
            (learning.length +
              mastered.length)) *
            100
        );

  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        styles.flex,
        {
          backgroundColor:
            theme.background,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
          />
        }
      >
        <Text
          style={[
            type.sectionLabel,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          {greeting}
        </Text>

        <Text
          style={[
            type.screenTitle,
            {
              color: theme.text,
              marginTop: 6,
            },
          ]}
        >
          Today's Memory
        </Text>

        {/* Stats */}

        <View
          style={[
            styles.statsCard,
            {
              backgroundColor:
                theme.surface,
              borderColor:
                theme.border,
            },
          ]}
        >
          <View
            style={styles.stat}
          >
            <Text
              style={[
                styles.number,
                {
                  color:
                    theme.accent,
                },
              ]}
            >
              {learning.length}
            </Text>

            <Text
              style={[
                styles.label,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Learning
            </Text>
          </View>

          <View
            style={styles.divider}
          />

          <View
            style={styles.stat}
          >
            <Text
              style={[
                styles.number,
                {
                  color:
                    theme.accent,
                },
              ]}
            >
              {mastered.length}
            </Text>

            <Text
              style={[
                styles.label,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Mastered
            </Text>
          </View>

          <View
            style={styles.divider}
          />

          <View
            style={styles.stat}
          >
            <Text
              style={[
                styles.number,
                {
                  color:
                    theme.accent,
                },
              ]}
            >
              {completion}%
            </Text>

            <Text
              style={[
                styles.label,
                {
                  color:
                    theme.textSecondary,
                },
              ]}
            >
              Progress
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: 28,
          }}
        >
          {learning.length === 0 ? (
            <EmptyState
              title="You're all caught up!"
              description="No verses are waiting for review today. Add a new Scripture to keep your memorization streak going."
            />
          ) : (
            <SwipeDeck
              verses={learning}
              categoriesById={
                categoriesById
              }
              onMastered={(v) =>
                markStatus(
                  v.id,
                  "mastered"
                )
              }
              onSkip={() => {}}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    flex: {
      flex: 1,
    },

    content: {
      padding: 20,
      paddingBottom: 60,
    },

    statsCard: {
      marginTop: 24,

      borderWidth: 1,

      borderRadius: 22,

      flexDirection: "row",

      justifyContent:
        "space-around",

      alignItems: "center",

      paddingVertical: 22,
    },

    stat: {
      alignItems: "center",

      flex: 1,
    },

    divider: {
      width: 1,

      height: 45,

      backgroundColor:
        "#D6D6D6",
    },

    number: {
      fontSize: 28,

      fontWeight: "700",
    },

    label: {
      marginTop: 5,

      fontSize: 13,

      fontWeight: "600",
    },
  });