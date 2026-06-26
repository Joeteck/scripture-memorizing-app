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
};

export type Theme = typeof lightTheme;
