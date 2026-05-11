import { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { supabase } from "@/lib/supabase";
import { LucideIcon } from "@/components/LucideIcon";

const checklist = [
  { label: "Profile created", done: true },
  { label: "Service menu added", done: true },
  { label: "Stripe account connected", done: true },
  { label: "FOAM review", done: false },
];

const nextSteps = [
  "We'll review your profile and services",
  "You'll get a push notification when you're approved",
  "Then you'll appear in customer search results",
];

export default function OperatorPendingScreen() {
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
  }

  function handleExplore() {
    router.replace("/operator/today");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.iconSection}>
          <View style={styles.iconCircle}>
            <LucideIcon name="Clock" size={48} color={Colors.foamBlue} />
          </View>

          <Text style={styles.headline}>You're in the queue.</Text>
          <Text style={styles.body}>
            We review every detailer before they go live. Usually takes less than 24 hours.
          </Text>
        </View>

        <View style={styles.checklistCard}>
          <View style={styles.checklist}>
            {checklist.map((item, i) => (
              <View key={i} style={styles.checklistRow}>
                {item.done ? (
                  <View style={styles.checkCircleFilled}>
                    <LucideIcon name="Check" size={14} color={Colors.white} />
                  </View>
                ) : (
                  <View style={styles.checkCircleEmpty}>
                    <LucideIcon name="Clock" size={12} color={Colors.light.textTertiary} />
                  </View>
                )}
                <Text style={[styles.checklistText, !item.done && styles.checklistTextPending]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.nextStepsSection}>
            <Text style={styles.nextStepsTitle}>What happens next?</Text>
            <View style={styles.nextStepsList}>
              {nextSteps.map((step, i) => (
                <View key={i} style={styles.nextStepRow}>
                  <Text style={styles.bullet}>·</Text>
                  <Text style={styles.nextStepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleExplore} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Explore the App</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactButton} activeOpacity={0.7}>
            <Text style={styles.contactButtonText}>Have questions? Contact us</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: Platform.OS === "web" ? 24 : 0,
    alignItems: "center",
  },
  iconSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  headline: {
    fontFamily: Typography.display,
    fontSize: 28,
    color: Colors.light.textPrimary,
    lineHeight: 34,
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
  checklistCard: {
    width: "100%",
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    marginBottom: 32,
    ...Shadows.light.level1,
  },
  checklist: { gap: Spacing.md },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  checkCircleFilled: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkCircleEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.borderDefault,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: Colors.light.bgPrimary,
  },
  checklistText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  checklistTextPending: {
    color: Colors.light.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
    marginVertical: 20,
  },
  nextStepsSection: {},
  nextStepsTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.sm,
  },
  nextStepsList: { gap: Spacing.sm },
  nextStepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  bullet: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textTertiary,
    marginTop: -2,
  },
  nextStepText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  actions: {
    width: "100%",
    gap: Spacing.md,
  },
  primaryButton: {
    width: "100%",
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.light.level2,
  },
  primaryButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  contactButton: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  contactButtonText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
});
