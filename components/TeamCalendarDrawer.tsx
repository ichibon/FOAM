import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { DrawerModal } from "@/components/DrawerModal";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalJob {
  id: string;
  scheduledAt: Date;
  durationMins: number;
  customerName: string;
  packageName: string;
  status: string;
  crewMemberId: string | null;
  crewInitials?: string;
  crewIndex: number;
}

interface CrewMember {
  id: string;
  name: string;
  initials: string;
}

export interface TeamCalendarDrawerProps {
  visible: boolean;
  onRequestClose: () => void;
  detailerId: string;
}

type ViewMode = "day" | "week";

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOT_HEIGHT = 60; // px per hour slot
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const TOTAL_HOUR_SLOTS = DAY_END_HOUR - DAY_START_HOUR;
const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;

const CREW_COLORS = [
  "#339DC7", "#2D9E8F", "#4B6CB7", "#7B61C4",
  "#4A9E6B", "#C76B33", "#C7336B", "#6B9EC7",
];

function crewColor(index: number): string {
  return CREW_COLORS[index % CREW_COLORS.length];
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - dow);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function dayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
}

function dayEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
}

function formatDayHeader(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();
  if (sameMonth) {
    return weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric" }) +
      " – " + weekEnd.toLocaleDateString("en-US", { day: "numeric", year: "numeric" });
  }
  return (
    weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " – " +
    weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  );
}

function formatHour(h: number): string {
  if (h === 0 || h === 24) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ─── Supabase fetch ───────────────────────────────────────────────────────────

async function fetchRange(
  detailerId: string,
  start: Date,
  end: Date
): Promise<{ jobs: CalJob[]; crew: CrewMember[] }> {
  const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
  const supabase = getSupabase();

  const [{ data: rawBookings }, { data: rawMembers }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, status, scheduled_at, estimated_duration_mins, crew_member_id," +
        "users!bookings_customer_id_fkey(full_name)," +
        "service_packages(name)"
      )
      .eq("detailer_id", detailerId)
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())
      .order("scheduled_at"),
    supabase
      .from("team_members")
      .select("id, user_id")
      .eq("manager_id", detailerId),
  ]);

  const members = (rawMembers as Array<{ id: string; user_id: string }> | null) ?? [];
  let memberMap: Record<string, { name: string; initials: string; index: number }> = {};

  if (members.length > 0) {
    const { data: userRows } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", members.map((m) => m.user_id));
    const userIdToName: Record<string, string> = {};
    for (const u of (userRows as Array<{ id: string; full_name: string | null }> | null) ?? []) {
      if (u.full_name) userIdToName[u.id] = u.full_name;
    }
    members.forEach((m, idx) => {
      const name = userIdToName[m.user_id] ?? "Crew";
      memberMap[m.id] = { name, initials: getInitials(name), index: idx };
    });
  }

  const crewList: CrewMember[] = members.map((m) => ({
    id: m.id,
    name: memberMap[m.id]?.name ?? "Crew",
    initials: memberMap[m.id]?.initials ?? "??",
  }));

  type RawBooking = {
    id: string;
    status: string;
    scheduled_at: string;
    estimated_duration_mins: number | null;
    crew_member_id: string | null;
    users: { full_name: string | null } | null;
    service_packages: { name: string } | null;
  };

  const jobs: CalJob[] = ((rawBookings as RawBooking[] | null) ?? []).map((b) => {
    const crewInfo = b.crew_member_id ? memberMap[b.crew_member_id] : undefined;
    return {
      id: b.id,
      scheduledAt: new Date(b.scheduled_at),
      durationMins: b.estimated_duration_mins ?? 60,
      customerName: b.users?.full_name ?? "Customer",
      packageName: b.service_packages?.name ?? "Service",
      status: b.status,
      crewMemberId: b.crew_member_id,
      crewInitials: crewInfo?.initials,
      crewIndex: crewInfo?.index ?? 0,
    };
  });

  return { jobs, crew: crewList };
}

// ─── Day-view job block ───────────────────────────────────────────────────────

