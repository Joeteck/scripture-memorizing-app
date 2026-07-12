// src/lib/auth.ts
import { supabase } from "@/lib/supabase";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

const RESET_REDIRECT = Linking.createURL("reset-password");

// Google sign-in redirects to a dedicated callback screen rather than the
// app root. This matters: the app root ("/") sits behind the signed-in
// tab group, so if the OS delivers this deep link before the token
// exchange finishes, the global auth guard in app/_layout.tsx would boot
// the user back to Sign In — the exact bug this fixes. auth-callback.tsx
// is registered as a public route, so it's safe to land on before a
// session exists, and it owns finishing the exchange itself.
const GOOGLE_REDIRECT = Linking.createURL("auth-callback");

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password,
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: RESET_REDIRECT,
  });
}

export type GoogleSignInOutcome = "opened" | "cancelled";

/**
 * Opens the Google OAuth browser flow and returns as soon as the browser
 * closes. Deliberately does NOT attempt to parse the result URL or
 * exchange the code here — that's owned entirely by app/auth-callback.tsx,
 * which the OS opens directly via GOOGLE_REDIRECT once the browser
 * redirects back to the app. Attempting the exchange in two places at
 * once is worse than in one: the code is single-use, so whichever path
 * runs second would fail anyway, and on Android in particular this
 * function's own "the browser closed" signal is not fully reliable —
 * WebBrowser can report `dismiss` instead of `success` even when the
 * redirect *did* succeed and the OS is about to (or already did) open
 * auth-callback in the background.
 *
 * Returns:
 *  - "opened": the browser flow ran; auth-callback will complete sign-in
 *    if/when the OS delivers the redirect. The caller should show a
 *    "completing" state and let the callback screen take over.
 *  - "cancelled": the user explicitly closed the browser without any
 *    redirect at all (e.g. pressed back). Safe to reset the UI immediately.
 *
 * Throws only for a real, immediate failure — e.g. Supabase couldn't
 * even issue an OAuth URL (network/config problem).
 */
export async function signInWithGoogle(): Promise<GoogleSignInOutcome> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: GOOGLE_REDIRECT,
      skipBrowserRedirect: true,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error("Supabase did not return an OAuth URL.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, GOOGLE_REDIRECT);

  if (result.type === "cancel") return "cancelled";
  return "opened";
}

export async function getSession() {
  return supabase.auth.getSession();
}

export async function getUser() {
  return supabase.auth.getUser();
}

/**
 * Permanently deletes the signed-in user's account and all their data.
 *
 * This can't be done directly from the client — deleting an auth user
 * requires Supabase's service_role key, which must never ship inside the
 * app. Instead this calls the `delete-account` Edge Function (see
 * supabase/functions/delete-account/index.ts), which runs server-side
 * with that key, verifies the caller's own session token, and deletes
 * only that user. Deleting the auth user cascades to their `verses`,
 * `categories`, and `profiles` rows (all set up with `on delete cascade`
 * in supabase/schema.sql); `feedback` and `error_logs` rows are kept but
 * anonymized (`on delete set null`), since those are useful for
 * debugging independent of who filed them.
 *
 * Requires the Edge Function to be deployed once via the Supabase CLI —
 * see PRODUCTION_AUDIT_REPORT.md for the one-time setup steps.
 */
export async function deleteAccount() {
  const { data, error } = await supabase.functions.invoke("delete-account");
  if (error) throw error;

  // Deleting the auth user cascades the user's cloud-side rows (backup
  // snapshots, metadata, device registrations, sync history). It has no
  // way to reach this device's local SQLite database though — that's the
  // whole point of local-first — so clear it here too, otherwise a
  // "deleted" account would still show all its verses locally.
  const { resetLocalDatabase } = await import("@/lib/db");
  await resetLocalDatabase();

  return data;
}
