import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme, type } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { PrimaryButton } from "@/components/PrimaryButton";

export default function SignIn() {
  const theme = useTheme();

  const {
    signInWithPassword,
    signUp,
    signInWithGoogle,
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(
    "signin"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [secure, setSecure] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function submit() {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const { error } =
        mode === "signin"
          ? await signInWithPassword(
              email.trim(),
              password
            )
          : await signUp(
              email.trim(),
              password
            );

      if (error) {
        throw error;
      }
    } catch (err: any) {
      setError(
        err.message ??
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function googleLogin() {
    try {
      setLoading(true);

      await signInWithGoogle();
    } catch (err: any) {
      setError(
        err.message ??
          "Unable to continue with Google."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.flex,
        {
          backgroundColor:
            theme.background,
        },
      ]}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={[
            type.screenTitle,
            {
              color: theme.text,
            },
          ]}
        >
          Scripture Memory
        </Text>

        <Text
          style={[
            type.body,
            {
              color:
                theme.textSecondary,
              marginTop: 10,
              marginBottom: 35,
              textAlign: "center",
            },
          ]}
        >
          {mode === "signin"
            ? "Welcome back."
            : "Create an account to begin memorizing Scripture."}
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={
            theme.textSecondary
          }
          style={[
            styles.input,
            {
              color: theme.text,
              backgroundColor:
                theme.surface,
              borderColor:
                theme.border,
            },
          ]}
        />

        <View
          style={[
            styles.passwordBox,
            {
              backgroundColor:
                theme.surface,
              borderColor:
                theme.border,
            },
          ]}
        >
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry={secure}
            style={[
              styles.passwordInput,
              {
                color: theme.text,
              },
            ]}
            placeholderTextColor={
              theme.textSecondary
            }
          />

          <TouchableOpacity
            onPress={() =>
              setSecure(!secure)
            }
          >
            <Ionicons
              size={22}
              color={
                theme.textSecondary
              }
              name={
                secure
                  ? "eye-off"
                  : "eye"
              }
            />
          </TouchableOpacity>
        </View>

        {!!error && (
          <Text
            style={styles.error}
          >
            {error}
          </Text>
        )}

        <PrimaryButton
          label={
            loading
              ? ""
              : mode === "signin"
              ? "Sign In"
              : "Create Account"
          }
          loading={loading}
          onPress={submit}
        />

        <View
          style={{
            height: 18,
          }}
        />

        <PrimaryButton
          label="Continue with Google"
          variant="ghost"
          onPress={
            googleLogin
          }
        />

        <TouchableOpacity
          style={{
            marginTop: 25,
          }}
          onPress={() =>
            setMode(
              mode === "signin"
                ? "signup"
                : "signin"
            )
          }
        >
          <Text
            style={{
              textAlign:
                "center",
              color:
                theme.accent,
              fontWeight: "600",
            }}
          >
            {mode === "signin"
              ? "Don't have an account? Sign Up"
              : "Already have an account? Sign In"}
          </Text>
        </TouchableOpacity>

        {loading && (
          <ActivityIndicator
            size="large"
            color={theme.accent}
            style={{
              marginTop: 25,
            }}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles =
  StyleSheet.create({
    flex: {
      flex: 1,
    },

    container: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 24,
    },

    input: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 15,
      marginBottom: 15,
      fontSize: 16,
    },

    passwordBox: {
      borderWidth: 1,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
      marginBottom: 15,
    },

    passwordInput: {
      flex: 1,
      fontSize: 16,
      paddingVertical: 15,
    },

    error: {
      color: "#E74C3C",
      marginBottom: 15,
      textAlign: "center",
      fontWeight: "600",
    },
  });