// src/components/SwipeDeck.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import VerseCard from "./VerseCard";
import { Verse, Category } from "@/types";
import { useTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";

const SW = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SW * 0.28;
const SWIPE_OUT_DURATION = 300;

interface Props {
  verses: Verse[];
  categoriesById: Record<string, Category>;
  onMastered: (verse: Verse) => void;
  onSkip: (verse: Verse) => void;
}

export function SwipeDeck({ verses, categoriesById, onMastered, onSkip }: Props) {
  const theme = useTheme();
  const [queue, setQueue] = useState<Verse[]>(verses);
  const [isAnimating, setIsAnimating] = useState(false);

  const position = useRef(new Animated.ValueXY()).current;
  // ✅ useNativeDriver: false — must match position's driver
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setQueue((current) => {
      const incomingIds = new Set(verses.map((v) => v.id));
      const currentIds = new Set(current.map((v) => v.id));
      const stillValid = current.filter((v) => incomingIds.has(v.id));
      const newOnes = verses.filter((v) => !currentIds.has(v.id));
      return [...stillValid, ...newOnes];
    });
  }, [verses]);

  useEffect(() => {
    position.setValue({ x: 0, y: 0 });
    fadeAnim.setValue(1);
  }, [queue[0]?.id]);

  const rotate = position.x.interpolate({
    inputRange: [-SW, 0, SW],
    outputRange: ["-18deg", "0deg", "18deg"],
    extrapolate: "clamp",
  });

  const masteredOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const skipOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  function resetPosition() {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false, // ✅ consistent — no native driver
      tension: 80,
      friction: 9,
    }).start();
  }

  function forceSwipe(direction: "left" | "right", velocityX = 0) {
    if (isAnimating) return;
    setIsAnimating(true);
    const x = direction === "right" ? SW + 100 : -SW - 100;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: Math.max(150, SWIPE_OUT_DURATION - Math.abs(velocityX) * 50),
      useNativeDriver: false, // ✅ consistent
    }).start(() => {
      finishSwipe(direction);
      setIsAnimating(false);
    });
  }

  function finishSwipe(direction: "left" | "right") {
    const verse = queue[0];
    if (!verse) return;
    if (direction === "right") {
      onMastered(verse);
      setQueue((q) => q.slice(1));
    } else {
      onSkip(verse);
      setQueue((q) => [...q.slice(1), verse]);
    }
    position.setValue({ x: 0, y: 0 });
  }

  function animateOut(callback: () => void) {
    if (isAnimating) return;
    setIsAnimating(true);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: false, // ✅ consistent — no native driver
    }).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: false, // ✅ consistent
      }).start(() => setIsAnimating(false));
    });
  }

  function handleSkip() {
    const verse = queue[0];
    if (!verse) return;
    animateOut(() => {
      onSkip(verse);
      setQueue((q) => [...q.slice(1), verse]);
    });
  }

  function handleAdvance() {
    if (queue.length < 2) return;
    animateOut(() => {
      setQueue((q) => [...q.slice(1), q[0]]);
    });
  }

  function handleMastered() {
    const verse = queue[0];
    if (!verse) return;
    animateOut(() => {
      onMastered(verse);
      setQueue((q) => q.slice(1));
    });
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          !isAnimating &&
          Math.abs(gesture.dx) > 8 &&
          Math.abs(gesture.dy) < 50,
        onPanResponderMove: (_, gesture) => {
          position.setValue({ x: gesture.dx, y: gesture.dy * 0.12 });
        },
        onPanResponderRelease: (_, gesture) => {
          const fastSwipe = Math.abs(gesture.vx) > 0.5;
          if (gesture.dx > SWIPE_THRESHOLD || (fastSwipe && gesture.dx > 60)) {
            forceSwipe("right", gesture.vx);
          } else if (
            gesture.dx < -SWIPE_THRESHOLD ||
            (fastSwipe && gesture.dx < -60)
          ) {
            forceSwipe("left", gesture.vx);
          } else {
            resetPosition();
          }
        },
        onPanResponderTerminate: () => resetPosition(),
      }),
    [queue, isAnimating]
  );

  if (!queue.length) {
    return (
      <View
        style={[
          styles.empty,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Ionicons
          name="sparkles"
          size={42}
          color={theme.mastered}
          style={{ marginBottom: 14 }}
        />
        <Text
          style={{
            color: theme.text,
            fontSize: 18,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          All Caught Up!
        </Text>
        <Text
          style={{
            color: theme.textSecondary,
            textAlign: "center",
            marginTop: 10,
            lineHeight: 22,
          }}
        >
          You've reviewed all your verses for now.{"\n"}Add a new one to keep
          going.
        </Text>
      </View>
    );
  }

  const verse = queue[0];
  const category = verse.category_id
    ? categoriesById[verse.category_id]
    : undefined;

  return (
    <View style={styles.container}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.cardWrapper,
          {
            opacity: fadeAnim,
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate },
            ],
          },
        ]}
      >
        <Animated.View
          style={[styles.badge, styles.badgeRight, { opacity: masteredOpacity }]}
          pointerEvents="none"
        >
          <Ionicons name="checkmark-circle" size={18} color="#3A7D44" />
          <Text style={[styles.badgeText, { color: "#3A7D44" }]}> MASTERED</Text>
        </Animated.View>

        <Animated.View
          style={[styles.badge, styles.badgeLeft, { opacity: skipOpacity }]}
          pointerEvents="none"
        >
          <Ionicons name="refresh-circle" size={18} color="#3D4B8C" />
          <Text style={[styles.badgeText, { color: "#3D4B8C" }]}> SKIP</Text>
        </Animated.View>

        <VerseCard verse={verse} category={category} />
      </Animated.View>

      <Text style={[styles.counter, { color: theme.textSecondary }]}>
        {queue.length} verse{queue.length !== 1 ? "s" : ""} remaining
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={handleSkip}
          activeOpacity={0.7}
          disabled={isAnimating}
        >
          <Ionicons
            name="refresh-circle-outline"
            size={28}
            color={theme.textSecondary}
          />
          <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>
            Skip
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.actionBtnCenter,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={handleAdvance}
          activeOpacity={0.7}
          disabled={isAnimating || queue.length < 2}
        >
          <Ionicons
            name="arrow-forward-circle-outline"
            size={28}
            color={
              isAnimating || queue.length < 2 ? theme.border : theme.accent
            }
          />
          <Text
            style={[
              styles.actionLabel,
              {
                color:
                  isAnimating || queue.length < 2
                    ? theme.border
                    : theme.accent,
              },
            ]}
          >
            Next
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={handleMastered}
          activeOpacity={0.7}
          disabled={isAnimating}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={28}
            color={theme.mastered}
          />
          <Text style={[styles.actionLabel, { color: theme.mastered }]}>
            Mastered
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    paddingBottom: 20,
  },
  cardWrapper: {
    width: "100%",
  },
  empty: {
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 260,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  counter: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 14,
    marginBottom: 14,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 5,
  },
  actionBtnCenter: {
    flex: 1.15,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    top: 20,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: "rgba(255,255,255,0.95)",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  badgeRight: { right: 16, borderColor: "#3A7D44" },
  badgeLeft: { left: 16, borderColor: "#3D4B8C" },
  badgeText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
});

export default SwipeDeck;