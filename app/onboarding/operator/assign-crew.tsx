import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { supabase } from "@/lib/supabase";
import { LucideIcon } from "@/components/LucideIcon";

interface TeamMember {
  id: string;
  display_name: string;
  team_role: string;
}

interface UnitVan {
  id: string;
  name: string;
  asset_type: string;
}

interface UnitLocation {
  id: string;
  name: string;
  address: string;
  bay_count: number;
  crew_member_ids: string[];
}

export default function AssignCrewScreen() {
  const [vans, setVans] = useState<UnitVan[]>([]);
  const [locations, setLocations] = useState<UnitLocation[]>([]);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  // map: assetId -> Set<memberId> (assigned today)
  const [vanCrewMap, setVanCrewMap] = useState<Record<string, Set<string>>>({});
  // map: locationId -> Set<memberId> (persisted to business_locations.crew_member_ids)
  const [locCrewMap, setLocCrewMap] = useState<Record<string, Set<string>>>({});
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [continuing, setContinuing] = useState(false);

  const loadUnits = useCallback(async () => {
    setLoadingUnits(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("detailer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!profile) return;

      // Load units, team members, and today's crew assignments in parallel
      const today = new Date().toISOString().split("T")[0];

      const [assetsResult, locsResult, membersResult] = await Promise.all([
        supabase
          .from("business_assets")
          .select("id, name, asset_type")
          .eq("detailer_id", profile.id)
          .eq("is_active", true)
          .order("created_at"),
        supabase
          .from("business_locations")
          .select("id, name, address, bay_count, crew_member_ids")
          .eq("detailer_id", profile.id)
          .eq("is_active", true)
          .order("created_at"),
        supabase
          .from("team_members")
          .select("id, display_name, team_role")
          .eq("manager_id", profile.id)
          .eq("is_active", true)
          .order("display_name"),
      ]);

      const assetsData = assetsResult.data ?? [];
      const locsData = locsResult.data ?? [];
      const membersData = membersResult.data ?? [];

      setVans(assetsData);
      const mappedLocs: UnitLocation[] = locsData.map((l) => ({
        id: l.id,
        name: l.name,
        address: (l.address as string) ?? "",
        bay_count: (l.bay_count as number) ?? 0,
        crew_member_ids: (l.crew_member_ids as string[]) ?? [],
      }));
      setLocations(mappedLocs);
      setAllMembers(membersData);

      // Load today's crew assignments for all vans
      if (assetsData.length > 0) {
        const assetIds = assetsData.map((a) => a.id);
        const { data: assignmentsData } = await supabase
          .from("asset_crew_assignments")
          .select("asset_id, team_member_id")
          .in("asset_id", assetIds)
          .eq("assigned_date", today);

        const crewMap: Record<string, Set<string>> = {};
        for (const a of assetsData) {
          crewMap[a.id] = new Set(
            (assignmentsData ?? [])
              .filter((ac) => ac.asset_id === a.id)
              .map((ac) => ac.team_member_id)
          );
        }
        setVanCrewMap(crewMap);
      }

      // Initialize location crew map from persisted crew_member_ids
      const initLocMap: Record<string, Set<string>> = {};
      for (const l of mappedLocs) {
        initLocMap[l.id] = new Set(l.crew_member_ids);
      }
      setLocCrewMap(initLocMap);
    } catch (err) {
      console.warn("[AssignCrew] loadUnits failed", err);
    }
    setLoadingUnits(false);
  }, []);

  useEffect(() => {
    void loadUnits();
  }, [loadUnits]);

  async function handleToggleCrewOnVan(vanId: string, memberId: string) {
    const today = new Date().toISOString().split("T")[0];
    const isAssigned = vanCrewMap[vanId]?.has(memberId) ?? false;
    const toggleKey = `${vanId}:${memberId}`;
    setTogglingId(toggleKey);

    // Optimistic update
    setVanCrewMap((prev) => {
      const next = { ...prev };
      const updated = new Set(next[vanId] ?? []);
      if (isAssigned) updated.delete(memberId);
      else updated.add(memberId);
      next[vanId] = updated;
      return next;
    });

    try {
      if (isAssigned) {
        const { error } = await supabase
          .from("asset_crew_assignments")
          .delete()
          .eq("asset_id", vanId)
          .eq("team_member_id", memberId)
          .eq("assigned_date", today);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("asset_crew_assignments")
          .upsert({ asset_id: vanId, team_member_id: memberId, assigned_date: today });
        if (error) throw error;
      }
    } catch (err) {
      console.warn("[AssignCrew] toggleCrewOnVan failed", err);
      // Revert on error
      setVanCrewMap((prev) => {
        const next = { ...prev };
        const reverted = new Set(next[vanId] ?? []);
        if (isAssigned) reverted.add(memberId);
        else reverted.delete(memberId);
        next[vanId] = reverted;
        return next;
      });
    }
    setTogglingId(null);
  }

  async function handleToggleCrewOnLocation(locId: string, memberId: string) {
    const isAssigned = locCrewMap[locId]?.has(memberId) ?? false;
    const toggleKey = `loc:${locId}:${memberId}`;
    setTogglingId(toggleKey);

    // Optimistic update
    const nextSet = new Set(locCrewMap[locId] ?? []);
    if (isAssigned) nextSet.delete(memberId);
    else nextSet.add(memberId);
    setLocCrewMap((prev) => ({ ...prev, [locId]: nextSet }));

    try {
      const { error } = await supabase
        .from("business_locations")
        .update({ crew_member_ids: [...nextSet] })
        .eq("id", locId);
      if (error) throw error;
    } catch (err) {
      console.warn("[AssignCrew] toggleCrewOnLocation failed", err);
      // Revert on error
      const revertedSet = new Set(locCrewMap[locId] ?? []);
      if (isAssigned) revertedSet.add(memberId);
      else revertedSet.delete(memberId);
      setLocCrewMap((prev) => ({ ...prev, [locId]: revertedSet }));
    }
    setTogglingId(null);
  }

  function openAddCrewScreen(unitId: string, unitType: "van" | "location") {
    router.push({
      pathname: "/onboarding/operator/add-team-member",
      params: { unit_id: unitId, unit_type: unitType },
    });
  }

  async function handleContinue() {
    setContinuing(true);
    router.push("/onboarding/operator/stripe");
    setContinuing(false);
  }

  function getUnitIcon(assetType: string): string {
    switch (assetType) {
      case "trailer":
        return "Package";
      case "truck":
        return "Truck";
      default:
        return "Truck";
    }
  }

  function assetTypeLabel(type: string): string {
    switch (type) {
      case "trailer": return "Trailer";
      case "truck": return "Truck";
      case "other": return "Vehicle";
      default: return "Van";
    }
  }

  const totalUnits = vans.length + locations.length;
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.progressHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <LucideIcon name="ChevronLeft" size={20} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Step 3 of 4</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.progressTrackWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "75%" }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introBlock}>
          <Text style={styles.headline}>Assign your crew.</Text>
          <Text style={styles.subheadline}>
            Tap a crew member to assign them to a unit. Use{" "}
            <Text style={styles.subheadlineBold}>+</Text> to invite someone new.
          </Text>
        </View>

        {loadingUnits ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.foamBlue} />
            <Text style={styles.loadingText}>Loading your operation...</Text>
          </View>
        ) : totalUnits === 0 ? (
          <View style={styles.emptyBanner}>
            <LucideIcon name="Info" size={18} color={Colors.foamBlue} />
            <Text style={styles.emptyBannerText}>
              No vans or locations added yet. Go back to build your operation first.
            </Text>
          </View>
        ) : (
          <View style={styles.unitList}>
            {vans.map((van) => {
              const assignedIds = vanCrewMap[van.id] ?? new Set<string>();
              return (
                <UnitCrewCard
                  key={van.id}
                  unitId={van.id}
                  icon={getUnitIcon(van.asset_type)}
                  name={van.name}
                  meta={`${assetTypeLabel(van.asset_type)} · Mobile service`}
                  allMembers={allMembers}
                  assignedMemberIds={assignedIds}
                  togglingId={togglingId}
                  onToggleMember={(memberId) => handleToggleCrewOnVan(van.id, memberId)}
                  onAddCrew={() => openAddCrewScreen(van.id, "van")}
                />
              );
            })}
            {locations.map((loc) => {
              const assignedIds = locCrewMap[loc.id] ?? new Set<string>();
              return (
                <UnitCrewCard
                  key={loc.id}
                  unitId={loc.id}
                  icon="Building2"
                  name={loc.name}
                  meta={[
                    loc.address.split(",")[0],
                    loc.bay_count > 0
                      ? `${loc.bay_count} ${loc.bay_count === 1 ? "bay" : "bays"}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  allMembers={allMembers}
                  assignedMemberIds={assignedIds}
                  togglingId={togglingId}
                  onToggleMember={(memberId) => handleToggleCrewOnLocation(loc.id, memberId)}
                  onAddCrew={() => openAddCrewScreen(loc.id, "location")}
                />
              );
            })}
          </View>
        )}

        <View style={styles.infoBox}>
          <LucideIcon name="Users" size={16} color={Colors.foamBlue} />
          <Text style={styles.infoBoxText}>
            {allMembers.length === 0
              ? "No crew members yet. Use + to invite your first team member — they'll appear here once they join."
              : "Tap a crew member chip to assign or unassign them from a unit. Use + to invite someone new."}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, continuing && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={continuing}
          activeOpacity={0.85}
        >
          {continuing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleContinue}
          disabled={continuing}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Assign crew later</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

interface UnitCrewCardProps {
  unitId: string;
  icon: string;
  name: string;
  meta: string;
  allMembers: TeamMember[];
  assignedMemberIds: Set<string>;
  togglingId: string | null;
  onToggleMember: (memberId: string) => void;
  onAddCrew: () => void;
}

function UnitCrewCard({
  unitId,
  icon,
  name,
  meta,
  allMembers,
  assignedMemberIds,
  togglingId,
  onToggleMember,
  onAddCrew,
}: UnitCrewCardProps) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.cardHeader}>
        <View style={cardStyles.iconCircle}>
          <LucideIcon name={icon} size={22} color={Colors.foamBlue} />
        </View>
        <View style={cardStyles.headerText}>
          <Text style={cardStyles.unitName}>{name}</Text>
          <Text style={cardStyles.unitMeta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
      </View>

      <View style={cardStyles.divider} />

      <View style={cardStyles.crewRow}>
        <Text style={cardStyles.crewLabel}>CREW</Text>
        <View style={cardStyles.chipsRow}>
          {assignedMemberIds.size === 0 && allMembers.length > 0 ? (
            <View style={cardStyles.noCrewChip}>
              <LucideIcon name="AlertCircle" size={12} color={Colors.warningLight} />
              <Text style={cardStyles.noCrewText}>No crew assigned</Text>
            </View>
          ) : allMembers.length === 0 ? (
            <Text style={cardStyles.noCrewText}>No team members yet</Text>
          ) : (
            allMembers.map((member) => {
              const isAssigned = assignedMemberIds.has(member.id);
              const isToggling = togglingId === `${unitId}:${member.id}`;
              return (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    cardStyles.crewChip,
                    isAssigned && cardStyles.crewChipAssigned,
                  ]}
                  onPress={() => onToggleMember(member.id)}
                  disabled={isToggling}
                  activeOpacity={0.8}
                >
                  {isAssigned && (
                    <LucideIcon name="Check" size={11} color={Colors.foamBlue} />
                  )}
                  <Text
                    style={[
                      cardStyles.crewChipText,
                      isAssigned && cardStyles.crewChipTextAssigned,
                    ]}
                  >
                    {member.display_name}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
          <TouchableOpacity
            style={cardStyles.addButton}
            onPress={onAddCrew}
            activeOpacity={0.8}
          >
            <LucideIcon name="Plus" size={16} color={Colors.foamBlue} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    overflow: "hidden",
    ...Shadows.light.level1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerText: { flex: 1 },
  unitName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.light.textPrimary,
  },
  unitMeta: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  divider: { height: 1, backgroundColor: Colors.light.borderSubtle },
  crewRow: { padding: 16, gap: 10 },
  crewLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  noCrewChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(217,119,6,0.08)",
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(217,119,6,0.20)",
  },
  noCrewText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
    color: Colors.warningLight,
  },
  crewChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    backgroundColor: Colors.light.surface,
  },
  crewChipAssigned: {
    backgroundColor: Colors.foamBlueSubtle,
    borderColor: Colors.foamBlue,
  },
  crewChipText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
    color: Colors.light.textSecondary,
  },
  crewChipTextAssigned: { color: Colors.foamBlue },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.foamBlue,
  },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xl2,
    paddingBottom: Spacing.sm,
  },
  backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  stepLabel: {
    flex: 1,
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  spacer: { width: 44 },
  progressTrackWrap: { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.light.borderSubtle,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: Colors.foamBlue, borderRadius: 2 },
  content: { paddingHorizontal: Spacing.md, paddingTop: 16, paddingBottom: 140 },
  introBlock: { marginBottom: 24 },
  headline: {
    fontFamily: Typography.display,
    fontSize: 26,
    color: Colors.light.textPrimary,
    lineHeight: 32,
    marginBottom: Spacing.xs,
  },
  subheadline: {
    fontFamily: Typography.body,
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  subheadlineBold: { fontFamily: Typography.bodySemiBold, color: Colors.light.textPrimary },
  loadingContainer: { alignItems: "center", marginTop: 60, gap: 12 },
  loadingText: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.light.textTertiary,
  },
  emptyBanner: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: Colors.foamLightBlue,
    borderRadius: Radius.md,
    padding: 16,
    alignItems: "flex-start",
    marginBottom: 24,
  },
  emptyBannerText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.foamBlue,
    lineHeight: 20,
  },
  unitList: { gap: 16, marginBottom: 24 },
  infoBox: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: Colors.foamLightBlue,
    borderRadius: Radius.md,
    padding: 16,
    alignItems: "flex-start",
  },
  infoBoxText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Platform.OS === "web" ? 24 : 0,
    paddingTop: Spacing.md,
    alignItems: "center",
    gap: 4,
  },
  primaryButton: {
    width: "100%",
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.light.level2,
  },
  buttonDisabled: { opacity: 0.4 },
  primaryButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
  skipButton: {
    height: 44,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButtonText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textTertiary,
  },
});
