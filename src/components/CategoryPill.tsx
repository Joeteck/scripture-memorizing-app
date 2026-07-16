import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getReadableTextColor } from "@/theme";

interface Props {
  label: string;
  color: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

function CategoryPillComponent({ label, color, selected, onPress, icon }: Props) {
  // `color` can be theme.accent (passed for translation/reminder/frequency
  // pills) or an arbitrary per-category custom color — either way, this
  // computes real contrast against it rather than assuming white always
  // reads clearly, which it doesn't (see PHASE_3_NOTES.md's contrast audit).
  const selectedTextColor = getReadableTextColor(color);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={label || undefined}
      accessibilityState={onPress ? { selected: !!selected } : undefined}
      style={[
        styles.pill,
        {
          backgroundColor: selected ? color : `${color}20`,
          borderColor: selected ? color : `${color}40`,
        },
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? selectedTextColor : color}
          style={{ marginRight: label ? 4 : 0 }}
        />
      )}
      {label ? (
        <Text style={[styles.label, { color: selected ? selectedTextColor : color }]}>{label}</Text>
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

// Pills are rendered in tight lists (every category, translation, and
// reminder-interval option) that all re-render together whenever their
// parent screen's state changes — memoizing means a pill only re-renders
// when its own props (selection state, color, label) actually change.
export const CategoryPill = memo(CategoryPillComponent);
