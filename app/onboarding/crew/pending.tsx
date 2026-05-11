import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { LucideIcon } from "@/components/LucideIcon";

const checklist = [
  { label: "Account created", done: true },
  { label: "Invite code verified", done: true },
  { label: "Manager approval", done: false },
];

export default function CrewPendingScreen() {
  function handleExplore() {
    router.replace("/team_member/jobs");
  }

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
                <Text style={[styles.checklistText, !item.done && styles.checklistTextPending]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

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
        <TouchableOpacity style={styles.primaryButton} onPress={handleExplore} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Explore the App</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactButton} activeOpacity={0.7}>
          <Text style={styles.contactButtonText}>Have questions? Contact your manager</Text>
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
  heroIcon: {
    marginBottom: 20,
  },
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
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  checklistTextPending: {
    color: Colors.light.textTertiary,
  },
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
    gap: Spacing.sm,
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
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
  contactButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  contactButtonText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
});
