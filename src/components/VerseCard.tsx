import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import { useTheme, type } from "@/theme";
import { Verse, Category } from "@/types";

interface Props {
  verse: Verse;
  category?: Category;
}

function formatInterval(minutes: number) {
  if (minutes < 60) return `${minutes} min`;

  if (minutes === 60) return "1 hour";

  if (minutes % 60 === 0)
    return `${minutes / 60} hrs`;

  return `${minutes} min`;
}

export function VerseCard({
  verse,
  category,
}: Props) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor:
            theme.surface,
          borderColor:
            theme.border,
        },
      ]}
    >
      {/* Header */}

      <View style={styles.header}>
        <Text
          style={[
            type.verseReference,
            {
              color: theme.accent,
            },
          ]}
        >
          {verse.reference}
        </Text>

        {category && (
          <View
            style={[
              styles.category,
              {
                backgroundColor:
                  category.color,
              },
            ]}
          >
            <Text
              style={
                styles.categoryText
              }
            >
              {category.name}
            </Text>
          </View>
        )}
      </View>

      {/* Scripture */}

      <Text
        style={[
          styles.scripture,
          {
            color: theme.text,
          },
        ]}
      >
        {verse.content}
      </Text>

      {/* Footer */}

      <View style={styles.footer}>
        <View
          style={[
            styles.translation,
            {
              borderColor:
                theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.footerText,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            {verse.translation}
          </Text>
        </View>

        <View
          style={[
            styles.translation,
            {
              borderColor:
                theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.footerText,
              {
                color:
                  theme.textSecondary,
              },
            ]}
          >
            ⏰{" "}
            {formatInterval(
              verse.reminder_interval_minutes
            )}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    card: {
      borderRadius: 28,
      padding: 24,
      borderWidth: 1,
      minHeight: 520,
      justifyContent:
        "space-between",
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: {
        width: 0,
        height: 10,
      },
      elevation: 8,
    },

    header: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom: 18,
    },

    category: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },

    categoryText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 12,
    },

    scripture: {
      fontSize: 26,
      lineHeight: 40,
      fontFamily:
        "Lora_400Regular",
      flex: 1,
    },

    footer: {
      flexDirection: "row",

      justifyContent:
        "space-between",

      marginTop: 30,
    },

    translation: {
      borderWidth: 1,

      borderRadius: 999,

      paddingHorizontal: 14,

      paddingVertical: 8,
    },

    footerText: {
      fontSize: 13,

      fontWeight: "600",
    },
  });

export default VerseCard;