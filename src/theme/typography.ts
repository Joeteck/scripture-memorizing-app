// Display/verse text uses Lora (serif, calm, like reading a printed page).
// UI chrome uses Inter (clean, neutral, gets out of the way).

export const fonts = {
  serifRegular: "Lora_400Regular",
  serifMedium: "Lora_500Medium",
  serifSemiBold: "Lora_600SemiBold",
  sansRegular: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemiBold: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
};

export const type = {
  verseBody: { fontFamily: fonts.serifRegular, fontSize: 22, lineHeight: 34 },
  verseReference: { fontFamily: fonts.serifSemiBold, fontSize: 15, letterSpacing: 0.3 },
  screenTitle: { fontFamily: fonts.sansBold, fontSize: 28, letterSpacing: 0.1 },
  sectionLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, letterSpacing: 1.2, textTransform: "uppercase" as const },
  body: { fontFamily: fonts.sansRegular, fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: fonts.sansRegular, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
};
