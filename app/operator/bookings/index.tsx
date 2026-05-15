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
type Segment = "upcoming" | "past";
type FilterChip = "all" | string; // string = team_member id

interface CrewChip {
  id: string;
  name: string;
  initials: string;
}

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
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function isUpcoming(date: Date): boolean {
  return date >= new Date(new Date().setHours(0, 0, 0, 0));
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
    case "requested":
      return { label: "Requested", bg: "rgba(217,119,6,0.08)", color: Colors.warningLight };
    case "confirmed":
      return { label: "Confirmed", bg: Colors.foamBlueSubtle, color: Colors.foamBlue };
    case "in_progress":
      return { label: "In Progress", bg: Colors.foamBlueSubtle, color: Colors.foamBlue };
    case "completed":
      return { label: "Completed", bg: "rgba(22,163,74,0.08)", color: Colors.successLight };
    case "cancelled":
      return { label: "Cancelled", bg: Colors.light.bgSecondary, color: Colors.light.textSecondary };
    case "no_show":
      return { label: "No Show", bg: "rgba(220,38,38,0.08)", color: Colors.errorLight };
    default:
      return { label: status, bg: Colors.light.bgSecondary, color: Colors.light.textSecondary };
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BookingListCard({
  booking,
  crewName,
  crewInitials,
  onPress,
  onAssignPress,
}: {
  booking: BookingCard;
  crewName: string | null;
  crewInitials: string | null;
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
          ? { boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.05)" } as object
          : Shadows.light.level1,
      ]}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.cardTimeBlock}>
          <Text style={styles.cardTime}>{booking.timeLabel}</Text>
          <Text style={styles.cardDate}>{booking.dateLabel}</Text>
        </View>
        {booking.isUnassigned ? (
          <TouchableOpacity
            onPress={onAssignPress}
            style={styles.assignBtn}
            activeOpacity={0.75}
          >
            <Text style={styles.assignBtnText}>Assign</Text>
          </TouchableOpacity>
        ) : booking.status === "confirmed" || booking.status === "in_progress" ? (
          <TouchableOpacity onPress={onAssignPress} style={styles.reassignBtn} activeOpacity={0.75}>
            <Text style={styles.reassignBtnText}>Reassign</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.cardCustomer}>{booking.customerName}</Text>
      <Text style={styles.cardVehicle}>{booking.vehicleDesc}</Text>
      <Text style={styles.cardPackage}>{booking.packageName}</Text>

      <View style={styles.cardFooter}>
        {booking.isUnassigned ? (
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        ) : crewName ? (
          <View style={[styles.crewPill, { backgroundColor: Colors.foamBlueSubtle }]}>
            <View style={styles.crewPillAvatar}>
              <Text style={styles.crewPillAvatarText}>{(crewInitials ?? "?").slice(0, 2)}</Text>
            </View>
            <Text style={[styles.crewPillName, { color: Colors.foamBlue }]}>
              {crewName.split(" ")[0]}
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OperatorBookingsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [segment, setSegment] = useState<Segment>("upcoming");
  const [activeFilter, setActiveFilter] = useState<FilterChip>("all");
  const [bookings, setBookings] = useState<BookingCard[]>([]);
  const [crewChips, setCrewChips] = useState<CrewChip[]>([]);
  const [crewDisplayMap, setCrewDisplayMap] = useState<Record<string, { name: string; initials: string }>>({});
  const [detailerId, setDetailerId] = useState<string | null>(null);
  const [unassignedCount, setUnassignedCount] = useState(0);

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
      setDetailerId(dId);

      const [bookingsRes, membersRes] = await Promise.all([
        supabase
          .from("bookings")
          .select(
            "id, status, scheduled_at, estimated_duration_mins, crew_member_id," +
            "service_address, subtotal, total, tip_amount, notes," +
            "users!bookings_customer_id_fkey(full_name)," +
            "vehicles(make,model,year,color)," +
            "service_packages(name)"
          )
          .eq("detailer_id", dId)
          .order("scheduled_at", { ascending: false })
          .limit(200),
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
      const chips: CrewChip[] = [];
      for (const m of rawMembers) {
        const name = memberUserMap[m.user_id] ?? "Crew";
        const initials = getInitials(name);
        cMap[m.id] = { name, initials };
        chips.push({ id: m.id, name: name.split(" ")[0], initials });
      }
      setCrewDisplayMap(cMap);
      setCrewChips(chips);

      const rawBookings: RawBookingRow[] = (bookingsRes.data as RawBookingRow[] | null) ?? [];

      const cards: BookingCard[] = rawBookings.map((b) => {
        const veh = b.vehicles;
        const vehicleDesc = veh
          ? [veh.year, veh.make, veh.model, veh.color].filter(Boolean).join(" ")
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
          customerName: b.users?.full_name ?? "Customer",
          vehicleDesc,
          packageName: b.service_packages?.name ?? "Service",
          crewMemberId: b.crew_member_id,
          crewName: crew?.name ?? null,
          crewInitials: crew?.initials ?? null,
          total: b.total ?? null,
        };
      });

      setBookings(cards);
      setUnassignedCount(cards.filter((c) => c.isUnassigned).length);
      setScreenState(cards.length === 0 ? "empty" : "main");
    } catch (err) {
      console.warn("[OperatorBookings] fetchData error", err);
      setScreenState("fetch_error");
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredBookings = bookings.filter((b) => {
    const segmentMatch =
      segment === "upcoming"
        ? isUpcoming(b.scheduledAt)
        : !isUpcoming(b.scheduledAt);
    const crewMatch =
      activeFilter === "all" || b.crewMemberId === activeFilter;
    return segmentMatch && crewMatch;
  });

  // ── Loading ────────────────────────────────────────────────────────────────
  if (screenState === "loading") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={Colors.foamBlue} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Bookings</Text>
          <View style={styles.headerActions}>
            {unassignedCount > 0 && (
              <TouchableOpacity
                onPress={() => router.push("/operator/bookings/unassigned")}
                style={styles.unassignedBadgeBtn}
                activeOpacity={0.75}
              >
                <Text style={styles.unassignedBadgeText}>{unassignedCount} unassigned</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => router.push("/operator/bookings/new")}
              style={styles.newBookingBtn}
              activeOpacity={0.75}
            >
              <Ionicons name="add" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming / Past segment */}
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segmentBtn, segment === "upcoming" && styles.segmentBtnActive]}
            onPress={() => setSegment("upcoming")}
            activeOpacity={0.75}
          >
            <Text
              style={[styles.segmentBtnText, segment === "upcoming" && styles.segmentBtnTextActive]}
            >
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, segment === "past" && styles.segmentBtnActive]}
            onPress={() => setSegment("past")}
            activeOpacity={0.75}
          >
            <Text
              style={[styles.segmentBtnText, segment === "past" && styles.segmentBtnTextActive]}
            >
              Past
            </Text>
          </TouchableOpacity>
        </View>

        {/* Crew filter chips */}
        {crewChips.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === "all" && styles.filterChipActive]}
              onPress={() => setActiveFilter("all")}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === "all" && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {crewChips.map((chip) => (
              <TouchableOpacity
                key={chip.id}
                style={[styles.filterChip, activeFilter === chip.id && styles.filterChipActive]}
                onPress={() => setActiveFilter(chip.id)}
                activeOpacity={0.75}
              >
                <View style={styles.filterChipAvatar}>
                  <Text style={styles.filterChipAvatarText}>{chip.initials.slice(0, 2)}</Text>
                </View>
                <Text
                  style={[
                    styles.filterChipText,
                    activeFilter === chip.id && styles.filterChipTextActive,
                  ]}
                >
                  {chip.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Body */}
      {screenState === "empty" || filteredBookings.length === 0 ? (
        <View style={styles.centerFill}>
          <Ionicons name="clipboard-outline" size={40} color={Colors.light.textTertiary} />
          <Text style={styles.emptyHeadline}>No bookings yet</Text>
          <Text style={styles.emptyBody}>
            {segment === "upcoming"
              ? "No upcoming bookings. Tap + to create one."
              : "No past bookings to show."}
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
              crewName={b.crewName}
              crewInitials={b.crewInitials}
              onPress={() => router.push(`/operator/bookings/${b.id}`)}
              onAssignPress={() =>
                router.push(`/operator/bookings/assign?bookingId=${b.id}`)
              }
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.bgPrimary,
  },
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  unassignedBadgeBtn: {
    backgroundColor: "rgba(217,119,6,0.08)",
    paddingHorizontal: Spacing.mdSm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
  unassignedBadgeText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.caption,
    color: Colors.warningLight,
  },
  newBookingBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.mdSm,
    backgroundColor: Colors.light.bgSecondary,
    borderRadius: Radius.sm,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: Colors.light.surface,
    ...Platform.select({
      web: { boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08)" },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  segmentBtnText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  segmentBtnTextActive: {
    fontFamily: Typography.bodySemiBold,
    color: Colors.light.textPrimary,
  },
  filterScroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.mdSm,
    gap: Spacing.sm,
    flexDirection: "row",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.mdSm,
    height: 32,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.foamBlue,
    borderColor: Colors.foamBlue,
  },
  filterChipAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipAvatarText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 8,
    color: Colors.white,
  },
  filterChipText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
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
  cardTimeBlock: {
    gap: 2,
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
