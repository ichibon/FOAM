import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { supabase } from "@/lib/supabase";
import { LucideIcon } from "@/components/LucideIcon";

interface UnitCounts {
  vans: number;
  locations: number;
}

function buildUnitLabel(counts: UnitCounts): string | null {
  const { vans, locations } = counts;
  if (vans === 0 && locations === 0) return null;
  const vanLabel = vans > 0 ? `${vans} ${vans === 1 ? "Van" : "Vans"}` : null;
  const locLabel =
    locations > 0 ? `${locations} ${locations === 1 ? "Location" : "Locations"}` : null;
  if (locLabel && vanLabel) return `${locLabel} and ${vanLabel} added`;
  if (locLabel) return `${locLabel} added`;
  return `${vanLabel} added`;
}

export default function OnboardingPendingScreen() {
  const [unitCounts, setUnitCounts] = useState<UnitCounts>({ vans: 0, locations: 0 });
  const [stripeConnected, setStripeConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.18,
          duration: 950,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 950,
          useNativeDriver: false,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const loadData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("detailer_profiles")
        .select("id, stripe_account_id")
        .eq("user_id", user.id)
        .single();
      if (!profile) return;

      setStripeConnected(!!profile.stripe_account_id);

      const [assetsResult, locsResult] = await Promise.all([
        supabase
          .from("business_assets")
          .select("id", { count: "exact", head: true })
          .eq("detailer_id", profile.id)
          .eq("is_active", true),
        supabase
          .from("business_locations")
          .select("id", { count: "exact", head: true })
          .eq("detailer_id", profile.id)
          .eq("is_active", true),
      ]);

      setUnitCounts({
        vans: assetsResult.count ?? 0,
        locations: locsResult.count ?? 0,
      });
    } catch (err) {
      console.warn("[OnboardingPending] loadData failed", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const unitLabel = buildUnitLabel(unitCounts);

  const checklist = [
    { key: "operation", icon: "Truck", label: "Operation built", done: unitCounts.vans > 0 || unitCounts.locations > 0 },
    { key: "stripe", icon: "Landmark", label: "Bank account connected", done: stripeConnected },
    { key: "review", icon: "Clock", label: "Under FOAM review", done: false, inProgress: true },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Animated.View
            style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]}
          />
          <View style={styles.checkCircle}>
            <LucideIcon name="CheckCircle" size={44} color={Colors.foamBlue} />
          </View>

          <Text style={styles.headline}>You're in the queue.</Text>
          <Text style={styles.subheadline}>
            FOAM's team will review your application within{" "}
            <Text style={styles.subheadlineBold}>1–2 business days.</Text>
          </Text>

          {loading ? (
            <ActivityIndicator color={Colors.foamBlue} style={{ marginTop: 4 }} />
          ) : unitLabel ? (
            <View style={styles.unitBadge}>
              <LucideIcon name="CheckCircle" size={14} color={Colors.successLight} />
              <Text style={styles.unitBadgeText}>{unitLabel}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.checklistCard}>
          <Text style={styles.checklistHeading}>SUBMITTED</Text>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.foamBlue} />
              <Text style={styles.loadingText}>Loading your status…</Text>
            </View>
          ) : (
            <View style={styles.checklistItems}>
              {checklist.map((item) => (
                <View key={item.key} style={styles.checklistRow}>
                  <View
                    style={[
                      styles.checklistIconCircle,
                      item.done && !item.inProgress && styles.checklistIconCircleDone,
                      item.inProgress && styles.checklistIconCircleInProgress,
                      !item.done && !item.inProgress && styles.checklistIconCirclePending,
                    ]}
                  >
                    {item.done && !item.inProgress ? (
                      <LucideIcon name="Check" size={16} color={Colors.successLight} />
                    ) : item.inProgress ? (
                      <LucideIcon name={item.icon} size={16} color={Colors.foamBlue} />
                    ) : (
                      <LucideIcon name={item.icon} size={16} color={Colors.light.textTertiary} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.checklistLabel,
                      item.inProgress && styles.checklistLabelInProgress,
                      !item.done && !item.inProgress && styles.checklistLabelPending,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.inProgress && (
                    <View style={styles.inProgressBadge}>
                      <Text style={styles.inProgressBadgeText}>In Review</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.nextStepsCard}>
          <View style={styles.nextStepsHeader}>
            <LucideIcon name="Info" size={18} color={Colors.foamBlue} />
            <Text style={styles.nextStepsTitle}>What happens next?</Text>
          </View>
          <View style={styles.nextStepsList}>
            {[
              {
                icon: "Search",
                title: "FOAM reviews your profile",
                body: "We verify your information and confirm your business details.",
              },
              {
                icon: "Bell",
                title: "You get notified",
                body: "Check your email and notifications — approval takes 1–2 business days.",
              },
              {
                icon: "Rocket",
                title: "Go live and start earning",
                body: "Once approved, your profile goes live and bookings can start.",
              },
            ].map((step, i) => (
              <View key={i} style={styles.nextStep}>
                <View style={styles.nextStepIconCircle}>
                  <LucideIcon name={step.icon} size={18} color={Colors.foamBlue} />
                </View>
                <View style={styles.nextStepText}>
                  <Text style={styles.nextStepTitle}>{step.title}</Text>
                  <Text style={styles.nextStepBody}>{step.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.dashboardButton}
          onPress={() => router.replace("/operator/today")}
          activeOpacity={0.85}
        >
          <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
          <LucideIcon name="ArrowRight" size={18} color={Colors.white} />
        </TouchableOpacity>

        <Text style={styles.footnote}>
          You'll see the pending status in your dashboard until FOAM approves your account.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: 48,
    paddingBottom: Platform.OS === "web" ? 40 : 32,
    gap: 24,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 16,
    position: "relative",
  },
  pulseRing: {
    position: "absolute",
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "rgba(51,157,199,0.10)",
    top: 10,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  headline: {
    fontFamily: Typography.display,
    fontSize: 28,
    color: Colors.light.textPrimary,
    textAlign: "center",
    marginBottom: 10,
  },
  subheadline: {
    fontFamily: Typography.body,
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 23,
    maxWidth: 300,
    marginBottom: 16,
  },
  subheadlineBold: {
    fontFamily: Typography.bodySemiBold,
    color: Colors.light.textPrimary,
  },
  unitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(22,163,74,0.10)",
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(22,163,74,0.25)",
  },
  unitBadgeText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.successLight,
  },
  checklistCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    ...Shadows.light.level1,
  },
  checklistHeading: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  loadingText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
  },
  checklistItems: { gap: 14 },
  checklistRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  checklistIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checklistIconCircleDone: { backgroundColor: "rgba(22,163,74,0.10)" },
  checklistIconCircleInProgress: { backgroundColor: Colors.foamBlueSubtle },
  checklistIconCirclePending: { backgroundColor: Colors.light.bgSecondary },
  checklistLabel: {
    flex: 1,
    fontFamily: Typography.bodyMedium,
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  checklistLabelInProgress: { color: Colors.foamBlue },
  checklistLabelPending: { color: Colors.light.textTertiary },
  inProgressBadge: {
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  inProgressBadgeText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.foamBlue,
  },
  nextStepsCard: {
    backgroundColor: Colors.foamLightBlue,
    borderRadius: Radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(51,157,199,0.20)",
  },
  nextStepsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  nextStepsTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.foamBlue,
  },
  nextStepsList: { gap: 16 },
  nextStep: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  nextStepIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(51,157,199,0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  nextStepText: { flex: 1 },
  nextStepTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 13,
    color: Colors.foamBlue,
    marginBottom: 3,
  },
  nextStepBody: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 19,
  },
  dashboardButton: {
    height: 52,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    ...Shadows.light.level2,
  },
  dashboardButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
  footnote: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
    marginTop: -8,
  },
});
