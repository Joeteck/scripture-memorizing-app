// Manuscript palette — a quiet, paper-and-ink feel rather than a generic
// "dark mode + indigo gradient" template. One accent (dusk) for actions,
// one warm accent (amber) reserved for the "mastered" moment only.

export const palette = {
  ink900: "#14171F",
  parchment50: "#FBF8F2",
  dusk600: "#3D4B8C",
  dusk100: "#E3E7F5",
  amber500: "#C98A3E",
  amber100: "#F3E4CC",
  mist200: "#E4E1DB",
  slate500: "#6B7280",
  white: "#FFFFFF",
  danger: "#C0392B",
  dangerSoft: "#FDE2E1",
  dangerSurface: "#FFF1F0",
  success: "#3A7D44",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  round: 999,
};

export const shadows = {
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  floating: {
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
};

export const lightTheme = {
  background: palette.parchment50,
  surface: palette.white,
  text: palette.ink900,
  textSecondary: palette.slate500,
  border: palette.mist200,
  accent: palette.dusk600,
  accentSoft: palette.dusk100,
  mastered: palette.amber500,
  masteredSoft: palette.amber100,
  error: palette.danger,
  errorSoft: palette.dangerSoft,
  errorSurface: palette.dangerSurface,
  shadows,
};

export const darkTheme = {
  background: palette.ink900,
  surface: "#1D212B",
  text: palette.parchment50,
  textSecondary: "#9AA0AC",
  border: "#2B303C",
  accent: "#7C8EDB",
  accentSoft: "#262C44",
  mastered: palette.amber500,
  masteredSoft: "#3A2E1C",
  shadows,
};

export type Theme = typeof lightTheme;
