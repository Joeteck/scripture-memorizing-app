import React from "react";
import {
    View,
    Text,
    StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, type } from "@/theme";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  subtitle?: string;
}

export function StatsCard({
    title,
    value,
    icon,
    color,
    subtitle,
    }: StatsCardProps) {
    const theme = useTheme();

    const iconColor = color ?? theme.primary;

    return (
        <View
        style={[
            styles.card,
            {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            ...theme.shadows.card,
            },
        ]}
        >
        <View style={styles.header}>
            <View
            style={[
                styles.iconContainer,
                {
                backgroundColor: `${iconColor}18`,
                },
            ]}
            >
            <Ionicons
                name={icon}
                size={22}
                color={iconColor}
            />
            </View>
        </View>

        <Text
            style={[
            type.statNumber,
            {
                color: theme.text,
                marginTop: 16,
            },
            ]}
        >
            {value}
        </Text>

        <Text
            style={[
            type.bodyBold,
            {
                color: theme.text,
                marginTop: 6,
            },
            ]}
        >
            {title}
        </Text>

        {subtitle ? (
            <Text
            style={[
                type.caption,
                {
                color: theme.textSecondary,
                marginTop: 4,
                },
            ]}
            >
            {subtitle}
            </Text>
        ) : null}
        </View>
    );
    }

    const styles = StyleSheet.create({
    card: {
        flex: 1,
        minHeight: 130,

        borderRadius: 22,

        borderWidth: 1,

        padding: 18,

        justifyContent: "space-between",
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    iconContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,

        justifyContent: "center",
        alignItems: "center",
    },
});