// src/components/ErrorBoundary.tsx
// Catches render-time errors anywhere below it in the tree, records them
// as fatal in the local error log (synced to Supabase's error_logs table
// — see src/lib/monitoring.ts), and shows a calm, on-brand fallback
// instead of a white screen or a raw crash. Must be a class component —
// React only supports error boundaries via componentDidCatch/getDerivedStateFromError.
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { logFatal } from "@/lib/monitoring";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

// Falls back to fixed colors rather than the theme system, since a
// theme-provider error is itself one of the things this boundary needs
// to be able to survive.
const COLORS = {
  background: "#FBF8F2",
  text: "#14171F",
  textSecondary: "#6B7280",
  accent: "#3D4B8C",
  accentSoft: "#EEF2FF",
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logFatal(error, { componentStack: info.componentStack });
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="leaf-outline" size={44} color={COLORS.accent} />
        </View>
        <Text style={styles.title}>Let's start again</Text>
        <Text style={styles.body}>
          Something interrupted this moment, but your saved verses and progress are safe.
          {"\n\n"}"Weeping may endure for a night, but joy cometh in the morning." — Psalm 30:5
        </Text>
        <Pressable style={styles.button} onPress={this.handleReset}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: COLORS.background,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accentSoft,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 999,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
