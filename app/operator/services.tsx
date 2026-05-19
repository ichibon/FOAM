import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { ServiceDrawer } from "@/components/ServiceDrawer";
import type { ServiceDrawerService } from "@/components/ServiceDrawer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawVehiclePricingRow {
  vehicle_type: string;
  price_adjustment: number;
}

interface RawServicePackage {
  id: string;
  name: string;
  base_price: number;
  duration_mins: number;
  description: string | null;
  display_order: number;
  is_addon: boolean;
  vehicle_size_pricing: RawVehiclePricingRow[];
}

type VehiclePricingMap = {
  xl: string;
  xxl: string;
};

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  hours: number;
  minutes: number;
  description: string | null;
  vehiclePricing: boolean;
  pricing: VehiclePricingMap;
  displayOrder: number;
  isAddon: boolean;
  addonTargetIds: string[];
  addonTargetNames: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function minsToHM(mins: number): { hours: number; minutes: number } {
  return { hours: Math.floor(mins / 60), minutes: mins % 60 };
}

function durationLabel(h: number, m: number): string {
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ServicesScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [detailerId, setDetailerId] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDrawerService | undefined>(undefined);

  const regularServices = useMemo(() => services.filter((s) => !s.isAddon), [services]);
  const addonServices = useMemo(() => services.filter((s) => s.isAddon), [services]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setFetchError(false);
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();

      const { data: profileData } = await supabase
        .from("detailer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!profileData) throw new Error("Profile not found");
      const dId: string = (profileData as unknown as { id: string }).id;
      setDetailerId(dId);

      const { data: pkgData, error: pkgErr } = await supabase
        .from("service_packages")
        .select("id,name,base_price,duration_mins,description,display_order,is_addon,vehicle_size_pricing(vehicle_type,price_adjustment)")
        .eq("detailer_id", dId)
        .eq("is_active", true)
        .order("display_order");
      if (pkgErr) throw pkgErr;

      const rows: RawServicePackage[] = (pkgData as unknown as RawServicePackage[]) ?? [];

      // Load add-on targets for any add-on packages
      const addonIds = rows.filter((r) => r.is_addon).map((r) => r.id);
      const addonTargetMap: Record<string, string[]> = {};

      if (addonIds.length > 0) {
        const { data: targetsData } = await supabase
          .from("service_addon_targets")
          .select("addon_id, service_id")
          .in("addon_id", addonIds);

        const targets = (targetsData ?? []) as { addon_id: string; service_id: string }[];
        for (const t of targets) {
          if (!addonTargetMap[t.addon_id]) addonTargetMap[t.addon_id] = [];
          addonTargetMap[t.addon_id].push(t.service_id);
        }
      }

      // Build a name map for regular services so add-ons can show their target names
      const serviceNameMap: Record<string, string> = {};
      for (const r of rows) {
        if (!r.is_addon) serviceNameMap[r.id] = r.name;
      }

      setServices(
        rows.map((r) => {
          const { hours, minutes } = minsToHM(r.duration_mins);
          const vspRows = r.vehicle_size_pricing ?? [];
          const pricing: VehiclePricingMap = { xl: "", xxl: "" };
          for (const row of vspRows) {
            const t = row.vehicle_type as keyof VehiclePricingMap;
            if (t in pricing) pricing[t] = row.price_adjustment.toString();
          }
          const targetIds = addonTargetMap[r.id] ?? [];
          return {
            id: r.id,
            name: r.name,
            price: r.base_price,
            hours,
            minutes,
            description: r.description,
            vehiclePricing: vspRows.length > 0,
            pricing,
            displayOrder: r.display_order,
            isAddon: r.is_addon,
            addonTargetIds: targetIds,
            addonTargetNames: targetIds.map((id) => serviceNameMap[id] ?? "").filter(Boolean),
          };
        })
      );
    } catch (err) {
      console.warn("[Services] load error", err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditingService(undefined);
    setDrawerVisible(true);
  }

  function openEdit(svc: ServiceItem) {
    setEditingService({
      id: svc.id,
      name: svc.name,
      price: svc.price,
      hours: svc.hours,
      minutes: svc.minutes,
      description: svc.description,
      vehiclePricing: svc.vehiclePricing,
      pricing: svc.pricing,
      isAddon: svc.isAddon,
      addonTargetIds: svc.addonTargetIds,
    });
    setDrawerVisible(true);
  }

  function handleSaved() {
    setDrawerVisible(false);
    load();
  }

  function confirmDelete(svc: ServiceItem) {
    const hasAddons = !svc.isAddon && addonServices.some((a) => a.addonTargetIds.includes(svc.id));
    const message = hasAddons
      ? `Remove "${svc.name}"? Add-ons linked to this service will lose this association.`
      : `Remove "${svc.name}" from your service menu?`;
    Alert.alert("Delete Service", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteService(svc.id) },
    ]);
  }

  async function deleteService(id: string) {
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();
      const { error: delErr } = await supabase
        .from("service_packages")
        .delete()
        .eq("id", id);
      if (delErr) throw delErr;
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.warn("[Services] delete error", err);
      Alert.alert("Error", "Couldn't delete the service. Please try again.");
    }
  }

  async function moveService(svcId: string, direction: "up" | "down") {
    if (reordering) return;
    const target = services.find((s) => s.id === svcId);
    if (!target) return;

    // Work within the same group (regular or add-on)
    const group = services.filter((s) => s.isAddon === target.isAddon);
    const idx = group.findIndex((s) => s.id === svcId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= group.length) return;

    const newGroup = [...group];
    [newGroup[idx], newGroup[swapIdx]] = [newGroup[swapIdx], newGroup[idx]];
    const newGroupOrdered = newGroup.map((s, i) => ({ ...s, displayOrder: i }));

    // Merge back into the flat services array
    const orderById: Record<string, number> = {};
    for (const s of newGroupOrdered) orderById[s.id] = s.displayOrder;
    setServices((prev) =>
      prev.map((s) => (s.id in orderById ? { ...s, displayOrder: orderById[s.id] } : s))
    );

    setReordering(true);
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();
      const updates = await Promise.all(
        newGroupOrdered.map((svc) =>
          supabase
            .from("service_packages")
            .update({ display_order: svc.displayOrder })
            .eq("id", svc.id)
        )
      );
      const firstErr = updates.find((r) => r.error)?.error;
      if (firstErr) {
        console.warn("[Services] reorder error", firstErr);
        Alert.alert("Error", "Couldn't save the new order. Please try again.");
        load();
      }
    } catch (err) {
      console.warn("[Services] reorder error", err);
      Alert.alert("Error", "Couldn't save the new order. Please try again.");
      load();
    } finally {
      setReordering(false);
    }
  }

  const isEmpty = services.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Menu</Text>
        <TouchableOpacity style={styles.addIconBtn} onPress={openAdd} activeOpacity={0.75}>
          <Ionicons name="add" size={26} color={Colors.foamBlue} />
        </TouchableOpacity>
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.foamBlue} size="large" />
        </View>
      ) : fetchError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.warningLight} />
          <Text style={styles.errorMsg}>Couldn't load your services.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.75}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="construct-outline" size={36} color={Colors.foamBlue} />
          </View>
          <Text style={styles.emptyHeadline}>No services yet.</Text>
          <Text style={styles.emptyBody}>
            Add the services you offer. You can edit or remove them anytime.
          </Text>
          <TouchableOpacity style={styles.emptyCta} onPress={openAdd} activeOpacity={0.85}>
            <Text style={styles.emptyCtaText}>Add a Service</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.foamBlue} />}
        >
          {/* Regular services */}
          {regularServices.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>SERVICES</Text>
                <Text style={styles.sectionCount}>{regularServices.length}</Text>
              </View>
              {regularServices.map((svc, idx) => (
                <ServiceCard
                  key={svc.id}
                  svc={svc}
                  idx={idx}
                  groupSize={regularServices.length}
                  reordering={reordering}
                  onMove={(dir) => moveService(svc.id, dir)}
                  onEdit={() => openEdit(svc)}
                  onDelete={() => confirmDelete(svc)}
                />
              ))}
            </>
          )}

          {/* Add-ons */}
          {addonServices.length > 0 && (
            <>
              <View style={[styles.sectionHeader, regularServices.length > 0 && { marginTop: Spacing.md }]}>
                <Text style={styles.sectionTitle}>ADD-ONS</Text>
                <Text style={styles.sectionCount}>{addonServices.length}</Text>
              </View>
              {addonServices.map((svc, idx) => (
                <ServiceCard
                  key={svc.id}
                  svc={svc}
                  idx={idx}
                  groupSize={addonServices.length}
                  reordering={reordering}
                  onMove={(dir) => moveService(svc.id, dir)}
                  onEdit={() => openEdit(svc)}
                  onDelete={() => confirmDelete(svc)}
                />
              ))}
            </>
          )}

          <TouchableOpacity style={styles.addTrigger} onPress={openAdd} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color={Colors.foamBlue} />
            <Text style={styles.addTriggerText}>Add a Service or Add-on</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Drawer */}
      {detailerId ? (
        <ServiceDrawer
          visible={drawerVisible}
          onRequestClose={() => setDrawerVisible(false)}
          detailerId={detailerId}
          service={editingService}
          regularServices={regularServices.map((s) => ({ id: s.id, name: s.name }))}
          onSaved={handleSaved}
        />
      ) : null}
    </SafeAreaView>
  );
}

