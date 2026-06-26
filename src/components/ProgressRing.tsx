import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { Svg, Circle } from "react-native-svg";
import { useTheme, type } from "@/theme";

interface ProgressRingProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

const AnimatedCircle =
  Animated.createAnimatedComponent(Circle);

export function ProgressRing({
  completed,
  total,
  size = 170,
  strokeWidth = 14,
}: ProgressRingProps) {
  const theme = useTheme();

  const progress =
    total === 0
      ? 0
      : Math.min(completed / total, 1);

  const percentage = Math.round(progress * 100);

  const animated =
    useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: progress,
      duration: 900,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const radius =
    (size - strokeWidth) / 2;

  const circumference =
    radius * Math.PI * 2;

  const strokeDashoffset =
    animated.interpolate({
      inputRange: [0, 1],
      outputRange: [
        circumference,
        0,
      ],
    });

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <Svg
        width={size}
        height={size}
      >
        <Circle
          stroke={theme.border}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />

        <AnimatedCircle
          stroke={theme.accent}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={
            strokeDashoffset
          }
          rotation="-90"
          origin={`${size / 2}, ${
            size / 2
          }`}
        />
      </Svg>

      <View style={styles.center}>
        <Text
          style={[
            type.hero,
            {
              color: theme.text,
            },
          ]}
        >
          {percentage}%
        </Text>

        <Text
          style={[
            type.caption,
            {
              color:
                theme.textSecondary,
              marginTop: 4,
            },
          ]}
        >
          {completed} of {total}
        </Text>

        <Text
          style={[
            type.caption,
            {
              color:
                theme.textSecondary,
            },
          ]}
        >
          verses mastered
        </Text>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      alignSelf: "center",
      justifyContent: "center",
      alignItems: "center",
    },

    center: {
      position: "absolute",
      alignItems: "center",
      justifyContent: "center",
    },
  });