// src/components/AppHeader.tsx
//
// One header, used the same way on every top-level screen. Replaces the
// ad-hoc "each screen builds its own title row" pattern (and the one-off
// menu button that only existed on Dashboard) with a single consistent
// piece: a menu button that always opens the global drawer (see
// src/lib/drawer.tsx), a title, and an optional right-side action.
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, type } from "@/theme";
import { useDrawer } from "@/lib/drawer";

interface Props {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Optional right-side affordance, e.g. a "New Category" button. */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightLabel?: string;
}

export function AppHeader({ title, subtitle, rightIcon, onRightPress, rightLabel }: Props) {
  const theme = useTheme();
  const { open } = useDrawer();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={open}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Open navigation menu"
        style={[styles.menuBtn, { backgroundColor: theme.accentSoft }]}
      >
        <Ionicons name="menu" size={22} color={theme.accent} />
      </Pressable>

      <View style={styles.titleWrap}>
        {subtitle ? (
          <Text style={[type.sectionLabel, { color: theme.textSecondary }]}>{subtitle}</Text>
        ) : null}
        <Text style={[type.screenTitle, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {rightIcon && onRightPress ? (
        <Pressable
          onPress={onRightPress}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={rightLabel ?? "Action"}
          style={[styles.menuBtn, { backgroundColor: theme.accentSoft }]}
        >
          <Ionicons name={rightIcon} size={20} color={theme.accent} />
        </Pressable>
      ) : (
        <View style={styles.menuBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
});
