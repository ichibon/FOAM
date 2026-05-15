import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Switch,
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
  status: string;
  scheduled_at: string;
  estimated_duration_mins: number | null;
  crew_member_id: string | null;
  users: { full_name: string | null } | null;
  service_packages: { name: string; base_price: number } | null;
  total: number | null;
  subtotal: number | null;
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

// ─── Types ────────────────────────────────────────────────────────────────────

type ScreenState = "loading" | "fetch_error" | "main";

interface CrewOption {
  id: string;
  name: string;
  initials: string;
  isAvailable: boolean;
  conflictLabel: string | null;
  jobCountToday: number;
}

interface BookingContext {
  id: string;
  customerName: string;
  packageName: string;
  scheduledAt: Date;
  timeLabel: string;
  dateLabel: string;
  price: number | null;
  estimatedDurMins: number | null;
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

function getLoadLabel(count: number): string {
  if (count <= 1) return "Light load";
  if (count <= 3) return "Moderate load";
  return "Heavy load";
}

function findConflict(
  targetDate: Date,
  targetDurMins: number | null,
  crewBookings: RawCrewBooking[]
): { hasConflict: boolean; label: string | null } {
  const targetStart = targetDate.getTime();
  const targetEnd = targetStart + (targetDurMins ?? 120) * 60000;
  for (const b of crewBookings) {
    const bStart = new Date(b.scheduled_at).getTime();
    const bEnd = bStart + (b.estimated_duration_mins ?? 120) * 60000;
    if (bStart < targetEnd && bEnd > targetStart) {
      return {
        hasConflict: true,
        label: `Has a job ${formatTime(new Date(b.scheduled_at))} – ${formatTime(new Date(bEnd))}`,
      };
    }
  }
  return { hasConflict: false, label: null };
}

// ─── Load Indicator ───────────────────────────────────────────────────────────

function LoadBar({ count }: { count: number }) {
  const filled = Math.min(count, 5);
  return (
    <View style={styles.loadBarRow}>
      <View style={styles.loadBarDots}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.loadDot,
              { backgroundColor: i < filled ? Colors.foamBlue : Colors.light.borderSubtle },
            ]}
          />
        ))}
      </View>
      <Text style={styles.loadLabel}>{getLoadLabel(count)}</Text>
    </View>
  );
}

// ─── Crew Row ─────────────────────────────────────────────────────────────────

