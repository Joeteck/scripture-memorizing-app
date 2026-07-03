// app/feedback.tsx
import React, { useState } from "react";
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, type, spacing } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { submitFeedback } from "@/lib/feedback";
import { logError } from "@/lib/monitoring";
import { useToast } from "@/lib/toast";
import { PrimaryButton } from "@/components/PrimaryButton";
import { CategoryPill } from "@/components/CategoryPill";

const TYPES = [
  { label: "Bug Report", value: "bug" as const, icon: "bug-outline" as const },
  { label: "Suggestion", value: "suggestion" as const, icon: "bulb-outline" as const },
  { label: "General", value: "general" as const, icon: "chatbubble-outline" as const },
];

export default function FeedbackScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const [type, setType] = useState<"bug" | "suggestion" | "general">("general");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!message.trim()) {
      toast.showError("Message Required", "Tell us what's on your mind.");
      return;
    }
    try {
      setLoading(true);
      await submitFeedback({ userId: user?.id ?? null, userEmail: user?.email ?? null, type, message: message.trim() });
      toast.showSuccess("Thank You", "Your note has been sent — we read every one.");
      setMessage("");
      router.back();
    } catch (e: any) {
      logError(e, { where: "submit feedback", type });
      toast.showError("Couldn't Send", e.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={[{ fontSize: 20, fontWeight: "800", color: theme.text }]}>Send Feedback</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.label, { color: theme.text }]}>Type</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 20 }}>
          {TYPES.map((t) => (
            <CategoryPill
              key={t.value}
              label={t.label}
              color={theme.accent}
              icon={t.icon}
              selected={type === t.value}
              onPress={() => setType(t.value)}
            />
          ))}
        </View>

        <Text style={[styles.label, { color: theme.text }]}>Message</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          placeholder="Describe the issue or suggestion…"
          placeholderTextColor={theme.textSecondary}
          style={[styles.textarea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
          textAlignVertical="top"
        />

        <PrimaryButton label="Send Feedback" onPress={handleSubmit} loading={loading} style={{ marginTop: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  content: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  textarea: { borderWidth: 1, borderRadius: 14, padding: 16, fontSize: 15, lineHeight: 22, minHeight: 140 },
});
