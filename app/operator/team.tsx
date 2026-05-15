import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";

export default function OperatorTeamScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.placeholderBlock}>
          <Ionicons name="people-outline" size={40} color={Colors.light.textTertiary} />
          <Text style={styles.placeholderText}>Full team management is coming soon.</Text>
        </View>

        {/* Deep links to Business screens — accessible now while Team tab is built */}
        <View style={styles.quickLinks}>
          <Text style={styles.quickLinksLabel}>BUSINESS TOOLS</Text>

          <TouchableOpacity
            style={[styles.linkCard, shadowStyle]}
            activeOpacity={0.7}
            onPress={() => router.push("/operator/business/payroll")}
          >
            <View style={styles.linkLeft}>
              <View style={styles.linkIcon}>
                <Ionicons name="cash-outline" size={20} color={Colors.foamBlue} />
              </View>
              <View>
                <Text style={styles.linkTitle}>Payroll Summary</Text>
                <Text style={styles.linkSub}>Per-member earnings & payout totals</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.light.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkCard, shadowStyle]}
            activeOpacity={0.7}
            onPress={() => router.push("/operator/business/commission")}
          >
            <View style={styles.linkLeft}>
              <View style={styles.linkIcon}>
                <Ionicons name="settings-outline" size={20} color={Colors.foamBlue} />
              </View>
              <View>
                <Text style={styles.linkTitle}>Commission Rules</Text>
                <Text style={styles.linkSub}>Default rate, per-member overrides & tips</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.light.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const shadowStyle =
  Platform.OS === "web"
    ? { boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
    : Shadows.light.level1;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  header: {
    paddingHorizontal: Spacing.mdLg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.surface,
  },
  title: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.h4,
    color: Colors.light.textPrimary,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    gap: Spacing.xl,
  },
  placeholderBlock: {
    alignItems: "center",
    gap: Spacing.mdSm,
  },
  placeholderText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  quickLinks: { gap: Spacing.mdSm },
  quickLinksLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
  },
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    padding: Spacing.md,
  },
  linkLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.mdSm, flex: 1 },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  linkTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  linkSub: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
});
