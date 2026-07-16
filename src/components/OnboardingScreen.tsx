// src/components/OnboardingScreen.tsx
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";

const { width: SW, height: SH } = Dimensions.get("window");

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bg: string;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    id: "1",
    icon: "book-outline",
    iconColor: "#3D4B8C",
    bg: "#EEF2FF",
    title: "Hide God's Word\nin Your Heart",
    subtitle:
      "Scripture Memory helps you memorize Bible verses through consistent, gentle repetition — one verse at a time.",
  },
  {
    id: "2",
    icon: "card-outline",
    iconColor: "#C98A3E",
    bg: "#FFF8E7",
    title: "Swipe Your Way\nto Mastery",
    subtitle:
      "Review today's verses as beautiful cards. Swipe right when you know it, left to see it again later.",
  },
  {
    id: "3",
    icon: "notifications-outline",
    iconColor: "#3A7D44",
    bg: "#F0FBF2",
    title: "Gentle Reminders\nThroughout Your Day",
    subtitle:
      "Set reminders and we'll nudge you to review each verse until it's truly hidden in your heart.",
  },
  {
    id: "4",
    icon: "pricetags-outline",
    iconColor: "#9333EA",
    bg: "#F5F0FF",
    title: "Organize by\nTheme or Season",
    subtitle:
      "Create categories like Faith, Courage, or Prayer — and group your scriptures the way your heart thinks.",
  },
  {
    id: "5",
    icon: "trophy-outline",
    iconColor: "#3D4B8C",
    bg: "#EEF2FF",
    title: "Celebrate Every\nVerse Mastered",
    subtitle:
      "Every verse you master is a milestone. Your History tab keeps a beautiful record of your journey.",
  },
];

interface Props {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: Props) {
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) setActiveIndex(viewableItems[0].index ?? 0);
  });
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  function goNext() {
    if (activeIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      onComplete();
    }
  }

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Skip */}
      <Pressable style={styles.skip} onPress={onComplete} hitSlop={12}>
        <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
      </Pressable>

      {/* Slides */}
      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfig.current}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {/* Icon bubble */}
            <View style={[styles.iconBubble, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon} size={72} color={item.iconColor} />
            </View>

            <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => {
          const inputRange = [(i - 1) * SW, i * SW, (i + 1) * SW];
          const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: "clamp" });
          const opacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: "clamp" });
          return (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotWidth, opacity, backgroundColor: theme.accent }]}
            />
          );
        })}
      </View>

      {/* CTA */}
      <Pressable
        style={[styles.btn, { backgroundColor: theme.accent }]}
        onPress={goNext}
      >
        <Text style={[styles.btnText, { color: theme.onAccent }]}>{isLast ? "Get Started" : "Continue"}</Text>
        <Ionicons name={isLast ? "checkmark" : "arrow-forward"} size={20} color={theme.onAccent} style={{ marginLeft: 8 }} />
      </Pressable>

      <View style={{ height: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  skip: {
    position: "absolute",
    top: 56,
    right: 24,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: { fontSize: 15, fontWeight: "600" },
  slide: {
    width: SW,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  iconBubble: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 30,
    fontFamily: "Lora_600SemiBold",
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 26,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 28,
  },
  dot: { height: 8, borderRadius: 4 },
  btn: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnText: { fontSize: 17, fontWeight: "700" },
});
