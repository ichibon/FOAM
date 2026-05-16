import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
  vehicle_size_pricing: RawVehiclePricingRow[];
}

type VehiclePricingMap = {
  suv: string;
  truck: string;
  van: string;
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

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDrawerService | undefined>(undefined);

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
        .select("id,name,base_price,duration_mins,description,display_order,vehicle_size_pricing(vehicle_type,price_adjustment)")
        .eq("detailer_id", dId)
        .eq("is_active", true)
        .order("display_order");
      if (pkgErr) throw pkgErr;

      const rows: RawServicePackage[] = (pkgData as unknown as RawServicePackage[]) ?? [];
      setServices(
        rows.map((r) => {
          const { hours, minutes } = minsToHM(r.duration_mins);
          const vspRows = r.vehicle_size_pricing ?? [];
          const pricing: VehiclePricingMap = { suv: "", truck: "", van: "" };
          for (const row of vspRows) {
            const t = row.vehicle_type as keyof VehiclePricingMap;
            if (t in pricing) pricing[t] = row.price_adjustment.toString();
          }
          const vehiclePricing = vspRows.length > 0;
          return {
            id: r.id,
            name: r.name,
            price: r.base_price,
            hours,
            minutes,
            description: r.description,
            vehiclePricing,
            pricing,
            displayOrder: r.display_order,
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
    });
    setDrawerVisible(true);
  }

  function handleSaved() {
    setDrawerVisible(false);
    load();
  }

  function confirmDelete(svc: ServiceItem) {
    Alert.alert(
      "Delete Service",
      `Remove "${svc.name}" from your service menu?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteService(svc.id) },
      ]
    );
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

  async function moveService(index: number, direction: "up" | "down") {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= services.length) return;
    if (reordering) return;

    // Swap the two items and renumber the entire list sequentially so that
    // duplicate display_order values (from legacy data or concurrent adds) can
    // never block a future reorder.
    const reordered = [...services];
    const temp = reordered[index];
    reordered[index] = reordered[swapIndex];
    reordered[swapIndex] = temp;

    const withNewOrder = reordered.map((svc, i) => ({
      ...svc,
      displayOrder: i,
    }));
    setServices(withNewOrder);

    setReordering(true);
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();
      const updates = await Promise.all(
        withNewOrder.map((svc) =>
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
      ) : services.length === 0 ? (
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
        >
          {services.map((svc, idx) => (
            <View key={svc.id} style={[styles.card, styles.shadow]}>
              <View style={styles.cardTop}>
                {/* Reorder handle */}
                <View style={styles.reorderCol}>
                  <TouchableOpacity
                    style={[styles.reorderBtn, idx === 0 && styles.reorderBtnDisabled]}
                    onPress={() => moveService(idx, "up")}
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
                    style={[styles.reorderBtn, idx === services.length - 1 && styles.reorderBtnDisabled]}
                    onPress={() => moveService(idx, "down")}
                    activeOpacity={0.6}
                    disabled={idx === services.length - 1 || reordering}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={idx === services.length - 1 ? Colors.light.textDisabled : Colors.light.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.svcName}>{svc.name}</Text>
                  <Text style={styles.svcMeta}>
                    ${svc.price.toFixed(0)} · {durationLabel(svc.hours, svc.minutes)}
                  </Text>
                  {svc.description ? (
                    <Text style={styles.svcDesc} numberOfLines={2}>
                      {svc.description}
                    </Text>
                  ) : null}
                  {svc.vehiclePricing && (
                    <View style={styles.chipRow}>
                      {svc.pricing.suv ? (
                        <View style={styles.chip}>
                          <Text style={styles.chipText}>SUV ${svc.pricing.suv}</Text>
                        </View>
                      ) : null}
                      {svc.pricing.truck ? (
                        <View style={styles.chip}>
                          <Text style={styles.chipText}>Truck ${svc.pricing.truck}</Text>
                        </View>
                      ) : null}
                      {svc.pricing.van ? (
                        <View style={styles.chip}>
                          <Text style={styles.chipText}>Van ${svc.pricing.van}</Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => openEdit(svc)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil-outline" size={18} color={Colors.foamBlue} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => confirmDelete(svc)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.errorLight} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addTrigger} onPress={openAdd} activeOpacity={0.8}>
            <Ionicons name="add" size={20} color={Colors.foamBlue} />
            <Text style={styles.addTriggerText}>Add a Service</Text>
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
          onSaved={handleSaved}
        />
      ) : null}
    </SafeAreaView>
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
  svcName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
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
