import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";

// ─── Raw DB row types ─────────────────────────────────────────────────────────

interface RawMemberRow {
  id: string;
  display_name: string | null;
  is_active: boolean;
  commission_rate: number | null;
  created_at: string;
  users: { full_name: string | null; phone: string | null } | null;
}

interface RawBookingRow {
  id: string;
  crew_member_id: string | null;
  status: string;
  scheduled_at: string;
  subtotal: number | null;
  tip_amount: number;
  total: number | null;
  service_packages: { name: string } | null;
}

// ─── Derived UI types ─────────────────────────────────────────────────────────

type MemberStatus = "on_job" | "available" | "off_today" | "inactive";

interface RosterMember {
  id: string;
  name: string;
  initials: string;
  isActive: boolean;
  status: MemberStatus;
  totalJobsToday: number;
  completedJobsToday: number;
  currentJobName: string | null;
  nextJobName: string | null;
  weekRevenue: number;
  isFlagged: boolean;
  flaggedJobName: string | null;
  flaggedJobTime: string | null;
}

type ScreenState = "loading" | "fetch_error" | "main";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function fmtCurrency(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function todayBounds(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
  return { start, end };
}

function weekBounds(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function bookingAmount(b: { total?: number | null; subtotal?: number | null; tip_amount: number }): number {
  return b.total ?? ((b.subtotal ?? 0) + b.tip_amount);
}

const TODAY_DATE = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

// ─── Status badge helpers ──────────────────────────────────────────────────────

function statusLabel(s: MemberStatus, isFlagged: boolean): string {
  if (isFlagged) return "Flagged";
  if (s === "on_job") return "On Job";
  if (s === "available") return "Available";
  if (s === "off_today") return "Off Today";
  return "Inactive";
}

function statusBgColor(s: MemberStatus, isFlagged: boolean): string {
  if (isFlagged) return "rgba(217,119,6,0.08)";
  if (s === "on_job") return "rgba(22,163,74,0.08)";
  if (s === "available") return Colors.foamBlueSubtle;
  return Colors.light.bgSecondary;
}

function statusTextColor(s: MemberStatus, isFlagged: boolean): string {
  if (isFlagged) return Colors.warningLight;
  if (s === "on_job") return Colors.successLight;
  if (s === "available") return Colors.foamBlue;
  return Colors.light.textTertiary;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeamRosterScreen() {
  const { user } = useAuth();
  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [members, setMembers] = useState<RosterMember[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setScreenState("loading");
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();

      const { data: profileData, error: profileErr } = await supabase
        .from("detailer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileErr) throw profileErr;
      if (!profileData) {
        setMembers([]);
        setScreenState("main");
        return;
      }

      const pid: string = profileData.id;
      const { start: todayStart, end: todayEnd } = todayBounds();
      const { start: weekStart, end: weekEnd } = weekBounds();

      const [membersRes, todayBookingsRes, weekBookingsRes] = await Promise.all([
        supabase
          .from("team_members")
          .select("id, display_name, is_active, commission_rate, created_at, users!crew_members_user_id_fkey(full_name, phone)")
          .eq("manager_id", pid)
          .order("created_at", { ascending: true }),
        supabase
          .from("bookings")
          .select("id, crew_member_id, status, scheduled_at, subtotal, tip_amount, total, service_packages(name)")
          .eq("detailer_id", pid)
          .gte("scheduled_at", todayStart)
          .lte("scheduled_at", todayEnd)
          .not("status", "in", '("cancelled","no_show")'),
        supabase
          .from("bookings")
          .select("id, crew_member_id, status, subtotal, tip_amount, total")
          .eq("detailer_id", pid)
          .eq("status", "completed")
          .gte("scheduled_at", weekStart)
          .lte("scheduled_at", weekEnd),
      ]);

      if (membersRes.error) throw membersRes.error;
      if (todayBookingsRes.error) throw todayBookingsRes.error;
      if (weekBookingsRes.error) throw weekBookingsRes.error;

      const rawMembers = (membersRes.data as RawMemberRow[] | null) ?? [];
      const todayBookings = (todayBookingsRes.data as RawBookingRow[] | null) ?? [];
      const weekBookings = (weekBookingsRes.data as RawBookingRow[] | null) ?? [];

      const weekRevenueMap: Record<string, number> = {};
      for (const b of weekBookings) {
        if (b.crew_member_id) {
          weekRevenueMap[b.crew_member_id] =
            (weekRevenueMap[b.crew_member_id] ?? 0) + bookingAmount(b);
        }
      }

      const roster: RosterMember[] = rawMembers.map((m) => {
        const name = m.display_name ?? m.users?.full_name ?? "Team Member";
        const memberTodayBookings = todayBookings.filter((b) => b.crew_member_id === m.id);
        const completedToday = memberTodayBookings.filter((b) => b.status === "completed").length;
        const inProgressBooking = memberTodayBookings.find((b) => b.status === "in_progress");
        const flaggedBooking = memberTodayBookings.find((b) => b.status === "flagged");

        let status: MemberStatus;
        if (!m.is_active) {
          status = "inactive";
        } else if (inProgressBooking) {
          status = "on_job";
        } else {
          status = "available";
        }

        const nextBooking = memberTodayBookings.find((b) => b.status === "confirmed");

        return {
          id: m.id,
          name,
          initials: initials(name),
          isActive: m.is_active,
          status,
          totalJobsToday: memberTodayBookings.length,
          completedJobsToday: completedToday,
          currentJobName: inProgressBooking?.service_packages?.name ?? null,
          nextJobName: nextBooking?.service_packages?.name ?? null,
          weekRevenue: weekRevenueMap[m.id] ?? 0,
          isFlagged: !!flaggedBooking,
          flaggedJobName: flaggedBooking?.service_packages?.name ?? null,
          flaggedJobTime: flaggedBooking ? fmtTime(flaggedBooking.scheduled_at) : null,
        };
      });

      setMembers(roster);
      setScreenState("main");
    } catch {
      setScreenState("fetch_error");
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const cardShadow = Platform.OS === "web"
    ? ({ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.05)" } as object)
    : Shadows.light.level1;

  const headerContent = (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>Team</Text>
        <Text style={styles.dateLabel}>{TODAY_DATE.toUpperCase()}</Text>
      </View>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => router.push("/operator/team/add")}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={14} color={Colors.foamBlue} />
        <Text style={styles.addBtnText}>Add Member</Text>
      </TouchableOpacity>
    </View>
  );

  if (screenState === "loading") {
    return (
      <SafeAreaView style={styles.container}>
        {headerContent}
        <View style={styles.center}>
          <ActivityIndicator color={Colors.foamBlue} />
        </View>
      </SafeAreaView>
    );
  }

  if (screenState === "fetch_error") {
    return (
      <SafeAreaView style={styles.container}>
        {headerContent}
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={Colors.light.textTertiary} />
          <Text style={styles.errorText}>Couldn't load your team</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.7}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {headerContent}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {members.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="people" size={36} color={Colors.foamBlue} />
              </View>
              <Text style={styles.emptyTitle}>No crew yet.</Text>
              <Text style={styles.emptyBody}>
                Your operation starts with your people. Add your first team member.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => router.push("/operator/team/add")}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyAddBtnText}>Add Team Member</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.onboardingCard}>
              <View style={styles.onboardingStep}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
                <Text style={styles.stepText}>Add a crew member by phone or email</Text>
              </View>
              <View style={styles.onboardingStep}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
                <Text style={styles.stepText}>Set their commission rate and permissions</Text>
              </View>
              <View style={styles.onboardingStep}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
                <Text style={styles.stepText}>Assign them to their first job</Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            {members.map((m) => {
              const isOffToday = m.status === "inactive";
              const hasNoJobs = m.totalJobsToday === 0 && m.isActive;
              const progressPct = m.totalJobsToday > 0
                ? Math.round((m.completedJobsToday / m.totalJobsToday) * 100)
                : 0;

              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.memberCard,
                    cardShadow,
                    m.isFlagged && styles.memberCardFlagged,
                    isOffToday && styles.memberCardDimmed,
                  ]}
                  onPress={() => router.push(`/operator/team/${m.id}`)}
                  activeOpacity={0.8}
                >
                  <View style={styles.memberTop}>
                    {/* Avatar */}
                    <View style={[styles.avatar, isOffToday && styles.avatarOff]}>
                      <Text style={[styles.avatarText, isOffToday && styles.avatarTextOff]}>
                        {m.initials}
                      </Text>
                    </View>

                    {/* Info column */}
                    <View style={styles.memberInfo}>
                      {/* Name + status badge */}
                      <View style={styles.memberNameRow}>
                        <Text style={[styles.memberName, isOffToday && styles.memberNameOff]}>
                          {m.name}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusBgColor(m.status, m.isFlagged) }]}>
                          <Text style={[styles.statusText, { color: statusTextColor(m.status, m.isFlagged) }]}>
                            {statusLabel(m.status, m.isFlagged)}
                          </Text>
                        </View>
                      </View>

                      {/* Specialty / placeholder */}
                      <Text style={styles.memberSpecialty}>Detailer · 4.9 ★</Text>

                      {/* Flagged state: warning banner + View Issue */}
                      {m.isFlagged ? (
                        <View style={styles.flaggedSection}>
                          <View style={styles.flagBanner}>
                            <Ionicons name="warning" size={14} color={Colors.warningLight} />
                            <Text style={styles.flagBannerText}>
                              {m.flaggedJobName
                                ? `Issue flagged on ${m.flaggedJobName}${m.flaggedJobTime ? ` · ${m.flaggedJobTime}` : ""}`
                                : "Issue flagged on a job today"}
                            </Text>
                          </View>
                          <View style={styles.flagActionRow}>
                            <TouchableOpacity
                              style={styles.viewIssueBtn}
                              onPress={() => router.push(`/operator/team/${m.id}`)}
                              activeOpacity={0.75}
                            >
                              <Text style={styles.viewIssueBtnText}>View Issue</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : hasNoJobs ? (
                        /* No jobs assigned today */
                        <View style={styles.noJobsSection}>
                          <Text style={styles.noJobsText}>No jobs assigned today</Text>
                          <View style={styles.noJobsActionRow}>
                            <TouchableOpacity
                              style={styles.assignJobBtn}
                              onPress={() => router.push("/operator/bookings/unassigned")}
                              activeOpacity={0.75}
                            >
                              <Text style={styles.assignJobBtnText}>Assign Job</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        /* Progress bar */
                        <View style={styles.progressSection}>
                          <View style={styles.progressBg}>
                            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                          </View>
                          <Text style={styles.progressLabel}>
                            {m.completedJobsToday} of {m.totalJobsToday} job{m.totalJobsToday !== 1 ? "s" : ""} done today
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Footer stats */}
                  <View style={styles.memberFooter}>
                    <Text style={styles.memberStats}>
                      {m.totalJobsToday} job{m.totalJobsToday !== 1 ? "s" : ""} today
                      {` · ${fmtCurrency(m.weekRevenue)} this week`}
                      {" · 0 reviews"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Invite card */}
            <TouchableOpacity
              style={[styles.inviteCard, cardShadow]}
              onPress={() => router.push("/operator/team/add")}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color={Colors.foamBlue} />
              <Text style={styles.inviteCardText}>Invite a team member</Text>
            </TouchableOpacity>

            {/* Business tools */}
            <View style={styles.businessSection}>
              <Text style={styles.businessLabel}>BUSINESS TOOLS</Text>
              <TouchableOpacity
                style={[styles.linkCard, cardShadow]}
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
                style={[styles.linkCard, cardShadow]}
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.bgPrimary },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.mdLg,
    paddingTop: Spacing.mdLg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.surface,
  },
  title: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 22,
    color: Colors.light.textPrimary,
    marginBottom: 2,
  },
  dateLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: Typography.tracking.label,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingBottom: 2,
  },
  addBtnText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },

  // Layout
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.mdSm,
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.mdSm,
  },

  // Error
  errorText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
  },
  retryBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  retryText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },

  // Empty state
  emptyWrapper: {
    paddingTop: Spacing.xl2,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  emptyState: { alignItems: "center", gap: Spacing.mdSm },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center", justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    fontFamily: Typography.display,
    fontSize: 22,
    color: Colors.light.textPrimary,
  },
  emptyBody: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 22,
  },
  emptyAddBtn: {
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    width: "100%",
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  emptyAddBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  onboardingCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.light.level1,
  },
  onboardingStep: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.mdSm },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.foamBlue,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginTop: 1,
  },
  stepNumText: { fontFamily: Typography.bodySemiBold, fontSize: 13, color: Colors.white },
  stepText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    flex: 1, lineHeight: 22,
  },

  // Member card
  memberCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    padding: Spacing.md,
    gap: Spacing.mdSm,
  },
  memberCardFlagged: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.warningLight,
  },
  memberCardDimmed: { opacity: 0.6 },
  memberTop: { flexDirection: "row", gap: Spacing.mdSm },

  // Avatar
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.foamBlue,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  avatarOff: { backgroundColor: Colors.light.borderDefault },
  avatarText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
  avatarTextOff: { color: Colors.light.textTertiary },

  // Member info
  memberInfo: { flex: 1, gap: 4 },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginBottom: 2,
  },
  memberName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
    flex: 1,
  },
  memberNameOff: { color: Colors.light.textTertiary },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    flexShrink: 0,
  },
  statusText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
  },
  memberSpecialty: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.mdSm,
  },

  // Progress
  progressSection: { gap: 4 },
  progressBg: {
    height: 4,
    backgroundColor: Colors.light.bgSecondary,
    borderRadius: Radius.pill,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.pill,
  },
  progressLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
  },

  // No jobs state
  noJobsSection: { gap: Spacing.sm },
  noJobsText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    fontStyle: "italic",
  },
  noJobsActionRow: { alignItems: "flex-end" },
  assignJobBtn: {
    height: 32,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  assignJobBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyS,
    color: Colors.foamBlue,
  },

  // Flagged state
  flaggedSection: { gap: Spacing.sm },
  flagBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: 10,
    backgroundColor: "rgba(217,119,6,0.08)",
    borderRadius: Radius.sm,
  },
  flagBannerText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.warningLight,
    flex: 1,
  },
  flagActionRow: { alignItems: "flex-end" },
  viewIssueBtn: {
    height: 32,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.errorLight,
    alignItems: "center",
    justifyContent: "center",
  },
  viewIssueBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyS,
    color: Colors.errorLight,
  },

  // Footer
  memberFooter: {
    paddingTop: Spacing.mdSm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  memberStats: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
  },

  // Invite card
  inviteCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.light.borderDefault,
    borderStyle: "dashed",
    padding: Spacing.md,
  },
  inviteCardText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },

  // Business section
  businessSection: { gap: Spacing.mdSm, marginTop: Spacing.sm },
  businessLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: Typography.tracking.label,
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
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center", justifyContent: "center",
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
