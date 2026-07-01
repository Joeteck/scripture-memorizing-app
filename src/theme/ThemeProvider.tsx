import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

import { lightTheme, darkTheme, Theme } from "./colors";
import { getThemeMode, setThemeMode as persistThemeMode, ThemeMode } from "@/lib/preferences";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Wraps the whole app so every screen's useTheme()/useThemeMode() call
 * shares one source of truth. "system" (the default) follows the OS
 * setting; "light"/"dark" are explicit user overrides, persisted locally.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    getThemeMode().then(setModeState);
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    persistThemeMode(next);
  };

  const effectiveScheme = mode === "system" ? systemScheme : mode;
  const theme = effectiveScheme === "dark" ? darkTheme : lightTheme;

  const value = useMemo<ThemeContextValue>(() => ({ mode, setMode, theme: theme as Theme }), [mode, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme()/useThemeMode() must be used within <ThemeProvider>.");
  }
  return ctx;
}
