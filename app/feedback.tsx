// app/feedback.tsx
import React, { useState } from "react";
import {
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useTheme, type as typeStyles, spacing } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { submitFeedback } from "@/lib/feedback";
import { logError } from "@/lib/monitoring";
import { useToast } from "@/lib/toast";
import { PrimaryButton } from "@/components/PrimaryButton";
import { CategoryPill } from "@/components/CategoryPill";
import { ModalHeader } from "@/components/ModalHeader";

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

  const [feedbackType, setFeedbackType] = useState<"bug" | "suggestion" | "general">("general");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!message.trim()) {
      toast.showError("Message Required", "Tell us what's on your mind.");
      return;
    }
    try {
      setLoading(true);
      await submitFeedback({
        userId: user?.id ?? null,
        userEmail: user?.email ?? null,
        type: feedbackType,
        message: message.trim(),
      });
      toast.showSuccess("Thank You", "Your note has been sent — we read every one.");
      setMessage("");
      router.back();
    } catch (e: any) {
      logError(e, { where: "submit feedback", type: feedbackType });
      toast.showError("Couldn't Send", e.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <ModalHeader title="Send Feedback" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[typeStyles.body, { color: theme.textSecondary, marginBottom: spacing.lg }]}>
          Found a bug, have an idea, or just want to say hello? We read every message.
        </Text>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.label, { color: theme.text }]}>Type</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {TYPES.map((t) => (
              <CategoryPill
                key={t.value}
                label={t.label}
                color={theme.accent}
                icon={t.icon}
                selected={feedbackType === t.value}
                onPress={() => setFeedbackType(t.value)}
              />
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.label, { color: theme.text }]}>Message</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            placeholder="Describe the issue or suggestion…"
            placeholderTextColor={theme.textSecondary}
            style={[styles.textarea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            textAlignVertical="top"
            accessibilityLabel="Feedback message"
          />
        </View>

        <PrimaryButton label="Send Feedback" onPress={handleSubmit} loading={loading} style={{ marginTop: 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, paddingTop: 0, paddingBottom: 60 },
  card: { borderRadius: 18, padding: 18, marginBottom: 18 },
  label: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  textarea: { borderWidth: 1, borderRadius: 14, padding: 16, fontSize: 15, lineHeight: 22, minHeight: 140 },
});
