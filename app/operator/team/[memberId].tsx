import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";

// ─── Raw DB row types ─────────────────────────────────────────────────────────

interface RawMemberDetail {
  id: string;
  display_name: string | null;
  is_active: boolean;
  commission_rate: number | null;
  created_at: string;
  can_view_customer_contact: boolean;
  can_reschedule_jobs: boolean;
  can_view_team_earnings: boolean;
  users: { full_name: string | null; phone: string | null; email: string | null } | null;
}

interface RawBookingRow {
  id: string;
  status: string;
  scheduled_at: string;
  subtotal: number | null;
  tip_amount: number;
  total: number | null;
  service_packages: { name: string } | null;
  users: { full_name: string | null } | null;
  vehicles: { make: string | null; model: string | null } | null;
  booking_contacts: { full_name: string | null; vehicle_make: string | null; vehicle_model: string | null } | null;
}

// ─── Screen types ─────────────────────────────────────────────────────────────

type ScreenState = "loading" | "fetch_error" | "not_found" | "main";

interface TodayJob {
  id: string;
  time: string;
  customerName: string;
  vehicleDesc: string;
  packageName: string;
  status: string;
}

interface MemberDetail {
  id: string;
  name: string;
  initials: string;
  isActive: boolean;
  commissionRate: number | null;
  joinedAt: string;
  phone: string | null;
  email: string | null;
  canViewCustomerContact: boolean;
  canRescheduleJobs: boolean;
  canViewTeamEarnings: boolean;
  // Stats
  totalJobsAllTime: number;
  jobsThisMonth: number;
  revenueThisMonth: number;
  tipsThisMonth: number;
  weekRevenue: number;
  // Schedule
  todayJobs: TodayJob[];
}

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
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function fmtJoinDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function bookingAmount(b: { total?: number | null; subtotal?: number | null; tip_amount: number }): number {
  return b.total ?? ((b.subtotal ?? 0) + b.tip_amount);
}

