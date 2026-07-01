import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, spacing, radius, type } from "@/theme";
import { TAB_INDEX, useTabNavigation } from "@/lib/tabNavigation";

type ActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  tab: keyof typeof TAB_INDEX;
};

function ActionCard({ icon, title, tab }: ActionProps) {
  const theme = useTheme();
  const { goToTab } = useTabNavigation();

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
      android_ripple={{ color: theme.border }}
      onPress={() => goToTab(tab)}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.accent + "20" },
        ]}
      >
        <Ionicons name={icon} size={24} color={theme.accent} />
      </View>

      <Text
        style={[
          type.caption,
          { color: theme.text, marginTop: 10, textAlign: "center" },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function QuickActions() {
  return (
    <View style={styles.container}>
      <ActionCard icon="add-circle" title="Add Verse" tab="add" />
      <ActionCard icon="pricetags" title="Categories" tab="categories" />
      <ActionCard icon="time" title="History" tab="history" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
});
