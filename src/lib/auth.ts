// src/lib/auth.ts

import { supabase } from "@/lib/supabase";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URL = Linking.createURL("/");

const RESET_REDIRECT = Linking.createURL("reset-password");

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

export async function signInWithGoogle() {
  console.log("Redirect URL:", REDIRECT_URL);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: REDIRECT_URL,
      skipBrowserRedirect: true,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error("Supabase did not return an OAuth URL.");

  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    REDIRECT_URL
  );

  if (result.type === "cancel") return;
  if (result.type !== "success" || !result.url) {
    throw new Error("Authentication was not completed.");
  }

  // Parse the deep link manually
  const parsedUrl = Linking.parse(result.url);
  const rawCode = parsedUrl.queryParams?.code;

  if (!rawCode) {
    throw new Error("No authorization code returned from OAuth provider.");
  }

  // TypeScript Safe Extraction: Extract single string if it returns an array
  const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;

  // Handshake the PKCE code explicitly
  const { data: exchangeData, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) throw exchangeError;

  console.log("PKCE Exchange Complete:", exchangeData);
}

export async function getSession() {
  return supabase.auth.getSession();
}

export async function getUser() {
  return supabase.auth.getUser();
}
