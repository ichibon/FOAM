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

type MemberStatus = "on_job" | "available" | "off_today";

interface RosterMember {
  id: string;
  name: string;
  initials: string;
  isActive: boolean;
  status: MemberStatus;
  totalJobsToday: number;
  completedJobsToday: number;
  currentJobName: string | null;
  weekRevenue: number;
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

// ─── Status helpers ────────────────────────────────────────────────────────────

function statusLabel(s: MemberStatus): string {
  if (s === "on_job") return "On Job";
  if (s === "available") return "Available";
  return "Off Today";
}

function statusBgColor(s: MemberStatus): string {
  if (s === "on_job") return "rgba(22,163,74,0.10)";
  if (s === "available") return Colors.light.bgSecondary;
  return Colors.light.bgSecondary;
}

function statusTextColor(s: MemberStatus): string {
  if (s === "on_job") return Colors.successLight;
  return Colors.light.textSecondary;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeamRosterScreen() {
  const { user } = useAuth();
  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [members, setMembers] = useState<RosterMember[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);

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
        .single();
      if (profileErr || !profileData) throw profileErr ?? new Error("no profile");

      const pid: string = profileData.id;
      setProfileId(pid);

      const { start: todayStart, end: todayEnd } = todayBounds();
      const { start: weekStart, end: weekEnd } = weekBounds();

      const [membersRes, todayBookingsRes, weekBookingsRes] = await Promise.all([
        supabase
          .from("team_members")
          .select("id, display_name, is_active, commission_rate, created_at, users(full_name, phone)")
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
        const name =
          m.display_name ?? m.users?.full_name ?? "Team Member";
        const memberTodayBookings = todayBookings.filter((b) => b.crew_member_id === m.id);
        const completedToday = memberTodayBookings.filter((b) => b.status === "completed").length;
        const inProgressBooking = memberTodayBookings.find((b) => b.status === "in_progress");

        let status: MemberStatus;
        if (!m.is_active) {
          status = "off_today";
        } else if (inProgressBooking) {
          status = "on_job";
        } else {
          status = "available";
        }

        return {
          id: m.id,
          name,
          initials: initials(name),
          isActive: m.is_active,
          status,
          totalJobsToday: memberTodayBookings.length,
          completedJobsToday: completedToday,
          currentJobName: inProgressBooking?.service_packages?.name ?? null,
          weekRevenue: weekRevenueMap[m.id] ?? 0,
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

  const shadow =
    Platform.OS === "web"
      ? { boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }
      : Shadows.light.level1;

  if (screenState === "loading") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Team</Text>
            <Text style={styles.dateLabel}>{TODAY_DATE.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.foamBlue} />
        </View>
      </SafeAreaView>
    );
  }

  if (screenState === "fetch_error") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Team</Text>
            <Text style={styles.dateLabel}>{TODAY_DATE.toUpperCase()}</Text>
          </View>
        </View>
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
          <Ionicons name="add" size={16} color={Colors.foamBlue} />
          <Text style={styles.addBtnText}>Add Member</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {members.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="people-outline" size={32} color={Colors.foamBlue} />
            </View>
            <Text style={styles.emptyTitle}>No team members yet</Text>
            <Text style={styles.emptyBody}>
              Invite crew members to start assigning jobs and tracking performance.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => router.push("/operator/team/add")}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color={Colors.white} />
              <Text style={styles.emptyAddBtnText}>Invite Team Member</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {members.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.memberCard, shadow, !m.isActive && styles.memberCardDimmed]}
                onPress={() => router.push(`/operator/team/${m.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.memberTop}>
                  <View style={[styles.avatar, !m.isActive && styles.avatarInactive]}>
                    <Text style={[styles.avatarText, !m.isActive && styles.avatarTextInactive]}>
                      {m.initials}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={[styles.memberName, !m.isActive && styles.memberNameInactive]}>
                        {m.name}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusBgColor(m.status) },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: statusTextColor(m.status) }]}>
                          {statusLabel(m.status)}
                        </Text>
                      </View>
                    </View>

                    {m.currentJobName && (
                      <Text style={styles.currentJobText}>Currently: {m.currentJobName}</Text>
                    )}

                    {m.isActive && m.totalJobsToday > 0 && (
                      <View style={styles.progressWrap}>
                        <View style={styles.progressBg}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${Math.round(
                                  (m.completedJobsToday / m.totalJobsToday) * 100
                                )}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressLabel}>
                          {m.completedJobsToday} of {m.totalJobsToday} job
                          {m.totalJobsToday !== 1 ? "s" : ""} done today
                        </Text>
                      </View>
                    )}

                    {m.isActive && m.totalJobsToday === 0 && (
                      <Text style={styles.noJobsText}>No jobs assigned today</Text>
                    )}

                    {!m.isActive && (
                      <Text style={styles.noJobsText}>Inactive</Text>
                    )}
                  </View>
                </View>

                <View style={styles.memberFooter}>
                  <Text style={styles.memberStats}>
                    {m.totalJobsToday} job{m.totalJobsToday !== 1 ? "s" : ""} today
                    {m.weekRevenue > 0 ? ` · ${fmtCurrency(m.weekRevenue)} this week` : ""}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.light.textTertiary} />
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.inviteCard]}
              onPress={() => router.push("/operator/team/add")}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.foamBlue} />
              <Text style={styles.inviteCardText}>Invite a team member</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.businessSection}>
          <Text style={styles.businessLabel}>BUSINESS TOOLS</Text>

          <TouchableOpacity
            style={[styles.linkCard, shadow]}
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
            style={[styles.linkCard, shadow]}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
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
  dateLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: Typography.tracking.label,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addBtnText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.mdSm,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.mdSm,
  },
  errorText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
  },
  retryBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.pill,
    marginTop: Spacing.xs,
  },
  retryText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl2,
    gap: Spacing.mdSm,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.foamLightBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    fontFamily: Typography.display,
    fontSize: Typography.size.h3,
    color: Colors.light.textPrimary,
  },
  emptyBody: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 21,
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    height: 48,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.pill,
    marginTop: Spacing.sm,
  },
  emptyAddBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  memberCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    padding: Spacing.md,
    gap: Spacing.mdSm,
  },
  memberCardDimmed: { opacity: 0.6 },
  memberTop: { flexDirection: "row", gap: Spacing.mdSm },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarInactive: { backgroundColor: Colors.light.borderDefault },
  avatarText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
  avatarTextInactive: { color: Colors.light.textTertiary },
  memberInfo: { flex: 1, gap: 4 },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  memberName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
  },
  memberNameInactive: { color: Colors.light.textTertiary },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
  },
  currentJobText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  progressWrap: { gap: 3, marginTop: 2 },
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
  noJobsText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    fontStyle: "italic",
    marginTop: 2,
  },
  memberFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.mdSm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  memberStats: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
  },
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
    marginTop: Spacing.xs,
  },
  inviteCardText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
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
