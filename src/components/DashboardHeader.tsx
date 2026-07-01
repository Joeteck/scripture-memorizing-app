// src/components/DashboardHeader.tsx — with AvatarButton + drawer trigger
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme, type } from "@/theme";
import { AvatarButton } from "./AvatarButton";

interface Props {
  userName?: string;
  userEmail?: string;
  avatarIndex?: number;
  onAvatarPress: () => void;
  onMenuPress?: () => void;
}

const MORNING_MESSAGES = [
  "Hide God's Word in your heart today.",
  "A new day, another verse to remember.",
  "Small daily steps build lasting faith.",
];
const AFTERNOON_MESSAGES = [
  "Keep going. You're doing great.",
  "Take a few minutes to review a verse.",
  "A little consistency goes a long way.",
];
const EVENING_MESSAGES = [
  "End the day with God's Word.",
  "Review today's verses before you rest.",
  "Finish strong today.",
];

export function DashboardHeader({ userName, userEmail, avatarIndex = 0, onAvatarPress, onMenuPress }: Props) {
  const theme = useTheme();
  const hour = new Date().getHours();

  const greeting = useMemo(() => {
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, [hour]);

  const message = useMemo(() => {
    let list = hour < 12 ? MORNING_MESSAGES : hour < 17 ? AFTERNOON_MESSAGES : EVENING_MESSAGES;
    return list[new Date().getDate() % list.length];
  }, [hour]);

  const displayName = userName || userEmail?.split("@")[0] || "Friend";
  const initials = (displayName.slice(0, 2) || "SC").toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={[type.caption, { color: theme.textSecondary }]}>{greeting}</Text>
        <Text style={[type.screenTitle, { color: theme.text, marginTop: 4 }]}>
          {displayName}{" "}
          <MaterialCommunityIcons name="hand-wave" size={20} color={theme.mastered} />
        </Text>
        <Text style={[type.body, { color: theme.textSecondary, marginTop: 8, lineHeight: 24 }]}>
          {message}
        </Text>
      </View>

      <AvatarButton
        initials={initials}
        avatarIndex={avatarIndex}
        onPress={onAvatarPress}
        size={56}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  left: { flex: 1, paddingRight: 16 },
});
