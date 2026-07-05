// app/quiz.tsx
// "Test Yourself" — tap-to-select word bank quiz for a single verse.
// Reached from the new card on the Today screen (app/(tabs)/index.tsx),
// via router.push({ pathname: "/quiz", params: { verseId } }).
//
// Not a public route — quizzing only makes sense signed in, against your
// own verse data, so the normal auth guard in app/_layout.tsx applies.
import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, type, spacing } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useVerses } from "@/hooks/useVerses";
import { generateWordBankQuiz, tokensMatch, type QuizToken, type WordBankQuiz } from "@/lib/quiz";
import { recordQuizAttempt, getQuizAttemptsForVerse } from "@/lib/db";
import { logError } from "@/lib/monitoring";
import { useToast } from "@/lib/toast";
import { EmptyState } from "@/components/EmptyState";
import { PrimaryButton } from "@/components/PrimaryButton";

// Perfect scores in a row before we suggest marking the verse mastered.
const MASTERY_STREAK_THRESHOLD = 3;

export default function QuizScreen() {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { verseId } = useLocalSearchParams<{ verseId: string }>();
  const { user } = useAuth();
  const { verses, categories, markStatus } = useVerses(user?.id ?? null);

  const verse = useMemo(() => verses.find((v) => v.id === verseId), [verses, verseId]);
  const category = verse?.category_id
    ? categories.find((c) => c.id === verse.category_id)
    : undefined;

  const [quiz, setQuiz] = useState<WordBankQuiz | null>(() =>
    verse ? generateWordBankQuiz(verse.content) : null
  );
  const [placed, setPlaced] = useState<Record<number, number>>({}); // blank token index -> bank token index
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!verse || !quiz) {
    return (
      <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={theme.text} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "800", color: theme.text }}>Test Yourself</Text>
          <View style={{ width: 26 }} />
        </View>
        <EmptyState
          icon="alert-circle-outline"
          title="Verse not found"
          description="This verse may have been removed. Go back and try another."
        />
      </SafeAreaView>
    );
  }

  const usedBankIndices = new Set(Object.values(placed));
  const allFilled = quiz.blankIndices.every((bi) => placed[bi] !== undefined);

  const correctCount = quiz.blankIndices.reduce((count, bi) => {
    const bankIndex = placed[bi];
    if (bankIndex === undefined) return count;
    const chip = quiz.bank.find((t) => t.index === bankIndex);
    const target = quiz.tokens[bi];
    return chip && target && tokensMatch(chip.display, target.display) ? count + 1 : count;
  }, 0);

  function tapChip(chip: QuizToken) {
    if (submitted) return;

    if (usedBankIndices.has(chip.index)) {
      // Already placed somewhere — tapping it again pulls it back out.
      const blankEntry = Object.entries(placed).find(([, v]) => v === chip.index);
      if (blankEntry) {
        const blankIdx = Number(blankEntry[0]);
        setPlaced((p) => {
          const next = { ...p };
          delete next[blankIdx];
          return next;
        });
      }
      return;
    }

    const nextBlank = quiz!.blankIndices.find((bi) => placed[bi] === undefined);
    if (nextBlank === undefined) return; // all blanks already filled
    setPlaced((p) => ({ ...p, [nextBlank]: chip.index }));
  }

  function tapBlank(blankIndex: number) {
    if (submitted) return;
    if (placed[blankIndex] === undefined) return;
    setPlaced((p) => {
      const next = { ...p };
      delete next[blankIndex];
      return next;
    });
  }

  async function checkAnswers() {
    setSubmitted(true);

    try {
      setSaving(true);
      await recordQuizAttempt(verse!.id, correctCount, quiz!.blankIndices.length);

      if (correctCount === quiz!.blankIndices.length) {
        const history = await getQuizAttemptsForVerse(verse!.id, 10);
        let streak = 0;
        for (const attempt of history) {
          if (attempt.correct_count === attempt.total_blanks) streak++;
          else break;
        }

        if (streak >= MASTERY_STREAK_THRESHOLD && verse!.status !== "mastered") {
          Alert.alert(
            `${streak} perfect scores in a row!`,
            `You've nailed ${verse!.reference} ${streak} times in a row. Mark it as mastered?`,
            [
              { text: "Not yet", style: "cancel" },
              {
                text: "Mark Mastered",
                onPress: () => {
                  markStatus(verse!.id, "mastered").catch((e) => {
                    logError(e, { where: "quiz: mark mastered from streak prompt" });
                  });
                },
              },
            ]
          );
        }
      }
    } catch (e) {
      // Non-fatal — the quiz result itself is still shown either way,
      // this only affects whether the attempt gets counted toward streaks.
      logError(e, { where: "quiz: record attempt" });
    } finally {
      setSaving(false);
    }
  }

  function retry() {
    setQuiz(generateWordBankQuiz(verse!.content));
    setPlaced({});
    setSubmitted(false);
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "800", color: theme.text }}>Test Yourself</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {category ? (
          <View style={[styles.categoryChip, { backgroundColor: category.color + "22" }]}>
            <Text style={[type.caption, { color: category.color, fontWeight: "700" }]}>
              {category.name}
            </Text>
          </View>
        ) : null}

        <Text style={[type.verseReference, { color: theme.accent, marginTop: 8 }]}>
          {verse.reference} ({verse.translation})
        </Text>

        {/* Blanked verse */}
        <View style={styles.verseWrap}>
          {quiz.tokens.map((token) => {
            const isBlank = quiz.blankIndices.includes(token.index);
            if (!isBlank) {
              return (
                <Text key={token.index} style={[styles.word, { color: theme.text }]}>
                  {token.display}
                </Text>
              );
            }

            const bankIndex = placed[token.index];
            const chip = bankIndex !== undefined ? quiz.bank.find((t) => t.index === bankIndex) : undefined;
            const isCorrect = submitted && chip ? tokensMatch(chip.display, token.display) : null;

            const blankColor = submitted
              ? isCorrect
                ? theme.mastered
                : theme.error
              : theme.accent;

            return (
              <Pressable
                key={token.index}
                onPress={() => tapBlank(token.index)}
                disabled={submitted}
                style={[
                  styles.blank,
                  {
                    borderColor: blankColor,
                    backgroundColor: chip ? blankColor + "18" : "transparent",
                    minWidth: Math.max(36, token.display.length * 11),
                  },
                ]}
              >
                <Text style={[styles.word, { color: blankColor, fontWeight: "700" }]}>
                  {chip ? chip.display : "\u00A0"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {submitted && correctCount < quiz.blankIndices.length ? (
          <View style={[styles.answerKey, { backgroundColor: theme.errorSurface, borderColor: theme.errorSoft }]}>
            <Text style={[type.caption, { color: theme.error, fontWeight: "700", marginBottom: 4 }]}>
              Correct answers
            </Text>
            <Text style={[type.body, { color: theme.text }]}>
              {quiz.blankIndices.map((bi) => quiz.tokens[bi].display).join("  •  ")}
            </Text>
          </View>
        ) : null}

        {/* Word bank */}
        {!submitted && (
          <>
            <Text style={[type.sectionLabel, { color: theme.textSecondary, marginTop: spacing.xl }]}>
              TAP TO FILL IN
            </Text>
            <View style={styles.bank}>
              {quiz.bank.map((chip) => {
                const used = usedBankIndices.has(chip.index);
                return (
                  <Pressable
                    key={chip.index}
                    onPress={() => tapChip(chip)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: used ? theme.background : theme.surface,
                        borderColor: theme.border,
                        opacity: used ? 0.35 : 1,
                      },
                    ]}
                  >
                    <Text style={[type.body, { color: theme.text }]}>{chip.display}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {submitted && (
          <View style={styles.scoreRow}>
            <Ionicons
              name={correctCount === quiz.blankIndices.length ? "checkmark-circle" : "information-circle"}
              size={22}
              color={correctCount === quiz.blankIndices.length ? theme.mastered : theme.accent}
            />
            <Text style={[type.bodyBold, { color: theme.text, marginLeft: 8 }]}>
              {correctCount}/{quiz.blankIndices.length} correct
            </Text>
          </View>
        )}

        <View style={{ marginTop: spacing.xl }}>
          {!submitted ? (
            <PrimaryButton
              label="Check Answers"
              onPress={checkAnswers}
              disabled={!allFilled}
              loading={saving}
            />
          ) : (
            <>
              <PrimaryButton label="Try Again" onPress={retry} icon="refresh" />
              <PrimaryButton
                label="Done"
                onPress={() => router.back()}
                variant="ghost"
                style={{ marginTop: 12 }}
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  content: { padding: 20, paddingBottom: 60 },
  categoryChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  verseWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 20,
    alignItems: "center",
  },
  word: {
    fontFamily: "Lora_400Regular",
    fontSize: 19,
    lineHeight: 32,
    marginRight: 6,
  },
  blank: {
    borderBottomWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 6,
    marginRight: 6,
    marginBottom: 2,
    alignItems: "center",
  },
  answerKey: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bank: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
  },
});
