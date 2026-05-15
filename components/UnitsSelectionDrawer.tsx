import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerModal } from "@/components/DrawerModal";
import { DrawerHeader } from "@/components/DrawerHeader";
import { AddVehicleDrawer } from "@/components/AddVehicleDrawer";
import { AddLocationDrawer } from "@/components/AddLocationDrawer";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VanRow {
  id: string;
  name: string;
  asset_type: string;
  is_active: boolean;
}

interface LocationRow {
  id: string;
  name: string;
  address: string;
  bay_count: number;
  accepts_walkins: boolean;
  is_active: boolean;
}

export interface UnitsSelectionDrawerProps {
  visible: boolean;
  onRequestClose: () => void;
  detailerId: string;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function UnitsSelectionDrawer({
  visible,
  onRequestClose,
  detailerId,
}: UnitsSelectionDrawerProps) {
  const [vans, setVans] = useState<VanRow[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [addVanOpen, setAddVanOpen] = useState(false);
  const [addLocationOpen, setAddLocationOpen] = useState(false);

  const fetchUnits = useCallback(async () => {
    if (!detailerId) return;
    setLoading(true);
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();

      const [{ data: assetsData }, { data: locsData }] = await Promise.all([
        supabase
          .from("business_assets")
          .select("id, name, asset_type, is_active")
          .eq("detailer_id", detailerId)
          .order("created_at"),
        supabase
          .from("business_locations")
          .select("id, name, address, bay_count, accepts_walkins, is_active")
          .eq("detailer_id", detailerId)
          .order("created_at"),
      ]);

      setVans((assetsData as VanRow[] | null) ?? []);
      setLocations((locsData as LocationRow[] | null) ?? []);
    } catch (err) {
      console.warn("[UnitsSelection] fetchUnits error", err);
    }
    setLoading(false);
  }, [detailerId]);

  useEffect(() => {
    if (visible) fetchUnits();
  }, [visible, fetchUnits]);

  async function handleToggleVan(van: VanRow) {
    setTogglingId(van.id);
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();
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
      console.warn("[UnitsSelection] toggleVan error", err);
    }
    setTogglingId(null);
  }

