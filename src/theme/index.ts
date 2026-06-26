import { TextStyle } from "react-native";

export const colors = {
  background: "#F8F6F1",
  surface: "#FFFFFF",

  primary: "#1E3A5F",
  primaryDark: "#142A44",

  accent: "#D4A017",

  success: "#3A7D44",
  warning: "#E8A317",
  danger: "#C0392B",

  text: "#1F2937",
  textSecondary: "#6B7280",

  border: "#E5E7EB",

  shadow: "#000000",
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
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 4,
  },

  floating: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 8,
  },
};

export const type: Record<string, TextStyle> = {
  hero: {
    fontFamily: "Lora_600SemiBold",
    fontSize: 34,
    lineHeight: 42,
  },

  screenTitle: {
    fontFamily: "Lora_600SemiBold",
    fontSize: 30,
    lineHeight: 36,
  },

  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },

  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  verseReference: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },

  verseText: {
    fontFamily: "Lora_400Regular",
    fontSize: 22,
    lineHeight: 34,
  },

  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
  },

  bodyBold: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },

  caption: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },

  button: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },

  statNumber: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
  },

  statLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
};

export function useTheme() {
  return {
    ...colors,
    spacing,
    radius,
    shadows,
  };
}




// import { useColorScheme } from "react-native";
// import { lightTheme, darkTheme, Theme } from "./colors";
// export { type } from "./typography";
// export { fonts } from "./typography";

// export function useTheme(): Theme {
//   const scheme = useColorScheme();
//   return scheme === "dark" ? darkTheme : lightTheme;
// }
