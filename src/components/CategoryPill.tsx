import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  label: string;
  color: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function CategoryPill({ label, color, selected, onPress, icon }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: selected ? color : `${color}20`,
          borderColor: selected ? color : `${color}40`,
        },
      ]}
    >
      {icon && (
        <Ionicons name={icon} size={14} color={selected ? "#fff" : color} style={{ marginRight: label ? 4 : 0 }} />
      )}
      {label ? (
        <Text style={[styles.label, { color: selected ? "#fff" : color }]}>{label}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  label: { fontSize: 13, fontWeight: "700" },
});
