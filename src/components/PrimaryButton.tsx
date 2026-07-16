import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/theme";

type Props = {
  label: string;
  onPress: () => void;

  loading?: boolean;
  disabled?: boolean;

  variant?: "filled" | "ghost";

  icon?: keyof typeof Ionicons.glyphMap;

  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "filled",
  icon,
  style,
}: Props) {
  const theme = useTheme();

  const isDisabled = loading || disabled;

  const background =
    variant === "filled"
      ? theme.accent
      : "transparent";

  const textColor =
    variant === "filled"
      ? theme.onAccent
      : theme.accent;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,

        {
          backgroundColor: background,

          borderColor: theme.accent,

          opacity: isDisabled
            ? 0.6
            : pressed
            ? 0.9
            : 1,

          transform: [
            {
              scale: pressed
                ? 0.98
                : 1,
            },
          ],
        },

        variant === "ghost" &&
          styles.ghost,

        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={textColor}
        />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={textColor}
              style={{
                marginRight: 10,
              }}
            />
          )}

          <Text
            style={[
              styles.text,
              {
                color: textColor,
              },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,

    borderRadius: 18,

    borderWidth: 1,

    justifyContent: "center",

    alignItems: "center",

    flexDirection: "row",

    shadowColor: "#000",

    shadowOpacity: 0.12,

    shadowRadius: 10,

    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 5,
  },

  ghost: {
    backgroundColor: "transparent",

    shadowOpacity: 0,

    elevation: 0,
  },

  text: {
    fontSize: 17,

    fontWeight: "700",

    letterSpacing: 0.3,
  },
});