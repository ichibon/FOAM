import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as Linking from "expo-linking";
import { handleOAuthCallback } from "@/lib/auth";
import { Colors } from "@/constants/design";

/**
 * Handles the foam://auth/callback deep link after Google OAuth.
 *
 * Covers two entry paths:
 *   Cold start — app launched from the deep link (getInitialURL)
 *   Warm start — app already running when the deep link arrives (addEventListener)
 *
 * Once handleOAuthCallback sets the Supabase session the auth state listener
 * in app/_layout.tsx navigates the user automatically — no manual router.replace needed.
 */
export default function AuthCallbackScreen() {
  useEffect(() => {
    async function process(url: string) {
      try {
        await handleOAuthCallback(url);
      } catch (err) {
        console.warn("[AuthCallback] failed to process callback URL", err);
      }
    }

    // Cold start: app opened directly by the deep link
    Linking.getInitialURL().then((url) => {
      if (url) process(url);
    });

    // Warm start: app was already running when the deep link arrived
    const subscription = Linking.addEventListener("url", ({ url }) => {
      process(url);
    });

    return () => subscription.remove();
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
