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
  // Text/icon color for anything filled solid with `accent` (e.g.
  // PrimaryButton). Kept as its own token rather than assuming "white"
  // everywhere, because that assumption breaks in dark mode — see the
  // dark theme's onAccent below and the contrast audit in
  // PHASE_3_NOTES.md for the numbers.
  onAccent: "#FFFFFF",
  mastered: palette.amber500,
  // theme.mastered (#C98A3E) reads fine as an icon accent, but measured
  // only 2.92:1 against white/surface as TEXT — well under the 4.5:1
  // WCAG AA requirement (see the contrast audit in PHASE_3_NOTES.md).
  // This darker variant is for text specifically; theme.mastered stays
  // unchanged for icons, fills, and badges, where it was already fine.
  masteredText: "#95601F",
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
  // Dark theme's `accent` is intentionally light (for legibility as
  // foreground text/icons on a dark background), which means white text
  // on TOP of a solid accent-filled surface fails WCAG AA contrast
  // (3.11:1, needs 4.5:1) — confirmed by direct calculation, see
  // PHASE_3_NOTES.md. Dark ink text on that same fill measures 5.76:1.
  onAccent: palette.ink900,
  mastered: palette.amber500,
  // Dark theme's mastered already measures 5.51–6.13:1 as text — no
  // separate darker variant needed here, unlike the light theme above.
  masteredText: palette.amber500,
  masteredSoft: "#3A2E1C",
  error: "#E0645C",
  errorSoft: "#4A2624",
  // Was #3A1F1D — that measured 4.41:1 with theme.error text on top, just
  // under the 4.5:1 WCAG AA threshold (e.g. the "Verse Not Found" title
  // in app/(tabs)/add.tsx, "Delete Account" in app/profile.tsx). This is
  // a barely-perceptible darkening that clears it (4.69:1) without
  // changing how the color reads.
  errorSurface: "#331B19",
  shadows,
};

export type Theme = typeof lightTheme;
