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

// ─── Raw DB row shapes (avoids `any`) ─────────────────────────────────────────

interface RawBooking {
  id: string;
  status: string;
  scheduled_at: string;
  estimated_duration_mins: number | null;
  crew_member_id: string | null;
  notes: string | null;
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

// ─── Screen types ──────────────────────────────────────────────────────────────

type ScreenState = "loading" | "fetch_error" | "empty" | "morning" | "main";
type MemberStatus = "on_job" | "en_route" | "available" | "off_today";
type ActivityIcon = "warning" | "star" | "arrow-forward" | "checkmark" | "add";

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  status: MemberStatus;
  hasIssue?: boolean;
}

interface JobCard {
  id: string;
  scheduledAt: Date;
  timeLabel: string;
  durationLabel: string;
  customerName: string;
  vehicleDesc: string;
  packageName: string;
  status: BookingStatus;
  crew_member_id: string | null;
  assignedTo?: string;
  assignedToInitials?: string;
  startedMinAgo?: number;
  estDoneLabel?: string;
  hasIssue?: boolean;
}

interface ActivityItem {
  id: string;
  icon: ActivityIcon;
  text: string;
  timeAgo: string;
}

interface OperatorStats {
  inProgress: number;
  completed: number;
  unassigned: number;
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

function formatDuration(mins: number | null): string {
  if (!mins) return "";
  if (mins < 60) return `~${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `~${h}.${Math.round((m / 60) * 10)} hrs` : `~${h} hr${h > 1 ? "s" : ""}`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getStatusDotColor(status: MemberStatus): string {
  switch (status) {
    case "on_job":   return Colors.successLight;
    case "en_route": return Colors.foamBlue;
    case "available": return Colors.light.textTertiary;
    case "off_today": return Colors.light.borderDefault;
  }
}

function getStatusLabel(status: MemberStatus): string {
  switch (status) {
    case "on_job":    return "On Job";
    case "en_route":  return "En Route";
    case "available": return "Available";
    case "off_today": return "Off Today";
  }
}

const ACTIVITY_ICON_COLOR: Record<ActivityIcon, string> = {
  warning:       Colors.errorLight,
  star:          Colors.foamBlue,
  "arrow-forward": Colors.light.textTertiary,
  checkmark:     Colors.successLight,
  add:           Colors.foamBlue,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function AvatarCircle({
  initials,
  size = 36,
  bgColor,
}: {
  initials: string;
  size?: number;
  bgColor?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bgColor ?? Colors.foamBlue,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: Typography.bodySemiBold,
          fontSize: size * 0.38,
          color: Colors.white,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

/** Vertical card chip — used in Team Status Overview (main state) */
function TeamChipCard({ member }: { member: TeamMember }) {
  const isOff = member.status === "off_today";
  return (
    <View style={[styles.chipCard, isOff && { opacity: 0.5 }]}>
      <AvatarCircle
        initials={member.initials}
        size={36}
        bgColor={isOff ? Colors.light.borderDefault : Colors.foamBlue}
      />
      <View style={styles.chipCardLabels}>
        <Text style={styles.chipCardName} numberOfLines={1}>
          {member.name.split(" ")[0]}
        </Text>
        <View style={styles.chipCardStatus}>
          <View style={[styles.statusDot, { backgroundColor: getStatusDotColor(member.status) }]} />
          <Text style={styles.chipCardStatusLabel}>{getStatusLabel(member.status)}</Text>
        </View>
      </View>
    </View>
  );
}

/** Horizontal pill chip — used in morning / alert states */
function TeamPillChip({ member }: { member: TeamMember }) {
  const isOff = member.status === "off_today";
  return (
    <View
      style={[
        styles.pillChip,
        isOff && { opacity: 0.6 },
        member.hasIssue === true && styles.pillChipWarning,
      ]}
    >
      <View style={styles.pillChipAvatar}>
        <Text style={styles.pillChipAvatarText}>{member.initials.slice(0, 2)}</Text>
      </View>
      <Text style={styles.pillChipName}>{member.name.split(" ")[0]}</Text>
      <View
        style={[
          styles.pillDot,
          {
            backgroundColor: member.hasIssue
              ? Colors.warningLight
              : getStatusDotColor(member.status),
          },
        ]}
      />
    </View>
  );
}

function UnassignedJobCard({ job }: { job: JobCard }) {
  return (
    <View style={[styles.jobCard, styles.jobCardUnassigned]}>
      <View style={styles.jobCardTopRow}>
        <View style={styles.jobCardTimeRow}>
          <Text style={styles.jobCardTime}>{job.timeLabel}</Text>
          {job.durationLabel ? (
            <>
              <Text style={styles.jobCardDot}>·</Text>
              <Text style={styles.jobCardDuration}>{job.durationLabel}</Text>
            </>
          ) : null}
        </View>
        <View style={styles.badgeUnassigned}>
          <Text style={styles.badgeUnassignedText}>Unassigned</Text>
        </View>
      </View>
      <Text style={styles.jobCardCustomer}>{job.customerName}</Text>
      <Text style={styles.jobCardVehicle}>{job.vehicleDesc}</Text>
      <Text style={styles.jobCardPackage}>{job.packageName}</Text>
      <View style={styles.jobCardAssignRow}>
        <TouchableOpacity style={styles.assignBtn}>
          <Text style={styles.assignBtnText}>Assign</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AssignedJobCard({ job }: { job: JobCard }) {
  return (
    <View style={[styles.jobCard, styles.jobCardAssigned]}>
      <View style={styles.jobCardTopRow}>
        <View style={styles.jobCardTimeRow}>
          <Text style={styles.jobCardTime}>{job.timeLabel}</Text>
          {job.durationLabel ? (
            <>
              <Text style={styles.jobCardDot}>·</Text>
              <Text style={styles.jobCardDuration}>{job.durationLabel}</Text>
            </>
          ) : null}
        </View>
        {job.assignedTo ? (
          <View style={styles.badgeAssigned}>
            <Text style={styles.badgeAssignedText}>{job.assignedTo.split(" ")[0]}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.jobCardCustomer}>{job.customerName}</Text>
      <Text style={styles.jobCardVehicle}>{job.vehicleDesc}</Text>
      <Text style={styles.jobCardPackage}>{job.packageName}</Text>
      {job.startedMinAgo != null && (
        <View style={styles.jobCardFooter}>
          <Ionicons name="time-outline" size={12} color={Colors.light.textTertiary} />
          <Text style={styles.jobCardFooterText}>
            {"Started "}{job.startedMinAgo}{"min ago"}
            {job.estDoneLabel ? ` · Est. done at ${job.estDoneLabel}` : ""}
          </Text>
        </View>
      )}
    </View>
  );
}

function CompletedJobRow({ job }: { job: JobCard }) {
  return (
    <View style={[styles.jobCard, styles.jobCardCompleted]}>
      <View style={styles.completedRow}>
        <Ionicons name="checkmark" size={12} color={Colors.successLight} />
        <Text style={styles.completedText}>Completed {job.timeLabel}</Text>
      </View>
      <Text style={styles.completedDetail}>
        {job.customerName} · {job.vehicleDesc} · {job.packageName}
      </Text>
    </View>
  );
}

function UpcomingJobCard({ job }: { job: JobCard }) {
  return (
    <View style={styles.morningJobCard}>
      <View style={styles.morningJobHeader}>
        <View style={styles.morningJobCrewRow}>
          <View style={styles.morningJobAvatar}>
            <Text style={styles.morningJobAvatarText}>
              {job.assignedToInitials ?? "??"}
            </Text>
          </View>
          <View>
            <Text style={styles.morningJobCrewName}>
              {job.assignedTo ?? "Unassigned"}
            </Text>
            <Text style={styles.morningJobCrewSub}>
              Starts in {formatTime(job.scheduledAt)}
            </Text>
          </View>
        </View>
        <View style={styles.badgeUpcoming}>
          <Text style={styles.badgeUpcomingText}>UPCOMING</Text>
        </View>
      </View>
      <View style={styles.morningJobDetails}>
        <Text style={styles.morningJobTime}>
          {job.timeLabel} · {job.customerName}
        </Text>
        <Text style={styles.morningJobVehicle}>
          {job.vehicleDesc} · {job.packageName}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OperatorTodayScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [firstName, setFirstName] = useState("there");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [todayJobs, setTodayJobs] = useState<JobCard[]>([]);
  const [stats, setStats] = useState<OperatorStats>({ inProgress: 0, completed: 0, unassigned: 0 });
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState<"warning" | "error">("warning");
  // Unresolved alert count derived from real booking signals (no_show + requested)
  const [unresolvedAlertCount, setUnresolvedAlertCount] = useState(0);

  const isMorning = new Date().getHours() < 9;

  const recentActivity: ActivityItem[] = [
    { id: "1", icon: "arrow-forward", text: "Devon en route to Dante R. · 8 min away", timeAgo: "2m ago" },
    { id: "2", icon: "star",          text: "Jordan received a 5-star review from Terrence", timeAgo: "14m ago" },
  ];

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();

      // ── 1. Operator profile ─────────────────────────────────────────────
      const { data: profileData } = await supabase
        .from("detailer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      // ── 2. User display name ────────────────────────────────────────────
      const { data: userData } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const rawName: string | null =
        (userData as RawUser | null)?.full_name ??
        (user.user_metadata?.full_name as string | undefined) ??
        null;
      if (rawName) setFirstName(rawName.split(" ")[0]);

      if (!profileData) {
        setScreenState("empty");
        return;
      }

      const detailerId: string = (profileData as { id: string }).id;
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

      // ── 3. Today's bookings ─────────────────────────────────────────────
      const { data: rawBookings } = await supabase
        .from("bookings")
        .select("id, status, scheduled_at, estimated_duration_mins, crew_member_id, notes")
        .eq("detailer_id", detailerId)
        .gte("scheduled_at", todayStart)
        .lte("scheduled_at", todayEnd)
        .order("scheduled_at");

      // ── 4. Team members ──────────────────────────────────────────────────
      const { data: rawMembers } = await supabase
        .from("team_members")
        .select("id, user_id, is_active")
        .eq("manager_id", detailerId);

      const typedMembers: RawTeamMember[] = (rawMembers as RawTeamMember[] | null) ?? [];

      // ── 5. User names for team members ────────────────────────────────────
      let memberUserMap: Record<string, string> = {};
      if (typedMembers.length > 0) {
        const uids = typedMembers.map((m) => m.user_id);
        const { data: memberUsers } = await supabase
          .from("users")
          .select("id, full_name")
          .in("id", uids);
        for (const u of (memberUsers as RawUser[] | null) ?? []) {
          if (u.full_name) memberUserMap[u.id] = u.full_name;
        }
      }

      // ── 6. crew_member_id → display name map ─────────────────────────────
      //    team_members.id → { name, initials }
      const crewDisplayMap: Record<string, { name: string; initials: string }> = {};
      for (const m of typedMembers) {
        const name = memberUserMap[m.user_id] ?? "Crew";
        crewDisplayMap[m.id] = { name, initials: getInitials(name) };
      }

      // ── 7. Build typed JobCard array ──────────────────────────────────────
      const typedBookings: RawBooking[] = (rawBookings as RawBooking[] | null) ?? [];
      const jobs: JobCard[] = typedBookings.map((b) => {
        const scheduledAt = new Date(b.scheduled_at);
        const crew = b.crew_member_id ? crewDisplayMap[b.crew_member_id] : undefined;
        const minAgo =
          b.status === "in_progress"
            ? Math.max(0, Math.round((now.getTime() - scheduledAt.getTime()) / 60000))
            : undefined;
        const estDone =
          minAgo != null && b.estimated_duration_mins
            ? new Date(scheduledAt.getTime() + b.estimated_duration_mins * 60000)
            : undefined;

        return {
          id: b.id,
          scheduledAt,
          timeLabel: formatTime(scheduledAt),
          durationLabel: formatDuration(b.estimated_duration_mins),
          customerName: "Customer",
          vehicleDesc: "Vehicle",
          packageName: "Service",
          status: b.status as BookingStatus,
          crew_member_id: b.crew_member_id,
          assignedTo:        crew?.name,
          assignedToInitials: crew?.initials,
          startedMinAgo: minAgo,
          estDoneLabel: estDone ? formatTime(estDone) : undefined,
        };
      });

      setTodayJobs(jobs);

      // ── 8. Stats ──────────────────────────────────────────────────────────
      const inProgress = jobs.filter((j) => j.status === "in_progress").length;
      const completed  = jobs.filter((j) => j.status === "completed").length;
      // Unassigned = confirmed booking with no crew assigned
      const unassigned = jobs.filter(
        (j) => j.status === "confirmed" && !j.crew_member_id
      ).length;
      setStats({ inProgress, completed, unassigned });

      // ── 9. Team member status ─────────────────────────────────────────────
      const members: TeamMember[] = typedMembers.map((m) => {
        const name = memberUserMap[m.user_id] ?? "Team Member";
        let status: MemberStatus = "available";
        if (!m.is_active) {
          status = "off_today";
        } else if (jobs.some((j) => j.crew_member_id === m.id && j.status === "in_progress")) {
          status = "on_job";
        } else if (
          jobs.some(
            (j) =>
              j.crew_member_id === m.id &&
              j.status === "confirmed" &&
              j.scheduledAt.getTime() - now.getTime() < 30 * 60 * 1000
          )
        ) {
          status = "en_route";
        }
        return { id: m.id, name, initials: getInitials(name), status };
      });
      setTeamMembers(members);

      // ── 10. Unresolved alert signals from DB ────────────────────────────
      // `no_show` = crew reported customer no-show (needs operator follow-up)
      // `requested` = customer booked but operator has not yet confirmed
      const { data: alertRows } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("detailer_id", detailerId)
        .in("status", ["no_show", "requested"])
        .gte("scheduled_at", todayStart)
        .lte("scheduled_at", todayEnd);

      const noShowCount  = ((alertRows ?? []) as Array<{ id: string; status: string }>)
        .filter((r) => r.status === "no_show").length;
      const pendingCount = ((alertRows ?? []) as Array<{ id: string; status: string }>)
        .filter((r) => r.status === "requested").length;

      const totalAlerts = noShowCount + pendingCount + (unassigned > 0 ? 1 : 0);
      setUnresolvedAlertCount(totalAlerts);

      if (noShowCount > 0) {
        setAlertMessage(
          `${noShowCount} no-show${noShowCount > 1 ? "s" : ""} need${noShowCount === 1 ? "s" : ""} follow-up`
        );
        setAlertSeverity("error");
        setAlertVisible(true);
      } else if (pendingCount > 0) {
        setAlertMessage(
          `${pendingCount} booking request${pendingCount > 1 ? "s" : ""} awaiting confirmation`
        );
        setAlertSeverity("warning");
        setAlertVisible(true);
      } else if (unassigned > 0) {
        setAlertMessage(
          `${unassigned} job${unassigned > 1 ? "s" : ""} still need${unassigned === 1 ? "s" : ""} to be assigned`
        );
        setAlertSeverity("warning");
        setAlertVisible(true);
      }

      setScreenState(jobs.length === 0 ? "empty" : isMorning ? "morning" : "main");
    } catch (err) {
      console.warn("[OperatorToday] fetchData error", err);
      setScreenState("fetch_error");
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (screenState === "loading") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={Colors.foamBlue} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────────
  if (screenState === "empty") {
    const label = new Date().toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",
    });
    return (
      <SafeAreaView style={styles.container}>
        <StickyHeader
          firstName={firstName}
          subtitle={label}
          subtitleStyle={undefined}
          alertCount={0}
          onBellPress={() => router.push("/operator/alerts")}
        />
        <View style={styles.centerFill}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="calendar-outline" size={32} color={Colors.foamBlue} />
          </View>
          <Text style={styles.emptyHeadline}>Wide open today.</Text>
          <Text style={styles.emptyBody}>
            No jobs are scheduled. Create a booking or share your booking link.
          </Text>
          <TouchableOpacity style={styles.emptyCtaBtn}>
            <Text style={styles.emptyCtaText}>Create Booking</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Fetch error ──────────────────────────────────────────────────────────────
  if (screenState === "fetch_error") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerFill}>
          <Ionicons name="cloud-offline-outline" size={40} color={Colors.light.textTertiary} />
          <Text style={[styles.emptyHeadline, { marginTop: Spacing.lg, fontSize: 20 }]}>
            Couldn't load your schedule
          </Text>
          <Text style={[styles.emptyBody, { marginBottom: Spacing.xl }]}>
            Check your connection and try again.
          </Text>
          <TouchableOpacity style={styles.emptyCtaBtn} onPress={fetchData}>
            <Text style={styles.emptyCtaText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Shared data for morning + main ───────────────────────────────────────────
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
  const allAssigned = stats.unassigned === 0;

  // Classify jobs using canonical DB field (crew_member_id), not display string
  const unassignedJobs = todayJobs.filter(
    (j) => j.status === "confirmed" && !j.crew_member_id
  );
  const assignedJobs = todayJobs.filter(
    (j) => j.status === "in_progress" || (j.status === "confirmed" && j.crew_member_id)
  );
  const completedJobs = todayJobs.filter((j) => j.status === "completed");

  // ── Morning ──────────────────────────────────────────────────────────────────
  if (screenState === "morning") {
    const totalJobs = todayJobs.length;
    const subtitle = `${todayLabel} · ${totalJobs} jobs today · ${allAssigned ? "All assigned" : `${stats.unassigned} unassigned`}`;
    return (
      <SafeAreaView style={styles.container}>
        <StickyHeader
          firstName={firstName}
          subtitle={subtitle}
          subtitleStyle={allAssigned ? styles.subtitleSuccess : styles.subtitleWarning}
          greetingLarge
          alertCount={unresolvedAlertCount}
          onBellPress={() => router.push("/operator/alerts")}
        />
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Team status pills */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
              {teamMembers.map((m) => <TeamPillChip key={m.id} member={m} />)}
            </ScrollView>
          </View>

          {/* Stats */}
          <StatsGrid stats={stats} />

          {/* All-assigned banner */}
          {allAssigned && (
            <View style={[styles.section, { marginTop: -8 }]}>
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.successLight} />
                <Text style={styles.successBannerText}>
                  All {totalJobs} jobs assigned and ready.
                </Text>
              </View>
            </View>
          )}

          {/* Upcoming jobs */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Live Jobs</Text>
              <TouchableOpacity><Text style={styles.sectionLink}>View All</Text></TouchableOpacity>
            </View>
            {todayJobs.slice(0, 5).map((job) => (
              <UpcomingJobCard key={job.id} job={job} />
            ))}
            {todayJobs.length > 5 && (
              <Text style={styles.moreJobsHint}>
                + {todayJobs.length - 5} more jobs today
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Main (default + alert variant) ───────────────────────────────────────────
  const subParts = [todayLabel];
  if (stats.inProgress > 0)
    subParts.push(`${stats.inProgress} job${stats.inProgress > 1 ? "s" : ""} in progress`);
  const subtitle = subParts.join(" · ");

  return (
    <SafeAreaView style={styles.container}>
      <StickyHeader
        firstName={firstName}
        subtitle={subtitle}
        subtitleSuffix={
          stats.unassigned > 0
            ? { text: ` · ${stats.unassigned} unassigned`, style: styles.subtitleWarning }
            : undefined
        }
        alertCount={unresolvedAlertCount}
        onBellPress={() => router.push("/operator/alerts")}
      />

      {/* ── Dismissible alert strip ─────────────────────────────────────────── */}
      {alertVisible && (
        <View
          style={[
            styles.alertStrip,
            alertSeverity === "error" ? styles.alertStripError : styles.alertStripWarning,
          ]}
        >
          <TouchableOpacity
            style={styles.alertStripMain}
            onPress={() => router.push("/operator/alerts")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="warning"
              size={18}
              color={alertSeverity === "error" ? Colors.errorLight : Colors.warningLight}
            />
            <Text
              style={[
                styles.alertStripText,
                { color: alertSeverity === "error" ? Colors.errorLight : Colors.warningLight },
              ]}
              numberOfLines={1}
            >
              {alertMessage}
            </Text>
            <Text
              style={[
                styles.alertStripViewLink,
                { color: alertSeverity === "error" ? Colors.errorLight : Colors.foamBlue },
              ]}
            >
              View →
            </Text>
          </TouchableOpacity>
          {/* Dismiss button */}
          <TouchableOpacity
            style={styles.alertDismissBtn}
            onPress={() => setAlertVisible(false)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="close"
              size={16}
              color={alertSeverity === "error" ? Colors.errorLight : Colors.warningLight}
            />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Team Right Now ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabelCaps}>TEAM RIGHT NOW</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipCardRow}
            style={styles.chipCardScroll}
          >
            {teamMembers.map((m) => <TeamChipCard key={m.id} member={m} />)}
          </ScrollView>
        </View>

        {/* ── Today's Jobs ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabelCaps}>TODAY'S JOBS</Text>
          <StatsGrid stats={stats} />

          {unassignedJobs.map((job) => <UnassignedJobCard key={job.id} job={job} />)}
          {unassignedJobs.length > 0 && (
            <TouchableOpacity style={styles.viewAllLink}>
              <Text style={styles.viewAllText}>View all unassigned jobs →</Text>
            </TouchableOpacity>
          )}
          {assignedJobs.map((job) => <AssignedJobCard key={job.id} job={job} />)}
          {completedJobs.map((job) => <CompletedJobRow key={job.id} job={job} />)}
          <TouchableOpacity style={styles.viewAllLink}>
            <Text style={styles.viewAllText}>See all today's jobs →</Text>
          </TouchableOpacity>
        </View>

        {/* ── Recent Activity ───────────────────────────────────────────── */}
        <View style={[styles.section, { marginBottom: Spacing.xl }]}>
          <View style={styles.activityCard}>
            <Text style={styles.sectionLabelCaps}>RECENT ACTIVITY</Text>
            {recentActivity.map((item, idx) => (
              <View key={item.id}>
                <View style={styles.activityRow}>
                  <Ionicons
                    name={item.icon}
                    size={16}
                    color={ACTIVITY_ICON_COLOR[item.icon]}
                    style={styles.activityIcon}
                  />
                  <Text style={styles.activityText}>{item.text}</Text>
                  <Text style={styles.activityTime}>{item.timeAgo}</Text>
                </View>
                {idx < recentActivity.length - 1 && <View style={styles.activityDivider} />}
              </View>
            ))}
            <TouchableOpacity
              style={styles.activityFooter}
              onPress={() => router.push("/operator/alerts")}
            >
              <Text style={styles.activityFooterLink}>View all activity →</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

interface StickyHeaderProps {
  firstName: string;
  subtitle: string;
  subtitleStyle?: object;
  subtitleSuffix?: { text: string; style: object };
  greetingLarge?: boolean;
  alertCount: number;
  onBellPress: () => void;
}

function StickyHeader({
  firstName,
  subtitle,
  subtitleStyle,
  subtitleSuffix,
  greetingLarge,
  alertCount,
  onBellPress,
}: StickyHeaderProps) {
  return (
    <View style={styles.stickyHeader}>
      <View style={styles.headerInner}>
        <View style={styles.flex}>
          <Text style={[styles.greeting, greetingLarge && styles.greetingLarge]}>
            {getGreeting()}, {firstName}.
          </Text>
          <Text style={[styles.subheading, subtitleStyle]}>
            {subtitle}
            {subtitleSuffix ? (
              <Text style={subtitleSuffix.style}>{subtitleSuffix.text}</Text>
            ) : null}
          </Text>
        </View>
        <TouchableOpacity style={styles.bellBtn} onPress={onBellPress}>
          {alertCount > 0 ? (
            <View>
              <Ionicons name="notifications" size={22} color={Colors.light.textPrimary} />
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{alertCount > 9 ? "9+" : alertCount}</Text>
              </View>
            </View>
          ) : (
            <Ionicons name="notifications-outline" size={22} color={Colors.light.textPrimary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatsGrid({ stats }: { stats: OperatorStats }) {
  return (
    <View style={[styles.statsGrid, { marginBottom: Spacing.md }]}>
      <TouchableOpacity style={styles.statCell}>
        <Text style={styles.statLabelSmall}>In Progress</Text>
        <Text style={[styles.statValueLarge, { color: Colors.foamBlue }]}>{stats.inProgress}</Text>
      </TouchableOpacity>
      <View style={styles.statDivider} />
      <TouchableOpacity style={styles.statCell}>
        <Text style={styles.statLabelSmall}>Completed</Text>
        <Text style={[styles.statValueLarge, { color: Colors.successLight }]}>{stats.completed}</Text>
      </TouchableOpacity>
      <View style={styles.statDivider} />
      <TouchableOpacity style={styles.statCell}>
        <Text style={styles.statLabelSmall}>Unassigned</Text>
        <Text
          style={[
            styles.statValueLarge,
            { color: stats.unassigned > 0 ? Colors.warningLight : Colors.light.textTertiary },
          ]}
        >
          {stats.unassigned}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={12}
          color={Colors.light.textTertiary}
          style={styles.statChevron}
        />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PH = 20; // horizontal padding

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.light.bgPrimary },
  flex:       { flex: 1 },
  centerFill: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Header
  stickyHeader: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: PH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.mdSm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  greeting: {
    fontFamily: Typography.display,
    fontSize: 26,
    color: Colors.light.textPrimary,
    lineHeight: 32,
  },
  greetingLarge: { fontSize: 30, lineHeight: 36 },
  subheading: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  subtitleSuccess: { fontFamily: Typography.bodySemiBold, color: Colors.successLight },
  subtitleWarning: { fontFamily: Typography.bodySemiBold, color: Colors.warningLight },
  bellBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: -8, marginTop: -4 },
  bellBadge: {
    position: "absolute", top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.warningLight,
    alignItems: "center", justifyContent: "center",
  },
  bellBadgeText: { fontFamily: Typography.bodySemiBold, fontSize: 9, color: Colors.white },

  // Alert strip
  alertStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
  },
  alertStripWarning: { backgroundColor: "rgba(217,119,6,0.08)" },
  alertStripError: {
    backgroundColor: "rgba(220,38,38,0.08)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(220,38,38,0.20)",
  },
  alertStripMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: PH,
    paddingVertical: 10,
  },
  alertStripText: {
    flex: 1,
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyS,
  },
  alertStripViewLink: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyS,
    flexShrink: 0,
  },
  alertDismissBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // Scroll
  scrollContent: { paddingTop: Spacing.lg, paddingBottom: 40 },

  // Sections
  section: { paddingHorizontal: PH, marginBottom: Spacing.xl },
  sectionLabelCaps: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.sm,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionLink: { fontFamily: Typography.bodyMedium, fontSize: Typography.size.bodyS, color: Colors.foamBlue },

  // Team chip cards (vertical)
  chipCardScroll: { marginHorizontal: -PH },
  chipCardRow: { paddingHorizontal: PH, gap: 12, paddingBottom: Spacing.xs },
  chipCard: {
    width: 80,
    height: 88,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    padding: 12,
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
      : Shadows.light.level1),
  },
  chipCardLabels: { alignItems: "center", width: "100%" },
  chipCardName: { fontFamily: Typography.bodySemiBold, fontSize: 11, color: Colors.light.textPrimary },
  chipCardStatus: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  chipCardStatusLabel: { fontFamily: Typography.bodyMedium, fontSize: 10, color: Colors.light.textSecondary },

  // Team pill chips (horizontal)
  pillRow: { gap: 8, paddingBottom: 4 },
  pillChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    borderRadius: Radius.pill,
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 4,
    flexShrink: 0,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }
      : { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 }),
  },
  pillChipWarning: { borderColor: Colors.warningLight },
  pillChipAvatar: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.light.bgSecondary,
    alignItems: "center", justifyContent: "center",
  },
  pillChipAvatarText: { fontFamily: Typography.bodySemiBold, fontSize: 10, color: Colors.light.textPrimary },
  pillChipName: { fontFamily: Typography.bodyMedium, fontSize: Typography.size.bodyS, color: Colors.light.textPrimary },
  pillDot: { width: 8, height: 8, borderRadius: 4 },

  // Stats grid
  statsGrid: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
      : Shadows.light.level1),
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 72,
    padding: 12,
    position: "relative",
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.borderSubtle,
    alignSelf: "stretch",
    marginVertical: 12,
  },
  statLabelSmall: { fontFamily: Typography.body, fontSize: Typography.size.caption, color: Colors.light.textTertiary, marginBottom: 4 },
  statValueLarge: { fontFamily: Typography.bodySemiBold, fontSize: 22 },
  statChevron: { position: "absolute", bottom: 8, right: 8 },

  // Job cards
  jobCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    padding: Spacing.md,
    marginBottom: 10,
    borderLeftWidth: 3,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 2px 4px rgba(0,0,0,0.08)" }
      : Shadows.light.level2),
  },
  jobCardUnassigned: { borderLeftColor: Colors.warningLight },
  jobCardAssigned:   { borderLeftColor: Colors.foamBlue },
  jobCardCompleted: {
    borderLeftColor: Colors.successLight,
    backgroundColor: Colors.light.bgSecondary,
    ...(Platform.OS === "web" ? { boxShadow: "none" } : { shadowOpacity: 0 }),
  },
  jobCardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  jobCardTimeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  jobCardTime:     { fontFamily: Typography.body, fontSize: Typography.size.bodyS, color: Colors.light.textSecondary },
  jobCardDot:      { fontFamily: Typography.body, fontSize: Typography.size.bodyS, color: Colors.light.textTertiary },
  jobCardDuration: { fontFamily: Typography.body, fontSize: Typography.size.bodyS, color: Colors.light.textTertiary },
  jobCardCustomer: { fontFamily: Typography.bodySemiBold, fontSize: Typography.size.bodyL, color: Colors.light.textPrimary, marginBottom: 2 },
  jobCardVehicle:  { fontFamily: Typography.body, fontSize: Typography.size.bodyS, color: Colors.light.textSecondary, marginBottom: 2 },
  jobCardPackage:  { fontFamily: Typography.body, fontSize: Typography.size.bodyS, color: Colors.light.textTertiary, marginBottom: Spacing.md },
  jobCardAssignRow: { alignItems: "flex-end" },
  assignBtn: {
    height: 32, paddingHorizontal: 16, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.foamBlue,
    alignItems: "center", justifyContent: "center",
  },
  assignBtnText: { fontFamily: Typography.bodyMedium, fontSize: Typography.size.bodyS, color: Colors.foamBlue },
  jobCardFooter: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderTopWidth: 1, borderTopColor: Colors.light.borderSubtle,
    paddingTop: 10, marginTop: 2,
  },
  jobCardFooterText: { fontFamily: Typography.body, fontSize: Typography.size.caption, color: Colors.light.textTertiary },
  completedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  completedText: { fontFamily: Typography.bodyMedium, fontSize: Typography.size.caption, color: Colors.successLight },
  completedDetail: { fontFamily: Typography.body, fontSize: Typography.size.caption, color: Colors.light.textTertiary },

  // Badges
  badgeUnassigned: { backgroundColor: "rgba(217,119,6,0.08)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  badgeUnassignedText: { fontFamily: Typography.bodyMedium, fontSize: 11, color: Colors.warningLight },
  badgeAssigned: { backgroundColor: Colors.foamBlueSubtle, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  badgeAssignedText: { fontFamily: Typography.bodyMedium, fontSize: 11, color: Colors.foamBlue },
  badgeUpcoming: { borderWidth: 1, borderColor: Colors.light.borderSubtle, backgroundColor: Colors.light.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.pill },
  badgeUpcomingText: { fontFamily: Typography.bodySemiBold, fontSize: 10, color: Colors.light.textTertiary, letterSpacing: 0.5 },

  // Morning job cards
  morningJobCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 12,
    ...(Platform.OS === "web" ? { boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } : Shadows.light.level1),
  },
  morningJobHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  morningJobCrewRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  morningJobAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.foamBlueSubtle, alignItems: "center", justifyContent: "center" },
  morningJobAvatarText: { fontFamily: Typography.bodySemiBold, fontSize: 12, color: Colors.foamBlue },
  morningJobCrewName: { fontFamily: Typography.bodySemiBold, fontSize: Typography.size.bodyM, color: Colors.light.textPrimary },
  morningJobCrewSub:  { fontFamily: Typography.body, fontSize: Typography.size.caption, color: Colors.light.textTertiary, marginTop: 2 },
  morningJobDetails: { gap: 4 },
  morningJobTime:    { fontFamily: Typography.bodyMedium, fontSize: Typography.size.bodyM, color: Colors.light.textPrimary },
  morningJobVehicle: { fontFamily: Typography.body, fontSize: Typography.size.bodyS, color: Colors.light.textSecondary },
  moreJobsHint: { fontFamily: Typography.body, fontSize: Typography.size.caption, color: Colors.light.textTertiary, textAlign: "center", paddingVertical: 8 },

  // Success banner
  successBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#DCFCE7", borderRadius: Radius.md, padding: 12,
  },
  successBannerText: { fontFamily: Typography.bodyMedium, fontSize: Typography.size.bodyS, color: Colors.successLight },

  // View-all links
  viewAllLink: { alignItems: "center", paddingVertical: 8, marginBottom: 4 },
  viewAllText: { fontFamily: Typography.bodySemiBold, fontSize: Typography.size.bodyS, color: Colors.foamBlue },

  // Activity card
  activityCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    padding: Spacing.md,
    ...(Platform.OS === "web" ? { boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } : Shadows.light.level1),
  },
  activityRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: Spacing.sm },
  activityIcon: { marginTop: 2, flexShrink: 0 },
  activityText: { flex: 1, fontFamily: Typography.body, fontSize: Typography.size.bodyS, color: Colors.light.textSecondary, lineHeight: 19 },
  activityTime: { fontFamily: Typography.body, fontSize: Typography.size.caption, color: Colors.light.textTertiary, flexShrink: 0 },
  activityDivider: { height: 1, backgroundColor: Colors.light.borderSubtle },
  activityFooter: { borderTopWidth: 1, borderTopColor: Colors.light.borderSubtle, paddingTop: 12, marginTop: 8, alignItems: "flex-end" },
  activityFooterLink: { fontFamily: Typography.bodySemiBold, fontSize: Typography.size.bodyS, color: Colors.foamBlue },

  // Empty state
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#E1F0F7",
    alignItems: "center", justifyContent: "center",
    marginBottom: 32,
  },
  emptyHeadline: {
    fontFamily: Typography.display, fontSize: Typography.size.h2,
    color: Colors.light.textPrimary, marginBottom: Spacing.md, textAlign: "center",
  },
  emptyBody: {
    fontFamily: Typography.body, fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary, textAlign: "center",
    lineHeight: 22, maxWidth: 280, marginBottom: Spacing.xl,
  },
  emptyCtaBtn: {
    backgroundColor: Colors.foamBlue, borderRadius: Radius.pill,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  emptyCtaText: { fontFamily: Typography.bodySemiBold, fontSize: Typography.size.bodyM, color: Colors.white },
});
