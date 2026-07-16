// src/components/ModalHeader.tsx
//
// Every modal screen (About, Donate, Feedback, Privacy Policy, Terms,
// Quiz, Profile, Backup & Restore, Paywall) used to hand-roll its own
// back button + title row — and had drifted into two different visual
// patterns doing it (a bare chevron on some screens, a circular icon
// button on others). This is the one version, used everywhere, so
// "consistent navigation" isn't just true of the tab screens.
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, type } from "@/theme";

interface Props {
  title: string;
  /** Defaults to router.back(); override for a screen with custom close behavior. */
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightLabel?: string;
}

export function ModalHeader({ title, onBack, rightIcon, onRightPress, rightLabel }: Props) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onBack ?? (() => router.back())}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={[styles.iconBtn, { backgroundColor: theme.accentSoft }]}
      >
        <Ionicons name="chevron-back" size={22} color={theme.accent} />
      </Pressable>

      <Text style={[type.screenTitle, { color: theme.text, fontSize: 20 }]} numberOfLines={1}>
        {title}
      </Text>

      {rightIcon && onRightPress ? (
        <Pressable
          onPress={onRightPress}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={rightLabel ?? "Action"}
          style={[styles.iconBtn, { backgroundColor: theme.accentSoft }]}
        >
          <Ionicons name={rightIcon} size={20} color={theme.accent} />
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
