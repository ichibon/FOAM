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

interface RawServicePackage {
  id: string;
  name: string;
  base_price: number;
  duration_mins: number;
  description: string | null;
  display_order: number;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  hours: number;
  minutes: number;
  description: string | null;
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
        .select("id,name,base_price,duration_mins,description,display_order")
        .eq("detailer_id", dId)
        .eq("is_active", true)
        .order("display_order");
      if (pkgErr) throw pkgErr;

      const rows: RawServicePackage[] = (pkgData as unknown as RawServicePackage[]) ?? [];
      setServices(
        rows.map((r) => {
          const { hours, minutes } = minsToHM(r.duration_mins);
          return {
            id: r.id,
            name: r.name,
            price: r.base_price,
            hours,
            minutes,
            description: r.description,
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
      vehiclePricing: false,
      pricing: { sedan: "", suv: "", truck: "", van: "" },
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
      await supabase.from("service_packages").delete().eq("id", id);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.warn("[Services] delete error", err);
      Alert.alert("Error", "Couldn't delete the service. Please try again.");
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
          {services.map((svc) => (
            <View key={svc.id} style={[styles.card, styles.shadow]}>
              <View style={styles.cardTop}>
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