// ─── ServiceCard ──────────────────────────────────────────────────────────────

function ServiceCard({
  svc,
  idx,
  groupSize,
  reordering,
  onMove,
  onEdit,
  onDelete,
}: {
  svc: ServiceItem;
  idx: number;
  groupSize: number;
  reordering: boolean;
  onMove: (dir: "up" | "down") => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.card, styles.shadow]}>
      <View style={styles.cardTop}>
        {/* Reorder handle */}
        <View style={styles.reorderCol}>
          <TouchableOpacity
            style={[styles.reorderBtn, idx === 0 && styles.reorderBtnDisabled]}
            onPress={() => onMove("up")}
            activeOpacity={0.6}
            disabled={idx === 0 || reordering}
          >
            <Ionicons
              name="chevron-up"
              size={16}
              color={idx === 0 ? Colors.light.textDisabled : Colors.light.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reorderBtn, idx === groupSize - 1 && styles.reorderBtnDisabled]}
            onPress={() => onMove("down")}
            activeOpacity={0.6}
            disabled={idx === groupSize - 1 || reordering}
          >
            <Ionicons
              name="chevron-down"
              size={16}
              color={idx === groupSize - 1 ? Colors.light.textDisabled : Colors.light.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.svcName}>{svc.name}</Text>
            {svc.isAddon && (
              <View style={styles.addonBadge}>
                <Text style={styles.addonBadgeText}>Add-on</Text>
              </View>
            )}
          </View>
          <Text style={styles.svcMeta}>
            ${svc.price.toFixed(0)} · {durationLabel(svc.hours, svc.minutes)}
          </Text>
          {svc.description ? (
            <Text style={styles.svcDesc} numberOfLines={2}>
              {svc.description}
            </Text>
          ) : null}
          {/* Vehicle size pricing chips */}
          {svc.vehiclePricing && (
            <View style={styles.chipRow}>
              {svc.pricing.xl ? (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>XL +${svc.pricing.xl}</Text>
                </View>
              ) : null}
              {svc.pricing.xxl ? (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>XXL +${svc.pricing.xxl}</Text>
                </View>
              ) : null}
            </View>
          )}
          {/* Add-on target service chips */}
          {svc.isAddon && svc.addonTargetNames.length > 0 && (
            <View style={styles.chipRow}>
              {svc.addonTargetNames.map((n) => (
                <View key={n} style={styles.addonTargetChip}>
                  <Ionicons name="add-circle-outline" size={11} color={Colors.foamBlue} />
                  <Text style={styles.addonTargetChipText}>{n}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={onEdit} activeOpacity={0.7}>
            <Ionicons name="pencil-outline" size={18} color={Colors.foamBlue} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onDelete} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={18} color={Colors.errorLight} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.bgPrimary },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.mdSm,
    backgroundColor: Colors.light.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontFamily: Typography.bodySemiBold,
    fontSize: 18,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  addIconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  errorMsg: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.foamBlue,
  },
  retryText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.mdSm,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  emptyHeadline: {
    fontFamily: Typography.display,
    fontSize: Typography.size.h3,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 21,
  },
  emptyCta: {
    height: 48,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  emptyCtaText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },

  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 120,
    gap: Spacing.mdSm,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
  },
  sectionCount: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
    color: Colors.foamBlue,
    backgroundColor: Colors.foamBlueSubtle,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: Radius.pill,
    overflow: "hidden",
  },

  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    padding: Spacing.md,
  },
  shadow: { ...Shadows.light.level1 },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },

  reorderCol: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingTop: 2,
  },
  reorderBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.bgSecondary,
  },
  reorderBtnDisabled: {
    backgroundColor: "transparent",
  },

  cardInfo: { flex: 1, gap: 4 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  svcName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
  },
  addonBadge: {
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  addonBadgeText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 10,
    color: Colors.foamBlue,
  },
  svcMeta: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  svcDesc: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    lineHeight: 18,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.bgSecondary,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.mdSm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.bgSecondary,
  },
  chipText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textSecondary,
  },
  addonTargetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.foamBlue,
    backgroundColor: Colors.foamLightBlue,
  },
  addonTargetChipText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
    color: Colors.foamBlue,
  },

  addTrigger: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.light.borderDefault,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  addTriggerText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
});