function CrewRow({
  crew,
  isSelected,
  showUnavailable,
  onSelect,
}: {
  crew: CrewOption;
  isSelected: boolean;
  showUnavailable: boolean;
  onSelect: () => void;
}) {
  if (!crew.isAvailable && !showUnavailable) return null;
  const disabled = !crew.isAvailable;

  return (
    <TouchableOpacity
      style={[
        styles.crewRow,
        isSelected && styles.crewRowSelected,
        disabled && styles.crewRowDisabled,
      ]}
      onPress={disabled ? undefined : onSelect}
      activeOpacity={disabled ? 1 : 0.75}
    >
      <View
        style={[
          styles.crewAvatar,
          { backgroundColor: disabled ? Colors.light.borderDefault : Colors.foamBlue },
        ]}
      >
        <Text style={styles.crewAvatarText}>{crew.initials.slice(0, 2)}</Text>
      </View>
      <View style={styles.crewInfo}>
        <Text style={[styles.crewName, disabled && { color: Colors.light.textTertiary }]}>
          {crew.name}
        </Text>
        {disabled && crew.conflictLabel ? (
          <Text style={styles.crewConflict}>{crew.conflictLabel}</Text>
        ) : (
          <Text style={styles.crewAvailableText}>Available</Text>
        )}
        <Text style={styles.crewJobCount}>{crew.jobCountToday} jobs today</Text>
        <LoadBar count={crew.jobCountToday} />
      </View>
      {isSelected && !disabled && (
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={12} color={Colors.white} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AssignJobScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [bookingCtx, setBookingCtx] = useState<BookingContext | null>(null);
  const [crewOptions, setCrewOptions] = useState<CrewOption[]>([]);
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [crewNotes, setCrewNotes] = useState("");

  const fetchData = useCallback(async () => {
    if (!user || !bookingId) return;
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
        setScreenState("fetch_error");
        return;
      }
      const detailerId: string = (profileData as { id: string }).id;

      const { data: rawBooking, error: bookingError } = await supabase
        .from("bookings")
        .select(
          "id, status, scheduled_at, estimated_duration_mins, crew_member_id, total, subtotal," +
          "users!bookings_customer_id_fkey(full_name)," +
          "service_packages(name,base_price)"
        )
        .eq("id", bookingId)
        .single();

      if (bookingError || !rawBooking) {
        setScreenState("fetch_error");
        return;
      }

      const b = rawBooking as RawBookingRow;
      const scheduledAt = new Date(b.scheduled_at);
      const ctx: BookingContext = {
        id: b.id,
        customerName: b.users?.full_name ?? "Customer",
        packageName: b.service_packages?.name ?? "Service",
        scheduledAt,
        timeLabel: formatTime(scheduledAt),
        dateLabel: formatDateShort(scheduledAt),
        price: b.total ?? b.subtotal ?? b.service_packages?.base_price ?? null,
        estimatedDurMins: b.estimated_duration_mins,
      };
      setBookingCtx(ctx);

      if (b.crew_member_id) setSelectedCrewId(b.crew_member_id);

      const { data: rawMembers } = await supabase
        .from("team_members")
        .select("id, user_id, is_active")
        .eq("manager_id", detailerId);

      const members: RawTeamMember[] = (rawMembers as RawTeamMember[] | null) ?? [];

      let memberUserMap: Record<string, string> = {};
      if (members.length > 0) {
        const uids = members.map((m) => m.user_id);
        const { data: memberUsers } = await supabase
          .from("users")
          .select("id, full_name")
          .in("id", uids);
        for (const u of (memberUsers as RawUser[] | null) ?? []) {
          if (u.full_name) memberUserMap[u.id] = u.full_name;
        }
      }

      const memberIds = members.map((m) => m.id);
      let crewBookingsMap: Record<string, RawCrewBooking[]> = {};
      let crewJobCountMap: Record<string, number> = {};

      if (memberIds.length > 0) {
        const dayStart = new Date(scheduledAt.getFullYear(), scheduledAt.getMonth(), scheduledAt.getDate()).toISOString();
        const dayEnd = new Date(scheduledAt.getFullYear(), scheduledAt.getMonth(), scheduledAt.getDate(), 23, 59, 59).toISOString();

        const { data: crewBookings } = await supabase
          .from("bookings")
          .select("crew_member_id, scheduled_at, estimated_duration_mins")
          .in("crew_member_id", memberIds)
          .in("status", ["confirmed", "in_progress", "requested"])
          .gte("scheduled_at", dayStart)
          .lte("scheduled_at", dayEnd);

        for (const cb of (crewBookings as RawCrewBooking[] | null) ?? []) {
          if (!cb.crew_member_id) continue;
          if (!crewBookingsMap[cb.crew_member_id]) crewBookingsMap[cb.crew_member_id] = [];
          crewBookingsMap[cb.crew_member_id].push(cb);
          crewJobCountMap[cb.crew_member_id] = (crewJobCountMap[cb.crew_member_id] ?? 0) + 1;
        }
      }

      const options: CrewOption[] = members
        .filter((m) => m.is_active)
        .map((m) => {
          const name = memberUserMap[m.user_id] ?? "Crew";
          const { hasConflict, label } = findConflict(scheduledAt, ctx.estimatedDurMins, crewBookingsMap[m.id] ?? []);
          return {
            id: m.id,
            name,
            initials: getInitials(name),
            isAvailable: !hasConflict,
            conflictLabel: label,
            jobCountToday: crewJobCountMap[m.id] ?? 0,
          };
        })
        .sort((a, b) => (b.isAvailable ? 1 : 0) - (a.isAvailable ? 1 : 0));

      setCrewOptions(options);
      setScreenState("main");
    } catch (err) {
      console.warn("[AssignJob] fetchData error", err);
      setScreenState("fetch_error");
    }
  }, [user, bookingId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleReview() {
    if (!bookingId || !selectedCrewId) return;
    const notesParam = crewNotes.trim() ? encodeURIComponent(crewNotes.trim()) : "";
    router.push(
      `/operator/bookings/crew-assignment?bookingId=${bookingId}&crewId=${selectedCrewId}${notesParam ? `&notes=${notesParam}` : ""}`
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (screenState === "loading") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Assign Job</Text>
          <View style={styles.navSpacer} />
        </View>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={Colors.foamBlue} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (screenState === "fetch_error" || !bookingCtx) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Assign Job</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Assign Job</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Job context bar */}
        <View style={styles.jobContextBar}>
          <Text style={styles.jobContextText}>
            {bookingCtx.customerName} · {bookingCtx.packageName} · {bookingCtx.dateLabel} at{" "}
            {bookingCtx.timeLabel}
            {bookingCtx.price != null ? ` · $${bookingCtx.price.toFixed(0)}` : ""}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>STEP 1 OF 2 — CHOOSE A CREW MEMBER</Text>

        {crewOptions.length === 0 ? (
          <View style={styles.noCrewBox}>
            <Ionicons name="people-outline" size={32} color={Colors.light.textTertiary} />
            <Text style={styles.noCrewText}>
              No active team members. Add crew in your Team tab.
            </Text>
          </View>
        ) : (
          <View style={styles.crewList}>
            {crewOptions.map((crew) => (
              <CrewRow
                key={crew.id}
                crew={crew}
                isSelected={selectedCrewId === crew.id}
                showUnavailable={showUnavailable}
                onSelect={() => setSelectedCrewId(crew.id)}
              />
            ))}
          </View>
        )}

        {crewOptions.some((c) => !c.isAvailable) && (
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelBlock}>
              <Text style={styles.toggleLabel}>Show unavailable crew</Text>
              <Text style={styles.toggleSubLabel}>Shows crew with scheduling conflicts.</Text>
            </View>
            <Switch
              value={showUnavailable}
              onValueChange={setShowUnavailable}
              trackColor={{ false: Colors.light.borderDefault, true: Colors.foamBlue }}
              thumbColor={Colors.white}
            />
          </View>
        )}

        <View style={styles.notesBlock}>
          <Text style={styles.sectionLabel}>NOTES FOR CREW MEMBER (OPTIONAL)</Text>
          <TextInput
            style={styles.notesInput}
            value={crewNotes}
            onChangeText={setCrewNotes}
            placeholder="Any special instructions for this job?"
            placeholderTextColor={Colors.light.textTertiary}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.reviewBtn, !selectedCrewId && { opacity: 0.45 }]}
          onPress={handleReview}
          disabled={!selectedCrewId}
          activeOpacity={0.8}
        >
          <Text style={styles.reviewBtnText}>Review Assignment</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.stepHint}>Step 1 of 2 — you'll confirm on the next screen</Text>
      </View>
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
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  navTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.h4,
    color: Colors.light.textPrimary,
  },
  navSpacer: { width: 32 },
  scrollContent: { padding: Spacing.md, paddingBottom: 140, gap: Spacing.md },
  jobContextBar: {
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.md,
    padding: Spacing.mdSm,
  },
  jobContextText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  sectionLabel: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
  },
  crewList: { gap: Spacing.sm },
  crewRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.mdSm,
    padding: Spacing.mdSm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.surface,
  },
  crewRowSelected: {
    borderWidth: 2,
    borderColor: Colors.foamBlue,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08)" } as object)
      : Shadows.light.level1),
  },
  crewRowDisabled: { backgroundColor: Colors.light.bgSecondary, opacity: 0.8 },
  crewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  crewAvatarText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
  crewInfo: { flex: 1 },
  crewName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
    marginBottom: 2,
  },
  crewAvailableText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.successLight,
    marginBottom: 2,
  },
  crewConflict: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.warningLight,
    marginBottom: 2,
  },
  crewJobCount: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
    marginBottom: Spacing.xs,
  },
  loadBarRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginTop: 2 },
  loadBarDots: { flexDirection: "row", gap: 3 },
  loadDot: { width: 12, height: 6, borderRadius: 3 },
  loadLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.mdSm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  toggleLabelBlock: { flex: 1, paddingRight: Spacing.md },
  toggleLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    marginBottom: 2,
  },
  toggleSubLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    lineHeight: 16,
  },
  notesBlock: { gap: Spacing.sm },
  notesInput: {
    height: 52,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.mdSm,
    paddingTop: Spacing.mdSm,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    backgroundColor: Colors.light.surface,
  },
  noCrewBox: { alignItems: "center", gap: Spacing.mdSm, paddingVertical: Spacing.xl },
  noCrewText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    textAlign: "center",
    maxWidth: 260,
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
    gap: Spacing.xs,
  },
  reviewBtn: {
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  reviewBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  stepHint: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    textAlign: "center",
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
