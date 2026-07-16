// src/theme/contrast.ts
//
// The contrast audit (see PHASE_3_NOTES.md) found the same real bug in
// several places: white text/icons hardcoded on top of a *dynamically
// chosen* fill color — theme.accent (fails WCAG AA in dark mode:
// 3.11:1, needs 4.5:1), a per-category custom color, a per-user avatar
// color. Hardcoding white works by luck for some colors and silently
// fails for others depending on how light or dark that particular color
// happens to be.
//
// This computes the actual WCAG contrast ratio against both white and
// near-black candidates and picks whichever one passes (or wins, if
// neither cleanly passes AA — better than guessing). Anywhere text sits
// on a color that isn't a fixed, pre-checked theme token, use this
// instead of a hardcoded "#fff".
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

const NEAR_WHITE = "#FFFFFF";
const NEAR_BLACK = "#14171F"; // matches the theme's ink900 rather than pure black

/**
 * Returns whichever of near-white / near-black gives better contrast
 * against `backgroundHex` — the correct general-purpose choice for text
 * or icons drawn on a fill color that isn't a known, pre-checked theme
 * token (a category's custom color, an avatar color, etc).
 */
export function getReadableTextColor(backgroundHex: string): string {
  const whiteRatio = contrastRatio(NEAR_WHITE, backgroundHex);
  const blackRatio = contrastRatio(NEAR_BLACK, backgroundHex);
  return whiteRatio >= blackRatio ? NEAR_WHITE : NEAR_BLACK;
}
