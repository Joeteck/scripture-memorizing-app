import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme, type } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useVerses } from "@/hooks/useVerses";

import { PrimaryButton } from "@/components/PrimaryButton";
import { CategoryPill } from "@/components/CategoryPill";

const REMINDER_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 Hour", value: 60 },
  { label: "2 Hours", value: 120 },
];

const TRANSLATIONS = [
  "KJV",
  "NKJV",
  "ESV",
  "NIV",
];

export default function AddVerseScreen() {
  const theme = useTheme();

  const { user } = useAuth();

  const {
    addVerse,
    categories,
  } = useVerses(user?.id ?? null);

  const [reference, setReference] = useState("");

  const [translation, setTranslation] =
    useState("KJV");

  const [categoryId, setCategoryId] =
    useState<string | null>(null);

  const [interval, setInterval] =
    useState(60);

  const [loading, setLoading] =
    useState(false);

  async function handleAdd() {
    if (!reference.trim()) {
      Alert.alert(
        "Verse Required",
        "Enter something like John 3:16."
      );
      return;
    }

    try {
      setLoading(true);

      await addVerse({
        reference: reference.trim(),
        categoryId,
        reminderIntervalMinutes: interval,
        translation,
      });

      Alert.alert(
        "Verse Added",
        "Your reminder has been scheduled."
      );

      setReference("");
      setCategoryId(null);
      setInterval(60);
    } catch (err: any) {
      Alert.alert(
        "Couldn't Add Verse",
        err.message ??
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        styles.container,
        {
          backgroundColor:
            theme.background,
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 60,
        }}
      >
        <Text
          style={[
            type.sectionLabel,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          NEW VERSE
        </Text>

        <Text
          style={[
            type.screenTitle,
            {
              color: theme.text,
              marginBottom: 30,
            },
          ]}
        >
          Add Scripture
        </Text>

        {/* Reference */}

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                theme.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.label,
              {
                color: theme.text,
              },
            ]}
          >
            Bible Reference
          </Text>

          <TextInput
            value={reference}
            onChangeText={setReference}
            placeholder="John 3:16"
            placeholderTextColor={
              theme.textSecondary
            }
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor:
                  theme.border,
              },
            ]}
          />

          {reference.length > 0 && (
            <Text
              style={{
                marginTop: 12,
                color:
                  theme.textSecondary,
              }}
            >
              This verse will be downloaded
              automatically after saving.
            </Text>
          )}
        </View>

        {/* Translation */}

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                theme.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.label,
              {
                color: theme.text,
              },
            ]}
          >
            Translation
          </Text>

          <View style={styles.wrap}>
            {TRANSLATIONS.map((item) => (
              <CategoryPill
                key={item}
                label={item}
                color={theme.accent}
                selected={
                  translation === item
                }
                onPress={() =>
                  setTranslation(item)
                }
              />
            ))}
          </View>
        </View>

        {/* Categories */}

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                theme.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.label,
              {
                color: theme.text,
              },
            ]}
          >
            Category
          </Text>

          <View style={styles.wrap}>
            {categories.map((category) => (
              <CategoryPill
                key={category.id}
                label={category.name}
                color={category.color}
                selected={
                  category.id ===
                  categoryId
                }
                onPress={() =>
                  setCategoryId(
                    category.id
                  )
                }
              />
            ))}
          </View>

          {categories.length === 0 && (
            <Text
              style={{
                color:
                  theme.textSecondary,
                marginTop: 10,
              }}
            >
              No categories yet.
            </Text>
          )}
        </View>

        {/* Reminder */}

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                theme.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.label,
              {
                color: theme.text,
              },
            ]}
          >
            Reminder Interval
          </Text>

          <View style={styles.wrap}>
            {REMINDER_OPTIONS.map(
              (item) => (
                <CategoryPill
                  key={item.value}
                  label={item.label}
                  color={theme.accent}
                  selected={
                    interval ===
                    item.value
                  }
                  onPress={() =>
                    setInterval(
                      item.value
                    )
                  }
                />
              )
            )}
          </View>

          <Text
            style={{
              marginTop: 14,
              color:
                theme.textSecondary,
            }}
          >
            You'll receive a notification
            every {interval} minutes until
            this verse is marked as
            mastered.
          </Text>
        </View>

        <PrimaryButton
          label="Add Verse"
          onPress={handleAdd}
          loading={loading}
          style={{
            marginTop: 20,
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },

  label: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },

  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
  },

  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});