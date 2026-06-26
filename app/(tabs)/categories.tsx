import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme, type } from "@/theme";

import { useAuth } from "@/hooks/useAuth";
import { useVerses } from "@/hooks/useVerses";

import { EmptyState } from "@/components/EmptyState";
import { PrimaryButton } from "@/components/PrimaryButton";
import { CategoryPill } from "@/components/CategoryPill";

const COLORS = [
  "#3D4B8C",
  "#5B8266",
  "#C98A3E",
  "#A14B4B",
  "#6B7280",
  "#2563EB",
  "#9333EA",
  "#EA580C",
];

export default function CategoriesScreen() {
  const theme = useTheme();

  const { user } = useAuth();

  const {
    verses,
    categories,
    addCategory,
  } = useVerses(user?.id ?? null);

  const [name, setName] = useState("");

  const [color, setColor] = useState(COLORS[0]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};

    verses.forEach((verse) => {
      if (!verse.category_id) return;

      map[verse.category_id] =
        (map[verse.category_id] ?? 0) + 1;
    });

    return map;
  }, [verses]);

  async function handleAdd() {
    if (!name.trim()) {
      Alert.alert(
        "Category Required",
        "Enter a category name."
      );
      return;
    }

    try {
      await addCategory(
        name.trim(),
        color
      );

      setName("");
      setColor(COLORS[0]);
    } catch (e: any) {
      Alert.alert(
        "Couldn't create category",
        e.message ??
          "Something went wrong."
      );
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
      <View style={styles.content}>
        <Text
          style={[
            type.sectionLabel,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          ORGANIZE
        </Text>

        <Text
          style={[
            type.screenTitle,
            {
              color: theme.text,
              marginBottom: 28,
            },
          ]}
        >
          Categories
        </Text>

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
            Category Name
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Faith"
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

          <Text
            style={[
              styles.label,
              {
                color: theme.text,
                marginTop: 20,
              },
            ]}
          >
            Color
          </Text>

          <View style={styles.colors}>
            {COLORS.map((item) => (
              <CategoryPill
                key={item}
                label=""
                color={item}
                selected={
                  color === item
                }
                onPress={() =>
                  setColor(item)
                }
              />
            ))}
          </View>

          <PrimaryButton
            label="Create Category"
            onPress={handleAdd}
            style={{
              marginTop: 20,
            }}
          />
        </View>

        <FlatList
          style={{
            marginTop: 25,
          }}
          data={categories}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState
              icon="folder-open-outline"
              title="No Categories"
              description="Create categories to organize your Scripture collection."
            />
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.categoryCard,
                {
                  backgroundColor:
                    theme.surface,
                },
              ]}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      item.color,
                  },
                ]}
              />

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.categoryName,
                    {
                      color:
                        theme.text,
                    },
                  ]}
                >
                  {item.name}
                </Text>

                <Text
                  style={{
                    color:
                      theme.textSecondary,
                    marginTop: 4,
                  }}
                >
                  {counts[item.id] ?? 0} verse
                  {(counts[item.id] ??
                    0) === 1
                    ? ""
                    : "s"}
                </Text>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    padding: 20,
  },

  card: {
    borderRadius: 18,
    padding: 18,
  },

  label: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },

  colors: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
  },

  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 16,
  },

  categoryName: {
    fontSize: 17,
    fontWeight: "700",
  },
});