import { supabase } from "@/lib/supabase";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

/**
 * Email Sign In
 */
export async function signIn(
  email: string,
  password: string
) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

/**
 * Email Sign Up
 */
export async function signUp(
  email: string,
  password: string
) {
  return supabase.auth.signUp({
    email,
    password,
  });
}

/**
 * Sign Out
 */
export async function signOut() {
  return supabase.auth.signOut();
}

/**
 * Forgot Password
 */
export async function resetPassword(
  email: string
) {
  const redirectTo = Linking.createURL("/reset-password");

  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
}

/**
 * Google OAuth
 *
 * IMPORTANT:
 * Enable Google Provider inside Supabase first.
 */
export async function signInWithGoogle() {
  const redirectTo = Linking.createURL("/");

  const { data, error } =
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

  if (error) {
    throw error;
  }

  if (data?.url) {
    const result =
      await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

    if (
      result.type === "success" &&
      result.url
    ) {
      await supabase.auth.exchangeCodeForSession(
        result.url
      );
    }
  }
}

/**
 * Current Session
 */
export async function getSession() {
  return supabase.auth.getSession();
}

/**
 * Current User
 */
export async function getUser() {
  return supabase.auth.getUser();
}