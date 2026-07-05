// src/lib/confirm.tsx
//
// Replaces native Alert.alert() for yes/no confirmations. Alert.alert()
// renders as the bare OS dialog — on Android that's a plain grey/white
// system sheet in the default system font, completely disconnected from
// the app's actual design (colors, type, rounded cards). This gives the
// same "are you sure?" functionality but themed and animated like the
// rest of the app.
//
// Usage (mirrors the useToast() pattern already used elsewhere):
//
//   const confirm = useConfirm();
//   const ok = await confirm({
//     title: "Sign Out",
//     message: "Are you sure you want to sign out?",
//     confirmLabel: "Sign Out",
//     destructive: true,
//   });
//   if (ok) { ... }
//
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, type, spacing } from "@/theme";
import { PrimaryButton } from "@/components/PrimaryButton";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Tints the confirm button and icon red instead of the accent color. */
  destructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const anim = useRef(new Animated.Value(0)).current;

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  React.useEffect(() => {
    if (pending) {
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 10 }).start();
    }
  }, [pending]);

  function close(result: boolean) {
    const resolve = pending?.resolve;
    Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setPending(null);
      resolve?.(result);
    });
  }

  const accentColor = pending?.destructive ? theme.error : theme.accent;
  const accentSoft = pending?.destructive ? theme.errorSurface : theme.accentSoft;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <Modal visible={!!pending} transparent animationType="none" onRequestClose={() => close(false)}>
        <Pressable style={styles.backdrop} onPress={() => close(false)}>
          <Animated.View
            style={[
              styles.cardWrap,
              {
                opacity: anim,
                transform: [
                  { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
                ],
              },
            ]}
          >
            {/* Stop taps on the card itself from bubbling to the backdrop dismiss */}
            <Pressable onPress={() => {}}>
              <View style={[styles.card, { backgroundColor: theme.surface }]}>
                {pending?.icon ? (
                  <View style={[styles.iconWrap, { backgroundColor: accentSoft }]}>
                    <Ionicons name={pending.icon} size={26} color={accentColor} />
                  </View>
                ) : null}

                <Text style={[type.bodyBold, { color: theme.text, fontSize: 18, textAlign: "center" }]}>
                  {pending?.title}
                </Text>

                {pending?.message ? (
                  <Text
                    style={[
                      type.body,
                      { color: theme.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 21 },
                    ]}
                  >
                    {pending.message}
                  </Text>
                ) : null}

                <View style={{ marginTop: spacing.lg, width: "100%" }}>
                  <PrimaryButton
                    label={pending?.confirmLabel ?? "Confirm"}
                    onPress={() => close(true)}
                    style={pending?.destructive ? { backgroundColor: theme.error, borderColor: theme.error } : undefined}
                  />
                  <PrimaryButton
                    label={pending?.cancelLabel ?? "Cancel"}
                    onPress={() => close(false)}
                    variant="ghost"
                    style={{ marginTop: 10 }}
                  />
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </ConfirmContext.Provider>
  );
}

/** Returns a function you can `await` for a themed yes/no confirmation. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  cardWrap: {
    width: "100%",
    maxWidth: 360,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
});
