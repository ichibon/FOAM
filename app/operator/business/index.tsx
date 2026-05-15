import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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
import type { BookingStatus } from "@/types/database";

type Period = "today" | "week" | "month" | "alltime";

interface RawBookingRow {
  id: string;
  status: BookingStatus;
  subtotal: number | null;
  tip_amount: number;
  total: number | null;
  scheduled_at: string;
  crew_member_id: string | null;
  service_packages: { name: string } | null;
  users: { full_name: string | null } | null;
  vehicles: { make: string | null; model: string | null } | null;
  booking_contacts: { full_name: string | null; vehicle_make: string | null; vehicle_model: string | null } | null;
}

interface TeamMemberRow {
  id: string;
  users: { full_name: string | null } | null;
  commission_rate: number | null;
}

interface ChartBar {
  label: string;
  service: number;
  tip: number;
}

interface TeamBreakdown {
  id: string;
  name: string;
  initials: string;
  jobCount: number;
  revenue: number;
}

interface TodayJob {
  id: string;
  customerName: string;
  vehicleDesc: string;
  packageName: string;
  amount: number;
  status: BookingStatus;
  crewName: string;
}

interface ServiceBreakdown {
  name: string;
  count: number;
  revenue: number;
}

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "alltime", label: "All Time" },
];

