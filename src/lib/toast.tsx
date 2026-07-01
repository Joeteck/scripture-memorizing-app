// src/lib/toast.tsx
// Custom toast/notification system to replace native Alert
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "alert-circle",
  info: "information-circle",
  warning: "warning",
};

const COLORS: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: { bg: "#F0FBF2", icon: "#3A7D44", border: "#B7DFC0" },
  error: { bg: "#FFF1F0", icon: "#C0392B", border: "#FFCDD2" },
  info: { bg: "#EEF2FF", icon: "#3D4B8C", border: "#C7D0F5" },
  warning: { bg: "#FFF8E7", icon: "#C98A3E", border: "#FFE0A3" },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  const colors = COLORS[toast.type];

  React.useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
    const timer = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }).start(onDismiss);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
        },
      ]}
    >
      <Ionicons name={ICONS[toast.type]} size={22} color={colors.icon} style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.toastTitle, { color: "#14171F" }]}>{toast.title}</Text>
        {toast.message ? (
          <Text style={[styles.toastMsg, { color: "#6B7280" }]}>{toast.message}</Text>
        ) : null}
      </View>
      <Pressable onPress={onDismiss} hitSlop={8}>
        <Ionicons name="close" size={18} color="#6B7280" />
      </Pressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-2), { id, type, title, message }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess: (t, m) => showToast("success", t, m),
        showError: (t, m) => showToast("error", t, m),
        showInfo: (t, m) => showToast("info", t, m),
      }}
    >
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  toastMsg: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
});
