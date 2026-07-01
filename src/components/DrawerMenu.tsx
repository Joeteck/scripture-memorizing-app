// src/components/DrawerMenu.tsx
// Side navigation drawer accessible from all screens
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme";

const { width: SW } = Dimensions.get("window");
const DRAWER_WIDTH = SW * 0.78;

export interface DrawerMenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  avatarIndex?: number;
  onSignOut?: () => void;
}

const AVATAR_COLORS = [
  "#3D4B8C", "#5B8266", "#C98A3E", "#A14B4B",
  "#6B7280", "#2563EB", "#9333EA", "#EA580C",
];

export function DrawerMenu({ visible, onClose, userName, userEmail, avatarIndex = 0, onSignOut }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 10 }),
        Animated.timing(bgAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(bgAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const displayName = userName || userEmail?.split("@")[0] || "Friend";
  const avatarBg = AVATAR_COLORS[avatarIndex % AVATAR_COLORS.length];
  const initials = (displayName.slice(0, 2) || "SC").toUpperCase();

  const items: DrawerMenuItem[] = [
    { icon: "person-outline", label: "Profile", onPress: () => { onClose(); router.push("/profile"); } },
    { icon: "settings-outline", label: "Settings", onPress: () => { onClose(); router.push("/profile"); } },
    { icon: "chatbubble-ellipses-outline", label: "Send Feedback", onPress: () => { onClose(); router.push("/feedback"); } },
    { icon: "heart-outline", label: "Donate", onPress: () => { onClose(); router.push("/donate"); } },
    { icon: "information-circle-outline", label: "About", onPress: () => { onClose(); router.push("/about"); } },
  ];

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: "rgba(0,0,0,0.5)", opacity: bgAnim },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Drawer panel */}
      <Animated.View
        style={[
          styles.drawer,
          { backgroundColor: theme.background, transform: [{ translateX: slideAnim }] },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile section */}
          <View style={[styles.profileSection, { borderBottomColor: theme.border }]}>
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
              <Text style={styles.avatarText}>{initials}</Text>
              {/* Shine overlay */}
              <View style={styles.shine} />
            </View>
            <Text style={[styles.displayName, { color: theme.text }]}>{displayName}</Text>
            {userEmail && (
              <Text style={[styles.email, { color: theme.textSecondary }]} numberOfLines={1}>
                {userEmail}
              </Text>
            )}
          </View>

          {/* Menu items */}
          <View style={styles.menuItems}>
            {items.map((item) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [
                  styles.menuItem,
                  { backgroundColor: pressed ? theme.accentSoft : "transparent" },
                ]}
                onPress={item.onPress}
              >
                <View style={[styles.menuIcon, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name={item.icon} size={20} color={item.danger ? "#C0392B" : theme.accent} />
                </View>
                <Text style={[styles.menuLabel, { color: item.danger ? "#C0392B" : theme.text }]}>
                  {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
              </Pressable>
            ))}
          </View>

          {/* Sign out */}
          {onSignOut && (
            <Pressable
              style={[styles.signOutBtn, { borderColor: theme.border }]}
              onPress={() => { onClose(); onSignOut(); }}
            >
              <Ionicons name="log-out-outline" size={18} color="#C0392B" />
              <Text style={[styles.signOutText]}>Sign Out</Text>
            </Pressable>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 8, height: 0 },
    elevation: 16,
  },
  profileSection: {
    paddingTop: 72,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    alignItems: "flex-start",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    overflow: "hidden",
  },
  avatarText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
  },
  shine: {
    position: "absolute",
    top: -20,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.25)",
    transform: [{ rotate: "30deg" }],
  },
  displayName: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
  email: { fontSize: 13, maxWidth: "90%" },
  menuItems: { paddingTop: 16, paddingHorizontal: 12 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 2,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: "600" },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 40,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  signOutText: { fontSize: 15, fontWeight: "700", color: "#C0392B" },
});