function monthBounds(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  return { start, end };
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

function bookingStatusLabel(s: string): string {
  const map: Record<string, string> = {
    requested: "Pending",
    confirmed: "Upcoming",
    in_progress: "In Progress",
    completed: "Done",
    cancelled: "Cancelled",
    no_show: "No Show",
  };
  return map[s] ?? s;
}

function bookingStatusColor(s: string): string {
  if (s === "in_progress") return Colors.foamBlue;
  if (s === "completed") return Colors.successLight;
  if (s === "confirmed") return Colors.foamBlue;
  if (s === "requested") return Colors.warningLight;
  return Colors.light.textTertiary;
}

function bookingStatusBg(s: string): string {
  if (s === "in_progress") return Colors.foamBlueSubtle;
  if (s === "completed") return "rgba(22,163,74,0.10)";
  if (s === "confirmed") return Colors.foamBlueSubtle;
  if (s === "requested") return "rgba(217,119,6,0.10)";
  return Colors.light.bgSecondary;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MemberProfileScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const { user } = useAuth();
  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [canViewContact, setCanViewContact] = useState(false);
  const [canReschedule, setCanReschedule] = useState(false);
  const [canViewEarnings, setCanViewEarnings] = useState(false);

  const load = useCallback(async () => {
    if (!user || !memberId) return;
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

      const { data: memberData, error: memberErr } = await supabase
        .from("team_members")
        .select(
          "id, display_name, is_active, commission_rate, created_at, can_view_customer_contact, can_reschedule_jobs, can_view_team_earnings, users(full_name, phone, email)"
        )
        .eq("id", memberId)
        .eq("manager_id", pid)
        .single();

      if (memberErr || !memberData) {
        setScreenState("not_found");
        return;
      }

      const raw = memberData as RawMemberDetail;
      const name = raw.display_name ?? raw.users?.full_name ?? "Team Member";

      const { start: monthStart, end: monthEnd } = monthBounds();
      const { start: todayStart, end: todayEnd } = todayBounds();
      const { start: weekStart, end: weekEnd } = weekBounds();

      const [allTimeRes, monthRes, todayRes, weekRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("crew_member_id", memberId)
          .eq("status", "completed"),
        supabase
          .from("bookings")
          .select("id, subtotal, tip_amount, total, status")
          .eq("crew_member_id", memberId)
          .eq("status", "completed")
          .gte("scheduled_at", monthStart)
          .lte("scheduled_at", monthEnd),
        supabase
          .from("bookings")
          .select(
            "id, status, scheduled_at, subtotal, tip_amount, total, service_packages(name), users!bookings_customer_id_fkey(full_name), vehicles(make,model), booking_contacts(full_name,vehicle_make,vehicle_model)"
          )
          .eq("crew_member_id", memberId)
          .gte("scheduled_at", todayStart)
          .lte("scheduled_at", todayEnd)
          .not("status", "in", '("cancelled","no_show")')
          .order("scheduled_at", { ascending: true }),
        supabase
          .from("bookings")
          .select("id, subtotal, tip_amount, total")
          .eq("crew_member_id", memberId)
          .eq("status", "completed")
          .gte("scheduled_at", weekStart)
          .lte("scheduled_at", weekEnd),
      ]);

      const monthBookings = (monthRes.data as RawBookingRow[] | null) ?? [];
      const todayBookings = (todayRes.data as RawBookingRow[] | null) ?? [];
      const weekBookings = (weekRes.data as RawBookingRow[] | null) ?? [];

      const revenueThisMonth = monthBookings.reduce(
        (s, b) => s + ((b.total ?? b.subtotal ?? 0)),
        0
      );
      const tipsThisMonth = monthBookings.reduce((s, b) => s + b.tip_amount, 0);
      const weekRevenue = weekBookings.reduce((s, b) => s + bookingAmount(b), 0);

      const todayJobs: TodayJob[] = todayBookings.map((b) => {
        const customerName =
          b.booking_contacts?.full_name ??
          b.users?.full_name ??
          "Customer";
        const vehicleDesc =
          b.booking_contacts
            ? `${b.booking_contacts.vehicle_make ?? ""} ${b.booking_contacts.vehicle_model ?? ""}`.trim()
            : b.vehicles
            ? `${b.vehicles.make ?? ""} ${b.vehicles.model ?? ""}`.trim()
            : "";

        return {
          id: b.id,
          time: fmtTime(b.scheduled_at),
          customerName,
          vehicleDesc,
          packageName: b.service_packages?.name ?? "Service",
          status: b.status,
        };
      });

      setCanViewContact(raw.can_view_customer_contact);
      setCanReschedule(raw.can_reschedule_jobs);
      setCanViewEarnings(raw.can_view_team_earnings);

      setMember({
        id: raw.id,
        name,
        initials: initials(name),
        isActive: raw.is_active,
        commissionRate: raw.commission_rate,
        joinedAt: fmtJoinDate(raw.created_at),
        phone: raw.users?.phone ?? null,
        email: raw.users?.email ?? null,
        canViewCustomerContact: raw.can_view_customer_contact,
        canRescheduleJobs: raw.can_reschedule_jobs,
        canViewTeamEarnings: raw.can_view_team_earnings,
        totalJobsAllTime: allTimeRes.count ?? 0,
        jobsThisMonth: monthBookings.length,
        revenueThisMonth,
        tipsThisMonth,
        weekRevenue,
        todayJobs,
      });

      setScreenState("main");
    } catch {
      setScreenState("fetch_error");
    }
  }, [user, memberId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function savePermissions() {
    if (!member || !profileId) return;
    setSaving(true);
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();
      const { error } = await supabase
        .from("team_members")
        .update({
          can_view_customer_contact: canViewContact,
          can_reschedule_jobs: canReschedule,
          can_view_team_earnings: canViewEarnings,
        })
        .eq("id", member.id)
        .eq("manager_id", profileId);
      if (error) throw error;
    } catch {
      Alert.alert("Error", "Couldn't save permissions. Please try again.");
      setCanViewContact(member.canViewCustomerContact);
      setCanReschedule(member.canRescheduleJobs);
      setCanViewEarnings(member.canViewTeamEarnings);
    }
    setSaving(false);
  }

  async function deactivateMember() {
    if (!member || !profileId) return;
    Alert.alert(
      "Deactivate Account",
      `Remove ${member.name} from your team? They will no longer be assigned to jobs.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
              const supabase = getSupabase();
              const { error } = await supabase
                .from("team_members")
                .update({ is_active: false })
                .eq("id", member.id)
                .eq("manager_id", profileId);
              if (error) throw error;
              router.back();
            } catch {
              Alert.alert("Error", "Couldn't deactivate this account. Please try again.");
            }
          },
        },
      ]
    );
  }

  const shadow =
    Platform.OS === "web"
      ? { boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }
      : Shadows.light.level1;

  if (screenState === "loading") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Team Member</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.foamBlue} />
        </View>
      </SafeAreaView>
    );
  }

  if (screenState === "fetch_error") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Team Member</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color={Colors.light.textTertiary} />
          <Text style={styles.errorText}>Couldn't load member details</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.7}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (screenState === "not_found" || !member) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Team Member</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>Member not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const permissionsChanged =
    canViewContact !== member.canViewCustomerContact ||
    canReschedule !== member.canRescheduleJobs ||
    canViewEarnings !== member.canViewTeamEarnings;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{member.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>{member.initials}</Text>
          </View>
          <Text style={styles.heroName}>{member.name}</Text>
          <Text style={styles.heroRole}>
            Mobile Detailer · Joined {member.joinedAt}
          </Text>

          <View
            style={[
              styles.heroStatusBadge,
              {
                backgroundColor: member.isActive
                  ? "rgba(22,163,74,0.10)"
                  : Colors.light.bgSecondary,
              },
            ]}
          >
            <Text
              style={[
                styles.heroStatusText,
                { color: member.isActive ? Colors.successLight : Colors.light.textSecondary },
              ]}
            >
              {member.isActive ? "Active" : "Inactive"}
            </Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Total Jobs</Text>
              <Text style={styles.heroStatValue}>{member.totalJobsAllTime}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>This Month</Text>
              <Text style={styles.heroStatValue}>{member.jobsThisMonth} jobs</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>This Week</Text>
              <Text style={styles.heroStatValue}>
                {member.weekRevenue > 0 ? fmtCurrency(member.weekRevenue) : "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Performance */}
        <View style={[styles.card, shadow]}>
          <Text style={styles.cardSectionLabel}>PERFORMANCE THIS MONTH</Text>
          <View style={styles.statRows}>
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Jobs completed</Text>
              <Text style={styles.statRowValue}>{member.jobsThisMonth}</Text>
            </View>
            <View style={styles.statRowBorder} />
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Service revenue</Text>
              <Text style={styles.statRowValue}>{fmtCurrency(member.revenueThisMonth)}</Text>
            </View>
            <View style={styles.statRowBorder} />
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Tips earned</Text>
              <Text style={styles.statRowValue}>{fmtCurrency(member.tipsThisMonth)}</Text>
            </View>
          </View>
        </View>

        {/* Today's schedule */}
        {member.todayJobs.length > 0 && (
          <View style={[styles.card, shadow, { padding: 0 }]}>
            <View style={styles.cardHeaderPadded}>
              <Text style={styles.cardSectionLabel}>TODAY'S SCHEDULE</Text>
            </View>
            {member.todayJobs.map((j, idx) => (
              <TouchableOpacity
                key={j.id}
                style={[
                  styles.jobRow,
                  idx < member.todayJobs.length - 1 && styles.jobRowBorder,
                ]}
                onPress={() => router.push(`/operator/bookings/${j.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.jobLeft}>
                  <Text style={styles.jobTime}>{j.time}</Text>
                  <View
                    style={[
                      styles.jobStatusBadge,
                      { backgroundColor: bookingStatusBg(j.status) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.jobStatusText,
                        { color: bookingStatusColor(j.status) },
                      ]}
                    >
                      {bookingStatusLabel(j.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.jobRight}>
                  <Text style={styles.jobCustomer}>
                    {j.customerName}
                    {j.vehicleDesc ? ` · ${j.vehicleDesc}` : ""}
                  </Text>
                  <Text style={styles.jobPackage}>{j.packageName}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={Colors.light.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Commission */}
        <View style={[styles.card, shadow]}>
          <View style={styles.commissionRow}>
            <Text style={styles.commissionLabel}>Commission rate</Text>
            <View style={styles.commissionRight}>
              <Text style={styles.commissionRate}>
                {member.commissionRate != null ? `${member.commissionRate}%` : "Default"}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/operator/business/commission")}
                activeOpacity={0.7}
              >
                <Text style={styles.commissionEditLink}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Permissions */}
        <View style={[styles.card, shadow]}>
          <Text style={styles.cardSectionLabel}>PERMISSIONS</Text>
          <View style={styles.permissionRows}>
            <PermissionRow
              label="Can view customer contact info"
              value={canViewContact}
              onChange={setCanViewContact}
            />
            <View style={styles.permRowBorder} />
            <PermissionRow
              label="Can reschedule jobs"
              value={canReschedule}
              onChange={setCanReschedule}
            />
            <View style={styles.permRowBorder} />
            <PermissionRow
              label="Can view team earnings"
              value={canViewEarnings}
              onChange={setCanViewEarnings}
            />
          </View>

          {permissionsChanged && (
            <TouchableOpacity
              style={[styles.savePermBtn, saving && styles.savePermBtnDisabled]}
              onPress={savePermissions}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.savePermBtnText}>Save Permissions</Text>
              )}
            </TouchableOpacity>
          )}

          <Text style={styles.permHint}>Changes take effect immediately.</Text>
        </View>

        {/* Contact info */}
        {(member.phone || member.email) && (
          <View style={[styles.card, shadow]}>
            <Text style={styles.cardSectionLabel}>CONTACT</Text>
            <View style={styles.statRows}>
              {member.phone && (
                <View style={styles.statRow}>
                  <View style={styles.contactLabelRow}>
                    <Ionicons name="call-outline" size={14} color={Colors.light.textTertiary} />
                    <Text style={styles.statRowLabel}>Phone</Text>
                  </View>
                  <Text style={styles.statRowValue}>{member.phone}</Text>
                </View>
              )}
              {member.phone && member.email && <View style={styles.statRowBorder} />}
              {member.email && (
                <View style={styles.statRow}>
                  <View style={styles.contactLabelRow}>
                    <Ionicons name="mail-outline" size={14} color={Colors.light.textTertiary} />
                    <Text style={styles.statRowLabel}>Email</Text>
                  </View>
                  <Text style={styles.statRowValue} numberOfLines={1}>
                    {member.email}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Destructive */}
        <TouchableOpacity
          style={styles.deactivateBtn}
          onPress={deactivateMember}
          activeOpacity={0.7}
        >
          <Text style={styles.deactivateBtnText}>
            {member.isActive ? "Deactivate Account" : "Account Already Inactive"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── PermissionRow sub-component ─────────────────────────────────────────────

interface PermissionRowProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

function PermissionRow({ label, value, onChange }: PermissionRowProps) {
  return (
    <View style={styles.permRow}>
      <Text style={styles.permRowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.light.borderDefault, true: Colors.foamBlue }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.mdSm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.surface,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  headerSpacer: { width: 44 },
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
  },
  retryText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  heroSection: {
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  heroAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  heroAvatarText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 28,
    color: Colors.white,
  },
  heroName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.h3,
    color: Colors.light.textPrimary,
  },
  heroRole: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
  },
  heroStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginBottom: Spacing.sm,
  },
  heroStatusText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    marginTop: Spacing.xs,
  },
  heroStatItem: { flex: 1, alignItems: "center", gap: 4 },
  heroStatLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
  },
  heroStatValue: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
  },
  heroStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.light.borderSubtle,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.mdSm,
    padding: Spacing.md,
  },
  cardSectionLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: Typography.tracking.label,
    marginBottom: Spacing.mdSm,
  },
  cardHeaderPadded: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 0,
  },
  statRows: { gap: 0 },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.mdSm,
  },
  statRowBorder: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
  },
  statRowLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  statRowValue: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.mdSm,
    gap: Spacing.mdSm,
    minHeight: 56,
  },
  jobRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  jobLeft: { alignItems: "flex-start", gap: 4, minWidth: 70 },
  jobTime: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textPrimary,
  },
  jobStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  jobStatusText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 10,
  },
  jobRight: { flex: 1, gap: 2 },
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
  commissionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  commissionLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  commissionRight: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  commissionRate: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.foamBlue,
  },
  commissionEditLink: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
  permissionRows: { gap: 0 },
  permRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  permRowBorder: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
  },
  permRowLabel: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    marginRight: Spacing.md,
  },
  permHint: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    marginTop: Spacing.sm,
  },
  savePermBtn: {
    height: 44,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.mdSm,
  },
  savePermBtnDisabled: { opacity: 0.5 },
  savePermBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  contactLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  deactivateBtn: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.mdSm,
    alignItems: "center",
    borderRadius: Radius.sm,
  },
  deactivateBtnText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.errorLight,
  },
});
