import React from "react";
import { View, Text, Image, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme, type } from "@/theme";

/**
 * Rendered while fonts/DB/auth are initializing in app/_layout.tsx — this is
 * the branded loading state shown in Expo Go and dev builds. (The separate
 * native boot splash, configured via the expo-splash-screen plugin in
 * app.config.js, is what shows before any JS has run at all; it can only be
 * previewed in a real build, not Expo Go.)
 */
export default function AppSplashScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Image source={require("../assets/logo.png")} style={styles.logo} resizeMode="contain" />

      <Text style={[type.screenTitle, { color: theme.text, marginTop: 24 }]}>Scripture Memory</Text>

      <Text style={[type.body, { color: theme.textSecondary, marginTop: 6 }]}>
        Memorize. Reflect. Grow.
      </Text>

      <ActivityIndicator size="small" color={theme.accent} style={{ marginTop: 30 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 24,
  },
});
