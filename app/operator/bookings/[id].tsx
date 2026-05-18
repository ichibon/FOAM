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
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import type { BookingStatus } from "@/types/database";

// ─── Raw DB row types ─────────────────────────────────────────────────────────

interface RawSiblingRow {
  id: string;
  vehicles: { make: string | null; model: string | null; year: number | null; color: string | null; vehicle_type: string | null } | null;
  service_packages: { name: string; description: string | null; duration_mins: number; base_price: number } | null;
  booking_contacts: { vehicle_make: string | null; vehicle_model: string | null; vehicle_year: number | null; vehicle_color: string | null } | null;
}

interface OrderVehicle {
  bookingId: string;
  vehicleDesc: string;
  vehicleType: string | null;
  packageName: string;
  packageDescription: string | null;
  durationMins: number;
  basePrice: number;
}

interface RawBookingDetail {
  id: string;
  status: string;
  scheduled_at: string;
  estimated_duration_mins: number | null;
  crew_member_id: string | null;
  customer_id: string | null;
  contact_id: string | null;
  detailer_id: string;
  order_id: string | null;
  service_address: string | null;
  subtotal: number | null;
  platform_fee: number | null;
  tip_amount: number;
  total: number | null;
  notes: string | null;
  is_recurring: boolean;
  has_water_supply: boolean | null;
  has_electricity_supply: boolean | null;
  vehicles: {
    make: string | null;
    model: string | null;
    year: number | null;
    color: string | null;
    vehicle_type: string | null;
  } | null;
  service_packages: {
    name: string;
    description: string | null;
    duration_mins: number;
    base_price: number;
  } | null;
  booking_contacts: {
    full_name: string | null;
    phone: string | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
    vehicle_year: number | null;
    vehicle_color: string | null;
  } | null;
}

function parseRawBooking(raw: unknown): RawBookingDetail {
  if (!raw || typeof raw !== "object") throw new Error("Invalid booking row");
  const r = raw as Record<string, unknown>;
  const nullableStr = (v: unknown): string | null => (typeof v === "string" ? v : null);
  const nullableNum = (v: unknown): number | null => (typeof v === "number" ? v : null);
  const nullableBool = (v: unknown): boolean | null => (v == null ? null : Boolean(v));
  const asObj = (v: unknown): Record<string, unknown> =>
    v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  return {
    id: String(r.id ?? ""),
    status: String(r.status ?? ""),
    scheduled_at: String(r.scheduled_at ?? ""),
    estimated_duration_mins: nullableNum(r.estimated_duration_mins),
    crew_member_id: nullableStr(r.crew_member_id),
    customer_id: nullableStr(r.customer_id),
    contact_id: nullableStr(r.contact_id),
    detailer_id: String(r.detailer_id ?? ""),
    order_id: nullableStr(r.order_id),
    service_address: nullableStr(r.service_address),
    subtotal: nullableNum(r.subtotal),
    platform_fee: nullableNum(r.platform_fee),
    tip_amount: typeof r.tip_amount === "number" ? r.tip_amount : 0,
    total: nullableNum(r.total),
    notes: nullableStr(r.notes),
    is_recurring: Boolean(r.is_recurring),
    has_water_supply: nullableBool(r.has_water_supply),
    has_electricity_supply: nullableBool(r.has_electricity_supply),
    vehicles: r.vehicles
      ? (() => {
          const v = asObj(r.vehicles);
          return {
            make: nullableStr(v.make),
            model: nullableStr(v.model),
            year: nullableNum(v.year),
            color: nullableStr(v.color),
            vehicle_type: nullableStr(v.vehicle_type),
          };
        })()
      : null,
    service_packages: r.service_packages
      ? (() => {
          const p = asObj(r.service_packages);
          return {
            name: typeof p.name === "string" ? p.name : "Service",
            description: nullableStr(p.description),
            duration_mins: typeof p.duration_mins === "number" ? p.duration_mins : 0,
            base_price: typeof p.base_price === "number" ? p.base_price : 0,
          };
        })()
      : null,
    booking_contacts: r.booking_contacts
      ? (() => {
          const c = asObj(r.booking_contacts);
          return {
            full_name: nullableStr(c.full_name),
            phone: nullableStr(c.phone),
            vehicle_make: nullableStr(c.vehicle_make),
            vehicle_model: nullableStr(c.vehicle_model),
            vehicle_year: nullableNum(c.vehicle_year),
            vehicle_color: nullableStr(c.vehicle_color),
          };
        })()
      : null,
  };
}

