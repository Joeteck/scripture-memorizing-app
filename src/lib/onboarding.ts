// src/lib/onboarding.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "scripture_onboarding_v1";
const TOUR_KEY = "scripture_tour_v1";

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val === "done";
  } catch {
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, "done");
}

export async function hasCompletedTour(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(TOUR_KEY);
    return val === "done";
  } catch {
    return false;
  }
}

export async function markTourComplete(): Promise<void> {
  await AsyncStorage.setItem(TOUR_KEY, "done");
}

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.multiRemove([ONBOARDING_KEY, TOUR_KEY]);
}
