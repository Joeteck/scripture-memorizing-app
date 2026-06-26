import React, { useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, type } from "@/theme";

interface DashboardHeaderProps {
    userName?: string;
}

const MORNING_MESSAGES = [
    "Hide God's Word in your heart today.",
    "A new day, another verse to remember.",
    "Small daily steps build lasting faith.",
];

const AFTERNOON_MESSAGES = [
    "Keep going. You're doing great.",
    "Take a few minutes to review a verse.",
    "A little consistency goes a long way.",
];

const EVENING_MESSAGES = [
    "End the day with God's Word.",
    "Review today's verses before you rest.",
    "Finish strong today.",
];

export function DashboardHeader({
    userName,
    }: DashboardHeaderProps) {
    const theme = useTheme();

    const hour = new Date().getHours();

    const greeting = useMemo(() => {
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    }, [hour]);

    const message = useMemo(() => {
        let list = MORNING_MESSAGES;

        if (hour >= 12 && hour < 17) {
        list = AFTERNOON_MESSAGES;
        }

        if (hour >= 17) {
        list = EVENING_MESSAGES;
        }

        return list[
        new Date().getDate() % list.length
        ];
    }, [hour]);

    return (
        <View style={styles.container}>
        <View style={styles.left}>
            <Text
            style={[
                type.caption,
                {
                color: theme.textSecondary,
                },
            ]}
            >
            {greeting}
            </Text>

            <Text
            style={[
                type.screenTitle,
                {
                color: theme.text,
                marginTop: 4,
                },
            ]}
            >
            {userName
                ? `${userName} 👋`
                : "Friend 👋"}
            </Text>

            <Text
            style={[
                type.body,
                {
                color: theme.textSecondary,
                marginTop: 8,
                lineHeight: 24,
                },
            ]}
            >
            {message}
            </Text>
        </View>

        <View
            style={[
            styles.iconWrapper,
            {
                backgroundColor: `${theme.accent}20`,
            },
            ]}
        >
            <Ionicons
            name="book"
            size={30}
            color={theme.accent}
            />
        </View>
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 28,
    },

    left: {
        flex: 1,
        paddingRight: 16,
    },

    iconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
    },
});