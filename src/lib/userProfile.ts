// src/lib/userProfile.ts
// Lightweight user profile stored in AsyncStorage (name, avatar choice)
import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_KEY = "scripture_user_profile_v1";

export interface UserProfile {
  displayName: string;
  avatarIndex: number; // index into our avatar set
}

const DEFAULT: UserProfile = { displayName: "", avatarIndex: 0 };

export async function getProfile(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

export async function saveProfile(profile: Partial<UserProfile>): Promise<void> {
  const current = await getProfile();
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({ ...current, ...profile }));
}
