import { spacing, radius, shadows, Theme } from "./colors";
import { useThemeContext, ThemeProvider } from "./ThemeProvider";
import type { ThemeMode } from "@/lib/preferences";

export { type, fonts } from "./typography";
export { spacing, radius, shadows };
export { getReadableTextColor } from "./contrast";
export type { Theme, ThemeMode };
export { ThemeProvider };

/**
 * Single source of truth for color tokens — light/dark aware, and
 * overridable via the Profile screen's Appearance setting. Every screen
 * and component should read colors through this hook rather than
 * hardcoding hex values, so the whole app stays on one consistent palette.
 */
export function useTheme(): Theme {
  return useThemeContext().theme;
}

/** Read/write the user's appearance preference (system / light / dark). */
export function useThemeMode(): { mode: ThemeMode; setMode: (mode: ThemeMode) => void } {
  const { mode, setMode } = useThemeContext();
  return { mode, setMode };
}
