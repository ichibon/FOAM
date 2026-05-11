import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { LucideIcon } from "@/components/LucideIcon";

const benefits = [
  "Find detailers within your service radius",
  "Show accurate arrival times for mobile operators",
  "Remember your home and work addresses",
];

export default function LocationScreen() {
  const [loading, setLoading] = useState(false);

  async function handleEnable() {
    setLoading(true);
    try {
      if (Platform.OS !== "web") {
        await Location.requestForegroundPermissionsAsync();
      }
    } catch {}
    setLoading(false);
    router.replace("/onboarding/customer/complete");
  }

  function handleSkip() {
    router.replace("/onboarding/customer/complete");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.progressHeader}>
        <Text style={styles.stepLabel}>Step 3 of 3</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "100%" }]} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <LucideIcon name="MapPin" size={48} color={Colors.foamBlue} />
        </View>

        <View style={styles.textSection}>
          <Text style={styles.headline}>So we can find detailers near you.</Text>
          <Text style={styles.body}>
            We use your location to show nearby operators and calculate accurate drive times. We never share your location with anyone.
          </Text>
        </View>

        <View style={styles.benefitsSection}>
          {benefits.map((benefit, i) => (
            <View key={i} style={styles.benefitRow}>
              <View style={styles.checkCircle}>
                <LucideIcon name="Check" size={12} color={Colors.white} />
              </View>
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleEnable}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Enable Location</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipButtonText}>Not now</Text>
        </TouchableOpacity>
        <Text style={styles.skipHint}>You can enable location later in Settings.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  progressHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    alignItems: "center",
  },
  stepLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
    marginBottom: Spacing.sm,
  },
  progressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: Colors.light.borderSubtle,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.foamBlue,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: 32,
    alignItems: "center",
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.foamLightBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  textSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  headline: {
    fontFamily: Typography.display,
    fontSize: 26,
    color: Colors.light.textPrimary,
    lineHeight: 32,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  body: {
    fontFamily: Typography.body,
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 300,
  },
  benefitsSection: {
    width: "100%",
    gap: Spacing.sm,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    ...Shadows.light.level1,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  benefitText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Platform.OS === "web" ? 24 : 0,
    paddingTop: Spacing.sm,
    gap: 4,
    alignItems: "center",
  },
  primaryButton: {
    width: "100%",
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.light.level1,
  },
  buttonDisabled: { opacity: 0.5 },
  primaryButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
  skipButton: {
    height: 44,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  skipButtonText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
  skipHint: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    textAlign: "center",
  },
});
