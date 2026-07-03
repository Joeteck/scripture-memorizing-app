// app/(tabs)/categories.tsx — with verse count, tappable to see verses inside
import React, { useMemo, useState } from "react";
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, type } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useVerses } from "@/hooks/useVerses";
import { useToast } from "@/lib/toast";
import { logError } from "@/lib/monitoring";

import { EmptyState } from "@/components/EmptyState";
import { PrimaryButton } from "@/components/PrimaryButton";
import { CategoryPill } from "@/components/CategoryPill";
import { Category, Verse } from "@/types";

const COLORS = ["#3D4B8C","#5B8266","#C98A3E","#A14B4B","#6B7280","#2563EB","#9333EA","#EA580C"];

function CategoryDetailModal({
  category,
  verses,
  onClose,
}: { category: Category; verses: Verse[]; onClose: () => void }) {
  const theme = useTheme();
  const slideAnim = React.useRef(new Animated.Value(600)).current;

  React.useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 70, friction: 11 }).start();
  }, []);

  function close() {
    Animated.timing(slideAnim, { toValue: 600, duration: 220, useNativeDriver: true }).start(onClose);
  }

  return (
    <Modal transparent animationType="none" statusBarTranslucent>
      <View style={[modalStyles.backdrop, { backgroundColor: "rgba(0,0,0,0.4)" }]}>
        <Animated.View
          style={[
            modalStyles.sheet,
            { backgroundColor: theme.background, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={[modalStyles.header, { borderBottomColor: theme.border }]}>
            <Pressable onPress={close} hitSlop={10} style={modalStyles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </Pressable>
            <View style={[modalStyles.dot, { backgroundColor: category.color }]} />
            <Text style={[type.screenTitle, { color: theme.text, flex: 1 }]}>{category.name}</Text>
            <Text style={[{ color: theme.textSecondary, fontSize: 14 }]}>
              {verses.length} verse{verses.length !== 1 ? "s" : ""}
            </Text>
          </View>

          <FlatList
            data={verses}
            keyExtractor={(v) => v.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            ListEmptyComponent={
              <EmptyState title="No Verses" description="No verses in this category yet." />
            }
            renderItem={({ item }) => (
              <View style={[modalStyles.verseCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[{ color: theme.accent, fontWeight: "700", fontSize: 15, marginBottom: 6 }]}>
                  {item.reference}
                </Text>
                <Text style={[{ color: theme.text, lineHeight: 22, fontSize: 14 }]} numberOfLines={4}>
                  {item.content}
                </Text>
                <Text style={[{ color: theme.textSecondary, fontSize: 12, marginTop: 8 }]}>
                  {item.translation} • {item.status === "mastered" ? "Mastered" : "Learning"}
                </Text>
              </View>
            )}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: { height: "85%", borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: { marginRight: 4 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  verseCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
});

export default function CategoriesScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const toast = useToast();

  const { verses, categories, addCategory } = useVerses(user?.id ?? null);

  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    verses.forEach((v) => { if (v.category_id) map[v.category_id] = (map[v.category_id] ?? 0) + 1; });
    return map;
  }, [verses]);

  async function handleAdd() {
    if (!name.trim()) { toast.showError("Name Required", "Enter a category name."); return; }
    try {
      setCreating(true);
      await addCategory(name.trim(), color);
      toast.showSuccess("Category Created", `"${name.trim()}" is ready to use.`);
      setName("");
      setColor(COLORS[0]);
    } catch (e: any) {
      logError(e, { where: "add category", name: name.trim() });
      toast.showError("Error", e.message ?? "Something went wrong.");
    } finally {
      setCreating(false);
    }
  }

  const categoryVerses = selectedCategory
    ? verses.filter((v) => v.category_id === selectedCategory.id)
    : [];

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[type.sectionLabel, { color: theme.textSecondary }]}>ORGANIZE</Text>
        <Text style={[type.screenTitle, { color: theme.text, marginBottom: 28 }]}>Categories</Text>

        {/* Create form */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.label, { color: theme.text }]}>Category Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Faith"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          />
          <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Color</Text>
          <View style={styles.colors}>
            {COLORS.map((item) => (
              <CategoryPill key={item} label="" color={item} selected={color === item} onPress={() => setColor(item)} />
            ))}
          </View>
          <PrimaryButton label="Create Category" onPress={handleAdd} loading={creating} style={{ marginTop: 20 }} />
        </View>

        {/* List */}
        <FlatList
          style={{ marginTop: 25 }}
          data={categories}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState icon="folder-open-outline" title="No Categories" description="Create categories to organize your Scripture collection." />
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.categoryCard,
                { backgroundColor: pressed ? theme.accentSoft : theme.surface },
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.categoryName, { color: theme.text }]}>{item.name}</Text>
                <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                  {counts[item.id] ?? 0} verse{(counts[item.id] ?? 0) === 1 ? "" : "s"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </Pressable>
          )}
        />
      </View>

      {selectedCategory && (
        <CategoryDetailModal
          category={selectedCategory}
          verses={categoryVerses}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20 },
  card: { borderRadius: 18, padding: 18 },
  label: { fontWeight: "700", fontSize: 16, marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  colors: { flexDirection: "row", flexWrap: "wrap" },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
  },
  dot: { width: 18, height: 18, borderRadius: 9, marginRight: 16 },
  categoryName: { fontSize: 17, fontWeight: "700" },
});
