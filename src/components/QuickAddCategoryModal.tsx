// src/components/QuickAddCategoryModal.tsx
// Lets users create a category without leaving the Add Verse flow
import React, { useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";
import { PrimaryButton } from "./PrimaryButton";
import { CategoryPill } from "./CategoryPill";

const COLORS = ["#3D4B8C","#5B8266","#C98A3E","#A14B4B","#6B7280","#2563EB","#9333EA","#EA580C"];

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, color: string) => Promise<void>;
}

export function QuickAddCategoryModal({ visible, onClose, onCreate }: Props) {
  const theme = useTheme();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 9 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      setName("");
      setColor(COLORS[0]);
    }
  }, [visible]);

  async function handleCreate() {
    if (!name.trim()) return;
    try {
      setLoading(true);
      await onCreate(name.trim(), color);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
      </TouchableWithoutFeedback>

      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: theme.background, transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>New Category</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Faith, Courage, Prayer"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
            autoFocus
            accessibilityLabel="Category name"
          />

          <Text style={[styles.label, { color: theme.text }]}>Color</Text>
          <View style={styles.colors}>
            {COLORS.map((c) => (
              <CategoryPill key={c} label="" color={c} selected={color === c} onPress={() => setColor(c)} />
            ))}
          </View>

          <PrimaryButton label="Create Category" onPress={handleCreate} loading={loading} style={{ marginTop: 8 }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const ABSOLUTE_FILL = { position: "absolute" as const, left: 0, right: 0, top: 0, bottom: 0 };

const styles = StyleSheet.create({
  backdrop: { ...ABSOLUTE_FILL, backgroundColor: "rgba(0,0,0,0.5)" },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  title: { fontSize: 19, fontWeight: "800" },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 18 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 10 },
  colors: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
});
