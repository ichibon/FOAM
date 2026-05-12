import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import { makeRedirectUri } from "expo-auth-session";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// Required for expo-web-browser to properly close the auth session on iOS
WebBrowser.maybeCompleteAuthSession();

export const OAUTH_REDIRECT_URI = makeRedirectUri({
  scheme: "foam",
  path: "auth/callback",
});

// ─── Google ────────────────────────────────────────────────────────────────

/**
 * Sign in with Google via Supabase OAuth + in-app browser.
 * Uses PKCE flow — the callback URL will contain a `code` parameter handled
 * by handleOAuthCallback().
 */
export async function signInWithGoogle(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: OAUTH_REDIRECT_URI,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error("No OAuth URL returned from Supabase");

  const result = await WebBrowser.openAuthSessionAsync(data.url, OAUTH_REDIRECT_URI);

  if (result.type === "success") {
    await handleOAuthCallback(result.url);
  }
}

// ─── Apple ─────────────────────────────────────────────────────────────────

/**
 * Sign in with Apple via native prompt (iOS only).
 * Uses Supabase signInWithIdToken — no browser redirect needed.
 */
export async function signInWithApple(): Promise<void> {
  if (Platform.OS !== "ios") {
    throw new Error("Apple Sign In is only available on iOS");
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error("Apple Sign In did not return an identity token");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });

  if (error) throw error;
}

// ─── Email ─────────────────────────────────────────────────────────────────

/**
 * Sign in with email + password.
 */
export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
}

/**
 * Create a new account with email + password.
 * Returns { needsConfirmation: true } when email verification is required.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<{ needsConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: fullName.trim() } },
  });
  if (error) throw error;
  return { needsConfirmation: !data.session };
}

/**
 * Send a password reset email.
 */
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  if (error) throw error;
}

// ─── OAuth callback ─────────────────────────────────────────────────────────

/**
 * Process a Supabase OAuth callback URL.
 * Supports both PKCE flow (code= query param) and implicit flow (#access_token hash).
 */
export async function handleOAuthCallback(url: string): Promise<void> {
  // PKCE flow: URL contains ?code= — use Supabase's official exchange method
  if (url.includes("code=")) {
    const { error } = await supabase.auth.exchangeCodeForSession(url);
    if (error) throw error;
    return;
  }

  // Implicit flow fallback: tokens in hash fragment (#access_token=...&refresh_token=...)
  const hashPart = url.split("#")[1] ?? "";
  const params = new URLSearchParams(hashPart);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");

  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw error;
  }
}
