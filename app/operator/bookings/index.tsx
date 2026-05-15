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
import type { BookingStatus } from "@/types/database";

// ─── Raw DB row types ─────────────────────────────────────────────────────────

interface RawBookingRow {
  id: string;
  status: string;
  scheduled_at: string;
  estimated_duration_mins: number | null;
  crew_member_id: string | null;
  service_address: string | null;
  subtotal: number | null;
  total: number | null;
  tip_amount: number;
  notes: string | null;
  users: { full_name: string | null } | null;
  vehicles: { make: string | null; model: string | null; year: number | null; color: string | null } | null;
  service_packages: { name: string } | null;
  booking_contacts: { full_name: string | null; vehicle_make: string | null; vehicle_model: string | null; vehicle_year: number | null; vehicle_color: string | null } | null;
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

// ─── Screen types ─────────────────────────────────────────────────────────────

type ScreenState = "loading" | "fetch_error" | "empty" | "main";
type FilterChip = "all" | "today" | "upcoming" | "unassigned" | "completed";

interface BookingCard {
  id: string;
  status: BookingStatus;
  isUnassigned: boolean;
  scheduledAt: Date;
  timeLabel: string;
  dateLabel: string;
  customerName: string;
  vehicleDesc: string;
  packageName: string;
  crewMemberId: string | null;
  crewName: string | null;
  crewInitials: string | null;
  total: number | null;
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
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (d.getTime() - today.getTime()) / 86400000;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function statusBadgeConfig(status: BookingStatus, isUnassigned: boolean): {
  label: string;
  bg: string;
  color: string;
} {
  if (isUnassigned) {
    return { label: "Unassigned", bg: "rgba(217,119,6,0.08)", color: Colors.warningLight };
  }
  switch (status) {
    case "requested":   return { label: "Requested",   bg: "rgba(217,119,6,0.08)",  color: Colors.warningLight };
    case "confirmed":   return { label: "Confirmed",   bg: Colors.foamBlueSubtle,   color: Colors.foamBlue };
    case "in_progress": return { label: "In Progress", bg: Colors.foamBlueSubtle,   color: Colors.foamBlue };
    case "completed":   return { label: "Completed",   bg: "rgba(22,163,74,0.08)",  color: Colors.successLight };
    case "cancelled":   return { label: "Cancelled",   bg: Colors.light.bgSecondary, color: Colors.light.textSecondary };
    case "no_show":     return { label: "No Show",     bg: "rgba(220,38,38,0.08)",  color: Colors.errorLight };
    default:            return { label: status,        bg: Colors.light.bgSecondary, color: Colors.light.textSecondary };
  }
}

// ─── Booking card ─────────────────────────────────────────────────────────────

function BookingListCard({
  booking,
  onPress,
  onAssignPress,
}: {
  booking: BookingCard;
  onPress: () => void;
  onAssignPress: () => void;
}) {
  const badge = statusBadgeConfig(booking.status, booking.isUnassigned);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        Platform.OS === "web"
          ? ({ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.05)" } as object)
          : Shadows.light.level1,
      ]}
    >
      {/* Time + action button */}
      <View style={styles.cardTopRow}>
        <View>
          <Text style={styles.cardTime}>{booking.timeLabel}</Text>
          <Text style={styles.cardDate}>{booking.dateLabel}</Text>
        </View>
        {booking.isUnassigned ? (
          <TouchableOpacity onPress={onAssignPress} style={styles.assignBtn} activeOpacity={0.75}>
            <Text style={styles.assignBtnText}>Assign</Text>
          </TouchableOpacity>
        ) : (booking.status === "confirmed" || booking.status === "in_progress") ? (
          <TouchableOpacity onPress={onAssignPress} style={styles.reassignBtn} activeOpacity={0.75}>
            <Text style={styles.reassignBtnText}>Reassign</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.cardCustomer}>{booking.customerName}</Text>
      <Text style={styles.cardVehicle}>{booking.vehicleDesc}</Text>
      <Text style={styles.cardPackage}>{booking.packageName}</Text>

      {/* Footer: badge + price */}
      <View style={styles.cardFooter}>
        {booking.isUnassigned ? (
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        ) : booking.crewName ? (
          <View style={[styles.crewPill, { backgroundColor: Colors.foamBlueSubtle }]}>
            <View style={styles.crewPillAvatar}>
              <Text style={styles.crewPillAvatarText}>{(booking.crewInitials ?? "?").slice(0, 2)}</Text>
            </View>
            <Text style={[styles.crewPillName, { color: Colors.foamBlue }]}>
              {booking.crewName.split(" ")[0]}
            </Text>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        )}
        {booking.total != null && (
          <Text style={styles.cardTotal}>${booking.total.toFixed(0)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Filter chip data ─────────────────────────────────────────────────────────

const FILTER_CHIPS: { id: FilterChip; label: string }[] = [
  { id: "all",        label: "All" },
  { id: "today",      label: "Today" },
  { id: "upcoming",   label: "Upcoming" },
  { id: "unassigned", label: "Unassigned" },
  { id: "completed",  label: "Completed" },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OperatorBookingsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [activeFilter, setActiveFilter] = useState<FilterChip>("all");
  const [bookings, setBookings] = useState<BookingCard[]>([]);
  const [crewDisplayMap, setCrewDisplayMap] = useState<Record<string, { name: string; initials: string }>>({});

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

      const dId: string = (profileData as { id: string }).id;

      const [bookingsRes, membersRes] = await Promise.all([
        supabase
          .from("bookings")
          .select(
            "id, status, scheduled_at, estimated_duration_mins, crew_member_id," +
            "service_address, subtotal, total, tip_amount, notes," +
            "users!bookings_customer_id_fkey(full_name)," +
            "vehicles(make,model,year,color)," +
            "service_packages(name)," +
            "booking_contacts(full_name,vehicle_make,vehicle_model,vehicle_year,vehicle_color)"
          )
          .eq("detailer_id", dId)
          .order("scheduled_at", { ascending: false })
          .limit(300),
        supabase
          .from("team_members")
          .select("id, user_id, is_active")
          .eq("manager_id", dId),
      ]);

      const rawMembers: RawTeamMember[] = (membersRes.data as RawTeamMember[] | null) ?? [];

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

      const cMap: Record<string, { name: string; initials: string }> = {};
      for (const m of rawMembers) {
        const name = memberUserMap[m.user_id] ?? "Crew";
        cMap[m.id] = { name, initials: getInitials(name) };
      }
      setCrewDisplayMap(cMap);

      const rawBookings: RawBookingRow[] = (bookingsRes.data as RawBookingRow[] | null) ?? [];

      const cards: BookingCard[] = rawBookings.map((b) => {
        const veh = b.vehicles;
        const contact = b.booking_contacts;
        const vehicleDesc = veh
          ? [veh.year, veh.make, veh.model, veh.color].filter(Boolean).join(" ")
          : contact
          ? [contact.vehicle_year, contact.vehicle_make, contact.vehicle_model, contact.vehicle_color].filter(Boolean).join(" ") || "Vehicle (walk-in)"
          : "Vehicle";
        const scheduledAt = new Date(b.scheduled_at);
        const isUnassigned =
          (b.status === "confirmed" || b.status === "requested") && !b.crew_member_id;
        const crew = b.crew_member_id ? cMap[b.crew_member_id] : undefined;

        return {
          id: b.id,
          status: b.status as BookingStatus,
          isUnassigned,
          scheduledAt,
          timeLabel: formatTime(scheduledAt),
          dateLabel: formatDateShort(scheduledAt),
          customerName: b.users?.full_name ?? b.booking_contacts?.full_name ?? "Customer",
          vehicleDesc,
          packageName: b.service_packages?.name ?? "Service",
          crewMemberId: b.crew_member_id,
          crewName: crew?.name ?? null,
          crewInitials: crew?.initials ?? null,
          total: b.total ?? null,
        };
      });

      setBookings(cards);
      setScreenState(cards.length === 0 ? "empty" : "main");
    } catch (err) {
      console.warn("[OperatorBookings] fetchData error", err);
      setScreenState("fetch_error");
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Filter logic ──────────────────────────────────────────────────────────────
  const now = new Date();

  const filteredBookings = bookings.filter((b) => {
    switch (activeFilter) {
      case "all":
        return true;
      case "today":
        return isToday(b.scheduledAt);
      case "upcoming":
        return (
          b.scheduledAt >= now &&
          (b.status === "confirmed" || b.status === "requested" || b.status === "in_progress")
        );
      case "unassigned":
        return b.isUnassigned;
      case "completed":
        return b.status === "completed";
      default:
        return true;
    }
  });

  // Count badges for chips
  const unassignedCount = bookings.filter((b) => b.isUnassigned).length;
  const todayCount = bookings.filter((b) => isToday(b.scheduledAt)).length;

  function chipCount(chip: FilterChip): number | null {
    if (chip === "unassigned") return unassignedCount > 0 ? unassignedCount : null;
    if (chip === "today") return todayCount > 0 ? todayCount : null;
    return null;
  }

  function handleChipPress(chip: FilterChip) {
    if (chip === "unassigned") {
      router.push("/operator/bookings/unassigned");
      return;
    }
    setActiveFilter(chip);
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (screenState === "loading") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={Colors.foamBlue} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (screenState === "fetch_error") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerFill}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.errorLight} />
          <Text style={styles.errorText}>Couldn't load bookings</Text>
          <TouchableOpacity onPress={fetchData} style={styles.retryBtn} activeOpacity={0.75}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Bookings</Text>
          <TouchableOpacity
            onPress={() => router.push("/operator/bookings/new")}
            style={styles.newBookingBtn}
            activeOpacity={0.75}
          >
            <Ionicons name="add" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Status filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_CHIPS.map((chip) => {
            const isActive = activeFilter === chip.id;
            const count = chipCount(chip.id);
            return (
              <TouchableOpacity
                key={chip.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => handleChipPress(chip.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {chip.label}
                </Text>
                {count != null && (
                  <View
                    style={[
                      styles.chipCountBadge,
                      { backgroundColor: isActive ? Colors.white : chip.id === "unassigned" ? Colors.warningLight : Colors.foamBlue },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipCountText,
                        { color: isActive ? (chip.id === "unassigned" ? Colors.warningLight : Colors.foamBlue) : Colors.white },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Body ── */}
      {(screenState === "empty" || filteredBookings.length === 0) ? (
        <View style={styles.centerFill}>
          <Ionicons name="clipboard-outline" size={40} color={Colors.light.textTertiary} />
          <Text style={styles.emptyHeadline}>
            {activeFilter === "unassigned"
              ? "All jobs are assigned"
              : activeFilter === "completed"
              ? "No completed bookings yet"
              : activeFilter === "today"
              ? "Nothing scheduled today"
              : activeFilter === "upcoming"
              ? "No upcoming bookings"
              : "No bookings yet"}
          </Text>
          <Text style={styles.emptyBody}>
            {activeFilter === "all" || activeFilter === "upcoming"
              ? "Tap + to create a manual booking."
              : "Check a different filter above."}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredBookings.map((b) => (
            <BookingListCard
              key={b.id}
              booking={b}
              onPress={() => router.push(`/operator/bookings/${b.id}`)}
              onAssignPress={() => router.push(`/operator/bookings/assign?bookingId=${b.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  centerFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  header: {
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
    paddingTop: Spacing.md,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.mdSm,
  },
  headerTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 22,
    color: Colors.light.textPrimary,
  },
  newBookingBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  filterScroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    flexDirection: "row",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.mdSm,
    height: 34,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.foamBlue,
    borderColor: Colors.foamBlue,
  },
  filterChipText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  filterChipTextActive: { color: Colors.white },
  chipCountBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  chipCountText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 10,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 120,
    gap: Spacing.mdSm,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    padding: Spacing.md,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  cardTime: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
  },
  cardDate: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  assignBtn: {
    height: 32,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  assignBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyS,
    color: Colors.foamBlue,
  },
  reassignBtn: {
    height: 32,
    paddingHorizontal: Spacing.mdSm,
    alignItems: "center",
    justifyContent: "center",
  },
  reassignBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyS,
    color: Colors.foamBlue,
  },
  cardCustomer: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    marginBottom: 2,
  },
  cardVehicle: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  cardPackage: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.mdSm,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.mdSm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  badge: {
    paddingHorizontal: Spacing.mdSm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  badgeText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
  },
  crewPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.mdSm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  crewPillAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  crewPillAvatarText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 7,
    color: Colors.white,
  },
  crewPillName: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
  },
  cardTotal: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
  errorText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: Spacing.sm,
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