function getPeriodRange(period: Period): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  if (period === "week") {
    const start = new Date(now);
    const dayOfWeek = start.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  const start = new Date(now);
  start.setMonth(start.getMonth() - 5);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

function buildChartData(bookings: RawBookingRow[], period: Period): ChartBar[] {
  const now = new Date();

  if (period === "today") {
    const HOURS = [8, 9, 10, 11, 12, 13, 14, 15];
    return HOURS.map((h) => {
      const group = bookings.filter(
        (b) => new Date(b.scheduled_at).getHours() === h
      );
      const label = h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;
      return {
        label,
        service: group.reduce((s, b) => s + (b.subtotal ?? 0), 0),
        tip: group.reduce((s, b) => s + b.tip_amount, 0),
      };
    });
  }

  if (period === "week") {
    const DAYS: { label: string; jsDay: number }[] = [
      { label: "Mon", jsDay: 1 },
      { label: "Tue", jsDay: 2 },
      { label: "Wed", jsDay: 3 },
      { label: "Thu", jsDay: 4 },
      { label: "Fri", jsDay: 5 },
      { label: "Sat", jsDay: 6 },
      { label: "Sun", jsDay: 0 },
    ];
    return DAYS.map(({ label, jsDay }) => {
      const group = bookings.filter(
        (b) => new Date(b.scheduled_at).getDay() === jsDay
      );
      return {
        label,
        service: group.reduce((s, b) => s + (b.subtotal ?? 0), 0),
        tip: group.reduce((s, b) => s + b.tip_amount, 0),
      };
    });
  }

  if (period === "month") {
    return ["W1", "W2", "W3", "W4"].map((label, i) => {
      const group = bookings.filter((b) => {
        const day = new Date(b.scheduled_at).getDate();
        return Math.floor((day - 1) / 7) === i;
      });
      return {
        label,
        service: group.reduce((s, b) => s + (b.subtotal ?? 0), 0),
        tip: group.reduce((s, b) => s + b.tip_amount, 0),
      };
    });
  }

  const months: { label: string; month: number; year: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    months.push({
      label: d.toLocaleString("default", { month: "short" }),
      month: d.getMonth(),
      year: d.getFullYear(),
    });
  }
  return months.map(({ label, month, year }) => {
    const group = bookings.filter((b) => {
      const d = new Date(b.scheduled_at);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    return {
      label,
      service: group.reduce((s, b) => s + (b.subtotal ?? 0), 0),
      tip: group.reduce((s, b) => s + b.tip_amount, 0),
    };
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function fmtCurrency(val: number): string {
  return `$${val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function BarChart({ data }: { data: ChartBar[] }) {
  const CHART_H = 156;
  const LABEL_H = 20;
  const BAR_AREA_H = CHART_H - LABEL_H;

  const maxVal = useMemo(
    () => Math.max(...data.map((d) => d.service + d.tip), 1),
    [data]
  );

  return (
    <View style={{ height: CHART_H, flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
      {data.map((d, i) => {
        const total = d.service + d.tip;
        const barH = total > 0 ? Math.max(Math.round((total / maxVal) * BAR_AREA_H), 2) : 2;
        const tipH = total > 0 ? Math.round((d.tip / total) * barH) : 0;
        const serviceH = barH - tipH;

        return (
          <View
            key={i}
            style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", height: CHART_H }}
          >
            <View style={{ width: "80%", height: barH, overflow: "hidden" }}>
              {tipH > 0 && (
                <View
                  style={{
                    height: tipH,
                    backgroundColor: Colors.foamLightBlue,
                    borderWidth: 1,
                    borderColor: Colors.foamBlue,
                    borderBottomWidth: 0,
                  }}
                />
              )}
              <View
                style={{
                  height: serviceH,
                  backgroundColor: total > 0 ? Colors.foamBlue : Colors.light.borderSubtle,
                  borderRadius: total > 0 ? 0 : 2,
                }}
              />
            </View>
            <Text
              style={{
                fontFamily: Typography.body,
                fontSize: 10,
                color: Colors.light.textTertiary,
                marginTop: 4,
                height: LABEL_H,
              }}
            >
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function BusinessScreen() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("week");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingRevenue, setPendingRevenue] = useState(0);
  const [confirmedRevenue, setConfirmedRevenue] = useState(0);
  const [jobCount, setJobCount] = useState(0);
  const [avgTicket, setAvgTicket] = useState(0);
  const [chartData, setChartData] = useState<ChartBar[]>([]);
  const [teamBreakdown, setTeamBreakdown] = useState<TeamBreakdown[]>([]);
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdown[]>([]);
  const [todayJobs, setTodayJobs] = useState<TodayJob[]>([]);

  const load = useCallback(
    async (p: Period) => {
      if (!user) return;
      setLoading(true);
      setFetchError(false);
      try {
        const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
        const supabase = getSupabase();

        const { data: profileData, error: profileErr } = await supabase
          .from("detailer_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();
        if (profileErr || !profileData) throw profileErr ?? new Error("no profile");

        const profileId: string = profileData.id;
        const { start, end } = getPeriodRange(p);

        const [bookingsRes, teamRes, todayRes] = await Promise.all([
          supabase
            .from("bookings")
            .select(
              "id, status, subtotal, tip_amount, total, scheduled_at, crew_member_id, service_packages(name), users!bookings_customer_id_fkey(full_name), vehicles(make,model), booking_contacts(full_name,vehicle_make,vehicle_model)"
            )
            .eq("detailer_id", profileId)
            .gte("scheduled_at", start)
            .lte("scheduled_at", end)
            .order("scheduled_at", { ascending: false }),

          supabase
            .from("team_members")
            .select("id, users(full_name), commission_rate")
            .eq("manager_id", profileId)
            .eq("is_active", true),

          p !== "today"
            ? supabase
                .from("bookings")
                .select(
                  "id, status, subtotal, tip_amount, total, scheduled_at, crew_member_id, service_packages(name), users!bookings_customer_id_fkey(full_name), vehicles(make,model), booking_contacts(full_name,vehicle_make,vehicle_model)"
                )
                .eq("detailer_id", profileId)
                .gte("scheduled_at", (() => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString(); })())
                .lte("scheduled_at", (() => { const d = new Date(); d.setHours(23,59,59,999); return d.toISOString(); })())
                .order("scheduled_at", { ascending: true })
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (bookingsRes.error) throw bookingsRes.error;

        const bookings = (bookingsRes.data as unknown as RawBookingRow[] | null) ?? [];
        const teamMembers = (teamRes.data as unknown as TeamMemberRow[] | null) ?? [];
        const todayRaw = (todayRes.data as unknown as RawBookingRow[] | null) ?? [];

        const bookingAmount = (b: { total?: number | null; subtotal?: number | null; tip_amount: number }) =>
          b.total ?? ((b.subtotal ?? 0) + b.tip_amount);
        const total = bookings.reduce((s, b) => s + bookingAmount(b), 0);
        const pending = bookings
          .filter((b) => b.status === "requested" || b.status === "confirmed")
          .reduce((s, b) => s + bookingAmount(b), 0);
        const confirmed = total - pending;

        setTotalRevenue(total);
        setPendingRevenue(pending);
        setConfirmedRevenue(confirmed);

        const count = bookings.length;
        setJobCount(count);
        setAvgTicket(count > 0 ? Math.round(total / count) : 0);

        const svcMap: Record<string, ServiceBreakdown> = {};
        for (const b of bookings) {
          const pkg = b.service_packages?.name ?? "Other";
          if (!svcMap[pkg]) svcMap[pkg] = { name: pkg, count: 0, revenue: 0 };
          svcMap[pkg].count += 1;
          svcMap[pkg].revenue += bookingAmount(b);
        }
        setServiceBreakdown(
          Object.values(svcMap).sort((a, b) => b.revenue - a.revenue)
        );

        setChartData(buildChartData(bookings, p));

        const memberMap: Record<string, TeamBreakdown> = {};
        for (const tm of teamMembers) {
          memberMap[tm.id] = {
            id: tm.id,
            name: tm.users?.full_name ?? "Team Member",
            initials: getInitials(tm.users?.full_name ?? "TM"),
            jobCount: 0,
            revenue: 0,
          };
        }
        for (const b of bookings) {
          if (b.crew_member_id && memberMap[b.crew_member_id]) {
            memberMap[b.crew_member_id].jobCount += 1;
            memberMap[b.crew_member_id].revenue += bookingAmount(b);
          }
        }
        const breakdown = Object.values(memberMap)
          .filter((m) => m.jobCount > 0)
          .sort((a, b) => b.revenue - a.revenue);
        setTeamBreakdown(breakdown);

        const jobSource = p === "today" ? bookings : todayRaw;
        const crewNameMap: Record<string, string> = {};
        for (const tm of teamMembers) crewNameMap[tm.id] = tm.users?.full_name?.split(" ")[0] ?? "Crew";

        const jobs: TodayJob[] = jobSource.map((b) => {
          const customerName =
            b.users?.full_name ?? b.booking_contacts?.full_name ?? "Customer";
          const veh = b.vehicles;
          const contact = b.booking_contacts;
          const vehicleDesc = veh
            ? [veh.make, veh.model].filter(Boolean).join(" ") || "Vehicle"
            : contact
            ? [contact.vehicle_make, contact.vehicle_model].filter(Boolean).join(" ") || "Vehicle"
            : "Vehicle";
          return {
            id: b.id,
            customerName,
            vehicleDesc,
            packageName: b.service_packages?.name ?? "Service",
            amount: bookingAmount(b),
            status: b.status,
            crewName: b.crew_member_id ? (crewNameMap[b.crew_member_id] ?? "") : "",
          };
        });
        setTodayJobs(jobs.slice(0, 5));
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
      // Only re-run when the screen gains focus or `load` identity changes.
      // Period changes are handled by handlePeriod which calls load() directly.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load])
  );

  function handlePeriod(p: Period) {
    setPeriod(p);
    load(p);
  }

  const statusColor = (s: BookingStatus) => {
    if (s === "completed") return Colors.successLight;
    if (s === "in_progress") return Colors.foamBlue;
    if (s === "cancelled" || s === "no_show") return Colors.errorLight;
    return Colors.warningLight;
  };

  const statusLabel = (s: BookingStatus) => {
    const map: Record<BookingStatus, string> = {
      requested: "Pending",
      confirmed: "Confirmed",
      in_progress: "In Progress",
      completed: "Paid",
      cancelled: "Cancelled",
      no_show: "No Show",
    };
    return map[s] ?? s;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Business</Text>
      </View>

      {loading && !fetchError ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.foamBlue} size="large" />
        </View>
      ) : fetchError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.warningLight} />
          <Text style={styles.errorText}>Couldn't load business data</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(period)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
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
                <Text style={[styles.chipText, period === p.key && styles.chipTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {jobCount === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="bar-chart-outline" size={48} color={Colors.foamBlue} />
              </View>
              <Text style={styles.emptyHeadline}>No revenue yet.</Text>
              <Text style={styles.emptyBody}>
                Create your first booking to start tracking revenue.
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => router.push("/operator/bookings/new")}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyCtaText}>New Booking</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
          {/* Revenue summary */}
          <View style={[styles.card, styles.shadow]}>
            <Text style={styles.revenueAmount}>{fmtCurrency(totalRevenue)}</Text>
            <Text style={styles.revenueLabel}>
              Team Revenue ·{" "}
              {period === "today"
                ? "Today"
                : period === "week"
                ? "This Week"
                : period === "month"
                ? "This Month"
                : "All Time"}
            </Text>
            <View style={styles.pillRow}>
              <View style={[styles.pill, { backgroundColor: "rgba(217,119,6,0.10)" }]}>
                <Text style={[styles.pillText, { color: Colors.warningLight }]}>
                  {fmtCurrency(pendingRevenue)} pending
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: "rgba(22,163,74,0.10)" }]}>
                <Text style={[styles.pillText, { color: Colors.successLight }]}>
                  {fmtCurrency(confirmedRevenue)} confirmed
                </Text>
              </View>
            </View>
          </View>

          {/* Job count + avg ticket stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.shadow]}>
              <Text style={styles.statValue}>{jobCount}</Text>
              <Text style={styles.statLabel}>Total Jobs</Text>
            </View>
            <View style={[styles.statCard, styles.shadow]}>
              <Text style={styles.statValue}>{jobCount > 0 ? fmtCurrency(avgTicket) : "—"}</Text>
              <Text style={styles.statLabel}>Avg Ticket</Text>
            </View>
          </View>

          {/* Bar chart */}
          <View style={[styles.card, styles.shadow]}>
            <View style={styles.chartHeader}>
              <Text style={styles.sectionLabel}>
                {period === "today"
                  ? "TODAY BY HOUR"
                  : period === "week"
                  ? "THIS WEEK BY DAY"
                  : period === "month"
                  ? "THIS MONTH BY WEEK"
                  : "LAST 6 MONTHS"}
              </Text>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.foamBlue }]} />
                  <Text style={styles.legendLabel}>Service</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: Colors.foamLightBlue, borderWidth: 1, borderColor: Colors.foamBlue },
                    ]}
                  />
                  <Text style={styles.legendLabel}>Tip</Text>
                </View>
              </View>
            </View>
            <BarChart data={chartData} />
          </View>

          {/* Team breakdown */}
          {teamBreakdown.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>BY TEAM MEMBER</Text>
                <Text style={styles.sectionMeta}>
                  {period === "today"
                    ? "Today"
                    : period === "week"
                    ? "This Week"
                    : period === "month"
                    ? "This Month"
                    : "All Time"}
                </Text>
              </View>
              <View style={[styles.card, styles.shadow, { padding: 0 }]}>
                {teamBreakdown.map((m, idx) => (
                  <View
                    key={m.id}
                    style={[
                      styles.memberRow,
                      idx < teamBreakdown.length - 1 && styles.memberRowBorder,
                    ]}
                  >
                    <View style={styles.memberLeft}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{m.initials}</Text>
                      </View>
                      <View>
                        <Text style={styles.memberName}>{m.name}</Text>
                        <Text style={styles.memberMeta}>{m.jobCount} job{m.jobCount !== 1 ? "s" : ""}</Text>
                      </View>
                    </View>
                    <View style={styles.memberRight}>
                      <Text style={styles.memberRevenue}>{fmtCurrency(m.revenue)}</Text>
                      <Ionicons name="chevron-forward" size={16} color={Colors.light.textTertiary} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Service type breakdown */}
          {serviceBreakdown.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>BY SERVICE TYPE</Text>
              </View>
              <View style={[styles.card, styles.shadow, { padding: 0 }]}>
                {serviceBreakdown.map((s, idx) => {
                  const pct = totalRevenue > 0 ? (s.revenue / totalRevenue) * 100 : 0;
                  return (
                    <View
                      key={s.name}
                      style={[
                        styles.svcRow,
                        idx < serviceBreakdown.length - 1 && styles.svcRowBorder,
                      ]}
                    >
                      <View style={styles.svcInfo}>
                        <Text style={styles.svcName}>{s.name}</Text>
                        <Text style={styles.svcCount}>
                          {s.count} job{s.count !== 1 ? "s" : ""}
                        </Text>
                      </View>
                      <View style={styles.svcRight}>
                        <View style={styles.svcBarBg}>
                          <View style={[styles.svcBarFill, { width: `${Math.max(pct, 2)}%` }]} />
                        </View>
                        <Text style={styles.svcRevenue}>{fmtCurrency(s.revenue)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Today's breakdown */}
          {todayJobs.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>TODAY'S BREAKDOWN</Text>
                <TouchableOpacity onPress={() => router.push("/operator/bookings")}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.card, styles.shadow, { padding: 0 }]}>
                {todayJobs.map((j, idx) => (
                  <TouchableOpacity
                    key={j.id}
                    style={[
                      styles.jobRow,
                      idx < todayJobs.length - 1 && styles.jobRowBorder,
                    ]}
                    onPress={() => router.push(`/operator/bookings/${j.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.jobLeft}>
                      <Text style={styles.jobCustomer}>
                        {j.customerName} · {j.vehicleDesc}
                      </Text>
                      <Text style={styles.jobPackage}>{j.packageName}</Text>
                    </View>
                    <View style={styles.jobRight}>
                      <Text style={styles.jobAmount}>{fmtCurrency(j.amount)}</Text>
                      <View style={styles.jobBadges}>
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: `${statusColor(j.status)}1A` },
                          ]}
                        >
                          <Text style={[styles.badgeText, { color: statusColor(j.status) }]}>
                            {statusLabel(j.status)}
                          </Text>
                        </View>
                        {j.crewName ? (
                          <View style={[styles.badge, { backgroundColor: Colors.foamBlueSubtle }]}>
                            <Text style={[styles.badgeText, { color: Colors.foamBlue }]}>
                              {j.crewName}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Payout card */}
          <View style={[styles.card, styles.shadow, styles.payoutCard]}>
            <Text style={styles.payoutLabel}>Next Payout</Text>
            <Text style={styles.payoutAmount}>
              Tomorrow · {fmtCurrency(confirmedRevenue)}
            </Text>
            <TouchableOpacity
              style={styles.outlineBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.outlineBtnText}>View Payout History</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.outlineBtn}
              activeOpacity={0.7}
              onPress={() => router.push("/operator/business/payroll")}
            >
              <Text style={styles.outlineBtnText}>Payroll Summary →</Text>
            </TouchableOpacity>
          </View>
            </>
          )}
        </ScrollView>
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

const shadowBase = Shadows.light.level1;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.light.bgPrimary,
  },
  headerTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 22,
    color: Colors.light.textPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 120,
    gap: Spacing.md,
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
  chipActive: {
    backgroundColor: Colors.foamBlue,
    borderColor: Colors.foamBlue,
  },
  chipText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  card: { ...cardBase },
  shadow: { ...shadowBase },
  revenueAmount: {
    fontFamily: Typography.display,
    fontSize: 36,
    color: Colors.light.textPrimary,
    lineHeight: 42,
  },
  revenueLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    marginTop: Spacing.xs,
  },
  pillRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  pill: {
    paddingHorizontal: Spacing.mdSm,
    paddingVertical: 6,
    borderRadius: Radius.xs,
  },
  pillText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: Typography.tracking.label,
  },
  legend: { flexDirection: "row", gap: Spacing.mdSm, alignItems: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendLabel: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.light.textTertiary,
  },
  section: { gap: Spacing.mdSm },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    letterSpacing: Typography.tracking.wide,
  },
  sectionMeta: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
  },
  seeAll: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.foamBlue,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.mdSm,
    minHeight: 56,
  },
  memberRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  memberLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.mdSm },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyS,
    color: Colors.white,
  },
  memberName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  memberMeta: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
  },
  memberRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  memberRevenue: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.light.textPrimary,
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  jobRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  jobLeft: { flex: 1, gap: 2 },
  jobCustomer: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  jobPackage: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  jobRight: { alignItems: "flex-end", gap: 4, marginLeft: Spacing.mdSm },
  jobAmount: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.light.textPrimary,
  },
  jobBadges: { flexDirection: "row", gap: 4 },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.xs },
  badgeText: { fontFamily: Typography.bodyMedium, fontSize: 11 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl3,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.mdSm,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  emptyHeadline: {
    fontFamily: Typography.display,
    fontSize: Typography.size.h3,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 21,
  },
  emptyCta: {
    height: 48,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  emptyCtaText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  payoutCard: { gap: Spacing.mdSm },
  payoutLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
  },
  payoutAmount: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 17,
    color: Colors.light.textPrimary,
  },
  outlineBtn: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.xs,
  },
  statValue: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 22,
    color: Colors.light.textPrimary,
  },
  statLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
  },
  svcRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.mdSm,
    minHeight: 52,
    gap: Spacing.md,
  },
  svcRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  svcInfo: { minWidth: 100 },
  svcName: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  svcCount: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    marginTop: 1,
  },
  svcRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  svcBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.light.bgSecondary,
    borderRadius: Radius.pill,
    overflow: "hidden",
  },
  svcBarFill: {
    height: "100%",
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.pill,
  },
  svcRevenue: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textPrimary,
    minWidth: 48,
    textAlign: "right",
  },
});
