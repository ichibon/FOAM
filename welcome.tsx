import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius } from "@/constants/design";

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>foam</Text>
        <Text style={styles.logoSub}>AUTO SPA</Text>
      </View>

      {/* Tagline */}
      <View style={styles.taglineContainer}>
        <Text style={styles.tagline}>Your business.</Text>
        <Text style={styles.tagline}>Your car.</Text>
        <Text style={styles.taglineAccent}>Clean.</Text>
      </View>

      {/* CTAs */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/auth/signup")}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/auth/login")}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.foamDarkTeal,
    paddingHorizontal: Spacing.lg,
    justifyContent: "space-between",
    paddingBottom: Spacing.xl2,
  },
  logoContainer: {
    marginTop: Spacing.xl4,
    alignItems: "flex-start",
  },
  logoText: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 64,
    color: Colors.foamBlue,
    letterSpacing: -1,
    lineHeight: 70,
  },
  logoSub: {
    fontFamily: "Inter_600SemiBold",
    fontSize: Typography.size.label,
    color: Colors.dark.textSecondary,
    letterSpacing: Typography.tracking.label,
    marginTop: -4,
  },
  taglineContainer: {
    flex: 1,
    justifyContent: "center",
  },
  tagline: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: Typography.size.h1,
    color: Colors.dark.textPrimary,
    lineHeight: 42,
  },
  taglineAccent: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: Typography.size.h1,
    color: Colors.foamBlue,
    lineHeight: 42,
  },
  ctaContainer: {
    gap: Spacing.sm,
  },
  primaryButton: {
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.borderDefault,
  },
  secondaryButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: Typography.size.bodyL,
    color: Colors.dark.textPrimary,
  },
});
