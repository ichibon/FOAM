import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { supabase } from "@/lib/supabase";
import { LucideIcon } from "@/components/LucideIcon";

export default function CustomerCompleteScreen() {
  const [saving, setSaving] = useState(true);

  useEffect(() => {
    markOnboardingComplete();
  }, []);

  async function markOnboardingComplete() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("users")
          .update({ onboarding_complete: true })
          .eq("id", user.id);
      }
    } catch {}
    setSaving(false);
  }

  function handleContinue() {
    router.replace("/customer/discover");
  }

  if (saving) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.foamBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <LucideIcon name="Check" size={32} color={Colors.white} />
        </View>

        <View style={styles.textSection}>
          <Text style={styles.headline}>You're all set.</Text>
          <Text style={styles.subheadline}>Let's find you a detailer.</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>VEHICLE SAVED</Text>
            <Text style={styles.statValue}>Your Ride</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>PAYMENT</Text>
            <Text style={styles.statValue}>On file</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>LOCATION</Text>
            <Text style={styles.statValue}>Ready</Text>
          </View>
        </View>

        <View style={styles.previewSection}>
          <Text style={styles.previewLabel}>TOP DETAILERS NEAR YOU</Text>
          {[
            { name: "Elite Auto Spa", rating: "4.9", reviews: "124", distance: "2.1 mi" },
            { name: "Pristine Mobile", rating: "5.0", reviews: "89", distance: "3.4 mi" },
          ].map((d, i) => (
            <View key={i} style={styles.detailerCard}>
              <View style={styles.detailerAvatar} />
              <View style={styles.detailerInfo}>
                <Text style={styles.detailerName}>{d.name}</Text>
                <View style={styles.detailerMeta}>
                  <LucideIcon name="Star" size={10} color={Colors.foamBlue} />
                  <Text style={styles.detailerMetaText}>
                    {d.rating} ({d.reviews}) · {d.distance}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleContinue} activeOpacity={0.85}>
          <LucideIcon name="MapPin" size={16} color={Colors.white} />
          <Text style={styles.primaryButtonText}>Find a Detailer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: 32,
    alignItems: "center",
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    ...Shadows.light.level2,
  },
  textSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  headline: {
    fontFamily: Typography.display,
    fontSize: 32,
    color: Colors.light.textPrimary,
    lineHeight: 38,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subheadline: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: 20,
    width: "100%",
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    ...Shadows.light.level1,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
    textAlign: "center",
  },
  statValue: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.light.borderSubtle,
    marginHorizontal: Spacing.sm,
  },
  previewSection: {
    width: "100%",
    gap: Spacing.sm,
    opacity: 0.8,
  },
  previewLabel: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  detailerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
  },
  detailerAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.bgSecondary,
  },
  detailerInfo: { flex: 1 },
  detailerName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    marginBottom: 2,
  },
  detailerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailerMetaText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textSecondary,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Platform.OS === "web" ? 32 : 0,
    paddingTop: Spacing.md,
  },
  primaryButton: {
    width: "100%",
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    ...Shadows.light.level2,
  },
  primaryButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
});