function DayJobBlock({ job }: { job: CalJob }) {
  const slotCount = Math.max(1, Math.round(job.durationMins / 60));
  const blockHeight = slotCount * SLOT_HEIGHT - 4;
  const isUnassigned = !job.crewMemberId;
  const bgColor = isUnassigned ? Colors.light.bgPrimary : crewColor(job.crewIndex);

  return (
    <View
      style={[
        dayStyles.block,
        {
          height: blockHeight,
          backgroundColor: bgColor,
          borderWidth: isUnassigned ? 2 : 0,
          borderColor: isUnassigned ? Colors.light.borderDefault : "transparent",
          borderStyle: "dashed",
          opacity: job.status === "completed" ? 0.6 : 1,
        },
        !isUnassigned ? Shadows.light.level1 : null,
      ]}
    >
      {!isUnassigned && (
        <View style={dayStyles.blockHeader}>
          <View style={[dayStyles.avatar, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
            <Text style={dayStyles.avatarText}>{job.crewInitials ?? "?"}</Text>
          </View>
          <View style={dayStyles.blockMeta}>
            <Text style={dayStyles.customer} numberOfLines={1}>{job.customerName}</Text>
            <Text style={dayStyles.pkg} numberOfLines={1}>{job.packageName}</Text>
          </View>
        </View>
      )}
      {isUnassigned && (
        <View style={dayStyles.blockHeader}>
          <Ionicons name="calendar-outline" size={14} color={Colors.foamBlue} />
          <View style={dayStyles.blockMeta}>
            <Text style={[dayStyles.customer, { color: Colors.foamBlue }]} numberOfLines={1}>
              {job.customerName}
            </Text>
            <Text style={[dayStyles.pkg, { color: Colors.light.textTertiary }]} numberOfLines={1}>
              Unassigned
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const dayStyles = StyleSheet.create({
  block: { borderRadius: Radius.md, padding: 8, marginBottom: 4, overflow: "hidden" },
  blockHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  avatar: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontFamily: Typography.bodySemiBold, fontSize: 9, color: Colors.white },
  blockMeta: { flex: 1 },
  customer: { fontFamily: Typography.bodySemiBold, fontSize: 12, color: Colors.white },
  pkg: { fontFamily: Typography.body, fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 1 },
});

// ─── Day view ─────────────────────────────────────────────────────────────────

function DayView({
  jobs,
  filterCrewId,
}: {
  jobs: CalJob[];
  filterCrewId: string | null;
}) {
  const filtered = filterCrewId ? jobs.filter((j) => j.crewMemberId === filterCrewId) : jobs;

  // Map each job to its starting hour slot
  const startSlotMap: Record<number, CalJob[]> = {};
  for (const job of filtered) {
    const h = job.scheduledAt.getHours();
    if (h < DAY_START_HOUR || h >= DAY_END_HOUR) continue;
    const slotIdx = h - DAY_START_HOUR;
    if (!startSlotMap[slotIdx]) startSlotMap[slotIdx] = [];
    startSlotMap[slotIdx].push(job);
  }

  return (
    <ScrollView
      style={dvStyles.scroll}
      contentContainerStyle={dvStyles.content}
      showsVerticalScrollIndicator={false}
    >
      {Array.from({ length: TOTAL_HOUR_SLOTS }).map((_, slotIdx) => {
        const hour = DAY_START_HOUR + slotIdx;
        const slotJobs = startSlotMap[slotIdx] ?? [];
        return (
          <View key={slotIdx} style={dvStyles.slotRow}>
            <View style={dvStyles.slotLabel}>
              <Text style={dvStyles.slotLabelText}>{formatHour(hour)}</Text>
            </View>
            <View style={dvStyles.slotCell}>
              <View style={dvStyles.slotLine} />
              {slotJobs.map((job) => (
                <DayJobBlock key={job.id} job={job} />
              ))}
            </View>
          </View>
        );
      })}

      {filtered.length === 0 && (
        <View style={dvStyles.empty}>
          <Ionicons name="calendar-outline" size={36} color={Colors.light.textDisabled} />
          <Text style={dvStyles.emptyText}>No jobs scheduled</Text>
        </View>
      )}
    </ScrollView>
  );
}

const dvStyles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingTop: 6, paddingBottom: 48 },
  slotRow: { flexDirection: "row", minHeight: SLOT_HEIGHT },
  slotLabel: { width: 54, paddingTop: 4, alignItems: "flex-end", paddingRight: 10 },
  slotLabelText: { fontFamily: Typography.body, fontSize: 11, color: Colors.light.textTertiary },
  slotCell: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: Colors.light.borderSubtle,
    paddingLeft: 10,
    paddingRight: 12,
    paddingTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  slotLine: {
    position: "absolute", left: 0, top: 0,
    width: 6, height: 1,
    backgroundColor: Colors.light.borderSubtle,
  },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontFamily: Typography.bodySemiBold, fontSize: 15, color: Colors.light.textSecondary },
});

// ─── Week view ────────────────────────────────────────────────────────────────

function WeekView({
  weekStart,
  jobs,
  filterCrewId,
  onDayPress,
}: {
  weekStart: Date;
  jobs: CalJob[];
  filterCrewId: string | null;
  onDayPress: (date: Date) => void;
}) {
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const filtered = filterCrewId ? jobs.filter((j) => j.crewMemberId === filterCrewId) : jobs;

  // Group jobs by day index (0–6) and hour
  const gridMap: Record<number, Record<number, CalJob[]>> = {};
  for (let i = 0; i < 7; i++) gridMap[i] = {};

  for (const job of filtered) {
    const dayIdx = weekDays.findIndex((d) => isSameDay(d, job.scheduledAt));
    if (dayIdx < 0) continue;
    const h = job.scheduledAt.getHours();
    if (h < DAY_START_HOUR || h >= DAY_END_HOUR) continue;
    const slotIdx = h - DAY_START_HOUR;
    if (!gridMap[dayIdx][slotIdx]) gridMap[dayIdx][slotIdx] = [];
    gridMap[dayIdx][slotIdx].push(job);
  }

  const today = new Date();

  return (
    <ScrollView
      style={wvStyles.scroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={wvStyles.content}
    >
      {/* Sticky day header row */}
      <View style={wvStyles.dayHeaderRow}>
        <View style={wvStyles.timeGutter} />
        {weekDays.map((d, i) => {
          const todayDay = isToday(d);
          return (
            <TouchableOpacity
              key={i}
              style={wvStyles.dayHeaderCell}
              onPress={() => onDayPress(d)}
              activeOpacity={0.7}
            >
              <Text style={wvStyles.dayLetterText}>{WEEK_DAYS[d.getDay()]}</Text>
              <View style={[wvStyles.dayNumberWrap, todayDay && wvStyles.todayCircle]}>
                <Text style={[wvStyles.dayNumberText, todayDay && wvStyles.todayText]}>
                  {d.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Grid */}
      {Array.from({ length: TOTAL_HOUR_SLOTS }).map((_, slotIdx) => {
        const hour = DAY_START_HOUR + slotIdx;
        return (
          <View key={slotIdx} style={wvStyles.gridRow}>
            {/* Time label */}
            <View style={wvStyles.timeGutter}>
              <Text style={wvStyles.timeLabel}>{formatHour(hour)}</Text>
            </View>
            {/* Day cells */}
            {weekDays.map((_, dayIdx) => {
              const cellJobs = gridMap[dayIdx][slotIdx] ?? [];
              const isCurrentDay = isToday(weekDays[dayIdx]);
              return (
                <View
                  key={dayIdx}
                  style={[wvStyles.gridCell, isCurrentDay && wvStyles.gridCellToday]}
                >
                  {cellJobs.map((job) => (
                    <View
                      key={job.id}
                      style={[
                        wvStyles.jobDot,
                        {
                          backgroundColor: job.crewMemberId
                            ? crewColor(job.crewIndex)
                            : Colors.light.borderDefault,
                        },
                      ]}
                    >
                      <Text style={wvStyles.jobDotText} numberOfLines={1}>
                        {job.customerName.split(" ")[0]}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

const WEEK_COL = 1; // relative flex weight per day column

const wvStyles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  dayHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.surface,
  },
  timeGutter: { width: 44, alignItems: "flex-end", paddingRight: 6, paddingTop: 4 },
  dayHeaderCell: { flex: WEEK_COL, alignItems: "center", paddingVertical: 6 },
  dayLetterText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 10,
    color: Colors.light.textTertiary,
    textTransform: "uppercase",
  },
  dayNumberWrap: { width: 24, height: 24, alignItems: "center", justifyContent: "center", marginTop: 2, borderRadius: 12 },
  todayCircle: { backgroundColor: Colors.foamBlue },
  dayNumberText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  todayText: { color: Colors.white, fontFamily: Typography.bodySemiBold },
  gridRow: {
    flexDirection: "row",
    height: SLOT_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  timeLabel: {
    fontFamily: Typography.body,
    fontSize: 10,
    color: Colors.light.textTertiary,
    marginTop: 4,
  },
  gridCell: {
    flex: WEEK_COL,
    borderLeftWidth: 1,
    borderLeftColor: Colors.light.borderSubtle,
    padding: 2,
    gap: 2,
  },
  gridCellToday: { backgroundColor: "rgba(51,157,199,0.04)" },
  jobDot: {
    borderRadius: Radius.xs,
    paddingHorizontal: 3,
    paddingVertical: 2,
    marginBottom: 1,
  },
  jobDotText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 9,
    color: Colors.white,
  },
});

// ─── Main component ───────────────────────────────────────────────────────────

export function TeamCalendarDrawer({
  visible,
  onRequestClose,
  detailerId,
}: TeamCalendarDrawerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [jobs, setJobs] = useState<CalJob[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCrewId, setFilterCrewId] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    if (!detailerId) return;
    setLoading(true);
    try {
      if (viewMode === "day") {
        const { jobs: loaded, crew: loadedCrew } = await fetchRange(
          detailerId,
          dayStart(selectedDate),
          dayEnd(selectedDate)
        );
        setJobs(loaded);
        setCrew(loadedCrew);
      } else {
        const { jobs: loaded, crew: loadedCrew } = await fetchRange(
          detailerId,
          weekStart,
          dayEnd(addDays(weekStart, 6))
        );
        setJobs(loaded);
        setCrew(loadedCrew);
      }
    } catch (err) {
      console.warn("[TeamCalendar] loadJobs error", err);
    }
    setLoading(false);
  }, [detailerId, viewMode, selectedDate, weekStart]);

  useEffect(() => {
    if (visible) loadJobs();
  }, [visible, loadJobs]);

  // Reset to today when drawer opens
  useEffect(() => {
    if (visible) {
      const today = new Date();
      setSelectedDate(today);
      setWeekStart(getWeekStart(today));
      setViewMode("day");
    }
  }, [visible]);

  function handleDayPress(date: Date) {
    setSelectedDate(date);
    setViewMode("day");
  }

  function handleGoToday() {
    const today = new Date();
    setSelectedDate(today);
    setWeekStart(getWeekStart(today));
  }

  const dayLabel = isToday(selectedDate)
    ? `Today · ${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : formatDayHeader(selectedDate);

  return (
    <DrawerModal visible={visible} onRequestClose={onRequestClose}>
      {/* ── Top navigation ── */}
      <View style={styles.headerRow}>
        {viewMode === "day" ? (
          <>
            <TouchableOpacity style={styles.navArrow} onPress={() => setSelectedDate((d) => addDays(d, -1))} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color={Colors.light.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{dayLabel}</Text>
            <TouchableOpacity
              style={styles.weekBtn}
              onPress={() => { setWeekStart(getWeekStart(selectedDate)); setViewMode("week"); }}
            >
              <Text style={styles.weekBtnText}>Week</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.navArrow} onPress={() => setWeekStart((w) => addDays(w, -7))} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color={Colors.light.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{formatWeekRange(weekStart)}</Text>
            <TouchableOpacity style={styles.weekBtn} onPress={handleGoToday}>
              <Text style={styles.weekBtnText}>Today</Text>
            </TouchableOpacity>
          </>
        )}
        {viewMode === "week" && (
          <TouchableOpacity
            style={[styles.navArrow, { marginLeft: 4 }]}
            onPress={() => setWeekStart((w) => addDays(w, 7))}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={20} color={Colors.light.textPrimary} />
          </TouchableOpacity>
        )}
        {viewMode === "day" && (
          <TouchableOpacity style={styles.navArrow} onPress={() => setSelectedDate((d) => addDays(d, 1))} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={20} color={Colors.light.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Crew filter chips ── */}
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
                style={[styles.chip, isSelected && { backgroundColor: color, borderColor: color }]}
                onPress={() => setFilterCrewId(isSelected ? null : m.id)}
              >
                <View style={[styles.crewDot, { backgroundColor: isSelected ? "#fff" : color }]} />
                <Text style={[styles.chipText, isSelected && { color: Colors.white }]}>
                  {m.name.split(" ")[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.divider} />

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.foamBlue} />
        </View>
      ) : viewMode === "day" ? (
        <DayView jobs={jobs} filterCrewId={filterCrewId} />
      ) : (
        <WeekView
          weekStart={weekStart}
          jobs={jobs}
          filterCrewId={filterCrewId}
          onDayPress={handleDayPress}
        />
      )}
    </DrawerModal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.mdSm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
    gap: 8,
  },
  navArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  weekBtn: { paddingHorizontal: 10, paddingVertical: 6, flexShrink: 0 },
  weekBtnText: { fontFamily: Typography.bodyMedium, fontSize: 14, color: Colors.foamBlue },
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
  chipActive: { backgroundColor: Colors.foamBlue, borderColor: Colors.foamBlue },
  chipText: { fontFamily: Typography.bodyMedium, fontSize: 13, color: Colors.light.textSecondary },
  chipTextActive: { color: Colors.white },
  crewDot: { width: 8, height: 8, borderRadius: 4 },
  divider: { height: 1, backgroundColor: Colors.light.borderSubtle },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
});
