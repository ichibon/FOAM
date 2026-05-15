import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerModal } from "@/components/DrawerModal";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalJob {
  id: string;
  scheduledAt: Date;
  durationMins: number;
  customerName: string;
  vehicleDesc: string;
  packageName: string;
  status: string;
  crewMemberId: string | null;
  crewName?: string;
  crewInitials?: string;
}

interface CrewMember {
  id: string;
  name: string;
  initials: string;
}

interface TeamCalendarDrawerProps {
  visible: boolean;
  onRequestClose: () => void;
  detailerId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOT_HEIGHT = 56; // px per 30-min slot
const DAY_START_HOUR = 7;
const DAY_END_HOUR = 20;
const TOTAL_SLOTS = (DAY_END_HOUR - DAY_START_HOUR) * 2;

const CREW_COLORS = [
  "#339DC7", "#2D9E8F", "#4B6CB7", "#7B61C4",
  "#4A9E6B", "#C76B33", "#C7336B", "#6B9EC7",
];

function crewColor(index: number): string {
  return CREW_COLORS[index % CREW_COLORS.length];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHour(h: number): string {
  if (h === 0 || h === 24) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function formatSlotLabel(slotIndex: number): string {
  const totalMins = (DAY_START_HOUR * 60) + slotIndex * 30;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (m === 0) return formatHour(h);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateHeader(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatTime(date: Date): string {
  let h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ─── JobBlock rendered in timeline ────────────────────────────────────────────

function JobBlock({
  job,
  crewIndex,
}: {
  job: CalJob;
  crewIndex: number;
}) {
  const slots = Math.max(1, Math.round(job.durationMins / 30));
  const blockHeight = slots * SLOT_HEIGHT - 6;
  const bgColor = job.crewMemberId ? crewColor(crewIndex) : Colors.light.bgSecondary;
  const isUnassigned = !job.crewMemberId;
  const isCompleted = job.status === "completed";

  return (
    <View
      style={[
        styles.jobBlock,
        {
          height: blockHeight,
          backgroundColor: isUnassigned ? Colors.light.bgPrimary : bgColor,
          borderWidth: isUnassigned ? 2 : 0,
          borderColor: isUnassigned ? Colors.light.borderDefault : "transparent",
          borderStyle: isUnassigned ? "dashed" : "solid",
          opacity: isCompleted ? 0.65 : 1,
        },
        !isUnassigned &&
          (Platform.OS === "web"
            ? { boxShadow: "0 2px 8px rgba(0,0,0,0.14)" }
            : Shadows.light.level2),
      ]}
    >
      {/* Crew avatar row */}
      {!isUnassigned && (
        <View style={styles.jobBlockHeader}>
          <View style={[styles.jobCrewAvatar, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
            <Text style={[styles.jobCrewAvatarText, { color: "#fff" }]}>
              {job.crewInitials ?? "??"}
            </Text>
          </View>
          <View style={styles.jobBlockInfo}>
            <Text style={styles.jobCustomer} numberOfLines={1}>
              {job.customerName}
            </Text>
            <Text style={styles.jobPackage} numberOfLines={1}>
              {job.packageName}
            </Text>
          </View>
        </View>
      )}
      {isUnassigned && (
        <View style={styles.jobBlockHeader}>
          <Ionicons name="calendar-outline" size={16} color={Colors.foamBlue} />
          <View style={styles.jobBlockInfo}>
            <Text style={[styles.jobCustomer, { color: Colors.foamBlue }]} numberOfLines={1}>
              {formatTime(job.scheduledAt)} — {job.customerName}
            </Text>
            <Text style={[styles.jobPackage, { color: Colors.light.textSecondary }]} numberOfLines={1}>
              Unassigned
            </Text>
          </View>
        </View>
      )}
      {blockHeight > 56 && (
        <Text
          style={[
            styles.jobDuration,
            { color: isUnassigned ? Colors.light.textTertiary : "rgba(255,255,255,0.7)" },
          ]}
        >
          {job.durationMins >= 60
            ? `${Math.floor(job.durationMins / 60)}h ${job.durationMins % 60 > 0 ? `${job.durationMins % 60}m` : ""}`
            : `${job.durationMins}m`}
        </Text>
      )}
      {isCompleted && (
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark" size={10} color={Colors.white} />
        </View>
      )}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function TeamCalendarDrawer({
  visible,
  onRequestClose,
  detailerId,
}: TeamCalendarDrawerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [jobs, setJobs] = useState<CalJob[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCrewId, setFilterCrewId] = useState<string | null>(null);

  const fetchJobs = useCallback(
    async (date: Date) => {
      if (!detailerId) return;
      setLoading(true);
      try {
        const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
        const supabase = getSupabase();

        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
        const end = new Date(
          date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59
        ).toISOString();

        const [{ data: rawBookings }, { data: rawMembers }] = await Promise.all([
          supabase
            .from("bookings")
            .select(
              "id, status, scheduled_at, estimated_duration_mins, crew_member_id," +
              "users!bookings_customer_id_fkey(full_name)," +
              "vehicles(make, model, year, color)," +
              "service_packages(name)"
            )
            .eq("detailer_id", detailerId)
            .gte("scheduled_at", start)
            .lte("scheduled_at", end)
            .order("scheduled_at"),
          supabase
            .from("team_members")
            .select("id, user_id")
            .eq("manager_id", detailerId),
        ]);

        // Fetch user names for crew
        const members = (rawMembers as Array<{ id: string; user_id: string }> | null) ?? [];
        let memberMap: Record<string, { name: string; initials: string; index: number }> = {};
        if (members.length > 0) {
          const uids = members.map((m) => m.user_id);
          const { data: userRows } = await supabase
            .from("users")
            .select("id, full_name")
            .in("id", uids);
          const userList = (userRows as Array<{ id: string; full_name: string | null }> | null) ?? [];
          const userIdToName: Record<string, string> = {};
          for (const u of userList) {
            if (u.full_name) userIdToName[u.id] = u.full_name;
          }
          members.forEach((m, idx) => {
            const name = userIdToName[m.user_id] ?? "Crew";
            memberMap[m.id] = { name, initials: getInitials(name), index: idx };
          });
        }

        const crewList: CrewMember[] = members.map((m, idx) => ({
          id: m.id,
          name: memberMap[m.id]?.name ?? "Crew",
          initials: memberMap[m.id]?.initials ?? "??",
          index: idx,
        }));
        setCrew(crewList);

        const bookingRows = (rawBookings as Array<{
          id: string;
          status: string;
          scheduled_at: string;
          estimated_duration_mins: number | null;
          crew_member_id: string | null;
          users: { full_name: string | null } | null;
          vehicles: { make: string | null; model: string | null; year: number | null; color: string | null } | null;
          service_packages: { name: string } | null;
        }> | null) ?? [];

        const calJobs: CalJob[] = bookingRows.map((b) => {
          const crew = b.crew_member_id ? memberMap[b.crew_member_id] : undefined;
          const veh = b.vehicles;
          const vehicleDesc = veh
            ? [veh.year, veh.make, veh.model].filter(Boolean).join(" ")
            : "Vehicle";
          return {
            id: b.id,
            scheduledAt: new Date(b.scheduled_at),
            durationMins: b.estimated_duration_mins ?? 60,
            customerName: b.users?.full_name ?? "Customer",
            vehicleDesc,
            packageName: b.service_packages?.name ?? "Service",
            status: b.status,
            crewMemberId: b.crew_member_id,
            crewName: crew?.name,
            crewInitials: crew?.initials,
          };
        });
        setJobs(calJobs);
      } catch (err) {
        console.warn("[TeamCalendar] fetchJobs error", err);
      }
      setLoading(false);
    },
    [detailerId]
  );

  useEffect(() => {
    if (visible) {
      fetchJobs(selectedDate);
    }
  }, [visible, selectedDate, fetchJobs]);

  // Reset to today when drawer opens
  useEffect(() => {
    if (visible) setSelectedDate(new Date());
  }, [visible]);

  function navigateDay(delta: number) {
    setSelectedDate((d) => addDays(d, delta));
  }

  const filteredJobs = filterCrewId
    ? jobs.filter((j) => j.crewMemberId === filterCrewId)
    : jobs;

  // Build a slot → job map
  const slotJobMap: Record<number, CalJob> = {};
  for (const job of filteredJobs) {
    const h = job.scheduledAt.getHours();
    const m = job.scheduledAt.getMinutes();
    if (h < DAY_START_HOUR || h >= DAY_END_HOUR) continue;
    const slotIdx = (h - DAY_START_HOUR) * 2 + (m >= 30 ? 1 : 0);
    slotJobMap[slotIdx] = job;
  }
  const occupiedSlots = new Set<number>();
  for (const [slotStr, job] of Object.entries(slotJobMap)) {
    const slot = Number(slotStr);
    const slotsUsed = Math.max(1, Math.round(job.durationMins / 30));
    for (let i = 0; i < slotsUsed; i++) occupiedSlots.add(slot + i);
  }

  const dateLabel = isToday(selectedDate)
    ? `Today · ${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : formatDateHeader(selectedDate);

  return (
    <DrawerModal visible={visible} onRequestClose={onRequestClose}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.navArrow}
          onPress={() => navigateDay(-1)}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{dateLabel}</Text>
        <TouchableOpacity
          style={styles.navArrow}
          onPress={() => navigateDay(1)}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={20} color={Colors.light.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Crew filter chips */}
      {crew.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipRow}
        >
          <TouchableOpacity
            style={[styles.chip, !filterCrewId && styles.chipActive]}
            onPress={() => setFilterCrewId(null)}
          >
            <Text style={[styles.chipText, !filterCrewId && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {crew.map((m, idx) => {
            const isSelected = filterCrewId === m.id;
            const color = crewColor(idx);
            return (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.chip,
                  isSelected && { backgroundColor: color, borderColor: color },
                ]}
                onPress={() => setFilterCrewId(isSelected ? null : m.id)}
              >
                <View style={[styles.crewDot, { backgroundColor: isSelected ? "#fff" : color }]} />
                <Text
                  style={[
                    styles.chipText,
                    isSelected && { color: Colors.white },
                  ]}
                >
                  {m.name.split(" ")[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.divider} />

      {/* Timeline */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.foamBlue} />
        </View>
      ) : (
        <ScrollView
          style={styles.timelineScroll}
          contentContainerStyle={styles.timelineContent}
          showsVerticalScrollIndicator={false}
        >
          {Array.from({ length: TOTAL_SLOTS }).map((_, slotIdx) => {
            const job = slotJobMap[slotIdx];
            const isOccupied = occupiedSlots.has(slotIdx) && !slotJobMap[slotIdx];
            const showLabel = slotIdx % 2 === 0; // full hours only
            const crewIdx = job?.crewMemberId
              ? crew.findIndex((c) => c.id === job.crewMemberId)
              : 0;

            return (
              <View key={slotIdx} style={styles.slotRow}>
                {/* Time label */}
                <View style={styles.slotLabel}>
                  {showLabel && (
                    <Text style={styles.slotLabelText}>{formatSlotLabel(slotIdx)}</Text>
                  )}
                </View>
                {/* Content cell */}
                <View style={styles.slotCell}>
                  <View style={styles.slotLine} />
                  {job && !isOccupied ? (
                    <View style={styles.jobContainer}>
                      <JobBlock job={job} crewIndex={crewIdx} />
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
          {/* Empty state */}
          {filteredJobs.length === 0 && !loading && (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={36} color={Colors.light.textDisabled} />
              <Text style={styles.emptyText}>No jobs scheduled</Text>
              <Text style={styles.emptySubtext}>
                {filterCrewId ? "No jobs for this crew member" : "Nothing booked for this day."}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </DrawerModal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.mdSm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  navArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  dateLabel: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 16,
    color: Colors.light.textPrimary,
  },
  chipScroll: { maxHeight: 52, backgroundColor: Colors.light.surface },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.surface,
  },
  chipActive: {
    backgroundColor: Colors.foamBlue,
    borderColor: Colors.foamBlue,
  },
  chipText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  chipTextActive: { color: Colors.white },
  crewDot: { width: 8, height: 8, borderRadius: 4 },
  divider: { height: 1, backgroundColor: Colors.light.borderSubtle },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  timelineScroll: { flex: 1 },
  timelineContent: { paddingTop: 8, paddingBottom: 48 },
  slotRow: {
    flexDirection: "row",
    minHeight: SLOT_HEIGHT,
  },
  slotLabel: {
    width: 52,
    paddingTop: 4,
    alignItems: "flex-end",
    paddingRight: 10,
  },
  slotLabelText: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.light.textTertiary,
  },
  slotCell: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: Colors.light.borderSubtle,
    paddingLeft: 10,
    paddingRight: 14,
    paddingTop: 4,
    position: "relative",
  },
  slotLine: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 6,
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
  },
  jobContainer: { marginBottom: 4 },
  jobBlock: {
    borderRadius: Radius.md,
    padding: 10,
    overflow: "hidden",
  },
  jobBlockHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  jobCrewAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  jobCrewAvatarText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 10,
    color: Colors.white,
  },
  jobBlockInfo: { flex: 1 },
  jobCustomer: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 13,
    color: Colors.white,
  },
  jobPackage: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginTop: 1,
  },
  jobDuration: {
    fontFamily: Typography.body,
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
  },
  completedBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  emptySubtext: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.light.textTertiary,
  },
});
