import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { handleOAuthCallback } from "@/lib/auth";
import { Colors } from "@/constants/design";

/**
 * Handles the foam://auth/callback deep link for cold-start OAuth redirects.
 *
 * Warm-start handling (app already running) is intentionally handled inside
 * signInWithGoogle() via openAuthSessionAsync's return value — this screen
 * only processes getInitialURL() to avoid duplicate session exchange.
 *
 * On success: auth state listener in app/_layout.tsx navigates the user.
 * On failure: redirects to /auth/welcome so the user is never stuck on a spinner.
 */
export default function AuthCallbackScreen() {
  useEffect(() => {
    async function process() {
      try {
        const url = await Linking.getInitialURL();
        if (url) await handleOAuthCallback(url);
      } catch (err) {
        console.warn("[AuthCallback] failed to process callback URL", err);
        router.replace("/auth/welcome");
      }
    }
    process();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.foamBlue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.bgPrimary,
  },
});
