import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, type } from "@/theme";

type Props = {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    description?: string;
};

export function EmptyState({
    icon = "book-outline",
    title,
    description,
    }: Props) {
    const theme = useTheme();

    return (
        <View style={styles.container}>
        <View
            style={[
            styles.iconContainer,
            {
                backgroundColor: theme.surface,
                borderColor: theme.border,
            },
            ]}
        >
            <Ionicons
            name={icon}
            size={42}
            color={theme.accent}
            />
        </View>

        <Text
            style={[
            type.screenTitle,
            styles.title,
            { color: theme.text },
            ]}
        >
            {title}
        </Text>

        {description ? (
            <Text
            style={[
                type.body,
                styles.description,
                {
                color: theme.textSecondary,
                },
            ]}
            >
            {description}
            </Text>
        ) : null}
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",

        paddingHorizontal: 30,
        paddingVertical: 50,
    },

    iconContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,

        alignItems: "center",
        justifyContent: "center",

        borderWidth: 1,

        marginBottom: 22,
    },

    title: {
        textAlign: "center",
        marginBottom: 10,
    },

    description: {
        textAlign: "center",
        lineHeight: 24,
        maxWidth: 320,
    },
});