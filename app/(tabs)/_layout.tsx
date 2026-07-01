// app/(tabs)/_layout.tsx — swipeable tabs via PagerView
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PagerView from "react-native-pager-view";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";
import { TAB_INDEX, useTabNavigation } from "@/lib/tabNavigation";

// Import screens directly (bypasses expo-router tab system for swipe)
import TodayScreen from "./index";
import DashboardScreen from "./dashboard";
import AddScreen from "./add";
import CategoriesScreen from "./categories";
import HistoryScreen from "./history";

const TABS = [
  { name: "Today", icon: "book" as const, activeIcon: "book" as const },
  { name: "Dashboard", icon: "stats-chart-outline" as const, activeIcon: "stats-chart" as const },
  { name: "Add", icon: "add-circle-outline" as const, activeIcon: "add-circle" as const },
  { name: "Categories", icon: "pricetags-outline" as const, activeIcon: "pricetags" as const },
  { name: "History", icon: "time-outline" as const, activeIcon: "time" as const },
];

const SCREENS = [TodayScreen, DashboardScreen, AddScreen, CategoriesScreen, HistoryScreen];

export default function TabsLayout() {
  const theme = useTheme();
  const pagerRef = useRef<PagerView>(null);
  const [activeTab, setActiveTab] = useState(0);
  const { registerGoToTab } = useTabNavigation();

  const goTo = useCallback((i: number) => {
    pagerRef.current?.setPage(i);
    setActiveTab(i);
  }, []);

  // Let other screens (e.g. Dashboard quick actions) jump to a tab by name
  useEffect(() => {
    registerGoToTab((tabName) => {
      const index = TAB_INDEX[tabName];
      if (index !== undefined) goTo(index);
    });
  }, [registerGoToTab, goTo]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Pager */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => setActiveTab(e.nativeEvent.position)}
        overdrag
      >
        {SCREENS.map((Screen, i) => (
          <View key={i} style={{ flex: 1 }}>
            <Screen />
          </View>
        ))}
      </PagerView>

      {/* Custom tab bar */}
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.tabBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}
      >
        {TABS.map((tab, i) => {
          const active = activeTab === i;
          return (
            <Pressable key={tab.name} style={styles.tab} onPress={() => goTo(i)}>
              <Ionicons
                name={active ? tab.activeIcon : tab.icon}
                size={24}
                color={active ? theme.accent : theme.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: active ? theme.accent : theme.textSecondary },
                  active && styles.tabLabelActive,
                ]}
              >
                {tab.name}
              </Text>
              {active && <View style={[styles.tabDot, { backgroundColor: theme.accent }]} />}
            </Pressable>
          );
        })}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
    position: "relative",
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
    fontWeight: "600",
  },
  tabLabelActive: {
    fontWeight: "700",
  },
  tabDot: {
    position: "absolute",
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
