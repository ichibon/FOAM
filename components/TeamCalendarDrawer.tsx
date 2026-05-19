import { useEffect, useState, useCallback } from "react";
import type { ComponentProps } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerModal } from "@/components/DrawerModal";
import { DrawerHeader } from "@/components/DrawerHeader";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalJob {
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

export interface CrewMember {
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

const SLOT_HEIGHT = 60;
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const TOTAL_HOUR_SLOTS = DAY_END_HOUR - DAY_START_HOUR;
const CREW_COL_MIN_WIDTH = 90;
const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const TIME_GUTTER_W = 44;

const CREW_COLORS = [
  "#339DC7", "#2D9E8F", "#4B6CB7", "#7B61C4",
  "#4A9E6B", "#C76B33", "#C7336B", "#6B9EC7",
];

export function crewColor(index: number): string {
  return CREW_COLORS[index % CREW_COLORS.length];
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
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

export function formatDayLabel(date: Date): string {
  return isToday(date)
    ? `Today · ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  if (sameMonth) {
    return weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric" }) +
      " – " + weekEnd.toLocaleDateString("en-US", { day: "numeric" });
  }
  return weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " – " + weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatHour(h: number): string {
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
  const memberMap: Record<string, { name: string; initials: string; index: number }> = {};

  if (members.length > 0) {
    const { data: userRows } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", members.map((m) => m.user_id));
    const userNameMap: Record<string, string> = {};
    for (const u of (userRows as Array<{ id: string; full_name: string | null }> | null) ?? []) {
      if (u.full_name) userNameMap[u.id] = u.full_name;
    }
    members.forEach((m, idx) => {
      const name = userNameMap[m.user_id] ?? "Crew";
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

// ─── Crew-column Day View ─────────────────────────────────────────────────────
// Each crew member is a column; rows are hour slots.
// Unassigned jobs appear in a trailing "Open" column.

type DayColumn = {
  colKey: string;
  label: string;
  initials: string;
  color: string;
};

function buildDayColumns(
  crew: CrewMember[],
  hasUnassigned: boolean,
  filterCrewId: string | null
): DayColumn[] {
  const visibleCrew = filterCrewId ? crew.filter((m) => m.id === filterCrewId) : crew;
  const cols: DayColumn[] = visibleCrew.map((m, idx) => ({
    colKey: m.id,
    label: m.name.split(" ")[0],
    initials: m.initials,
    color: crewColor(idx),
  }));
  if (hasUnassigned && !filterCrewId) {
    cols.push({ colKey: "__unassigned__", label: "Open", initials: "—", color: Colors.light.borderDefault });
  }
  return cols;
}

export function DayView({
  jobs,
  crew,
  filterCrewId,
}: {
  jobs: CalJob[];
  crew: CrewMember[];
  filterCrewId: string | null;
}) {
  const hasUnassigned = jobs.some((j) => !j.crewMemberId);
  const totalGridH = TOTAL_HOUR_SLOTS * SLOT_HEIGHT;

  // Compute absolute top offset and clamped block height for a job
  function jobLayout(job: CalJob): { top: number; height: number } {
    const h = job.scheduledAt.getHours();
    const m = job.scheduledAt.getMinutes();
    const fractHour = h + m / 60;
    const top = (fractHour - DAY_START_HOUR) * SLOT_HEIGHT;
    const desired = (job.durationMins / 60) * SLOT_HEIGHT;
    const maxAvail = (DAY_END_HOUR - fractHour) * SLOT_HEIGHT;
    const height = Math.max(Math.min(desired, maxAvail), 26);
    return { top, height };
  }

  // Reusable time-gutter column (absolute labels at each hour line)
  function TimeGutter() {
    return (
      <View style={{ width: TIME_GUTTER_W }}>
        {Array.from({ length: TOTAL_HOUR_SLOTS }).map((_, i) => (
          <View
            key={i}
            style={{ position: "absolute", top: i * SLOT_HEIGHT + 4, width: TIME_GUTTER_W, alignItems: "flex-end", paddingRight: 8 }}
          >
            <Text style={gvStyles.timeLabel}>{formatHour(DAY_START_HOUR + i)}</Text>
          </View>
        ))}
      </View>
    );
  }

  // Reusable hour-grid-line background for a column
  function HourLines() {
    return (
      <>
        {Array.from({ length: TOTAL_HOUR_SLOTS }).map((_, i) => (
          <View
            key={i}
            style={{ position: "absolute", top: i * SLOT_HEIGHT, left: 0, right: 0, height: 1, backgroundColor: Colors.light.borderSubtle }}
          />
        ))}
      </>
    );
  }

  // Job block for a single job
  function JobBlock({ job, color }: { job: CalJob; color: string }) {
    const { top, height } = jobLayout(job);
    return (
      <View style={[gvStyles.absJobBlock, { top, height, backgroundColor: color }]}>
        <Text style={gvStyles.chipCustomer} numberOfLines={1}>{job.customerName.split(" ")[0]}</Text>
        {height > 38 && <Text style={gvStyles.chipPkg} numberOfLines={1}>{job.packageName}</Text>}
      </View>
    );
  }

  // Solo operator (no team): single-column absolute timeline
  if (crew.length === 0) {
    const visibleJobs = jobs.filter((j) => {
      const h = j.scheduledAt.getHours();
      return h >= DAY_START_HOUR && h < DAY_END_HOUR;
    });

    return (
      <ScrollView style={gvStyles.scroll} contentContainerStyle={gvStyles.content} showsVerticalScrollIndicator={false}>
        {jobs.length === 0 ? (
          <View style={gvStyles.empty}>
            <Ionicons name="calendar-outline" size={36} color={Colors.light.textDisabled} />
            <Text style={gvStyles.emptyText}>No jobs scheduled</Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", height: totalGridH }}>
            <TimeGutter />
            <View style={{ flex: 1, position: "relative", borderLeftWidth: 1, borderLeftColor: Colors.light.borderSubtle }}>
              <HourLines />
              {visibleJobs.map((job) => (
                <JobBlock key={job.id} job={job} color={Colors.foamBlue} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  // Team view: crew-column grid
  const columns = buildDayColumns(crew, hasUnassigned, filterCrewId);

  // Job map: colKey → CalJob[]
  const jobsByCol: Record<string, CalJob[]> = {};
  for (const col of columns) jobsByCol[col.colKey] = [];
  for (const job of jobs) {
    const h = job.scheduledAt.getHours();
    if (h < DAY_START_HOUR || h >= DAY_END_HOUR) continue;
    const colKey = job.crewMemberId ?? "__unassigned__";
    if (jobsByCol[colKey]) jobsByCol[colKey].push(job);
  }

  return (
    <ScrollView style={gvStyles.scroll} contentContainerStyle={gvStyles.content} showsVerticalScrollIndicator={false}>
      {/* Crew header row */}
      <View style={[gvStyles.row, gvStyles.headerRow]}>
        <View style={gvStyles.timeGutter} />
        {columns.map((col) => (
          <View key={col.colKey} style={[gvStyles.cell, gvStyles.crewHeaderCell]}>
            <View style={[gvStyles.crewAvatar, { backgroundColor: col.color }]}>
              <Text style={gvStyles.crewAvatarText}>{col.initials}</Text>
            </View>
            <Text style={gvStyles.crewName} numberOfLines={1}>{col.label}</Text>
          </View>
        ))}
      </View>

      {/* Grid body — absolutely positioned jobs */}
      <View style={{ flexDirection: "row", height: totalGridH }}>
        <TimeGutter />
        {columns.map((col) => (
          <View key={col.colKey} style={{ flex: 1, minWidth: CREW_COL_MIN_WIDTH, position: "relative", borderLeftWidth: 1, borderLeftColor: Colors.light.borderSubtle }}>
            <HourLines />
            {(jobsByCol[col.colKey] ?? []).map((job) => (
              <JobBlock key={job.id} job={job} color={col.color} />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const gvStyles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  row: {
    flexDirection: "row",
    height: SLOT_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  headerRow: { height: 52 },
  timeGutter: {
    width: TIME_GUTTER_W,
    alignItems: "flex-end",
    paddingRight: 8,
    paddingTop: 8,
    flexShrink: 0,
  },
  timeLabel: { fontFamily: Typography.body, fontSize: 10, color: Colors.light.textTertiary },
  cell: {
    flex: 1,
    minWidth: CREW_COL_MIN_WIDTH,
    borderLeftWidth: 1,
    borderLeftColor: Colors.light.borderSubtle,
    padding: 3,
    gap: 2,
  },
  crewHeaderCell: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 6,
  },
  crewAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  crewAvatarText: { fontFamily: Typography.bodySemiBold, fontSize: 9, color: Colors.white },
  crewName: { fontFamily: Typography.bodyMedium, fontSize: 10, color: Colors.light.textSecondary, textAlign: "center" },
  jobChip: {
    borderRadius: Radius.xs,
    paddingHorizontal: 4,
    paddingVertical: 3,
    marginBottom: 1,
    ...Shadows.light.level1,
  },
  absJobBlock: {
    position: "absolute",
    left: 3,
    right: 3,
    borderRadius: Radius.xs,
    paddingHorizontal: 4,
    paddingVertical: 3,
    overflow: "hidden",
    ...Shadows.light.level1,
  },
  chipCustomer: { fontFamily: Typography.bodySemiBold, fontSize: 10, color: Colors.white },
  chipPkg: { fontFamily: Typography.body, fontSize: 9, color: "rgba(255,255,255,0.85)" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontFamily: Typography.bodySemiBold, fontSize: 15, color: Colors.light.textSecondary },
});

// ─── Week View ────────────────────────────────────────────────────────────────
// Each of the 7 days is a column; rows are hour slots.

export function WeekView({
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

  // Group by day index and hour
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

  return (
    <ScrollView style={wvStyles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={wvStyles.content}>
      {/* Day header row */}
      <View style={[wvStyles.row, wvStyles.headerRow]}>
        <View style={{ width: TIME_GUTTER_W, flexShrink: 0 }} />
        {weekDays.map((d, i) => {
          const todayDay = isToday(d);
          return (
            <TouchableOpacity key={i} style={wvStyles.cell} onPress={() => onDayPress(d)} activeOpacity={0.7}>
              <Text style={wvStyles.dayLetter}>{WEEK_DAYS[d.getDay()]}</Text>
              <View style={[wvStyles.dayNumberWrap, todayDay && wvStyles.todayCircle]}>
                <Text style={[wvStyles.dayNumber, todayDay && wvStyles.todayText]}>{d.getDate()}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hour rows */}
      {Array.from({ length: TOTAL_HOUR_SLOTS }).map((_, slotIdx) => {
        const hour = DAY_START_HOUR + slotIdx;
        return (
          <View key={slotIdx} style={wvStyles.row}>
            <View style={[wvStyles.timeGutter]}>
              <Text style={wvStyles.timeLabel}>{formatHour(hour)}</Text>
            </View>
            {weekDays.map((d, dayIdx) => {
              const cellJobs = gridMap[dayIdx][slotIdx] ?? [];
              return (
                <TouchableOpacity
                  key={dayIdx}
                  style={[wvStyles.cell, isToday(d) && wvStyles.todayCell]}
                  onPress={() => onDayPress(d)}
                  activeOpacity={0.85}
                >
                  {cellJobs.map((job) => (
                    <View
                      key={job.id}
                      style={[wvStyles.dot, { backgroundColor: job.crewMemberId ? crewColor(job.crewIndex) : Colors.light.borderDefault }]}
                    >
                      <Text style={wvStyles.dotText} numberOfLines={1}>{job.customerName.split(" ")[0]}</Text>
                    </View>
                  ))}
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

const wvStyles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },
  row: {
    flexDirection: "row",
    height: SLOT_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  headerRow: { height: 52 },
  timeGutter: { width: TIME_GUTTER_W, alignItems: "flex-end", paddingRight: 8, paddingTop: 8, flexShrink: 0 },
  timeLabel: { fontFamily: Typography.body, fontSize: 10, color: Colors.light.textTertiary },
  cell: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: Colors.light.borderSubtle,
    padding: 2,
    gap: 2,
  },
  todayCell: { backgroundColor: "rgba(51,157,199,0.04)" },
  dayLetter: {
    fontFamily: Typography.bodyMedium,
    fontSize: 10,
    color: Colors.light.textTertiary,
    textTransform: "uppercase",
    textAlign: "center",
    paddingTop: 4,
  },
  dayNumberWrap: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", alignSelf: "center", marginTop: 1 },
  todayCircle: { backgroundColor: Colors.foamBlue },
  dayNumber: { fontFamily: Typography.bodyMedium, fontSize: 12, color: Colors.light.textSecondary },
  todayText: { color: Colors.white, fontFamily: Typography.bodySemiBold },
  dot: { borderRadius: Radius.xs, paddingHorizontal: 3, paddingVertical: 2, marginBottom: 1 },
  dotText: { fontFamily: Typography.bodyMedium, fontSize: 9, color: Colors.white },
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
        const result = await fetchRange(detailerId, dayStart(selectedDate), dayEnd(selectedDate));
        setJobs(result.jobs);
        setCrew(result.crew);
      } else {
        const result = await fetchRange(detailerId, weekStart, dayEnd(addDays(weekStart, 6)));
        setJobs(result.jobs);
        setCrew(result.crew);
      }
    } catch (err) {
      console.warn("[TeamCalendar] loadJobs error", err);
    }
    setLoading(false);
  }, [detailerId, viewMode, selectedDate, weekStart]);

  useEffect(() => {
    if (visible) loadJobs();
  }, [visible, loadJobs]);

  useEffect(() => {
    if (visible) {
      const today = new Date();
      setSelectedDate(today);
      setWeekStart(getWeekStart(today));
      setViewMode("day");
      setFilterCrewId(null);
    }
  }, [visible]);

  function handleDayPress(date: Date) {
    setSelectedDate(date);
    setViewMode("day");
  }

  function switchToWeek() {
    setWeekStart(getWeekStart(selectedDate));
    setViewMode("week");
  }

  function goToday() {
    const today = new Date();
    setSelectedDate(today);
    setWeekStart(getWeekStart(today));
  }

  // Right action for DrawerHeader: Week ↔ Today toggle
  const headerRightAction = (
    <TouchableOpacity
      style={styles.modeToggle}
      onPress={viewMode === "day" ? switchToWeek : goToday}
      activeOpacity={0.7}
    >
      <Text style={styles.modeToggleText}>{viewMode === "day" ? "Week" : "Today"}</Text>
    </TouchableOpacity>
  );

  return (
    <DrawerModal visible={visible} onRequestClose={onRequestClose}>
      {/* Shared drawer header — title + close + view-mode toggle */}
      <DrawerHeader
        title="Team Calendar"
        onClose={onRequestClose}
        rightAction={headerRightAction}
      />

      {/* Date / week navigation row */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={styles.navArrow}
          activeOpacity={0.7}
          onPress={() =>
            viewMode === "day"
              ? setSelectedDate((d) => addDays(d, -1))
              : setWeekStart((w) => addDays(w, -7))
          }
        >
          <Ionicons name="chevron-back" size={18} color={Colors.light.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.navLabel}>
          {viewMode === "day" ? formatDayLabel(selectedDate) : formatWeekRange(weekStart)}
        </Text>

        <TouchableOpacity
          style={styles.navArrow}
          activeOpacity={0.7}
          onPress={() =>
            viewMode === "day"
              ? setSelectedDate((d) => addDays(d, 1))
              : setWeekStart((w) => addDays(w, 7))
          }
        >
          <Ionicons name="chevron-forward" size={18} color={Colors.light.textPrimary} />
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
                style={[styles.chip, isSelected && { backgroundColor: color, borderColor: color }]}
                onPress={() => setFilterCrewId(isSelected ? null : m.id)}
              >
                <View style={[styles.crewDot, { backgroundColor: isSelected ? Colors.white : color }]} />
                <Text style={[styles.chipText, isSelected && { color: Colors.white }]}>
                  {m.name.split(" ")[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.divider} />

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.foamBlue} />
        </View>
      ) : viewMode === "day" ? (
        <DayView jobs={jobs} crew={crew} filterCrewId={filterCrewId} />
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
  modeToggle: { paddingHorizontal: 4, paddingVertical: 4 },
  modeToggleText: { fontFamily: Typography.bodyMedium, fontSize: 14, color: Colors.foamBlue },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
    gap: 8,
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  navLabel: {
    flex: 1,
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  chipScroll: { maxHeight: 50, backgroundColor: Colors.light.surface },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    alignItems: "center",
  },
  chip: {
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
  chipActive: { backgroundColor: Colors.foamBlue, borderColor: Colors.foamBlue },
  chipText: { fontFamily: Typography.bodyMedium, fontSize: 13, color: Colors.light.textSecondary },
  chipTextActive: { color: Colors.white },
  crewDot: { width: 8, height: 8, borderRadius: 4 },
  divider: { height: 1, backgroundColor: Colors.light.borderSubtle },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
});
