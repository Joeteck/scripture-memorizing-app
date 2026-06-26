import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, spacing, radius, type } from "@/theme";

type Props = {
    currentStreak: number;
    bestStreak: number;
    completedToday: boolean;
};

export function StreakCard({
    currentStreak,
    bestStreak,
    completedToday,
    }: Props) {
    const theme = useTheme();

    return (
        <View
        style={[
            styles.card,
            {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            },
        ]}
        >
        <View style={styles.header}>
            <View
            style={[
                styles.iconCircle,
                {
                backgroundColor: "#FFF3E8",
                },
            ]}
            >
            <Ionicons
                name="flame"
                size={28}
                color="#F97316"
            />
            </View>

            <View style={{ flex: 1 }}>
            <Text
                style={[
                type.caption,
                { color: theme.textSecondary },
                ]}
            >
                Current Streak
            </Text>

            <Text
                style={[
                styles.streakNumber,
                { color: theme.text },
                ]}
            >
                {currentStreak} Day
                {currentStreak !== 1 ? "s" : ""}
            </Text>
            </View>
        </View>

        <View
            style={[
            styles.divider,
            {
                backgroundColor: theme.border,
            },
            ]}
        />

        <View style={styles.footer}>
            <View style={styles.item}>
            <Text
                style={[
                type.caption,
                {
                    color: theme.textSecondary,
                },
                ]}
            >
                Best
            </Text>

            <Text
                style={[
                styles.value,
                {
                    color: theme.text,
                },
                ]}
            >
                {bestStreak} Days
            </Text>
            </View>

            <View style={styles.item}>
            <Text
                style={[
                type.caption,
                {
                    color: theme.textSecondary,
                },
                ]}
            >
                Today
            </Text>

            <View style={styles.status}>
                <Ionicons
                name={
                    completedToday
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
                size={18}
                color={
                    completedToday
                    ? "#16A34A"
                    : theme.textSecondary
                }
                />

                <Text
                style={[
                    styles.statusText,
                    {
                    color: completedToday
                        ? "#16A34A"
                        : theme.textSecondary,
                    },
                ]}
                >
                {completedToday
                    ? "Completed"
                    : "Pending"}
                </Text>
            </View>
            </View>
        </View>
        </View>
    );
    }

    const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderRadius: radius.xl,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
    },

    iconCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: "center",
        alignItems: "center",
        marginRight: spacing.md,
    },

    streakNumber: {
        fontSize: 30,
        fontWeight: "700",
        marginTop: 2,
    },

    divider: {
        height: 1,
        marginVertical: spacing.lg,
    },

    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    item: {
        flex: 1,
    },

    value: {
        fontSize: 18,
        fontWeight: "700",
        marginTop: 4,
    },

    status: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
    },

    statusText: {
        marginLeft: 6,
        fontWeight: "600",
    },
});