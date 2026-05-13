import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Switch,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { supabase } from "@/lib/supabase";
import { LucideIcon } from "@/components/LucideIcon";

interface VanSummary {
  id: string;
  name: string;
  asset_type: string;
  is_active: boolean;
  created_at: string;
}

interface LocationSummary {
  id: string;
  name: string;
  address: string;
  bay_count: number;
  accepts_walkins: boolean;
  is_active: boolean;
  created_at: string;
}

type ApprovalStatus = "pending" | "approved" | "rejected" | "suspended";

export default function LocationsVansScreen() {
  const [vans, setVans] = useState<VanSummary[]>([]);
  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>("approved");

  const loadUnits = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("detailer_profiles")
        .select("id, approval_status")
        .eq("user_id", user.id)
        .single();
      if (!profile) return;
      setApprovalStatus((profile.approval_status as ApprovalStatus) ?? "approved");

      const [{ data: assetsData }, { data: locsData }] = await Promise.all([
        supabase
          .from("business_assets")
          .select("id, name, asset_type, is_active, created_at")
          .eq("detailer_id", profile.id)
          .order("is_active", { ascending: false })
          .order("created_at"),
        supabase
          .from("business_locations")
          .select("id, name, address, bay_count, accepts_walkins, is_active, created_at")
          .eq("detailer_id", profile.id)
          .order("is_active", { ascending: false })
          .order("created_at"),
      ]);

      setVans(assetsData ?? []);
      setLocations(locsData ?? []);
    } catch (err) {
      console.warn("[LocationsVans] loadUnits failed", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadUnits();
  }, [loadUnits]);

  async function handleToggleVan(van: VanSummary) {
    if (approvalStatus === "pending") return;
    setTogglingId(van.id);
    try {
      const { error } = await supabase
        .from("business_assets")
        .update({ is_active: !van.is_active })
        .eq("id", van.id);
      if (!error) {
        setVans((prev) =>
          prev.map((v) => (v.id === van.id ? { ...v, is_active: !v.is_active } : v))
        );
      }
    } catch (err) {
      console.warn("[LocationsVans] toggleVan failed", err);
    }
    setTogglingId(null);
  }

  async function handleToggleLocation(loc: LocationSummary) {
    if (approvalStatus === "pending") return;
    setTogglingId(loc.id);
    try {
      const { error } = await supabase
        .from("business_locations")
        .update({ is_active: !loc.is_active })
        .eq("id", loc.id);
      if (!error) {
        setLocations((prev) =>
          prev.map((l) => (l.id === loc.id ? { ...l, is_active: !l.is_active } : l))
        );
      }
    } catch (err) {
      console.warn("[LocationsVans] toggleLocation failed", err);
    }
    setTogglingId(null);
  }

  function assetTypeLabel(type: string) {
    switch (type) {
      case "trailer": return "Trailer";
      case "truck": return "Truck";
      case "other": return "Vehicle";
      default: return "Van";
    }
  }

  function getUnitStatus(isActive: boolean): "pending" | "active" | "inactive" {
    if (approvalStatus === "pending") return isActive ? "pending" : "inactive";
    return isActive ? "active" : "inactive";
  }

  const isPending = approvalStatus === "pending";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <LucideIcon name="ChevronLeft" size={20} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Locations & Vans</Text>
        <View style={styles.spacer} />
      </View>

      {isPending && (
        <View style={styles.pendingBanner}>
          <LucideIcon name="Clock" size={15} color={Colors.warningLight} />
          <Text style={styles.pendingBannerText}>
            Your units are pending FOAM approval. Toggles are locked until approved.
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.foamBlue} />
          <Text style={styles.loadingText}>Loading your operation...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Vans Section */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <LucideIcon name="Truck" size={18} color={Colors.foamBlue} />
                <Text style={styles.sectionTitle}>Vans</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{vans.length}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addUnitButton}
                onPress={() => router.push("/onboarding/operator/build")}
                activeOpacity={0.8}
              >
                <LucideIcon name="Plus" size={16} color={Colors.foamBlue} />
                <Text style={styles.addUnitButtonText}>Add Van</Text>
              </TouchableOpacity>
            </View>

            {vans.length === 0 ? (
              <EmptyUnitCard
                icon="Truck"
                message="No vans added yet."
                hint="Add your first van to start accepting mobile bookings."
              />
            ) : (
              <View style={styles.unitList}>
                {vans.map((van) => {
                  const unitStatus = getUnitStatus(van.is_active);
                  return (
                    <View
                      key={van.id}
                      style={[styles.unitCard, !van.is_active && styles.unitCardInactive]}
                    >
                      <View style={styles.unitCardLeft}>
                        <View
                          style={[
                            styles.unitIconCircle,
                            !van.is_active && styles.unitIconCircleInactive,
                          ]}
                        >
                          <LucideIcon
                            name="Truck"
                            size={22}
                            color={van.is_active ? Colors.foamBlue : Colors.light.textTertiary}
                          />
                        </View>
                        <View style={styles.unitInfo}>
                          <View style={styles.unitNameRow}>
                            <Text
                              style={[styles.unitName, !van.is_active && styles.unitNameInactive]}
                              numberOfLines={1}
                            >
                              {van.name}
                            </Text>
                            <StatusBadge status={unitStatus} />
                          </View>
                          <Text style={styles.unitMeta}>{assetTypeLabel(van.asset_type)}</Text>
                        </View>
                      </View>
                      <View style={styles.unitCardActions}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => router.push("/onboarding/operator/build")}
                          activeOpacity={0.7}
                        >
                          <LucideIcon name="Pencil" size={16} color={Colors.light.textSecondary} />
                        </TouchableOpacity>
                        <Switch
                          value={van.is_active}
                          onValueChange={() => handleToggleVan(van)}
                          disabled={togglingId === van.id || isPending}
                          trackColor={{
                            false: Colors.light.borderDefault,
                            true: Colors.foamBlue,
                          }}
                          thumbColor={Colors.white}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Locations Section */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <LucideIcon name="Building2" size={18} color={Colors.foamBlue} />
                <Text style={styles.sectionTitle}>Locations</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{locations.length}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addUnitButton}
                onPress={() => router.push("/onboarding/operator/build")}
                activeOpacity={0.8}
              >
                <LucideIcon name="Plus" size={16} color={Colors.foamBlue} />
                <Text style={styles.addUnitButtonText}>Add Location</Text>
              </TouchableOpacity>
            </View>

            {locations.length === 0 ? (
              <EmptyUnitCard
                icon="Building2"
                message="No locations added yet."
                hint="Add a fixed location to accept bay bookings and walk-ins."
              />
            ) : (
              <View style={styles.unitList}>
                {locations.map((loc) => {
                  const unitStatus = getUnitStatus(loc.is_active);
                  return (
                    <View
                      key={loc.id}
                      style={[styles.unitCard, !loc.is_active && styles.unitCardInactive]}
                    >
                      <View style={styles.unitCardLeft}>
                        <View
                          style={[
                            styles.unitIconCircle,
                            !loc.is_active && styles.unitIconCircleInactive,
                          ]}
                        >
                          <LucideIcon
                            name="Building2"
                            size={22}
                            color={loc.is_active ? Colors.foamBlue : Colors.light.textTertiary}
                          />
                        </View>
                        <View style={styles.unitInfo}>
                          <View style={styles.unitNameRow}>
                            <Text
                              style={[styles.unitName, !loc.is_active && styles.unitNameInactive]}
                              numberOfLines={1}
                            >
                              {loc.name}
                            </Text>
                            <StatusBadge status={unitStatus} />
                          </View>
                          <Text style={styles.unitMeta} numberOfLines={1}>
                            {loc.address.split(",")[0]}
                            {loc.bay_count ? ` · ${loc.bay_count} ${loc.bay_count === 1 ? "bay" : "bays"}` : ""}
                            {loc.accepts_walkins ? " · Walk-ins" : ""}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.unitCardActions}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => router.push("/onboarding/operator/build")}
                          activeOpacity={0.7}
                        >
                          <LucideIcon name="Pencil" size={16} color={Colors.light.textSecondary} />
                        </TouchableOpacity>
                        <Switch
                          value={loc.is_active}
                          onValueChange={() => handleToggleLocation(loc)}
                          disabled={togglingId === loc.id || isPending}
                          trackColor={{
                            false: Colors.light.borderDefault,
                            true: Colors.foamBlue,
                          }}
                          thumbColor={Colors.white}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.hintCard}>
            <LucideIcon name="Info" size={15} color={Colors.foamBlue} />
            <Text style={styles.hintText}>
              {isPending
                ? "Your units are awaiting FOAM review. Once approved, you can toggle them on or off anytime."
                : "Toggle a unit off to temporarily hide it from bookings. It won't be deleted and can be reactivated anytime."}
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function StatusBadge({ status }: { status: "pending" | "active" | "inactive" }) {
  const badgeStyle =
    status === "active"
      ? styles.statusBadgeActive
      : status === "pending"
      ? styles.statusBadgePending
      : styles.statusBadgeInactive;
  const textStyle =
    status === "active"
      ? styles.statusBadgeTextActive
      : status === "pending"
      ? styles.statusBadgeTextPending
      : styles.statusBadgeTextInactive;
  const label = status === "active" ? "Active" : status === "pending" ? "Pending" : "Inactive";
  return (
    <View style={[styles.statusBadge, badgeStyle]}>
      <Text style={[styles.statusBadgeText, textStyle]}>{label}</Text>
    </View>
  );
}

function EmptyUnitCard({
  icon,
  message,
  hint,
}: {
  icon: string;
  message: string;
  hint: string;
}) {
  return (
    <View style={emptyStyles.card}>
      <LucideIcon name={icon} size={32} color={Colors.light.textDisabled} />
      <Text style={emptyStyles.message}>{message}</Text>
      <Text style={emptyStyles.hint}>{hint}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.bgSecondary,
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    borderStyle: "dashed",
  },
  message: {
    fontFamily: Typography.bodyMedium,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  hint: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textTertiary,
    textAlign: "center",
    lineHeight: 18,
  },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xl2,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  spacer: { width: 44 },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(217,119,6,0.08)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(217,119,6,0.18)",
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  pendingBannerText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.warningLight,
    lineHeight: 19,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.light.textTertiary,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: 20,
    paddingBottom: Platform.OS === "web" ? 40 : 32,
    gap: 28,
  },
  sectionBlock: { gap: 12 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 16,
    color: Colors.light.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  countBadgeText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 12,
    color: Colors.foamBlue,
  },
  addUnitButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.foamBlue,
    backgroundColor: Colors.light.surface,
  },
  addUnitButtonText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.foamBlue,
  },
  unitList: { gap: 10 },
  unitCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    ...Shadows.light.level1,
  },
  unitCardInactive: {
    backgroundColor: Colors.light.bgSecondary,
    borderColor: Colors.light.borderSubtle,
  },
  unitCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  unitIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  unitIconCircleInactive: {
    backgroundColor: Colors.light.bgSecondary,
  },
  unitInfo: { flex: 1, minWidth: 0 },
  unitNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  unitName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Colors.light.textPrimary,
    flexShrink: 1,
  },
  unitNameInactive: { color: Colors.light.textTertiary },
  unitMeta: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 3,
  },
  unitCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
    marginLeft: 4,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
  },
  statusBadge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeActive: { backgroundColor: "rgba(22,163,74,0.10)" },
  statusBadgePending: { backgroundColor: "rgba(217,119,6,0.10)" },
  statusBadgeInactive: { backgroundColor: Colors.light.bgSecondary },
  statusBadgeText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 10,
  },
  statusBadgeTextActive: { color: Colors.successLight },
  statusBadgeTextPending: { color: Colors.warningLight },
  statusBadgeTextInactive: { color: Colors.light.textTertiary },
  hintCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: Colors.foamLightBlue,
    borderRadius: Radius.md,
    padding: 14,
    alignItems: "flex-start",
  },
  hintText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 19,
  },
});
