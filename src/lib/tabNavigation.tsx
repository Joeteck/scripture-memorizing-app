// src/lib/tabNavigation.tsx
// Lets any screen (e.g. Dashboard quick actions) imperatively switch the
// active pager tab, since (tabs)/_layout.tsx renders screens manually
// inside a PagerView rather than using file-based tab routes.
import React, { createContext, useContext, useRef } from "react";

export const TAB_INDEX: Record<string, number> = {
  today: 0,
  dashboard: 1,
  add: 2,
  categories: 3,
  history: 4,
};

interface TabNavContextValue {
  goToTab: (tab: keyof typeof TAB_INDEX) => void;
  registerGoToTab: (fn: (tab: keyof typeof TAB_INDEX) => void) => void;
}

const TabNavContext = createContext<TabNavContextValue | null>(null);

export function TabNavigationProvider({ children }: { children: React.ReactNode }) {
  const handlerRef = useRef<((tab: keyof typeof TAB_INDEX) => void) | null>(null);

  const goToTab = (tab: keyof typeof TAB_INDEX) => {
    handlerRef.current?.(tab);
  };

  const registerGoToTab = (fn: (tab: keyof typeof TAB_INDEX) => void) => {
    handlerRef.current = fn;
  };

  return (
    <TabNavContext.Provider value={{ goToTab, registerGoToTab }}>
      {children}
    </TabNavContext.Provider>
  );
}

export function useTabNavigation() {
  const ctx = useContext(TabNavContext);
  if (!ctx) throw new Error("useTabNavigation must be used within TabNavigationProvider");
  return ctx;
}
