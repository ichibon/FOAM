import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as Linking from "expo-linking";
import { handleOAuthCallback } from "@/lib/auth";
import { Colors } from "@/constants/design";

/**
 * Handles the foam://auth/callback deep link after Google OAuth.
 * Extracts tokens from the URL and sets the Supabase session.
 * Navigation is handled automatically by the auth state listener in _layout.tsx.
 */
export default function AuthCallbackScreen() {
  useEffect(() => {
    async function process() {
      try {
        const url = await Linking.getInitialURL();
        if (url) await handleOAuthCallback(url);
      } catch (err) {
        console.warn("[AuthCallback] failed to process callback", err);
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
