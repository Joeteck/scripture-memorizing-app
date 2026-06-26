import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";

import VerseCard from "./VerseCard";

import { Verse, Category } from "@/types";
import { useTheme } from "@/theme";

const SCREEN_WIDTH = Dimensions.get("window").width;

const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface Props {
  verses: Verse[];

  categoriesById: Record<string, Category>;

  onMastered: (verse: Verse) => void;

  onSkip: (verse: Verse) => void;
}

export function SwipeDeck({
  verses,
  categoriesById,
  onMastered,
  onSkip,
}: Props) {
  const theme = useTheme();

  const [index, setIndex] = useState(0);

  const position = useRef(
    new Animated.ValueXY()
  ).current;

  useEffect(() => {
    position.setValue({
      x: 0,
      y: 0,
    });
  }, [index]);

  const rotate = position.x.interpolate({
    inputRange: [
      -SCREEN_WIDTH,
      0,
      SCREEN_WIDTH,
    ],
    outputRange: [
      "-20deg",
      "0deg",
      "20deg",
    ],
  });

  const cardStyle = {
    transform: [
      {
        translateX: position.x,
      },
      {
        translateY: position.y,
      },
      {
        rotate,
      },
    ],
  };

  function resetPosition() {
    Animated.spring(position, {
      toValue: {
        x: 0,
        y: 0,
      },
      useNativeDriver: false,
    }).start();
  }

  function forceSwipe(direction: "left" | "right") {
    Animated.timing(position, {
      toValue: {
        x:
          direction === "right"
            ? SCREEN_WIDTH + 120
            : -SCREEN_WIDTH - 120,

        y: 0,
      },

      duration: 250,

      useNativeDriver: false,
    }).start(() => finishSwipe(direction));
  }

  function finishSwipe(
    direction: "left" | "right"
  ) {
    const verse = verses[index];

    if (!verse) return;

    if (direction === "right") {
      onMastered(verse);
    } else {
      onSkip(verse);
    }

    position.setValue({
      x: 0,
      y: 0,
    });

    setIndex((v) => v + 1);
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () =>
          true,

        onPanResponderMove: (
          _,
          gesture
        ) => {
          position.setValue({
            x: gesture.dx,
            y: gesture.dy,
          });
        },

        onPanResponderRelease: (
          _,
          gesture
        ) => {
          if (
            gesture.dx >
            SWIPE_THRESHOLD
          ) {
            forceSwipe("right");
            return;
          }

          if (
            gesture.dx <
            -SWIPE_THRESHOLD
          ) {
            forceSwipe("left");
            return;
          }

          resetPosition();
        },
      }),
    [index]
  );

  if (!verses.length) {
    return (
      <View
        style={[
          styles.empty,
          {
            backgroundColor:
              theme.surface,
            borderColor:
              theme.border,
          },
        ]}
      >
        <Text
          style={{
            color:
              theme.textSecondary,
            fontSize: 18,
            textAlign: "center",
            lineHeight: 28,
          }}
        >
          🎉

          {"\n\n"}

          You've completed today's verses.

          {"\n\n"}

          Add another verse or come back later.
        </Text>
      </View>
    );
  }

  if (index >= verses.length) {
    return (
      <View
        style={[
          styles.empty,
          {
            backgroundColor:
              theme.surface,
            borderColor:
              theme.border,
          },
        ]}
      >
        <Text
          style={{
            color:
              theme.textSecondary,
            fontSize: 18,
            textAlign: "center",
          }}
        >
          Great work today 🙌
        </Text>
      </View>
    );
  }

    const renderCards = () => {
    return verses
      .map((verse, i) => {
        if (i < index) {
          return null;
        }

        const category =
          verse.category_id
            ? categoriesById[verse.category_id]
            : undefined;

        if (i === index) {
          return (
            <Animated.View
              key={verse.id}
              {...panResponder.panHandlers}
              style={[
                styles.animatedCard,
                cardStyle,
              ]}
            >
              {/* Swipe Right */}
              <Animated.View
                style={[
                  styles.badge,
                  styles.rightBadge,
                  {
                    opacity:
                      position.x.interpolate({
                        inputRange: [
                          0,
                          SWIPE_THRESHOLD,
                        ],
                        outputRange: [
                          0,
                          1,
                        ],
                        extrapolate:
                          "clamp",
                      }),
                  },
                ]}
              >
                <Text
                  style={
                    styles.badgeText
                  }
                >
                  ✓ MASTERED
                </Text>
              </Animated.View>

              {/* Swipe Left */}
              <Animated.View
                style={[
                  styles.badge,
                  styles.leftBadge,
                  {
                    opacity:
                      position.x.interpolate({
                        inputRange: [
                          -SWIPE_THRESHOLD,
                          0,
                        ],
                        outputRange: [
                          1,
                          0,
                        ],
                        extrapolate:
                          "clamp",
                      }),
                  },
                ]}
              >
                <Text
                  style={
                    styles.badgeText
                  }
                >
                  SKIP
                </Text>
              </Animated.View>

              <VerseCard
                verse={verse}
                category={category}
              />
            </Animated.View>
          );
        }

        return (
          <Animated.View
            key={verse.id}
            style={[
              styles.stackCard,
              {
                top:
                  (i - index) * 12,

                transform: [
                  {
                    scale:
                      1 -
                      (i -
                        index) *
                        0.04,
                  },
                ],
              },
            ]}
          >
            <VerseCard
              verse={verse}
              category={category}
            />
          </Animated.View>
        );
      })
      .reverse();
  };

  return (
    <View
      style={styles.container}
    >
      {renderCards()}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      minHeight: 560,
      marginTop: 10,
    },

    animatedCard: {
      position: "absolute",
      width: "100%",
    },

    stackCard: {
      position: "absolute",
      width: "100%",
    },

    empty: {
      minHeight: 500,
      borderRadius: 24,
      borderWidth: 1,
      justifyContent:
        "center",
      alignItems: "center",
      padding: 30,
    },

    badge: {
      position: "absolute",
      top: 35,
      zIndex: 999,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 3,
    },

    rightBadge: {
      right: 20,
      borderColor: "#2ECC71",
      transform: [
        {
          rotate: "18deg",
        },
      ],
    },

    leftBadge: {
      left: 20,
      borderColor: "#E74C3C",
      transform: [
        {
          rotate: "-18deg",
        },
      ],
    },

    badgeText: {
      fontWeight: "800",
      fontSize: 18,
      color: "#111827",
    },
  });

export default SwipeDeck;