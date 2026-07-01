// app/about.tsx
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useTheme, type } from "@/theme";

export default function AboutScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={[{ fontSize: 20, fontWeight: "800", color: theme.text }]}>About</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="book" size={48} color={theme.accent} />
        </View>

        <Text style={[type.screenTitle, { color: theme.text, textAlign: "center", marginTop: 16 }]}>
          Scripture Memory
        </Text>
        <Text style={{ color: theme.textSecondary, textAlign: "center", marginTop: 6 }}>
          v{Constants.expoConfig?.version ?? "1.0.0"}
        </Text>

        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Scripture Memory is a simple, beautiful app to help you hide God's Word in your heart — one verse at a time.
        </Text>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          {[
            { icon: "book-outline" as const, text: "Smart Bible reference lookup" },
            { icon: "notifications-outline" as const, text: "Customizable verse reminders" },
            { icon: "card-outline" as const, text: "Swipeable review cards" },
            { icon: "pricetags-outline" as const, text: "Organized Scripture categories" },
            { icon: "trophy-outline" as const, text: "Mastery tracking & history" },
          ].map((f) => (
            <View key={f.text} style={styles.feature}>
              <Ionicons name={f.icon} size={20} color={theme.accent} />
              <Text style={[styles.featureText, { color: theme.text }]}>{f.text}</Text>
            </View>
          ))}
        </View>

        <Text style={{ color: theme.textSecondary, textAlign: "center", marginTop: 32, lineHeight: 22, fontSize: 13 }}>
          Made with love, for those who want to carry the Word wherever they go.{"\n\n"}
          "Thy word have I hid in mine heart, that I might not sin against thee."{"\n"}
          — Psalm 119:11
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  content: { padding: 20, paddingBottom: 60 },
  iconWrap: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  body: { lineHeight: 24, textAlign: "center", marginTop: 16, marginBottom: 24, fontSize: 15 },
  card: { borderRadius: 18, padding: 18 },
  feature: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  featureText: { fontSize: 15, fontWeight: "600" },
});
