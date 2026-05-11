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

export default function TeamMemberPendingScreen() {
  const { refreshAuth } = useAuth();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { label: "Account created", done: true },
    { label: "Invite code verified", done: true },
    { label: "Manager approval", done: false },
  ]);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const checkStatusAndAdvance = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member, error: memberError } = await supabase
        .from("team_members")
        .select("status")
        .eq("user_id", user.id)
        .single();

      if (memberError) {
        console.warn("[TeamMemberPending] member fetch failed", memberError);
        return;
      }

      const isActive = member?.status === "active";

      setChecklist([
        { label: "Account created", done: true },
        { label: "Invite code verified", done: true },
        { label: "Manager approval", done: isActive },
      ]);

      if (isActive) {
        await refreshAuth();
        router.replace("/team_member/jobs");
      }
    } catch (err) {
      console.warn("[TeamMemberPending] status check failed", err);
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
        <View style={styles.heroIcon}>
          <View style={styles.iconCircle}>
            <LucideIcon name="Clock" size={48} color={Colors.foamBlue} />
          </View>
        </View>

        <View style={styles.headlineSection}>
          <Text style={styles.headline}>Waiting on your manager.</Text>
          <Text style={styles.body}>
            Your manager will get a notification and can approve you with one tap. Usually happens fast.
          </Text>
        </View>

        <View style={styles.statusCard}>
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
                      <LucideIcon name="Check" size={12} color={Colors.white} />
                    </View>
                  ) : (
                    <LucideIcon name="Clock" size={20} color={Colors.light.textTertiary} />
                  )}
                  <Text
                    style={[
                      styles.checklistText,
                      !item.done && styles.checklistTextPending,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {!item.done && (
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

          <View style={styles.teamRow}>
            <LucideIcon name="Users" size={18} color={Colors.foamBlue} />
            <Text style={styles.teamText}>You've requested to join the team</Text>
          </View>
        </View>

        <View style={styles.whileYouWait}>
          <Text style={styles.whileLabel}>WHILE YOU WAIT</Text>
          <View style={styles.whileItems}>
            <View style={styles.whileRow}>
              <LucideIcon name="Briefcase" size={18} color={Colors.foamBlue} />
              <Text style={styles.whileText}>Your jobs will appear here once assigned</Text>
            </View>
            <View style={styles.whileRow}>
              <LucideIcon name="DollarSign" size={18} color={Colors.foamBlue} />
              <Text style={styles.whileText}>Track your earnings in the Earnings tab</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkButton}
          onPress={checkStatusAndAdvance}
          disabled={loadingStatus}
          activeOpacity={0.7}
        >
          <Text style={styles.checkButtonText}>Check approval status</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: "center",
  },
  heroIcon: { marginBottom: 20 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.foamLightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  headlineSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  headline: {
    fontFamily: Typography.display,
    fontSize: 26,
    color: Colors.light.textPrimary,
    lineHeight: 32,
    textAlign: "center",
    marginBottom: 12,
  },
  body: {
    fontFamily: Typography.body,
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 300,
  },
  statusCard: {
    width: "100%",
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  checklistText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  checklistTextPending: { color: Colors.light.textTertiary },
  spinner: { flexShrink: 0 },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
    marginVertical: Spacing.md,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  teamText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  whileYouWait: {
    width: "100%",
    gap: Spacing.md,
  },
  whileLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
    paddingLeft: 4,
  },
  whileItems: { gap: Spacing.md },
  whileRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  whileText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "web" ? 32 : 0,
    paddingTop: Spacing.md,
  },
  checkButton: {
    width: "100%",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  checkButtonText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
});
