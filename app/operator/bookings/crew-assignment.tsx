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

// ─── Raw DB row types ─────────────────────────────────────────────────────────

interface RawBookingRow {
  id: string;
  scheduled_at: string;
  estimated_duration_mins: number | null;
  service_address: string | null;
  total: number | null;
  subtotal: number | null;
  users: { full_name: string | null } | null;
  service_packages: { name: string; base_price: number } | null;
  booking_contacts: { full_name: string | null } | null;
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

interface RawCrewJobCount {
  crew_member_id: string | null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ScreenState = "loading" | "fetch_error" | "main";
type SaveState = "idle" | "saving" | "success" | "error";

interface AssignmentSummary {
  bookingId: string;
  customerName: string;
  packageName: string;
  scheduledAt: Date;
  timeLabel: string;
  dateLabel: string;
  price: number | null;
  address: string | null;
  crewId: string;
  crewName: string;
  crewInitials: string;
  crewJobsToday: number;
  notes: string | null;
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
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
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

export default function CrewAssignmentScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { bookingId, crewId, notes } = useLocalSearchParams<{
    bookingId: string;
    crewId: string;
    notes?: string;
  }>();

  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [summary, setSummary] = useState<AssignmentSummary | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const decodedNotes = notes ?? null;

  const fetchData = useCallback(async () => {
    if (!user || !bookingId || !crewId) return;
    setScreenState("loading");
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();

      const [bookingRes, memberRes] = await Promise.all([
        supabase
          .from("bookings")
          .select(
            "id, scheduled_at, estimated_duration_mins, service_address, total, subtotal," +
            "users!bookings_customer_id_fkey(full_name)," +
            "service_packages(name,base_price)," +
            "booking_contacts(full_name)"
          )
          .eq("id", bookingId)
          .single(),
        supabase
          .from("team_members")
          .select("id, user_id, display_name")
          .eq("id", crewId)
          .single(),
      ]);

      if (bookingRes.error || !bookingRes.data || memberRes.error || !memberRes.data) {
        setScreenState("fetch_error");
        return;
      }

      const b = bookingRes.data as RawBookingRow;
      const m = memberRes.data as RawTeamMemberRow;

      let crewName: string;
      if (m.display_name) {
        crewName = m.display_name;
      } else {
        const { data: uRow } = await supabase
          .from("users")
          .select("id, full_name")
          .eq("id", m.user_id)
          .single();
        crewName = (uRow as RawUserRow | null)?.full_name ?? "Crew Member";
      }

      // Count how many jobs this crew member has today
      const scheduledAt = new Date(b.scheduled_at);
      const dayStart = new Date(scheduledAt.getFullYear(), scheduledAt.getMonth(), scheduledAt.getDate()).toISOString();
      const dayEnd = new Date(scheduledAt.getFullYear(), scheduledAt.getMonth(), scheduledAt.getDate(), 23, 59, 59).toISOString();

      const { data: crewJobsData } = await supabase
        .from("bookings")
        .select("crew_member_id")
        .eq("crew_member_id", crewId)
        .in("status", ["confirmed", "in_progress", "requested"])
        .gte("scheduled_at", dayStart)
        .lte("scheduled_at", dayEnd);

      const crewJobsToday = (crewJobsData as RawCrewJobCount[] | null)?.length ?? 0;

      setSummary({
        bookingId: b.id,
        customerName: b.users?.full_name ?? b.booking_contacts?.full_name ?? "Customer",
        packageName: b.service_packages?.name ?? "Service",
        scheduledAt,
        timeLabel: formatTime(scheduledAt),
        dateLabel: formatDate(scheduledAt),
        price: b.total ?? b.subtotal ?? b.service_packages?.base_price ?? null,
        address: b.service_address,
        crewId,
        crewName,
        crewInitials: getInitials(crewName),
        crewJobsToday,
        notes: decodedNotes ?? null,
      });
      setScreenState("main");
    } catch (err) {
      console.warn("[CrewAssignment] fetchData error", err);
      setScreenState("fetch_error");
    }
  }, [user, bookingId, crewId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleConfirm() {
    if (!summary) return;
    setSaveError(null);
    setSaveState("saving");
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();

      const updatePayload: Record<string, unknown> = {
        crew_member_id: summary.crewId,
      };

      const { error } = await supabase
        .from("bookings")
        .update(updatePayload)
        .eq("id", summary.bookingId);

      if (error) {
        console.warn("[CrewAssignment] update error", error);
        setSaveError("Failed to save assignment. Please try again.");
        setSaveState("error");
        return;
      }

      setSaveState("success");
    } catch (err) {
      console.warn("[CrewAssignment] confirm error", err);
      setSaveError("An unexpected error occurred.");
      setSaveState("error");
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (screenState === "loading") {
    return (
      <SafeAreaView style={styles.container}>
        <NavHeader onBack={() => router.back()} title="Confirm Assignment" />
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={Colors.foamBlue} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (screenState === "fetch_error" || !summary) {
    return (
      <SafeAreaView style={styles.container}>
        <NavHeader onBack={() => router.back()} title="Confirm Assignment" />
        <View style={styles.centerFill}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.errorLight} />
          <Text style={styles.errorText}>Couldn't load assignment details</Text>
          <TouchableOpacity onPress={fetchData} style={styles.retryBtn} activeOpacity={0.75}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (saveState === "success") {
    return (
      <SafeAreaView style={styles.container}>
        <NavHeader onBack={() => router.back()} title="Confirm Assignment" />
        <View style={styles.centerFill}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={36} color={Colors.foamBlue} />
          </View>
          <Text style={styles.successHeadline}>Assignment Confirmed</Text>
          <Text style={styles.successBody}>
            {summary.crewName.split(" ")[0]} has been assigned to{" "}
            {summary.customerName}'s booking.
          </Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.push(`/operator/bookings/${summary.bookingId}`)}
            activeOpacity={0.8}
          >
            <Text style={styles.doneBtnText}>View Booking</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <NavHeader onBack={() => router.back()} title="Confirm Assignment" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={styles.stepDot} />
          <View style={[styles.stepLine, { backgroundColor: Colors.foamBlue }]} />
          <View style={[styles.stepDot, { backgroundColor: Colors.foamBlue }]} />
          <Text style={styles.stepText}>Step 2 of 2 — Review &amp; confirm</Text>
        </View>

        {/* Job summary */}
        <SectionCard>
          <SectionLabel>JOB DETAILS</SectionLabel>
          <View style={styles.summaryRow}>
            <Ionicons name="time-outline" size={16} color={Colors.light.textTertiary} />
            <Text style={styles.summaryValue}>
              {summary.dateLabel} at {summary.timeLabel}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="person-outline" size={16} color={Colors.light.textTertiary} />
            <Text style={styles.summaryValue}>{summary.customerName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="car-outline" size={16} color={Colors.light.textTertiary} />
            <Text style={styles.summaryValue}>{summary.packageName}</Text>
          </View>
          {summary.address && (
            <View style={styles.summaryRow}>
              <Ionicons name="location-outline" size={16} color={Colors.light.textTertiary} />
              <Text style={[styles.summaryValue, { flex: 1 }]}>{summary.address}</Text>
            </View>
          )}
          {summary.price != null && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Job value</Text>
              <Text style={styles.priceValue}>${summary.price.toFixed(0)}</Text>
            </View>
          )}
        </SectionCard>

        {/* Assigned crew */}
        <SectionCard>
          <SectionLabel>ASSIGNED TO</SectionLabel>
          <View style={styles.crewRow}>
            <View style={styles.crewAvatar}>
              <Text style={styles.crewAvatarText}>{summary.crewInitials.slice(0, 2)}</Text>
            </View>
            <View style={styles.crewDetails}>
              <Text style={styles.crewName}>{summary.crewName}</Text>
              <Text style={styles.crewSubText}>
                {summary.crewJobsToday} other job{summary.crewJobsToday !== 1 ? "s" : ""} today
              </Text>
            </View>
            <View style={styles.confirmBadge}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.successLight} />
            </View>
          </View>
        </SectionCard>

        {/* Notes */}
        {summary.notes && (
          <SectionCard>
            <SectionLabel>CREW NOTES</SectionLabel>
            <Text style={styles.notesText}>{summary.notes}</Text>
          </SectionCard>
        )}

        {/* Notification info */}
        <View style={styles.notifBox}>
          <Ionicons name="notifications-outline" size={16} color={Colors.foamBlue} />
          <Text style={styles.notifText}>
            {summary.crewName.split(" ")[0]} will be notified immediately via push notification.
          </Text>
        </View>

        {saveError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.errorLight} />
            <Text style={styles.errorBannerText}>{saveError}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, saveState === "saving" && { opacity: 0.65 }]}
          onPress={handleConfirm}
          disabled={saveState === "saving"}
          activeOpacity={0.8}
        >
          {saveState === "saving" ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
              <Text style={styles.confirmBtnText}>Confirm Assignment</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Change crew member</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── NavHeader ────────────────────────────────────────────────────────────────

function NavHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.navHeader}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.navTitle}>{title}</Text>
      <View style={styles.navSpacer} />
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
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  navTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.h4,
    color: Colors.light.textPrimary,
  },
  navSpacer: { width: 32 },
  scrollContent: { padding: Spacing.md, paddingBottom: 140, gap: Spacing.mdSm },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.borderDefault,
  },
  stepLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.light.borderSubtle,
  },
  stepText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
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
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.mdSm,
    marginBottom: Spacing.sm,
  },
  summaryValue: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.mdSm,
    paddingTop: Spacing.mdSm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  priceLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
  },
  priceValue: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.h4,
    color: Colors.foamBlue,
  },
  crewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.mdSm,
  },
  crewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  crewAvatarText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
  crewDetails: { flex: 1 },
  crewName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
  },
  crewSubText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  confirmBadge: { flexShrink: 0 },
  notesText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  notifBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.md,
    padding: Spacing.mdSm,
  },
  notifText: {
    flex: 1,
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(220,38,38,0.08)",
    borderRadius: Radius.md,
    padding: Spacing.mdSm,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.errorLight,
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    paddingBottom: Platform.OS === "ios" ? 32 : Spacing.md,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    gap: Spacing.sm,
  },
  confirmBtn: {
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  confirmBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  backLink: { alignItems: "center" },
  backLinkText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.foamBlue,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  successHeadline: {
    fontFamily: Typography.display,
    fontSize: Typography.size.h2,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  successBody: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 22,
  },
  doneBtn: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.mdSm,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
  },
  doneBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
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
});
