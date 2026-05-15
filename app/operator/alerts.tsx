import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";

// ─── Types ────────────────────────────────────────────────────────────────────

type AlertSeverity = "error" | "warning" | "info";
type AlertTab = "needs_action" | "all_activity";

interface AlertCard {
  id: string;
  severity: AlertSeverity;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  note?: string;
  timeAgo: string;
  primaryAction?: { label: string; icon?: React.ComponentProps<typeof Ionicons>["name"] };
  secondaryAction?: { label: string };
  progressLabel?: string;
  progressPct?: number;
  autoApproveLabel?: string;
}

interface ActivityItem {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  text: string;
  subtext?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const NEEDS_ACTION: AlertCard[] = [
  {
    id: "a1",
    severity: "error",
    label: "Issue Flagged",
    icon: "warning",
    title: "James K. flagged a damage report on Dante R.'s BMW X5",
    subtitle: "Paint Correction · 3:00 PM job",
    note: "James says: Pre-existing scratch found on rear bumper. Attaching photo.",
    timeAgo: "2 min ago",
    primaryAction: { label: "Call James", icon: "call" },
    secondaryAction: { label: "View Photos" },
  },
  {
    id: "a2",
    severity: "warning",
    label: "No-Show Reported",
    icon: "person-remove",
    title: "Devon reported Christina L. as no-show · 11:30 AM job",
    subtitle: "Location: 1847 Peachtree Rd NE",
    timeAgo: "5 min ago",
    primaryAction: { label: "Contact Customer" },
    progressLabel: "Grace period: 5:43 remaining",
    progressPct: 40,
  },
  {
    id: "a3",
    severity: "info",
    label: "Service Change Requested",
    icon: "add-circle",
    title: "Kayla wants to add Headlight Restoration (+$95) to Alicia M.'s job",
    subtitle: "",
    timeAgo: "3 min ago",
    primaryAction: { label: "Approve Now" },
    secondaryAction: { label: "Reject" },
    autoApproveLabel: "Auto-approves in 2:14",
  },
];

const ALL_ACTIVITY: ActivityItem[] = [
  {
    id: "act1",
    icon: "checkmark",
    iconColor: Colors.successLight,
    text: "Jordan completed Terrence W.'s job · 8:45 AM",
  },
  {
    id: "act2",
    icon: "star",
    iconColor: Colors.foamBlue,
    text: "Jordan received 5-star review from Terrence W.",
  },
  {
    id: "act3",
    icon: "arrow-forward",
    iconColor: Colors.light.textTertiary,
    text: "Devon en route to Dante R. · Est. arrival 8 min",
  },
  {
    id: "act4",
    icon: "add",
    iconColor: Colors.foamBlue,
    text: "New booking: Christina L. · Fri, May 3 · 10:00 AM",
    subtext: "Unassigned — needs crew",
  },
  {
    id: "act5",
    icon: "checkmark",
    iconColor: Colors.successLight,
    text: "Kayla completed Alicia M.'s job · 2:12 PM",
  },
  {
    id: "act6",
    icon: "warning",
    iconColor: Colors.errorLight,
    text: "James K. flagged damage on Dante R.'s job",
    subtext: "Just now",
  },
];

// ─── Alert card component ─────────────────────────────────────────────────────

function AlertCardView({ card }: { card: AlertCard }) {
  const accentColor =
    card.severity === "error"
      ? Colors.errorLight
      : card.severity === "warning"
      ? Colors.warningLight
      : Colors.foamBlue;

  const labelColor =
    card.severity === "error"
      ? Colors.errorLight
      : card.severity === "warning"
      ? Colors.warningLight
      : Colors.foamBlue;

  return (
    <View style={[styles.alertCard, { borderLeftColor: accentColor }]}>
      {/* Header row */}
      <View style={styles.alertCardHeader}>
        <View style={styles.alertCardLabelRow}>
          <Ionicons name={card.icon} size={18} color={labelColor} />
          <Text style={[styles.alertCardLabel, { color: labelColor }]}>{card.label}</Text>
        </View>
        <Text style={styles.alertCardTime}>{card.timeAgo}</Text>
      </View>

      {/* Title + subtitle */}
      <Text style={styles.alertCardTitle}>{card.title}</Text>
      {card.subtitle ? <Text style={styles.alertCardSubtitle}>{card.subtitle}</Text> : null}

      {/* Note (quoted message) */}
      {card.note ? (
        <View style={styles.alertCardNote}>
          <Text style={styles.alertCardNoteText}>"{card.note}"</Text>
        </View>
      ) : null}

      {/* Progress bar (no-show grace period) */}
      {card.progressLabel != null && (
        <View style={styles.alertCardProgress}>
          <Text style={styles.alertCardProgressLabel}>{card.progressLabel}</Text>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${card.progressPct ?? 0}%` as `${number}%`,
                  backgroundColor: Colors.warningLight,
                },
              ]}
            />
          </View>
          <Text style={styles.alertCardNoteText}>Devon is waiting. No customer contact yet.</Text>
        </View>
      )}

      {/* Auto-approve label */}
      {card.autoApproveLabel ? (
        <Text style={styles.autoApproveLabel}>{card.autoApproveLabel}</Text>
      ) : null}

      {/* Action buttons */}
      <View style={styles.alertCardActions}>
        {card.secondaryAction && (
          <TouchableOpacity
            style={[
              styles.alertActionBtnSecondary,
              { borderColor: card.severity === "error" ? Colors.errorLight : Colors.foamBlue },
            ]}
          >
            <Text
              style={[
                styles.alertActionBtnSecondaryText,
                { color: card.severity === "error" ? Colors.errorLight : Colors.foamBlue },
              ]}
            >
              {card.secondaryAction.label}
            </Text>
          </TouchableOpacity>
        )}
        {card.primaryAction && (
          <TouchableOpacity
            style={[
              styles.alertActionBtnPrimary,
              { backgroundColor: accentColor, flex: card.secondaryAction ? 1 : undefined },
            ]}
          >
            {card.primaryAction.icon && (
              <Ionicons name={card.primaryAction.icon} size={14} color={Colors.white} />
            )}
            <Text style={styles.alertActionBtnPrimaryText}>{card.primaryAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function OperatorAlertsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AlertTab>("needs_action");
  const alertCount = NEEDS_ACTION.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Live Alerts</Text>
          {alertCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{alertCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Segment control */}
      <View style={styles.segmentContainer}>
        <View style={styles.segmentTrack}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === "needs_action" && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveTab("needs_action")}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === "needs_action" && styles.segmentBtnTextActive,
              ]}
            >
              Needs Action
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === "all_activity" && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveTab("all_activity")}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === "all_activity" && styles.segmentBtnTextActive,
              ]}
            >
              All Activity
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "needs_action" ? (
          <>
            <Text style={styles.sectionCapsLabel}>REQUIRES YOUR ATTENTION</Text>
            {NEEDS_ACTION.map((card) => (
              <AlertCardView key={card.id} card={card} />
            ))}
          </>
        ) : (
          <>
            {ALL_ACTIVITY.map((item, idx) => (
              <View key={item.id}>
                <View style={styles.activityRow}>
                  <View style={styles.activityIconWrap}>
                    <Ionicons name={item.icon} size={14} color={item.iconColor} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>{item.text}</Text>
                    {item.subtext ? (
                      <Text
                        style={[
                          styles.activitySubtext,
                          item.subtext.toLowerCase().includes("unassigned") && {
                            color: Colors.warningLight,
                          },
                        ]}
                      >
                        {item.subtext}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {idx < ALL_ACTIVITY.length - 1 && (
                  <View style={styles.activityDivider} />
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PADDING_H = 20;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.bgPrimary,
  },

  // ── Header ────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.surface,
    paddingHorizontal: PADDING_H,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 17,
    color: Colors.light.textPrimary,
  },
  headerBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.warningLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadgeText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 11,
    color: Colors.white,
  },
  headerSpacer: {
    width: 32,
  },

  // ── Segment control ───────────────────────────────────────────────
  segmentContainer: {
    paddingHorizontal: PADDING_H,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  segmentTrack: {
    flexDirection: "row",
    backgroundColor: Colors.light.bgSecondary,
    borderRadius: Radius.pill,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    alignItems: "center",
  },
  segmentBtnActive: {
    backgroundColor: Colors.foamBlue,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }
      : { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 }),
  },
  segmentBtnText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
  },
  segmentBtnTextActive: {
    color: Colors.white,
  },

  // ── Scroll content ────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: PADDING_H,
    paddingTop: Spacing.md,
    paddingBottom: 40,
  },
  sectionCapsLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: Spacing.md,
  },

  // ── Alert card ────────────────────────────────────────────────────
  alertCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: Colors.light.borderSubtle,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 10,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 4px 6px rgba(0,0,0,0.08)" }
      : Shadows.light.level2),
  },
  alertCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  alertCardLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  alertCardLabel: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyS,
  },
  alertCardTime: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
  },
  alertCardTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.light.textPrimary,
    lineHeight: 21,
  },
  alertCardSubtitle: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  alertCardNote: {
    backgroundColor: Colors.light.bgSecondary,
    borderRadius: Radius.sm,
    padding: 10,
    marginTop: 4,
  },
  alertCardNoteText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    fontStyle: "italic",
    lineHeight: 19,
  },
  alertCardProgress: {
    gap: 8,
    marginTop: 4,
  },
  alertCardProgressLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.warningLight,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: Colors.light.borderSubtle,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  autoApproveLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    marginTop: -4,
  },
  alertCardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  alertActionBtnSecondary: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  alertActionBtnSecondaryText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
  },
  alertActionBtnPrimary: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  alertActionBtnPrimaryText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },

  // ── All activity feed ─────────────────────────────────────────────
  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  activityIconWrap: {
    width: 24,
    alignItems: "center",
    paddingTop: 2,
    flexShrink: 0,
  },
  activityContent: {
    flex: 1,
    gap: 2,
  },
  activityText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    lineHeight: 20,
  },
  activitySubtext: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
  },
  activityDivider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
  },
});
