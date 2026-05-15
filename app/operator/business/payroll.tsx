import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/hooks/useAuth";
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from "@/constants/design";

type PayPeriod = "week" | "month" | "alltime";

interface TeamMemberEarning {
  id: string;
  name: string;
  initials: string;
  jobCount: number;
  commissionRate: number;
  serviceCommission: number;
  tipsReceived: number;
  totalOwed: number;
}

interface RawTeamMemberRow {
  id: string;
  users: { full_name: string | null } | null;
  commission_rate: number | null;
}

interface RawBookingRow {
  id: string;
  subtotal: number | null;
  tip_amount: number;
  crew_member_id: string | null;
}

interface RawTimeEntryRow {
  id: string;
  booking_id: string;
  crew_member_id: string;
}

const PERIODS: { key: PayPeriod; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "alltime", label: "All Time" },
];

function getPeriodMeta(period: PayPeriod): {
  start: string;
  end: string;
  label: string;
  payoutDate: string;
} {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (period === "week") {
    const start = new Date(now);
    const dayOfWeek = start.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    const payout = new Date(start);
    payout.setDate(payout.getDate() + 7);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      label: `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      payoutDate: payout.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
    };
  }
  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const payout = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      label: now.toLocaleString("default", { month: "long", year: "numeric" }),
      payoutDate: payout.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
    };
  }
  const start = new Date(2024, 0, 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label: "All Bookings",
    payoutDate: "On demand",
  };
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function fmtCurrency(val: number): string {
  return `$${val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function PayrollScreen() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<PayPeriod>("week");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [members, setMembers] = useState<TeamMemberEarning[]>([]);
  const [paidState, setPaidState] = useState<Record<string, boolean>>({});
  const [periodLabel, setPeriodLabel] = useState("");
  const [payoutDate, setPayoutDate] = useState("");
  const [usedFallback, setUsedFallback] = useState(false);

  const load = useCallback(
    async (p: PayPeriod) => {
      if (!user) return;
      setLoading(true);
      setFetchError(false);
      try {
        const { getSupabase } =
          require("@/lib/supabase") as typeof import("@/lib/supabase");
        const supabase = getSupabase();

        const { data: profileData, error: profileErr } = await supabase
          .from("detailer_profiles")
          .select("id, default_commission_rate")
          .eq("user_id", user.id)
          .single();
        if (profileErr || !profileData) throw profileErr ?? new Error("no profile");

        const profileId: string = profileData.id;
        const defaultRate: number =
          (profileData as { id: string; default_commission_rate?: number | null })
            .default_commission_rate ?? 38;
        const meta = getPeriodMeta(p);
        setPeriodLabel(meta.label);
        setPayoutDate(meta.payoutDate);

        const [teamRes, bookingsRes] = await Promise.all([
          supabase
            .from("team_members")
            .select("id, users(full_name), commission_rate")
            .eq("manager_id", profileId)
            .eq("is_active", true),
          supabase
            .from("bookings")
            .select("id, subtotal, tip_amount, crew_member_id")
            .eq("detailer_id", profileId)
            .eq("status", "completed")
            .gte("scheduled_at", meta.start)
            .lte("scheduled_at", meta.end),
        ]);

        if (teamRes.error) throw teamRes.error;

        const teamMembers = (teamRes.data as RawTeamMemberRow[] | null) ?? [];
        const bookings = (bookingsRes.data as RawBookingRow[] | null) ?? [];

        // Attempt to load crew_time_entries to attribute bookings to crew members
        // who actually clocked in, rather than relying solely on crew_member_id.
        const bookingIds = bookings.map((b) => b.id);
        let timeEntries: RawTimeEntryRow[] = [];
        let usingFallback = true;

        if (bookingIds.length > 0) {
          const { data: teData } = await supabase
            .from("crew_time_entries")
            .select("id, booking_id, crew_member_id")
            .in("booking_id", bookingIds);
          if (teData && teData.length > 0) {
            timeEntries = teData as RawTimeEntryRow[];
            usingFallback = false;
          }
        }

        setUsedFallback(usingFallback);

        // Build a map: booking_id → crew_member_id
        // If time entries exist, they take precedence over booking.crew_member_id.
        const bookingToCrew: Record<string, string[]> = {};
        if (!usingFallback) {
          for (const te of timeEntries) {
            if (!bookingToCrew[te.booking_id]) bookingToCrew[te.booking_id] = [];
            if (!bookingToCrew[te.booking_id].includes(te.crew_member_id)) {
              bookingToCrew[te.booking_id].push(te.crew_member_id);
            }
          }
        } else {
          for (const b of bookings) {
            if (b.crew_member_id) {
              bookingToCrew[b.id] = [b.crew_member_id];
            }
          }
        }

        const rateMap: Record<string, number> = {};
        for (const tm of teamMembers) rateMap[tm.id] = tm.commission_rate ?? defaultRate;

        // Aggregate earnings per crew member
        const earningsMap: Record<
          string,
          { serviceRevenue: number; tips: number; jobCount: number }
        > = {};
        for (const tm of teamMembers) {
          earningsMap[tm.id] = { serviceRevenue: 0, tips: 0, jobCount: 0 };
        }

        for (const b of bookings) {
          const assignedCrew = bookingToCrew[b.id] ?? [];
          if (assignedCrew.length === 0) continue;
          // Split revenue evenly if multiple crew on same booking
          const splitCount = assignedCrew.length;
          for (const crewId of assignedCrew) {
            if (!earningsMap[crewId]) continue;
            earningsMap[crewId].serviceRevenue += (b.subtotal ?? 0) / splitCount;
            earningsMap[crewId].tips += b.tip_amount / splitCount;
            earningsMap[crewId].jobCount += 1;
          }
        }

        const earnings: TeamMemberEarning[] = teamMembers.map((tm) => {
          const rate = rateMap[tm.id];
          const e = earningsMap[tm.id] ?? { serviceRevenue: 0, tips: 0, jobCount: 0 };
          const commission = Math.round((e.serviceRevenue * rate) / 100);
          return {
            id: tm.id,
            name: tm.users?.full_name ?? "Team Member",
            initials: getInitials(tm.users?.full_name ?? "TM"),
            jobCount: e.jobCount,
            commissionRate: rate,
            serviceCommission: commission,
            tipsReceived: Math.round(e.tips),
            totalOwed: commission + Math.round(e.tips),
          };
        });

        setMembers(earnings);
        setPaidState({});
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  useFocusEffect(
    useCallback(() => {
      load(period);
    }, [load, period])
  );

  function handlePeriod(p: PayPeriod) {
    setPeriod(p);
    load(p);
  }

  function handleMarkPaid(memberId: string) {
    setPaidState((prev) => ({ ...prev, [memberId]: true }));
  }

  function handleRunPayroll() {
    Alert.alert(
      "Run Payroll",
      "Automated payroll disbursement is coming soon. Use the per-member 'Mark as Paid' buttons for now.",
      [{ text: "Got it" }]
    );
  }

  const totalPayout = members.reduce((s, m) => s + m.totalOwed, 0);
  const allPaid =
    members.length > 0 && members.every((m) => paidState[m.id]);
  const activeMembers = members.filter((m) => m.jobCount > 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payroll Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && !fetchError ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.foamBlue} size="large" />
        </View>
      ) : fetchError ? (
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={40}
            color={Colors.warningLight}
          />
          <Text style={styles.errorText}>Couldn't load payroll data</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(period)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Period filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.periodRow}
            >
              {PERIODS.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.chip, period === p.key && styles.chipActive]}
                  onPress={() => handlePeriod(p.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      period === p.key && styles.chipTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Pay period info */}
            <View style={[styles.card, styles.shadow]}>
              <Text style={styles.metaLabel}>PAY PERIOD</Text>
              <Text style={styles.periodLabelText}>{periodLabel}</Text>
              {payoutDate !== "On demand" && (
                <Text style={styles.periodSub}>
                  Commission paid out on {payoutDate}
                </Text>
              )}
              {usedFallback && (
                <View style={styles.fallbackNote}>
                  <Ionicons
                    name="information-circle-outline"
                    size={13}
                    color={Colors.foamBlue}
                  />
                  <Text style={styles.fallbackText}>
                    Earnings based on completed bookings. Time-entry based tracking activates once crew members start clocking in.
                  </Text>
                </View>
              )}
            </View>

            {/* Total payout */}
            <View style={[styles.card, styles.shadow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Payroll</Text>
              <Text style={styles.totalAmount}>{fmtCurrency(totalPayout)}</Text>
            </View>

            {/* Member cards */}
            {activeMembers.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="people-outline"
                  size={32}
                  color={Colors.light.textTertiary}
                />
                <Text style={styles.emptyText}>
                  No completed jobs this period
                </Text>
              </View>
            ) : (
              activeMembers.map((m) => {
                const isPaid = paidState[m.id] ?? false;
                return (
                  <View
                    key={m.id}
                    style={[styles.card, styles.shadow, styles.memberCard]}
                  >
                    <View style={styles.memberHeader}>
                      <View style={styles.memberLeft}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>{m.initials}</Text>
                        </View>
                        <Text style={styles.memberName}>{m.name}</Text>
                      </View>
                      <Text style={styles.jobCount}>
                        {m.jobCount} job{m.jobCount !== 1 ? "s" : ""}
                      </Text>
                    </View>

                    <View style={styles.breakdown}>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>
                          Service commission ({m.commissionRate}%)
                        </Text>
                        <Text style={styles.breakdownValue}>
                          {fmtCurrency(m.serviceCommission)}
                        </Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Tips received</Text>
                        <Text style={styles.breakdownValue}>
                          {fmtCurrency(m.tipsReceived)}
                        </Text>
                      </View>
                      <View style={styles.totalBreakdown}>
                        <Text style={styles.totalOwedLabel}>Total owed</Text>
                        <Text style={styles.totalOwedAmount}>
                          {fmtCurrency(m.totalOwed)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.statusRow}>
                      <Text style={styles.statusRowLabel}>Pay Period Status</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          isPaid
                            ? { backgroundColor: "rgba(22,163,74,0.10)" }
                            : { backgroundColor: "rgba(217,119,6,0.10)" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color: isPaid
                                ? Colors.successLight
                                : Colors.warningLight,
                            },
                          ]}
                        >
                          {isPaid ? "Paid" : "Pending"}
                        </Text>
                      </View>
                    </View>

                    {isPaid ? (
                      <View style={styles.paidBtn}>
                        <Text style={styles.paidBtnText}>Paid</Text>
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={Colors.successLight}
                        />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.markPaidBtn}
                        activeOpacity={0.7}
                        onPress={() => handleMarkPaid(m.id)}
                      >
                        <Text style={styles.markPaidText}>Mark as Paid</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Run Payroll CTA */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity
              style={[styles.ctaBtn, allPaid && styles.ctaBtnSuccess]}
              activeOpacity={0.8}
              onPress={handleRunPayroll}
            >
              <Text style={styles.ctaBtnText}>Run Payroll</Text>
            </TouchableOpacity>
            <Text style={styles.ctaNote}>
              {allPaid
                ? "All members marked as paid"
                : "Mark each member individually or run payroll."}
            </Text>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const cardBase = {
  backgroundColor: Colors.light.surface,
  borderRadius: Radius.lg,
  borderWidth: 1,
  borderColor: Colors.light.borderSubtle,
  padding: Spacing.md,
};

const shadowBase =
  Platform.OS === "web"
    ? { boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
    : Shadows.light.level1;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 17,
    color: Colors.light.textPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 140,
    gap: Spacing.mdSm,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  errorText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
  },
  retryBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.foamBlue,
  },
  retryText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
  periodRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    backgroundColor: Colors.light.surface,
  },
  chipActive: { backgroundColor: Colors.foamBlue, borderColor: Colors.foamBlue },
  chipText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  chipTextActive: { color: Colors.white },
  card: { ...cardBase },
  shadow: { ...shadowBase },
  metaLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: Typography.tracking.label,
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },
  periodLabelText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 18,
    color: Colors.light.textPrimary,
    marginBottom: 2,
  },
  periodSub: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  fallbackNote: {
    flexDirection: "row",
    gap: Spacing.xs,
    alignItems: "flex-start",
    marginTop: Spacing.sm,
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.xs,
    padding: Spacing.sm,
  },
  fallbackText: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.light.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
  },
  totalAmount: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 22,
    color: Colors.light.textPrimary,
  },
  emptyCard: {
    ...cardBase,
    alignItems: "center",
    gap: Spacing.mdSm,
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textTertiary,
  },
  memberCard: { gap: Spacing.md },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.mdSm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Colors.white,
  },
  memberName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 16,
    color: Colors.light.textPrimary,
  },
  jobCount: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
  },
  breakdown: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.foamBlue,
    paddingLeft: Spacing.mdSm,
    marginLeft: Spacing.xs,
    gap: Spacing.sm,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  breakdownValue: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textPrimary,
  },
  totalBreakdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  totalOwedLabel: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  totalOwedAmount: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 16,
    color: Colors.foamBlue,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  statusRowLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  statusBadgeText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 11,
  },
  markPaidBtn: {
    height: 40,
    borderWidth: 1,
    borderColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  markPaidText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
  paidBtn: {
    height: 40,
    borderWidth: 1,
    borderColor: Colors.successLight,
    borderRadius: Radius.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(22,163,74,0.08)",
  },
  paidBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.successLight,
  },
  ctaContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === "ios" ? 32 : Spacing.md,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    gap: Spacing.sm,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 -4px 6px -1px rgba(0,0,0,0.05)" }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 8,
        }),
  },
  ctaBtn: {
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtnSuccess: { backgroundColor: Colors.successLight },
  ctaBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  ctaNote: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
    textAlign: "center",
  },
});
