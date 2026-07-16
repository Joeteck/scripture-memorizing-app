// src/components/AvatarButton.tsx
// Premium glassmorphism avatar button with shining animation
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme, getReadableTextColor } from "@/theme";
import { AVATAR_COLORS } from "@/theme/avatarColors";

interface Props {
  initials: string;
  avatarIndex?: number;
  onPress: () => void;
  size?: number;
}

export function AvatarButton({ initials, avatarIndex = 0, onPress, size = 52 }: Props) {
  const theme = useTheme();
  const shineAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(2200),
        Animated.timing(shineAnim, {
          toValue: 1.5,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shineAnim, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const avatarColor = AVATAR_COLORS[avatarIndex % AVATAR_COLORS.length];
  const initialsColor = getReadableTextColor(avatarColor);
  const borderRadius = size / 2;

  const shineTranslate = shineAnim.interpolate({
    inputRange: [-1, 1.5],
    outputRange: [-size * 1.2, size * 1.8],
  });

  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <View
        style={[
          styles.wrapper,
          {
            width: size,
            height: size,
            borderRadius,
            backgroundColor: avatarColor,
            borderColor: `${avatarColor}55`,
          },
        ]}
      >
        {/* Glass overlay */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius,
              backgroundColor: "rgba(255,255,255,0.12)",
            },
          ]}
        />

        {/* Animated shine */}
        <Animated.View
          style={[
            styles.shine,
            {
              height: size * 2,
              transform: [{ translateX: shineTranslate }, { rotate: "25deg" }],
            },
          ]}
        />

        <Text
          style={[
            styles.initials,
            { fontSize: size * 0.35, color: initialsColor },
          ]}
        >
          {initials}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  shine: {
    position: "absolute",
    width: 20,
    backgroundColor: "rgba(255,255,255,0.35)",
    top: -20,
  },
  initials: {
    fontWeight: "800",
    letterSpacing: 1,
  },
});
