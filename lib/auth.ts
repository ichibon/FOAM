import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import { makeRedirectUri } from "expo-auth-session";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// Required for expo-web-browser to close the auth session on iOS
WebBrowser.maybeCompleteAuthSession();

export const OAUTH_REDIRECT_URI = makeRedirectUri({
  scheme: "foam",
  path: "auth/callback",
});

/**
 * Sign in with Google via Supabase OAuth + in-app browser.
 * Works on iOS, Android, and web.
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

/**
 * Parse Supabase tokens from a callback URL and set the session.
 * Supabase returns tokens as hash fragments: #access_token=...&refresh_token=...
 */
export async function handleOAuthCallback(url: string): Promise<void> {
  const hashPart = url.split("#")[1] ?? "";
  const params = new URLSearchParams(hashPart);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");

  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw error;
  }
}
