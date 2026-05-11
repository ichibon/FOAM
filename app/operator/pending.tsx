import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { LucideIcon } from "@/components/LucideIcon";

interface ChecklistItem {
  label: string;
  done: boolean;
}

const NEXT_STEPS = [
  "We'll review your profile and services",
  "You'll get a push notification when you're approved",
  "Then you'll appear in customer search results",
];

export default function OperatorPendingScreen() {
  const { refreshAuth } = useAuth();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { label: "Profile created", done: true },
    { label: "Service menu added", done: false },
    { label: "Stripe account connected", done: false },
    { label: "FOAM review", done: false },
  ]);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const checkStatusAndAdvance = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from("detailer_profiles")
        .select("id, stripe_account_id, approval_status")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        console.warn("[OperatorPending] profile fetch failed", profileError);
        return;
      }
      if (!profile) return;

      const { count: serviceCount, error: svcError } = await supabase
        .from("service_packages")
        .select("id", { count: "exact", head: true })
        .eq("detailer_id", profile.id);

      if (svcError) {
        console.warn("[OperatorPending] service count failed", svcError);
      }

      setChecklist([
        { label: "Profile created", done: true },
        { label: "Service menu added", done: (serviceCount ?? 0) > 0 },
        { label: "Stripe account connected", done: !!profile.stripe_account_id },
        { label: "FOAM review", done: profile.approval_status === "approved" },
      ]);

      if (profile.approval_status === "approved") {
        await refreshAuth();
        router.replace("/operator/today");
      }
    } catch (err) {
      console.warn("[OperatorPending] status check failed", err);
    } finally {
      setLoadingStatus(false);
    }
  }, [refreshAuth]);

  useEffect(() => {
    checkStatusAndAdvance();
  }, [checkStatusAndAdvance]);

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
          {loadingStatus ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.foamBlue} />
              <Text style={styles.loadingText}>Checking your status…</Text>
            </View>
          ) : (
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
                  <Text
                    style={[
                      styles.checklistText,
                      !item.done && styles.checklistTextPending,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {!item.done && i === checklist.length - 1 && (
                    <ActivityIndicator
                      size="small"
                      color={Colors.light.textTertiary}
                      style={styles.spinner}
                    />
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.nextStepsSection}>
            <Text style={styles.nextStepsTitle}>What happens next?</Text>
            <View style={styles.nextStepsList}>
              {NEXT_STEPS.map((step, i) => (
                <View key={i} style={styles.nextStepRow}>
                  <Text style={styles.bullet}>·</Text>
                  <Text style={styles.nextStepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.checkButton}
            onPress={checkStatusAndAdvance}
            disabled={loadingStatus}
            activeOpacity={0.7}
          >
            <Text style={styles.checkButtonText}>Check approval status</Text>
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
    flex: 1,
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  checklistTextPending: { color: Colors.light.textTertiary },
  spinner: { flexShrink: 0 },
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
  actions: { width: "100%", gap: Spacing.md },
  checkButton: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  checkButtonText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
});
