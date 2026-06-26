import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/theme";

type Props = {
  date?: string | null;
};

function formatDate(date?: string | null) {
  if (!date) return "--";

  const d = new Date(date);

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function Seal({ date }: Props) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.accent,
        },
      ]}
    >
      <Ionicons
        name="checkmark-circle"
        size={24}
        color="#fff"
      />

      <Text style={styles.date}>
        {formatDate(date)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 72,
    height: 72,

    borderRadius: 36,

    justifyContent: "center",
    alignItems: "center",

    padding: 6,
  },

  date: {
    color: "#FFFFFF",

    fontSize: 11,

    fontWeight: "700",

    marginTop: 4,

    textAlign: "center",
  },
});