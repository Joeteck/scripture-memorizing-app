import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme, spacing, radius, type } from "@/theme";

type ActionProps = {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    route: string;
};

function ActionCard({
    icon,
    title,
    route,
    }: ActionProps) {
    const router = useRouter();
    const theme = useTheme();

    return (
        <Pressable
        style={[
            styles.card,
            {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            },
        ]}
        android_ripple={{
            color: theme.border,
        }}
        onPress={() => router.push(route as any)}
        >
        <View
            style={[
            styles.iconContainer,
            {
                backgroundColor: theme.accent + "20",
            },
            ]}
        >
            <Ionicons
            name={icon}
            size={24}
            color={theme.accent}
            />
        </View>

        <Text
            style={[
            type.caption,
            {
                color: theme.text,
                marginTop: 10,
                textAlign: "center",
            },
            ]}
        >
            {title}
        </Text>
        </Pressable>
    );
}

export function QuickActions() {
    return (
        <View style={styles.container}>
        <ActionCard
            icon="add-circle"
            title="Add Verse"
            route="/(tabs)/add"
        />

        <ActionCard
            icon="pricetags"
            title="Categories"
            route="/(tabs)/categories"
        />

        <ActionCard
            icon="time"
            title="History"
            route="/(tabs)/history"
        />
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: spacing.md,
        marginVertical: spacing.lg,
    },

    card: {
        flex: 1,
        borderWidth: 1,
        borderRadius: radius.lg,
        paddingVertical: spacing.lg,
        alignItems: "center",
    },

    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: "center",
        alignItems: "center",
    },
});