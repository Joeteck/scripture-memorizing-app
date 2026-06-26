import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/theme";

type Props = {
  label: string;
  color: string;

  selected?: boolean;

  onPress?: () => void;

  icon?: keyof typeof Ionicons.glyphMap;
};

export function CategoryPill({
  label,
  color,
  selected = false,
  onPress,
  icon,
}: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,

        {
          opacity: pressed ? 0.8 : 1,

          transform: [
            {
              scale: pressed ? 0.96 : 1,
            },
          ],

          borderColor: selected
            ? color
            : theme.border,

          backgroundColor: selected
            ? color
            : theme.surface,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: selected
              ? "#FFFFFF"
              : color,
          },
        ]}
      />

      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={
            selected
              ? "#FFFFFF"
              : theme.text
          }
          style={{
            marginRight: 6,
          }}
        />
      )}

      {label.length > 0 && (
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            {
              color: selected
                ? "#FFFFFF"
                : theme.text,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 16,

    height: 42,

    borderRadius: 21,

    borderWidth: 1,

    marginRight: 10,

    marginBottom: 10,
  },

  dot: {
    width: 10,

    height: 10,

    borderRadius: 5,

    marginRight: 8,
  },

  label: {
    fontSize: 14,

    fontWeight: "600",
  },
});