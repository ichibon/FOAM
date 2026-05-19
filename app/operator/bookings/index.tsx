import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import type { BookingStatus } from "@/types/database";
import {
  CalJob,
  CrewMember as CalCrewMember,
  DayView,
  WeekView,
  addDays,
  getWeekStart,
  isSameDay,
  formatDayLabel,
  formatWeekRange,
  crewColor,
} from "@/components/TeamCalendarDrawer";

// ─── Raw DB row types ─────────────────────────────────────────────────────────

interface RawBookingRow {
  id: string;
  status: string;
  scheduled_at: string;
  estimated_duration_mins: number | null;
  crew_member_id: string | null;
  customer_id: string | null;
  order_id: string | null;
  service_address: string | null;
  subtotal: number | null;
  total: number | null;
  tip_amount: number;
  notes: string | null;
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
type ViewMode = "list" | "calendar";
type Segment = "upcoming" | "past";

type CrewMember = CalCrewMember;

interface BookingCard {
  id: string;
  orderId: string | null;
  vehicleCount: number;
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

function groupBookingsByDate(
  bookings: BookingCard[]
): { dateKey: string; label: string; items: BookingCard[] }[] {
  const map = new Map<string, { label: string; items: BookingCard[] }>();
  for (const b of bookings) {
    const d = b.scheduledAt;
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!map.has(dateKey)) {
      map.set(dateKey, { label: formatDateShort(d), items: [] });
    }
    map.get(dateKey)!.items.push(b);
  }
  return [...map.entries()].map(([dateKey, v]) => ({ dateKey, ...v }));
}

function statusBadgeConfig(status: BookingStatus): { label: string; bg: string; color: string } {
  switch (status) {
    case "requested":   return { label: "Upcoming",     bg: Colors.foamBlueSubtle,   color: Colors.foamBlue };
    case "confirmed":   return { label: "Upcoming",    bg: Colors.foamBlueSubtle,   color: Colors.foamBlue };
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
  onDeletePress,
}: {
  booking: BookingCard;
  onPress: () => void;
  onAssignPress: () => void;
  onDeletePress?: () => void;
}) {
  const isCancelled = booking.status === "cancelled";
  const isPast = booking.status === "completed" || booking.status === "no_show";
  const badge = statusBadgeConfig(booking.status);

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
      {/* Time row + action button */}
      <View style={styles.cardTopRow}>
        <View style={styles.cardTimeBlock}>
          {isPast ? (
            <Text style={styles.cardTimePast}>{badge.label} · {booking.timeLabel}</Text>
          ) : (
            <View style={styles.cardTimeBadgeRow}>
              <Text style={isCancelled ? styles.cardTimePast : styles.cardTime}>{booking.timeLabel}</Text>
              {isCancelled ? (
                <View style={[styles.inlineBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.inlineBadgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              ) : booking.isUnassigned ? (
                <View style={[styles.inlineBadge, { backgroundColor: "rgba(217,119,6,0.08)" }]}>
                  <Text style={[styles.inlineBadgeText, { color: Colors.warningLight }]}>Unassigned</Text>
                </View>
              ) : (
                <View style={[styles.inlineBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.inlineBadgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {isCancelled ? (
          <TouchableOpacity onPress={onDeletePress} style={styles.textActionBtn} activeOpacity={0.75}>
            <Ionicons name="trash-outline" size={18} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        ) : booking.isUnassigned ? (
          <TouchableOpacity onPress={onAssignPress} style={styles.assignBtn} activeOpacity={0.75}>
            <Text style={styles.assignBtnText}>Assign</Text>
          </TouchableOpacity>
        ) : isPast ? (
          <TouchableOpacity onPress={onPress} style={styles.textActionBtn} activeOpacity={0.75}>
            <Text style={styles.textActionBtnSecondary}>View</Text>
          </TouchableOpacity>
        ) : (booking.status === "confirmed" || booking.status === "in_progress") && booking.crewMemberId ? (
          <TouchableOpacity onPress={onAssignPress} style={styles.textActionBtn} activeOpacity={0.75}>
            <Text style={styles.textActionBtnBlue}>Reassign</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.cardCustomer}>{booking.customerName}</Text>
      <Text style={styles.cardVehicle}>{booking.vehicleDesc}</Text>
      {booking.vehicleCount > 1 && (
        <View style={styles.vehicleCountPill}>
          <Text style={styles.vehicleCountPillText}>{booking.vehicleCount} vehicles</Text>
        </View>
      )}
      <Text style={styles.cardPackage}>{booking.packageName}</Text>

      {/* Footer: crew chip or unassigned badge + optional total */}
      <View style={styles.cardFooter}>
        {booking.isUnassigned ? (
          <View style={[styles.footerBadge, { backgroundColor: "rgba(217,119,6,0.08)" }]}>
            <Text style={[styles.footerBadgeText, { color: Colors.warningLight }]}>Unassigned</Text>
          </View>
        ) : booking.crewName ? (
          <View style={styles.crewPill}>
            <View style={styles.crewPillAvatar}>
              <Text style={styles.crewPillAvatarText}>{(booking.crewInitials ?? "?").slice(0, 2)}</Text>
            </View>
            <Text style={styles.crewPillName}>{booking.crewName.split(" ")[0]}</Text>
          </View>
        ) : (
          <View style={[styles.footerBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.footerBadgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        )}
        {booking.total != null && booking.total > 0 && (
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
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [segment, setSegment] = useState<Segment>("upcoming");
  const [crewFilter, setCrewFilter] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingCard[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [detailerId, setDetailerId] = useState<string>("");

  // Calendar tab state
  const [calDate, setCalDate] = useState<Date>(() => new Date());
  const [calWeekStart, setCalWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [calViewMode, setCalViewMode] = useState<"day" | "week">("day");
  const [calFilterCrewId, setCalFilterCrewId] = useState<string | null>(null);

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
            "id, status, scheduled_at, estimated_duration_mins, crew_member_id, customer_id, order_id," +
            "service_address, subtotal, total, tip_amount, notes," +
            "vehicles(make,model,year,color)," +
            "service_packages(name)," +
            "booking_contacts(full_name,vehicle_make,vehicle_model,vehicle_year,vehicle_color)"
          )
          .eq("detailer_id", dId)
          .order("scheduled_at", { ascending: true })
          .limit(300),
        supabase
          .from("team_members")
          .select("id, user_id, is_active")
          .eq("manager_id", dId)
          .eq("is_active", true),
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
      const crewList: CrewMember[] = [];
      for (const m of rawMembers) {
        const name = memberUserMap[m.user_id] ?? "Crew";
        const initials = getInitials(name);
        cMap[m.id] = { name, initials };
        crewList.push({ id: m.id, name, initials });
      }
      setCrewMembers(crewList);

      // Fallback: order_id migration not yet applied — retry without that column
      let bookingsData = bookingsRes.data;
      let usedOrderIdFallback = false;
      if (bookingsRes.error?.code === "42703") {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("bookings")
          .select(
            "id, status, scheduled_at, estimated_duration_mins, crew_member_id, customer_id," +
            "service_address, subtotal, total, tip_amount, notes," +
            "vehicles(make,model,year,color)," +
            "service_packages(name)," +
            "booking_contacts(full_name,vehicle_make,vehicle_model,vehicle_year,vehicle_color)"
          )
          .eq("detailer_id", dId)
          .order("scheduled_at", { ascending: true })
          .limit(300);
        if (fallbackError) {
          setScreenState("fetch_error");
          return;
        }
        bookingsData = fallbackData;
        usedOrderIdFallback = true;
      }

      // Normalize order_id to null on fallback rows so grouping logic sees a clean null
      const rawBookings: RawBookingRow[] = ((bookingsData as RawBookingRow[] | null) ?? []).map(
        (row) => (usedOrderIdFallback ? { ...row, order_id: null } : row)
      );

      // Batch-fetch registered customer names where booking_contacts is not set
      const registeredIds = [
        ...new Set(
          rawBookings
            .filter((b) => b.customer_id && !b.booking_contacts)
            .map((b) => b.customer_id!)
        ),
      ];
      const userNameMap: Record<string, string> = {};
      if (registeredIds.length > 0) {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, full_name")
          .in("id", registeredIds);
        for (const u of (usersData as RawUser[] | null) ?? []) {
          if (u.full_name) userNameMap[u.id] = u.full_name;
        }
      }

      // Helper: build a vehicle description string from a raw booking row
      function rowVehicleDesc(b: RawBookingRow): string {
        const veh = b.vehicles;
        const contact = b.booking_contacts;
        return veh
          ? [veh.year, veh.make, veh.model, veh.color].filter(Boolean).join(" ") || "Vehicle"
          : contact
          ? [contact.vehicle_year, contact.vehicle_make, contact.vehicle_model, contact.vehicle_color].filter(Boolean).join(" ") || "Vehicle"
          : "Vehicle";
      }

      // Helper: map one raw row to a BookingCard (vehicleCount = 1, orderId carried through)
      function mapRow(b: RawBookingRow): BookingCard {
        const scheduledAt = new Date(b.scheduled_at);
        const isUnassigned =
          (b.status === "confirmed" || b.status === "requested") && !b.crew_member_id;
        const crew = b.crew_member_id ? cMap[b.crew_member_id] : undefined;
        const contact = b.booking_contacts;
        const customerName =
          contact?.full_name ??
          (b.customer_id ? userNameMap[b.customer_id] ?? "Customer" : "Customer");
        return {
          id: b.id,
          orderId: b.order_id,
          vehicleCount: 1,
          status: b.status as BookingStatus,
          isUnassigned,
          scheduledAt,
          timeLabel: formatTime(scheduledAt),
          dateLabel: formatDateShort(scheduledAt),
          customerName,
          vehicleDesc: rowVehicleDesc(b),
          packageName: b.service_packages?.name ?? "Service",
          crewMemberId: b.crew_member_id,
          crewName: crew?.name ?? null,
          crewInitials: crew?.initials ?? null,
          total: b.total ?? null,
        };
      }

      // Group rows that share an order_id into a single card
      const orderMap = new Map<string, RawBookingRow[]>();
      const soloRows: RawBookingRow[] = [];
      for (const b of rawBookings) {
        if (b.order_id) {
          const group = orderMap.get(b.order_id) ?? [];
          group.push(b);
          orderMap.set(b.order_id, group);
        } else {
          soloRows.push(b);
        }
      }

      const soloCards: BookingCard[] = soloRows.map(mapRow);

      const groupedCards: BookingCard[] = [...orderMap.values()].map((rows) => {
        const primary = rows[0];
        const base = mapRow(primary);
        const vehicleDescs = rows.map((r) => {
          const v = r.vehicles;
          const c = r.booking_contacts;
          return v
            ? [v.year, v.make, v.model].filter(Boolean).join(" ") || "Vehicle"
            : c
            ? [c.vehicle_year, c.vehicle_make, c.vehicle_model].filter(Boolean).join(" ") || "Vehicle"
            : "Vehicle";
        });
        const allPackageNames = [...new Set(rows.map((r) => r.service_packages?.name).filter(Boolean))];
        const combinedTotal = rows.reduce((sum, r) => sum + (r.total ?? 0), 0);
        return {
          ...base,
          vehicleDesc: vehicleDescs.join(" · "),
          vehicleCount: rows.length,
          packageName: allPackageNames.length === 1 ? (allPackageNames[0] as string) : "Multiple services",
          total: combinedTotal > 0 ? combinedTotal : null,
        };
      });

      const cards: BookingCard[] = [...soloCards, ...groupedCards].sort(
        (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()
      );

      setBookings(cards);
      setScreenState(cards.length === 0 ? "empty" : "main");
    } catch (err) {
      console.warn("[OperatorBookings] fetchData error", err);
      setScreenState("fetch_error");
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Delete handler ────────────────────────────────────────────────────────────

  async function handleDeleteCancelled(bookingId: string) {
    Alert.alert(
      "Delete Booking",
      "Permanently delete this cancelled booking?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
              const supabase = getSupabase();
              await supabase.from("bookings").delete().eq("id", bookingId);
              setBookings((prev) => prev.filter((b) => b.id !== bookingId));
            } catch (err) {
              console.warn("[OperatorBookings] delete error", err);
              Alert.alert("Error", "Failed to delete booking. Please try again.");
            }
          },
        },
      ]
    );
  }

  // ── Filter logic ──────────────────────────────────────────────────────────────

  const PAST_STATUSES: BookingStatus[] = ["completed", "no_show"];
  const UPCOMING_STATUSES: BookingStatus[] = ["requested", "confirmed", "in_progress", "cancelled"];

  const filteredBookings = bookings.filter((b) => {
    const matchesSegment =
      segment === "upcoming"
        ? UPCOMING_STATUSES.includes(b.status)
        : PAST_STATUSES.includes(b.status);
    const matchesCrew = crewFilter === null || b.crewMemberId === crewFilter;
    return matchesSegment && matchesCrew;
  });

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
        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>Bookings</Text>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => router.push("/operator/bookings/new")}
            activeOpacity={0.85}
          >
            <Text style={styles.bookBtnText}>Book A Service</Text>
          </TouchableOpacity>
        </View>

        {/* List / Calendar toggle */}
        <View style={styles.viewToggleRow}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === "list" && styles.viewToggleBtnActive]}
            onPress={() => setViewMode("list")}
            activeOpacity={0.75}
          >
            <Text style={[styles.viewToggleBtnText, viewMode === "list" && styles.viewToggleBtnTextActive]}>
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === "calendar" && styles.viewToggleBtnActive]}
            onPress={() => setViewMode("calendar")}
            activeOpacity={0.75}
          >
            <Text style={[styles.viewToggleBtnText, viewMode === "calendar" && styles.viewToggleBtnTextActive]}>
              Calendar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming / Past segment — list mode only */}
        {viewMode === "list" && (
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, segment === "upcoming" && styles.segmentBtnActive]}
            onPress={() => setSegment("upcoming")}
            activeOpacity={0.75}
          >
            <Text style={[styles.segmentBtnText, segment === "upcoming" && styles.segmentBtnTextActive]}>
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, segment === "past" && styles.segmentBtnActive]}
            onPress={() => setSegment("past")}
            activeOpacity={0.75}
          >
            <Text style={[styles.segmentBtnText, segment === "past" && styles.segmentBtnTextActive]}>
              Past
            </Text>
          </TouchableOpacity>
        </View>
        )}

        {/* Crew filter chips — list mode only */}
        {viewMode === "list" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.crewFilterScroll}
        >
          {/* "All" chip */}
          <TouchableOpacity
            style={[styles.crewChip, crewFilter === null && styles.crewChipActive]}
            onPress={() => setCrewFilter(null)}
            activeOpacity={0.75}
          >
            <Text style={[styles.crewChipText, crewFilter === null && styles.crewChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          {crewMembers.map((m) => {
            const isActive = crewFilter === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.crewChip, isActive && styles.crewChipActive]}
                onPress={() => setCrewFilter(isActive ? null : m.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.crewChipAvatar, isActive && styles.crewChipAvatarActive]}>
                  <Text style={styles.crewChipAvatarText}>{m.initials.slice(0, 2)}</Text>
                </View>
                <Text style={[styles.crewChipText, isActive && styles.crewChipTextActive]}>
                  {m.name.split(" ")[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        )}
      </View>

      {/* ── Body ── */}
      {viewMode === "calendar" ? (
        /* ── Calendar view ── */
        <View style={styles.calBody}>
          {/* Nav row */}
          <View style={styles.calNavRow}>
            <TouchableOpacity
              style={styles.calNavArrow}
              onPress={() =>
                calViewMode === "day"
                  ? setCalDate((d) => addDays(d, -1))
                  : setCalWeekStart((w) => addDays(w, -7))
              }
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color={Colors.light.textPrimary} />
            </TouchableOpacity>

            <Text style={styles.calNavLabel}>
              {calViewMode === "day" ? formatDayLabel(calDate) : formatWeekRange(calWeekStart)}
            </Text>

            <TouchableOpacity
              style={styles.calModeToggle}
              onPress={() => {
                if (calViewMode === "day") {
                  setCalWeekStart(getWeekStart(calDate));
                  setCalViewMode("week");
                } else {
                  const today = new Date();
                  setCalDate(today);
                  setCalWeekStart(getWeekStart(today));
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.calModeToggleText}>{calViewMode === "day" ? "Week" : "Today"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.calNavArrow}
              onPress={() =>
                calViewMode === "day"
                  ? setCalDate((d) => addDays(d, 1))
                  : setCalWeekStart((w) => addDays(w, 7))
              }
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={18} color={Colors.light.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Crew filter chips */}
          {crewMembers.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.calChipScroll}
              contentContainerStyle={styles.calChipRow}
            >
              <TouchableOpacity
                style={[styles.calChip, !calFilterCrewId && styles.calChipActive]}
                onPress={() => setCalFilterCrewId(null)}
                activeOpacity={0.75}
              >
                <Text style={[styles.calChipText, !calFilterCrewId && styles.calChipTextActive]}>All</Text>
              </TouchableOpacity>
              {crewMembers.map((m, idx) => {
                const isSelected = calFilterCrewId === m.id;
                const color = crewColor(idx);
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.calChip, isSelected && { backgroundColor: color, borderColor: color }]}
                    onPress={() => setCalFilterCrewId(isSelected ? null : m.id)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.calCrewDot, { backgroundColor: isSelected ? Colors.white : color }]} />
                    <Text style={[styles.calChipText, isSelected && { color: Colors.white }]}>
                      {m.name.split(" ")[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.calDivider} />

          {/* Calendar grid */}
          {(() => {
            const calJobs: CalJob[] = (() => {
              const filtered =
                calViewMode === "week"
                  ? bookings.filter((b) => {
                      const weekEnd = addDays(calWeekStart, 7);
                      return b.scheduledAt >= calWeekStart && b.scheduledAt < weekEnd;
                    })
                  : bookings.filter((b) => isSameDay(b.scheduledAt, calDate));
              return filtered.map((b) => {
                const crewIndex = b.crewMemberId
                  ? crewMembers.findIndex((m) => m.id === b.crewMemberId)
                  : 0;
                return {
                  id: b.id,
                  scheduledAt: b.scheduledAt,
                  durationMins: 60,
                  customerName: b.customerName,
                  packageName: b.packageName,
                  status: b.status,
                  crewMemberId: b.crewMemberId,
                  crewInitials: b.crewInitials ?? undefined,
                  crewIndex: crewIndex >= 0 ? crewIndex : 0,
                } as CalJob;
              });
            })();

            return calViewMode === "day" ? (
              <DayView jobs={calJobs} crew={crewMembers} filterCrewId={calFilterCrewId} />
            ) : (
              <WeekView
                weekStart={calWeekStart}
                jobs={calJobs}
                filterCrewId={calFilterCrewId}
                onDayPress={(date) => {
                  setCalDate(date);
                  setCalViewMode("day");
                }}
              />
            );
          })()}
        </View>
      ) : screenState === "empty" ? (
        <View style={styles.centerFill}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="book" size={40} color={Colors.foamBlue} />
          </View>
          <Text style={styles.emptyHeadline}>Your first booking is out there.</Text>
          <Text style={styles.emptyBody}>Share your profile and let customers find you.</Text>
          <TouchableOpacity
            style={styles.emptyPrimaryBtn}
            onPress={() => Alert.alert("Share My Profile", "Sharing coming soon.")}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyPrimaryBtnText}>Share My Profile</Text>
          </TouchableOpacity>
        </View>
      ) : filteredBookings.length === 0 ? (
        <View style={styles.centerFill}>
          <Ionicons name="clipboard-outline" size={40} color={Colors.light.textTertiary} />
          <Text style={styles.emptyHeadline}>
            {segment === "upcoming" ? "No upcoming bookings" : "No past bookings"}
          </Text>
          <Text style={styles.emptyBody}>
            {crewFilter !== null ? "Try selecting a different crew member." : "Check the other tab above."}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.foamBlue} />}
        >
          {groupBookingsByDate(filteredBookings).map((group) => (
            <View key={group.dateKey}>
              <Text style={styles.dateGroupHeader}>{group.label}</Text>
              {group.items.map((b) => (
                <BookingListCard
                  key={b.id}
                  booking={b}
                  onPress={() =>
                    router.push(
                      b.orderId
                        ? `/operator/bookings/${b.id}?orderId=${b.orderId}`
                        : `/operator/bookings/${b.id}`
                    )
                  }
                  onAssignPress={() => router.push(`/operator/bookings/assign?bookingId=${b.id}`)}
                  onDeletePress={() => handleDeleteCancelled(b.id)}
                />
              ))}
            </View>
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

  // ── Header ──
  header: {
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.mdLg,
    paddingBottom: Spacing.mdSm,
  },
  bookBtn: {
    height: 36,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  bookBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyS,
    color: Colors.white,
  },
  headerTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 22,
    color: Colors.light.textPrimary,
  },

  // List / Calendar toggle
  viewToggleRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.mdSm,
    gap: Spacing.sm,
  },
  viewToggleBtn: {
    flex: 1,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.bgSecondary,
  },
  viewToggleBtnActive: {
    backgroundColor: Colors.foamBlue,
  },
  viewToggleBtnText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  viewToggleBtnTextActive: {
    color: Colors.white,
  },

  // Upcoming / Past segment
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: Colors.light.bgSecondary,
    borderRadius: Radius.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.mdSm,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnActive: {
    backgroundColor: Colors.light.surface,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
      web: {},
    }),
  },
  segmentBtnText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  segmentBtnTextActive: {
    color: Colors.light.textPrimary,
  },

  // Crew filter chips
  crewFilterScroll: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.mdSm,
    gap: Spacing.sm,
    flexDirection: "row",
  },
  crewChip: {
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
  crewChipActive: {
    backgroundColor: Colors.foamBlue,
    borderColor: Colors.foamBlue,
  },
  crewChipAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  crewChipAvatarActive: {
    backgroundColor: Colors.white,
  },
  crewChipAvatarText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 9,
    color: Colors.foamBlue,
  },
  crewChipText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  crewChipTextActive: {
    color: Colors.white,
  },

  // ── List ──
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.mdSm,
    paddingBottom: 120,
  },
  dateGroupHeader: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    letterSpacing: 0.3,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    marginBottom: Spacing.xs,
  },

  // ── Booking card ──
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
    marginBottom: Spacing.mdSm,
  },
  cardTimeBlock: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  cardTimeBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  cardTime: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
  },
  cardTimePast: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
  },
  inlineBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  inlineBadgeText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
  },
  assignBtn: {
    height: 32,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  assignBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyS,
    color: Colors.foamBlue,
  },
  textActionBtn: {
    height: 32,
    paddingHorizontal: Spacing.mdSm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textActionBtnBlue: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyS,
    color: Colors.foamBlue,
  },
  textActionBtnSecondary: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
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
  cardTotal: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  footerBadge: {
    paddingHorizontal: Spacing.mdSm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  footerBadgeText: {
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
    backgroundColor: Colors.foamBlueSubtle,
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
    color: Colors.foamBlue,
  },
  vehicleCountPill: {
    alignSelf: "flex-start",
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.mdSm,
    paddingVertical: 2,
    marginBottom: 2,
  },
  vehicleCountPillText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
    color: Colors.foamBlue,
  },

  // ── Error / Empty ──
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
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center", justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyHeadline: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.h2,
    color: Colors.light.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.mdSm,
  },
  emptyBody: {
    fontFamily: Typography.body,
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  emptyPrimaryBtn: {
    height: 48, paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    backgroundColor: Colors.foamBlue,
    alignItems: "center", justifyContent: "center",
  },
  emptyPrimaryBtnText: {
    fontFamily: Typography.bodySemiBold, fontSize: 15, color: Colors.white,
  },

  // ── Calendar view ──
  calBody: {
    flex: 1,
  },
  calNavRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
    gap: 8,
    backgroundColor: Colors.light.surface,
  },
  calNavArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  calNavLabel: {
    flex: 1,
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  calModeToggle: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    flexShrink: 0,
  },
  calModeToggleText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 14,
    color: Colors.foamBlue,
  },
  calChipScroll: {
    maxHeight: 50,
    backgroundColor: Colors.light.surface,
  },
  calChipRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    alignItems: "center",
  },
  calChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.surface,
  },
  calChipActive: {
    backgroundColor: Colors.foamBlue,
    borderColor: Colors.foamBlue,
  },
  calChipText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  calChipTextActive: {
    color: Colors.white,
  },
  calCrewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calDivider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
  },
});