interface RawTeamMemberRow {
  id: string;
  user_id: string;
  display_name: string | null;
}

interface RawUserRow {
  id: string;
  full_name: string | null;
}

// ─── Screen types ─────────────────────────────────────────────────────────────

type ScreenState = "loading" | "fetch_error" | "main";

interface BookingDetail {
  id: string;
  orderId: string | null;
  orderVehicles: OrderVehicle[];
  status: BookingStatus;
  scheduledAt: Date;
  timeLabel: string;
  dateLabel: string;
  isUnassigned: boolean;
  customerName: string;
  customerInitials: string;
  customerPhone: string | null;
  serviceAddress: string | null;
  hasWaterSupply: boolean | null;
  hasElectricitySupply: boolean | null;
  vehicleDesc: string;
  vehicleType: string | null;
  packageName: string;
  packageDescription: string | null;
  durationMins: number;
  basePrice: number;
  subtotal: number | null;
  platformFee: number | null;
  tipAmount: number;
  total: number | null;
  notes: string | null;
  isRecurring: boolean;
  crewMemberId: string | null;
  crewName: string | null;
  crewInitials: string | null;
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

function formatDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (d.getTime() - today.getTime()) / 86400000;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr${h > 1 ? "s" : ""}`;
}

function statusBadgeConfig(status: BookingStatus, isUnassigned: boolean) {
  if (isUnassigned) return { label: "Unassigned", bg: "rgba(217,119,6,0.08)", color: Colors.warningLight };
  switch (status) {
    case "requested":     return { label: "Requested",   bg: "rgba(217,119,6,0.08)",       color: Colors.warningLight };
    case "confirmed":     return { label: "Confirmed",   bg: Colors.foamBlueSubtle,         color: Colors.foamBlue };
    case "in_progress":   return { label: "In Progress", bg: Colors.foamBlueSubtle,         color: Colors.foamBlue };
    case "completed":     return { label: "Completed",   bg: "rgba(22,163,74,0.08)",        color: Colors.successLight };
    case "cancelled":     return { label: "Cancelled",   bg: Colors.light.bgSecondary,      color: Colors.light.textSecondary };
    case "no_show":       return { label: "No Show",     bg: "rgba(220,38,38,0.08)",        color: Colors.errorLight };
    default:              return { label: status,        bg: Colors.light.bgSecondary,      color: Colors.light.textSecondary };
  }
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={[
        styles.sectionCard,
        Platform.OS === "web"
          ? ({ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.05)" } as object)
          : Shadows.light.level1,
      ]}
    >
      {children}
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BookingDetailScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user || !id) return;
    setScreenState("loading");
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();

      const { data: raw, error } = await supabase
        .from("bookings")
        .select(
          "id, status, scheduled_at, estimated_duration_mins, crew_member_id, customer_id, contact_id, detailer_id, order_id," +
          "service_address, subtotal, platform_fee, tip_amount, total, notes, is_recurring," +
          "has_water_supply, has_electricity_supply," +
          "vehicles(make,model,year,color,vehicle_type)," +
          "service_packages(name,description,duration_mins,base_price)," +
          "booking_contacts(full_name,phone,vehicle_make,vehicle_model,vehicle_year,vehicle_color)"
        )
        .eq("id", id)
        .single();

      if (error || !raw) {
        setScreenState("fetch_error");
        return;
      }

      const b = parseRawBooking(raw);
      const scheduledAt = new Date(b.scheduled_at);
      const isUnassigned =
        (b.status === "confirmed" || b.status === "requested") && !b.crew_member_id;

      let crewName: string | null = null;
      let crewInitials: string | null = null;

      if (b.crew_member_id) {
        const { data: memberRow } = await supabase
          .from("team_members")
          .select("id, user_id, display_name")
          .eq("id", b.crew_member_id)
          .single();
        const m = memberRow as RawTeamMemberRow | null;
        if (m) {
          if (m.display_name) {
            crewName = m.display_name;
          } else {
            const { data: uRow } = await supabase
              .from("users")
              .select("id, full_name")
              .eq("id", m.user_id)
              .single();
            crewName = (uRow as RawUserRow | null)?.full_name ?? "Crew";
          }
          crewInitials = getInitials(crewName ?? "Crew");
        }
      }

      // Walk-in bookings use booking_contacts; registered customers use the users table
      const contact = b.booking_contacts;
      let custName = contact?.full_name ?? null;
      let custPhone = contact?.phone ?? null;

      if (!custName && b.customer_id) {
        const { data: regUser } = await supabase
          .from("users")
          .select("id, full_name, phone")
          .eq("id", b.customer_id)
          .single();
        const u = regUser as { id: string; full_name: string | null; phone: string | null } | null;
        custName = u?.full_name ?? null;
        custPhone = u?.phone ?? custPhone;
      }
      custName = custName ?? "Customer";

      const vehicleDesc = b.vehicles
        ? [b.vehicles.year, b.vehicles.make, b.vehicles.model, b.vehicles.color]
            .filter(Boolean)
            .join(" ")
        : contact
        ? [contact.vehicle_year, contact.vehicle_make, contact.vehicle_model, contact.vehicle_color]
            .filter(Boolean)
            .join(" ") || "Vehicle (walk-in)"
        : "Vehicle";

      // Build order vehicles list — starts with this booking, then fetches siblings
      const primaryVehicle: OrderVehicle = {
        bookingId: b.id,
        vehicleDesc,
        vehicleType: b.vehicles?.vehicle_type ?? null,
        packageName: b.service_packages?.name ?? "Service",
        packageDescription: b.service_packages?.description ?? null,
        durationMins: b.service_packages?.duration_mins ?? 0,
        basePrice: b.service_packages?.base_price ?? 0,
      };

      let orderVehicles: OrderVehicle[] = [primaryVehicle];

      if (b.order_id) {
        const { data: siblingsData } = await supabase
          .from("bookings")
          .select(
            "id," +
            "vehicles(make,model,year,color,vehicle_type)," +
            "service_packages(name,description,duration_mins,base_price)," +
            "booking_contacts(vehicle_make,vehicle_model,vehicle_year,vehicle_color)"
          )
          .eq("order_id", b.order_id)
          .eq("detailer_id", b.detailer_id)
          .neq("id", b.id);

        const siblings: OrderVehicle[] = ((siblingsData as RawSiblingRow[] | null) ?? []).map((sib) => {
          const v = sib.vehicles;
          const c = sib.booking_contacts;
          const sibVehicleDesc = v
            ? [v.year, v.make, v.model, v.color].filter(Boolean).join(" ") || "Vehicle"
            : c
            ? [c.vehicle_year, c.vehicle_make, c.vehicle_model, c.vehicle_color].filter(Boolean).join(" ") || "Vehicle"
            : "Vehicle";
          return {
            bookingId: sib.id,
            vehicleDesc: sibVehicleDesc,
            vehicleType: v?.vehicle_type ?? null,
            packageName: sib.service_packages?.name ?? "Service",
            packageDescription: sib.service_packages?.description ?? null,
            durationMins: sib.service_packages?.duration_mins ?? 0,
            basePrice: sib.service_packages?.base_price ?? 0,
          };
        });

        orderVehicles = [primaryVehicle, ...siblings];
      }

      setBooking({
        id: b.id,
        orderId: b.order_id,
        orderVehicles,
        status: b.status as BookingStatus,
        scheduledAt,
        timeLabel: formatTime(scheduledAt),
        dateLabel: formatDate(scheduledAt),
        isUnassigned,
        customerName: custName,
        customerInitials: getInitials(custName),
        customerPhone: custPhone,
        serviceAddress: b.service_address,
        hasWaterSupply: b.has_water_supply,
        hasElectricitySupply: b.has_electricity_supply,
        vehicleDesc,
        vehicleType: b.vehicles?.vehicle_type ?? null,
        packageName: b.service_packages?.name ?? "Service",
        packageDescription: b.service_packages?.description ?? null,
        durationMins: b.service_packages?.duration_mins ?? 0,
        basePrice: b.service_packages?.base_price ?? 0,
        subtotal: b.subtotal,
        platformFee: b.platform_fee,
        tipAmount: b.tip_amount,
        total: b.total,
        notes: b.notes,
        isRecurring: b.is_recurring,
        crewMemberId: b.crew_member_id,
        crewName,
        crewInitials,
      });
      setScreenState("main");
    } catch (err) {
      console.warn("[BookingDetail] fetchData error", err);
      setScreenState("fetch_error");
    }
  }, [user, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleStatusChange(newStatus: BookingStatus) {
    if (!id) return;
    setIsSaving(true);
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();
      await supabase.from("bookings").update({ status: newStatus }).eq("id", id);
      await fetchData();
    } catch (err) {
      console.warn("[BookingDetail] statusChange error", err);
    } finally {
      setIsSaving(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (screenState === "loading") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Booking Detail</Text>
          <View style={styles.navSpacer} />
        </View>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={Colors.foamBlue} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (screenState === "fetch_error" || !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Booking Detail</Text>
          <View style={styles.navSpacer} />
        </View>
        <View style={styles.centerFill}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.errorLight} />
          <Text style={styles.errorText}>Couldn't load this booking</Text>
          <TouchableOpacity onPress={fetchData} style={styles.retryBtn} activeOpacity={0.75}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const badge = statusBadgeConfig(booking.status, booking.isUnassigned);
  const canConfirm = booking.status === "requested";
  const canComplete = booking.status === "in_progress";
  const canCancel = booking.status === "confirmed" || booking.status === "requested";

  return (
    <SafeAreaView style={styles.container}>
      {/* Nav header */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Booking Detail</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Status + Time */}
        <SectionCard>
          <View style={styles.statusRow}>
            <View>
              <SectionLabel>STATUS</SectionLabel>
              <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            </View>
            <View style={styles.timeBlock}>
              <SectionLabel>TIME</SectionLabel>
              <Text style={styles.timeText}>{booking.timeLabel}</Text>
              <Text style={styles.dateText}>{booking.dateLabel}</Text>
            </View>
          </View>
          {booking.isRecurring && (
            <View style={styles.recurringRow}>
              <Ionicons name="repeat" size={13} color={Colors.foamBlue} />
              <Text style={styles.recurringText}>Recurring booking</Text>
            </View>
          )}
        </SectionCard>

        {/* Customer + Vehicle */}
        <SectionCard>
          <SectionLabel>CUSTOMER</SectionLabel>
          <View style={styles.customerRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{booking.customerInitials}</Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{booking.customerName}</Text>
            </View>
          </View>

          {booking.customerPhone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={15} color={Colors.light.textTertiary} />
              <Text style={styles.infoRowText}>{booking.customerPhone}</Text>
            </View>
          )}
          {booking.serviceAddress && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={15} color={Colors.light.textTertiary} />
              <Text style={styles.infoRowText}>{booking.serviceAddress}</Text>
            </View>
          )}

          <View style={styles.divider} />
          <SectionLabel>VEHICLE</SectionLabel>
          <Text style={styles.vehicleName}>{booking.vehicleDesc}</Text>
          {booking.vehicleType && (
            <Text style={styles.vehicleType}>{booking.vehicleType.charAt(0).toUpperCase() + booking.vehicleType.slice(1)}</Text>
          )}
        </SectionCard>

        {/* Assignment */}
        <SectionCard>
          <SectionLabel>ASSIGNED TO</SectionLabel>
          {booking.crewName ? (
            <>
              <View style={styles.crewRow}>
                <View style={styles.crewAvatar}>
                  <Text style={styles.crewAvatarText}>{(booking.crewInitials ?? "??").slice(0, 2)}</Text>
                </View>
                <View style={styles.crewInfo}>
                  <Text style={styles.crewName}>{booking.crewName}</Text>
                </View>
              </View>
              <View style={styles.crewActions}>
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() =>
                    router.push(`/operator/bookings/assign?bookingId=${booking.id}`)
                  }
                  activeOpacity={0.75}
                >
                  <Text style={styles.outlineBtnText}>Reassign</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={styles.assignCta}
              onPress={() => router.push(`/operator/bookings/assign?bookingId=${booking.id}`)}
              activeOpacity={0.75}
            >
              <Ionicons name="person-add-outline" size={16} color={Colors.foamBlue} />
              <Text style={styles.assignCtaText}>Assign a crew member</Text>
            </TouchableOpacity>
          )}
        </SectionCard>

        {/* Service */}
        <SectionCard>
          <SectionLabel>SERVICE</SectionLabel>

          {booking.orderVehicles.map((v, i) => (
            <View key={v.bookingId}>
              {i > 0 && <View style={styles.vehicleSeparator} />}
              {booking.orderVehicles.length > 1 && (
                <Text style={styles.vehicleLabel}>{v.vehicleDesc}</Text>
              )}
              <View style={styles.serviceRow}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{v.packageName}</Text>
                  {v.packageDescription && (
                    <Text style={styles.serviceDesc}>{v.packageDescription}</Text>
                  )}
                  {v.durationMins > 0 && (
                    <View style={styles.infoRow}>
                      <Ionicons name="time-outline" size={14} color={Colors.light.textTertiary} />
                      <Text style={styles.infoRowText}>{formatDuration(v.durationMins)}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.servicePrice}>${v.basePrice.toFixed(0)}</Text>
              </View>
            </View>
          ))}

          {(booking.hasWaterSupply !== null || booking.hasElectricitySupply !== null) && (
            <>
              {booking.orderVehicles.length > 1 && <View style={styles.vehicleSeparator} />}
              <View style={styles.infoRow}>
                <Ionicons
                  name={booking.hasWaterSupply === true ? "water" : "water-outline"}
                  size={14}
                  color={booking.hasWaterSupply === true ? Colors.foamBlue : Colors.light.textTertiary}
                />
                <Text style={[styles.infoRowText, { color: booking.hasWaterSupply === true ? Colors.foamBlue : Colors.light.textTertiary }]}>
                  {booking.hasWaterSupply === true
                    ? "Water available"
                    : booking.hasWaterSupply === false
                    ? "No water supply"
                    : "Water not specified"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons
                  name={booking.hasElectricitySupply === true ? "flash" : "flash-outline"}
                  size={14}
                  color={booking.hasElectricitySupply === true ? Colors.successLight : Colors.light.textTertiary}
                />
                <Text style={[styles.infoRowText, { color: booking.hasElectricitySupply === true ? Colors.successLight : Colors.light.textTertiary }]}>
                  {booking.hasElectricitySupply === true
                    ? "Power available"
                    : booking.hasElectricitySupply === false
                    ? "No power supply"
                    : "Power not specified"}
                </Text>
              </View>
            </>
          )}
        </SectionCard>

        {/* Notes */}
        {booking.notes ? (
          <SectionCard>
            <SectionLabel>CUSTOMER NOTES</SectionLabel>
            <Text style={styles.notesText}>"{booking.notes}"</Text>
          </SectionCard>
        ) : null}

        {/* Payment */}
        {booking.subtotal != null && (
          <SectionCard>
            <SectionLabel>PAYMENT</SectionLabel>
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>Service charge</Text>
              <Text style={styles.payValue}>${(booking.subtotal ?? 0).toFixed(2)}</Text>
            </View>
            {booking.platformFee != null && (
              <View style={styles.payRow}>
                <Text style={styles.payLabel}>Platform fee</Text>
                <Text style={styles.payValue}>${booking.platformFee.toFixed(2)}</Text>
              </View>
            )}
            {booking.tipAmount > 0 && (
              <View style={styles.payRow}>
                <Text style={styles.payLabel}>Tip</Text>
                <Text style={styles.payValue}>${booking.tipAmount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.payDivider} />
            <View style={styles.payRow}>
              <Text style={styles.payTotalLabel}>Total</Text>
              <Text style={styles.payTotalValue}>${(booking.total ?? 0).toFixed(2)}</Text>
            </View>
          </SectionCard>
        )}

        {/* Actions */}
        {(canConfirm || canComplete || canCancel) && (
          <View style={styles.actionsBlock}>
            {canConfirm && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.foamBlue }]}
                onPress={() => handleStatusChange("confirmed")}
                activeOpacity={0.75}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={[styles.actionBtnText, { color: Colors.white }]}>Confirm Booking</Text>
                )}
              </TouchableOpacity>
            )}
            {canComplete && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.successLight }]}
                onPress={() => handleStatusChange("completed")}
                activeOpacity={0.75}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={[styles.actionBtnText, { color: Colors.white }]}>Mark Completed</Text>
                )}
              </TouchableOpacity>
            )}
            {canCancel && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleStatusChange("cancelled")}
                activeOpacity={0.75}
                disabled={isSaving}
              >
                <Text style={styles.cancelBtnText}>Cancel Booking</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

      </ScrollView>
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
  navTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.h4,
    color: Colors.light.textPrimary,
  },
  navSpacer: { width: 32 },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 120,
    gap: Spacing.mdSm,
  },
  sectionCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    padding: Spacing.md,
  },
  sectionLabel: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
    marginBottom: Spacing.mdSm,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statusBadge: {
    paddingHorizontal: Spacing.mdSm,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
  },
  timeBlock: {
    alignItems: "flex-end",
  },
  timeText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
  },
  dateText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  recurringRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.mdSm,
    paddingTop: Spacing.mdSm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  recurringText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.foamBlue,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.mdSm,
    marginBottom: Spacing.mdSm,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
  customerInfo: { flex: 1 },
  customerName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.mdSm,
    marginBottom: Spacing.sm,
  },
  infoRowText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
    marginVertical: Spacing.mdSm,
  },
  vehicleName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
  },
  vehicleType: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  crewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.mdSm,
    marginBottom: Spacing.mdSm,
  },
  crewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  crewAvatarText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  crewInfo: { flex: 1 },
  crewName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
  },
  crewActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  outlineBtn: {
    flex: 1,
    height: 40,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyS,
    color: Colors.foamBlue,
  },
  assignCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.mdSm,
  },
  assignCtaText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
  vehicleSeparator: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
    marginVertical: Spacing.mdSm,
  },
  vehicleLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    marginBottom: Spacing.xs,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  serviceInfo: { flex: 1, paddingRight: Spacing.md },
  serviceName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.xs,
  },
  serviceDesc: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  servicePrice: {
    fontFamily: Typography.display,
    fontSize: 22,
    color: Colors.light.textPrimary,
  },
  notesText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    fontStyle: "italic",
    lineHeight: 22,
  },
  payRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  payLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
  },
  payValue: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  payDivider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
    marginVertical: Spacing.mdSm,
  },
  payTotalLabel: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
  },
  payTotalValue: {
    fontFamily: Typography.display,
    fontSize: 20,
    color: Colors.light.textPrimary,
  },
  actionsBlock: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionBtn: {
    height: 48,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
  },
  cancelBtn: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.errorLight,
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
});
