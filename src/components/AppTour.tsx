// src/components/AppTour.tsx
// Spotlight tour that highlights different parts of the app
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: SW, height: SH } = Dimensions.get("window");

export interface TourStep {
  title: string;
  description: string;
  // position of the spotlight area (can be approximate)
  spotlight?: { x: number; y: number; width: number; height: number };
  icon?: keyof typeof Ionicons.glyphMap;
}

interface Props {
  steps: TourStep[];
  visible: boolean;
  onComplete: () => void;
}

export function AppTour({ steps, visible, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setStep(0);
      Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      // Pulse animation for spotlight
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      anim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible]);

  const goNext = useCallback(() => {
    if (step < steps.length - 1) {
      Animated.sequence([
        Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start(() => setStep((s) => s + 1));
    } else {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(onComplete);
    }
  }, [step, steps.length]);

  if (!visible) return null;

  const current = steps[step];
  const sp = current.spotlight;
  const isLast = step === steps.length - 1;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      {/* Dark overlay */}
      <Animated.View style={[styles.overlay, { opacity: anim }]}>
        {/* Spotlight cutout hint */}
        {sp && (
          <Animated.View
            style={[
              styles.spotlight,
              {
                left: sp.x - 8,
                top: sp.y - 8,
                width: sp.width + 16,
                height: sp.height + 16,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        )}
      </Animated.View>

      {/* Card — positioned below spotlight if possible */}
      <Animated.View
        style={[
          styles.card,
          {
            opacity: anim,
            top: sp ? Math.min(sp.y + sp.height + 24, SH - 260) : SH / 2 - 100,
          },
        ]}
      >
        {current.icon && (
          <View style={styles.iconWrap}>
            <Ionicons name={current.icon} size={28} color="#3D4B8C" />
          </View>
        )}

        <Text style={styles.stepCount}>
          {step + 1} of {steps.length}
        </Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.desc}>{current.description}</Text>

        <View style={styles.actions}>
          <Pressable style={styles.skipBtn} onPress={onComplete} hitSlop={8}>
            <Text style={styles.skipText}>Skip Tour</Text>
          </Pressable>

          <Pressable style={styles.nextBtn} onPress={goNext}>
            <Text style={styles.nextText}>{isLast ? "Done" : "Next"}</Text>
            <Ionicons
              name={isLast ? "checkmark" : "arrow-forward"}
              size={16}
              color="#fff"
              style={{ marginLeft: 6 }}
            />
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  spotlight: {
    position: "absolute",
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.6)",
    backgroundColor: "transparent",
  },
  card: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  stepCount: { fontSize: 12, fontWeight: "600", color: "#6B7280", marginBottom: 6 },
  title: { fontSize: 20, fontWeight: "800", color: "#14171F", marginBottom: 10 },
  desc: { fontSize: 15, color: "#6B7280", lineHeight: 22, marginBottom: 20 },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  skipBtn: { padding: 8 },
  skipText: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3D4B8C",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  nextText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