  async function handleToggleLocation(loc: LocationRow) {
    setTogglingId(loc.id);
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();
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
      console.warn("[UnitsSelection] toggleLocation error", err);
    }
    setTogglingId(null);
  }

  function assetTypeLabel(type: string) {
    switch (type) {
      case "trailer": return "Trailer";
      case "truck":   return "Truck";
      case "other":   return "Vehicle";
      default:        return "Van";
    }
  }

  return (
    <>
      <DrawerModal visible={visible} onRequestClose={onRequestClose}>
        <DrawerHeader title="My Units" onClose={onRequestClose} />

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.foamBlue} />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Vans section ── */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionLeft}>
                  <Ionicons name="car-outline" size={18} color={Colors.foamBlue} />
                  <Text style={styles.sectionTitle}>Vans</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{vans.length}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => setAddVanOpen(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={15} color={Colors.foamBlue} />
                  <Text style={styles.addBtnText}>Add Van</Text>
                </TouchableOpacity>
              </View>

              {vans.length === 0 ? (
                <EmptyUnitCard
                  iconName="car-outline"
                  message="No vans added yet."
                  hint="Add your first van to accept mobile bookings."
                  onAdd={() => setAddVanOpen(true)}
                />
              ) : (
                <View style={styles.unitList}>
                  {vans.map((van) => (
                    <View
                      key={van.id}
                      style={[styles.unitCard, !van.is_active && styles.unitCardInactive]}
                    >
                      <View style={[styles.iconCircle, !van.is_active && styles.iconCircleInactive]}>
                        <Ionicons
                          name="car-outline"
                          size={20}
                          color={van.is_active ? Colors.foamBlue : Colors.light.textTertiary}
                        />
                      </View>
                      <View style={styles.unitInfo}>
                        <Text
                          style={[styles.unitName, !van.is_active && styles.unitNameInactive]}
                          numberOfLines={1}
                        >
                          {van.name}
                        </Text>
                        <Text style={styles.unitMeta}>{assetTypeLabel(van.asset_type)}</Text>
                      </View>
                      <Switch
                        value={van.is_active}
                        onValueChange={() => handleToggleVan(van)}
                        disabled={togglingId === van.id}
                        trackColor={{ false: Colors.light.borderDefault, true: Colors.foamBlue }}
                        thumbColor={Colors.white}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ── Locations section ── */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionLeft}>
                  <Ionicons name="business-outline" size={18} color={Colors.foamBlue} />
                  <Text style={styles.sectionTitle}>Locations</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{locations.length}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => setAddLocationOpen(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={15} color={Colors.foamBlue} />
                  <Text style={styles.addBtnText}>Add Location</Text>
                </TouchableOpacity>
              </View>

              {locations.length === 0 ? (
                <EmptyUnitCard
                  iconName="business-outline"
                  message="No locations added yet."
                  hint="Add a fixed location to accept bay bookings."
                  onAdd={() => setAddLocationOpen(true)}
                />
              ) : (
                <View style={styles.unitList}>
                  {locations.map((loc) => (
                    <View
                      key={loc.id}
                      style={[styles.unitCard, !loc.is_active && styles.unitCardInactive]}
                    >
                      <View style={[styles.iconCircle, !loc.is_active && styles.iconCircleInactive]}>
                        <Ionicons
                          name="business-outline"
                          size={20}
                          color={loc.is_active ? Colors.foamBlue : Colors.light.textTertiary}
                        />
                      </View>
                      <View style={styles.unitInfo}>
                        <Text
                          style={[styles.unitName, !loc.is_active && styles.unitNameInactive]}
                          numberOfLines={1}
                        >
                          {loc.name}
                        </Text>
                        <Text style={styles.unitMeta} numberOfLines={1}>
                          {loc.address.split(",")[0]}
                          {loc.bay_count ? ` · ${loc.bay_count} bay${loc.bay_count !== 1 ? "s" : ""}` : ""}
                          {loc.accepts_walkins ? " · Walk-ins" : ""}
                        </Text>
                      </View>
                      <Switch
                        value={loc.is_active}
                        onValueChange={() => handleToggleLocation(loc)}
                        disabled={togglingId === loc.id}
                        trackColor={{ false: Colors.light.borderDefault, true: Colors.foamBlue }}
                        thumbColor={Colors.white}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Hint */}
            <View style={styles.hintCard}>
              <Ionicons name="information-circle-outline" size={15} color={Colors.foamBlue} />
              <Text style={styles.hintText}>
                Toggle a unit off to temporarily hide it from bookings. It can be reactivated anytime.
              </Text>
            </View>
          </ScrollView>
        )}
      </DrawerModal>

      {/* Nested drawers */}
      <AddVehicleDrawer
        visible={addVanOpen}
        onRequestClose={() => setAddVanOpen(false)}
        detailerId={detailerId}
        onAdded={() => { setAddVanOpen(false); fetchUnits(); }}
      />
      <AddLocationDrawer
        visible={addLocationOpen}
        onRequestClose={() => setAddLocationOpen(false)}
        detailerId={detailerId}
        onAdded={() => { setAddLocationOpen(false); fetchUnits(); }}
      />
    </>
  );
}

// ─── EmptyUnitCard ────────────────────────────────────────────────────────────

function EmptyUnitCard({
  iconName,
  message,
  hint,
  onAdd,
}: {
  iconName: string;
  message: string;
  hint: string;
  onAdd: () => void;
}) {
  return (
    <View style={emptyStyles.card}>
      <Ionicons name={iconName as any} size={30} color={Colors.light.textDisabled} />
      <Text style={emptyStyles.message}>{message}</Text>
      <Text style={emptyStyles.hint}>{hint}</Text>
      <TouchableOpacity style={emptyStyles.addBtn} onPress={onAdd} activeOpacity={0.8}>
        <Ionicons name="add" size={14} color={Colors.foamBlue} />
        <Text style={emptyStyles.addBtnText}>Add Now</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    gap: 24,
    paddingBottom: Platform.OS === "web" ? 40 : 32,
  },
  sectionBlock: { gap: 12 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.light.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: "center",
  },
  countText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 12,
    color: Colors.foamBlue,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.foamBlue,
    backgroundColor: Colors.light.surface,
  },
  addBtnText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.foamBlue,
  },
  unitList: { gap: 8 },
  unitCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    padding: 13,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }
      : Shadows.light.level1),
  },
  unitCardInactive: {
    backgroundColor: Colors.light.bgSecondary,
    borderColor: Colors.light.borderSubtle,
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
  iconCircleInactive: { backgroundColor: Colors.light.bgSecondary },
  unitInfo: { flex: 1, minWidth: 0 },
  unitName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  unitNameInactive: { color: Colors.light.textTertiary },
  unitMeta: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  hintCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: Colors.foamLightBlue,
    borderRadius: Radius.md,
    padding: 12,
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

const emptyStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    borderStyle: "dashed",
    padding: 20,
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.bgSecondary,
  },
  message: {
    fontFamily: Typography.bodyMedium,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  hint: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.light.textTertiary,
    textAlign: "center",
    lineHeight: 17,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.foamBlue,
  },
  addBtnText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.foamBlue,
  },
});
