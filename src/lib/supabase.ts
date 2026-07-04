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

/**
 * True only if both required env vars were present at build time. Checked
 * by app/_layout.tsx to show a clear "not configured" screen instead of
 * hanging on the splash screen forever.
 *
 * Deliberately NOT a thrown error here: a throw at module scope kills the
 * JS thread before React ever mounts — before the splash screen can be
 * hidden and before ErrorBoundary/monitoring exist to catch or report
 * anything. The app just sits on the native splash forever with nothing
 * in error_logs, which is exactly the failure mode this replaces. The
 * most common cause is EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
 * not being set as EAS build-time env vars (they're read from your local
 * .env by `expo start`, but EAS Build runs on separate servers that don't
 * see your local .env unless you configure it — see eas.json and
 * PRODUCTION_AUDIT_REPORT.md).
 */
export const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!SUPABASE_CONFIGURED) {
  console.error(
    "[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. " +
      "Falling back to placeholder config so the app can boot far enough to show " +
      "a clear error screen instead of hanging on the splash screen."
  );
}

export const supabase = createClient(
  SUPABASE_URL || "https://placeholder.invalid",
  SUPABASE_ANON_KEY || "placeholder-anon-key",
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
