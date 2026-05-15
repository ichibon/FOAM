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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";

// ─── Raw DB row types ─────────────────────────────────────────────────────────

interface RawUnassignedBooking {
  id: string;
  status: string;
  scheduled_at: string;
  estimated_duration_mins: number | null;
  service_address: string | null;
  subtotal: number | null;
  total: number | null;
  users: { full_name: string | null } | null;
  vehicles: { make: string | null; model: string | null; year: number | null; color: string | null } | null;
  service_packages: { name: string; base_price: number } | null;
}

interface RawTeamMember {
  id: string;
  user_id: string;
  is_active: boolean;
}

interface RawUser {
  id: string;
  full_name: string | null;
}

interface RawCrewBooking {
  crew_member_id: string | null;
  scheduled_at: string;
  estimated_duration_mins: number | null;
}

// ─── Screen types ─────────────────────────────────────────────────────────────

type ScreenState = "loading" | "fetch_error" | "empty" | "main";
type DateFilter = "all" | "today" | "week";

interface CrewAvailability {
  id: string;
  name: string;
  initials: string;
  isAvailable: boolean;
}

interface UnassignedCard {
  id: string;
  scheduledAt: Date;
  timeLabel: string;
  dateLabel: string;
  durationLabel: string;
  customerName: string;
  vehicleDesc: string;
  packageName: string;
  price: number | null;
  address: string | null;
  crewAvailability: CrewAvailability[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatTime(date: Date): string {
  let h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatDuration(mins: number | null): string {
  if (!mins) return "";
  if (mins < 60) return `~${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `~${h}.${Math.round((m / 60) * 10)} hrs` : `~${h} hr${h > 1 ? "s" : ""}`;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isThisWeek(date: Date): boolean {
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 3600000);
  return date >= now && date <= weekEnd;
}

function hasTimeConflict(
  targetDate: Date,
  targetDurMins: number | null,
  crewBookings: RawCrewBooking[]
): boolean {
  const targetStart = targetDate.getTime();
  const targetEnd = targetStart + (targetDurMins ?? 120) * 60000;

  return crewBookings.some((b) => {
    const bStart = new Date(b.scheduled_at).getTime();
    const bEnd = bStart + (b.estimated_duration_mins ?? 120) * 60000;
    return bStart < targetEnd && bEnd > targetStart;
  });
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function UnassignedJobsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [jobs, setJobs] = useState<UnassignedCard[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setScreenState("loading");
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();

      const { data: profileData } = await supabase
        .from("detailer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profileData) {
        setScreenState("empty");
        return;
      }

      const detailerId: string = (profileData as { id: string }).id;

      const [bookingsRes, membersRes] = await Promise.all([
        supabase
          .from("bookings")
          .select(
            "id, status, scheduled_at, estimated_duration_mins, service_address, subtotal, total," +
            "users!bookings_customer_id_fkey(full_name)," +
            "vehicles(make,model,year,color)," +
            "service_packages(name,base_price)"
          )
          .eq("detailer_id", detailerId)
          .in("status", ["confirmed", "requested"])
          .is("crew_member_id", null)
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at"),
        supabase
          .from("team_members")
          .select("id, user_id, is_active")
          .eq("manager_id", detailerId)
          .eq("is_active", true),
      ]);

      const rawBookings: RawUnassignedBooking[] =
        (bookingsRes.data as RawUnassignedBooking[] | null) ?? [];
      const rawMembers: RawTeamMember[] =
        (membersRes.data as RawTeamMember[] | null) ?? [];

      // Fetch user names for team members
      let memberUserMap: Record<string, string> = {};
      if (rawMembers.length > 0) {
        const uids = rawMembers.map((m) => m.user_id);
        const { data: memberUsers } = await supabase
          .from("users")
          .select("id, full_name")
          .in("id", uids);
        for (const u of (memberUsers as RawUser[] | null) ?? []) {
          if (u.full_name) memberUserMap[u.id] = u.full_name;
        }
      }

      // Fetch all upcoming crew bookings in one shot (for conflict detection)
      const memberIds = rawMembers.map((m) => m.id);
      let crewBookingsMap: Record<string, RawCrewBooking[]> = {};

      if (memberIds.length > 0) {
        const { data: crewBookings } = await supabase
          .from("bookings")
          .select("crew_member_id, scheduled_at, estimated_duration_mins")
          .in("crew_member_id", memberIds)
          .in("status", ["confirmed", "in_progress", "requested"])
          .gte("scheduled_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

        for (const b of (crewBookings as RawCrewBooking[] | null) ?? []) {
          if (!b.crew_member_id) continue;
          if (!crewBookingsMap[b.crew_member_id]) crewBookingsMap[b.crew_member_id] = [];
          crewBookingsMap[b.crew_member_id].push(b);
        }
      }

      const cards: UnassignedCard[] = rawBookings.map((b) => {
        const scheduledAt = new Date(b.scheduled_at);
        const veh = b.vehicles;
        const vehicleDesc = veh
          ? [veh.year, veh.make, veh.model, veh.color].filter(Boolean).join(" ")
          : "Vehicle";

        const crewAvailability: CrewAvailability[] = rawMembers.map((m) => {
          const name = memberUserMap[m.user_id] ?? "Crew";
          const conflict = hasTimeConflict(
            scheduledAt,
            b.estimated_duration_mins,
            crewBookingsMap[m.id] ?? []
          );
          return {
            id: m.id,
            name: name.split(" ")[0],
            initials: getInitials(name),
            isAvailable: !conflict,
          };
        });

        return {
          id: b.id,
          scheduledAt,
          timeLabel: formatTime(scheduledAt),
          dateLabel: formatDateShort(scheduledAt),
          durationLabel: formatDuration(b.estimated_duration_mins),
          customerName: b.users?.full_name ?? "Customer",
          vehicleDesc,
          packageName: b.service_packages?.name ?? "Service",
          price: b.total ?? b.subtotal ?? b.service_packages?.base_price ?? null,
          address: b.service_address,
          crewAvailability,
        };
      });

      setJobs(cards);
      setScreenState(cards.length === 0 ? "empty" : "main");
    } catch (err) {
      console.warn("[UnassignedJobs] fetchData error", err);
      setScreenState("fetch_error");
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredJobs = jobs.filter((j) => {
    if (dateFilter === "today") return isToday(j.scheduledAt);
    if (dateFilter === "week") return isThisWeek(j.scheduledAt);
    return true;
  });

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (screenState === "loading") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
          </TouchableOpacity>
          <View style={styles.navTitleRow}>
            <Text style={styles.navTitle}>Unassigned Jobs</Text>
          </View>
          <View style={styles.navSpacer} />
        </View>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={Colors.foamBlue} />
        </View>
      </SafeAreaView>
    );
  }

  const unassignedCount = jobs.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Nav header */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <View style={styles.navTitleRow}>
          <Text style={styles.navTitle}>Unassigned Jobs</Text>
          {unassignedCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{unassignedCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.navSpacer} />
      </View>

      {/* Filter pills */}
      <View style={styles.filterRow}>
        {(["all", "today", "week"] as DateFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, dateFilter === f && styles.filterPillActive]}
            onPress={() => setDateFilter(f)}
            activeOpacity={0.75}
          >
            <Text
              style={[styles.filterPillText, dateFilter === f && styles.filterPillTextActive]}
            >
              {f === "all" ? "All" : f === "today" ? "Today" : "This Week"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Body */}
      {screenState === "fetch_error" ? (
        <View style={styles.centerFill}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.errorLight} />
          <Text style={styles.errorText}>Couldn't load unassigned jobs</Text>
          <TouchableOpacity onPress={fetchData} style={styles.retryBtn} activeOpacity={0.75}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : screenState === "empty" || filteredJobs.length === 0 ? (
        <View style={styles.centerFill}>
          <Ionicons name="checkmark-circle-outline" size={40} color={Colors.successLight} />
          <Text style={styles.emptyHeadline}>All caught up</Text>
          <Text style={styles.emptyBody}>No unassigned jobs right now.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredJobs.map((job) => (
            <UnassignedJobCard
              key={job.id}
              job={job}
              onAssign={() =>
                router.push(`/operator/bookings/assign?bookingId=${job.id}`)
              }
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Unassigned Job Card ──────────────────────────────────────────────────────

function UnassignedJobCard({
  job,
  onAssign,
}: {
  job: UnassignedCard;
  onAssign: () => void;
}) {
  return (
    <View
      style={[
        styles.card,
        Platform.OS === "web"
          ? ({ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.05)" } as object)
          : Shadows.light.level2,
      ]}
    >
      {/* Top row */}
      <View style={styles.cardTopRow}>
        <View>
          <Text style={styles.cardDateTime}>
            {job.dateLabel} · {job.timeLabel}
          </Text>
          {job.durationLabel !== "" && (
            <Text style={styles.cardDuration}>{job.durationLabel}</Text>
          )}
        </View>
        <View style={styles.unassignedBadge}>
          <Text style={styles.unassignedBadgeText}>Unassigned</Text>
        </View>
      </View>

      {/* Customer + vehicle */}
      <Text style={styles.cardCustomer}>{job.customerName}</Text>
      <View style={styles.vehicleRow}>
        <Ionicons name="car-outline" size={14} color={Colors.light.textTertiary} />
        <Text style={styles.cardVehicle}>{job.vehicleDesc}</Text>
      </View>

      {/* Service + price */}
      <View style={styles.serviceRow}>
        <Text style={styles.cardPackage}>{job.packageName}</Text>
        {job.price != null && (
          <Text style={styles.cardPrice}>${job.price.toFixed(0)}</Text>
        )}
      </View>

      {/* Address */}
      {job.address && (
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={13} color={Colors.light.textTertiary} />
          <Text style={styles.addressText}>{job.address}</Text>
        </View>
      )}

      {/* Crew compatibility */}
      {job.crewAvailability.length > 0 && (
        <View style={styles.crewSection}>
          <Text style={styles.crewSectionLabel}>WHO CAN TAKE THIS?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.crewScroll}
          >
            {job.crewAvailability.map((m) => (
              <View
                key={m.id}
                style={[styles.crewChip, !m.isAvailable && styles.crewChipUnavailable]}
              >
                <View
                  style={[
                    styles.crewChipAvatar,
                    { backgroundColor: m.isAvailable ? Colors.foamBlue : Colors.light.borderDefault },
                  ]}
                >
                  <Text style={styles.crewChipAvatarText}>{m.initials.slice(0, 2)}</Text>
                </View>
                <Text
                  style={[
                    styles.crewChipName,
                    !m.isAvailable && styles.crewChipNameUnavailable,
                  ]}
                >
                  {m.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* CTA */}
      <TouchableOpacity style={styles.assignBtn} onPress={onAssign} activeOpacity={0.8}>
        <Text style={styles.assignBtnText}>Assign to Crew</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  centerFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.mdSm,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  navTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.h4,
    color: Colors.light.textPrimary,
  },
  countBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.warningLight,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 11,
    color: Colors.white,
  },
  navSpacer: { width: 32 },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.bgPrimary,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.surface,
  },
  filterPillActive: {
    backgroundColor: Colors.foamBlue,
    borderColor: Colors.foamBlue,
  },
  filterPillText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  filterPillTextActive: {
    color: Colors.white,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 120,
    gap: Spacing.mdSm,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warningLight,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    borderRightColor: Colors.light.borderSubtle,
    borderBottomColor: Colors.light.borderSubtle,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardDateTime: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  cardDuration: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  unassignedBadge: {
    backgroundColor: "rgba(217,119,6,0.08)",
    paddingHorizontal: Spacing.mdSm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  unassignedBadgeText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.warningLight,
  },
  cardCustomer: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.h4,
    color: Colors.light.textPrimary,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardVehicle: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardPackage: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
  },
  cardPrice: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.foamBlue,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  addressText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  crewSection: {
    paddingTop: Spacing.mdSm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    gap: Spacing.sm,
  },
  crewSectionLabel: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
  },
  crewScroll: {
    gap: Spacing.sm,
    paddingBottom: 2,
  },
  crewChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.surface,
    paddingLeft: 4,
    paddingRight: Spacing.mdSm,
    paddingVertical: 4,
  },
  crewChipUnavailable: {
    backgroundColor: Colors.light.bgSecondary,
    opacity: 0.6,
  },
  crewChipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  crewChipAvatarText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 9,
    color: Colors.white,
  },
  crewChipName: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
    color: Colors.light.textPrimary,
  },
  crewChipNameUnavailable: {
    color: Colors.light.textTertiary,
    textDecorationLine: "line-through",
  },
  assignBtn: {
    height: 44,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  assignBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
  errorText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.mdSm,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
  },
  retryBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  emptyHeadline: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.h4,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    textAlign: "center",
    maxWidth: 260,
  },
});
