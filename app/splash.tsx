import React from "react";
import { View, Text, Image, ActivityIndicator, StyleSheet } from "react-native";

export default function SplashScreen() {
    return (
        <View style={styles.container}>
        <Image
            source={require("../assets/logo.png")}
            style={styles.logo}
        />

        <Text style={styles.title}>
            Scripture Memory
        </Text>

        <Text style={styles.subtitle}>
            Memorize. Reflect. Grow.
        </Text>

        <ActivityIndicator
            size="small"
            color="#F5B942"
            style={{ marginTop: 30 }}
        />
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0F172A",
        justifyContent: "center",
        alignItems: "center",
    },

    logo: {
        width: 120,
        height: 120,
        marginBottom: 24,
    },

    title: {
        fontSize: 32,
        fontWeight: "700",
        color: "#FFFFFF",
        marginBottom: 8,
    },

    subtitle: {
        fontSize: 16,
        color: "#CBD5E1",
    },
});