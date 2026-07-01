import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";

const extra = Constants.expoConfig?.extra ?? {};

const SUPABASE_URL =
  extra.supabaseUrl ??
  process.env.EXPO_PUBLIC_SUPABASE_URL;

const SUPABASE_ANON_KEY =
  extra.supabaseAnonKey ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL"
  );
}

if (!SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      flowType: 'pkce',             // 👈 FORCES the PKCE workflow
      detectSessionInUrl: false,    // 👈 MUST be false in Native mobile environments
    },
    global: {
      headers: {
        "X-Client-Info": "scripture-memory",
      },
    },
  }
);
