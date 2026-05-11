import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Shadows, Drawer } from "@/constants/design";
import { supabase } from "@/lib/supabase";
import { EmptyState } from "@/components/EmptyState";
import { LucideIcon } from "@/components/LucideIcon";

type AssetType = "van" | "trailer" | "truck" | "other";

interface AddedVan {
  id: string;
  name: string;
  asset_type: AssetType;
}

interface AddedLocation {
  id: string;
  name: string;
  address: string;
}

export default function BuildOperationScreen() {
  const [vans, setVans] = useState<AddedVan[]>([]);
  const [locations, setLocations] = useState<AddedLocation[]>([]);
  const [loading, setLoading] = useState(false);

  const [showVanDrawer, setShowVanDrawer] = useState(false);
  const [vanName, setVanName] = useState("");
  const [vanType, setVanType] = useState<AssetType>("van");
  const [vanSaving, setVanSaving] = useState(false);

  const [showLocDrawer, setShowLocDrawer] = useState(false);
  const [locName, setLocName] = useState("");
  const [locAddress, setLocAddress] = useState("");
  const [locSaving, setLocSaving] = useState(false);

  const assetTypes: { id: AssetType; label: string }[] = [
    { id: "van", label: "Van" },
    { id: "trailer", label: "Trailer" },
    { id: "truck", label: "Truck" },
    { id: "other", label: "Other" },
  ];

  async function getDetailerProfileId(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from("detailer_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();
    return data?.id ?? null;
  }

  async function handleAddVan() {
    if (!vanName.trim()) return;
    setVanSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const detailerId = await getDetailerProfileId(user.id);
      if (detailerId) {
        const { data } = await supabase
          .from("business_assets")
          .insert({ detailer_id: detailerId, name: vanName.trim(), asset_type: vanType })
          .select("id, name, asset_type")
          .single();
        if (data) setVans((prev) => [...prev, data as AddedVan]);
      }
    }
    setVanName("");
    setVanType("van");
    setVanSaving(false);
    setShowVanDrawer(false);
  }

  async function handleAddLocation() {
    if (!locName.trim() || !locAddress.trim()) return;
    setLocSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const detailerId = await getDetailerProfileId(user.id);
      if (detailerId) {
        const { data } = await supabase
          .from("business_locations")
          .insert({ detailer_id: detailerId, name: locName.trim(), address: locAddress.trim() })
          .select("id, name, address")
          .single();
        if (data) setLocations((prev) => [...prev, data as AddedLocation]);
      }
    }
    setLocName("");
    setLocAddress("");
    setLocSaving(false);
    setShowLocDrawer(false);
  }

  async function handleContinue() {
    setLoading(true);
    router.push("/onboarding/operator/services");
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.progressHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <LucideIcon name="ChevronLeft" size={20} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Step 2 of 4</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.progressTrackWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "50%" }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introBlock}>
          <Text style={styles.headline}>Build your operation.</Text>
          <Text style={styles.subheadline}>Add your vehicles and locations so the app knows how you work.</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>VEHICLES</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowVanDrawer(true)}
              activeOpacity={0.8}
            >
              <LucideIcon name="Plus" size={14} color={Colors.foamBlue} />
              <Text style={styles.addButtonText}>Add Van</Text>
            </TouchableOpacity>
          </View>

          {vans.length === 0 ? (
            <EmptyState
              variant="functional"
              icon="Truck"
              headline="No vehicles yet"
              body="Add your vans, trailers, or trucks."
              ctaLabel="Add Vehicle"
              ctaRoute="/onboarding/operator/build"
              fullScreen={false}
            />
          ) : (
            <View style={styles.itemList}>
              {vans.map((van) => (
                <View key={van.id} style={styles.itemRow}>
                  <View style={styles.itemIcon}>
                    <LucideIcon name="Truck" size={16} color={Colors.foamBlue} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{van.name}</Text>
                    <Text style={styles.itemMeta}>{van.asset_type}</Text>
                  </View>
                  <LucideIcon name="Check" size={16} color={Colors.foamBlue} />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>LOCATIONS</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowLocDrawer(true)}
              activeOpacity={0.8}
            >
              <LucideIcon name="Plus" size={14} color={Colors.foamBlue} />
              <Text style={styles.addButtonText}>Add Location</Text>
            </TouchableOpacity>
          </View>

          {locations.length === 0 ? (
            <EmptyState
              variant="functional"
              icon="MapPin"
              headline="No locations yet"
              body="Add a shop, bay, or fixed service location."
              ctaLabel="Add Location"
              ctaRoute="/onboarding/operator/build"
              fullScreen={false}
            />
          ) : (
            <View style={styles.itemList}>
              {locations.map((loc) => (
                <View key={loc.id} style={styles.itemRow}>
                  <View style={styles.itemIcon}>
                    <LucideIcon name="MapPin" size={16} color={Colors.foamBlue} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{loc.name}</Text>
                    <Text style={styles.itemMeta}>{loc.address}</Text>
                  </View>
                  <LucideIcon name="Check" size={16} color={Colors.foamBlue} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.skipHint}>You can add more vehicles and locations later.</Text>
      </View>

      <Modal visible={showVanDrawer} animationType="slide" transparent onRequestClose={() => setShowVanDrawer(false)}>
        <View style={styles.backdrop}>
          <TouchableOpacity style={styles.backdropTouchable} onPress={() => setShowVanDrawer(false)} />
          <View style={styles.drawer}>
            <View style={styles.drawerHandle} />
            <Text style={styles.drawerTitle}>Add Vehicle</Text>

            <View style={styles.drawerForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vehicle name</Text>
                <TextInput
                  style={styles.input}
                  value={vanName}
                  onChangeText={setVanName}
                  placeholder="e.g., Primary Van, Unit 1"
                  placeholderTextColor={Colors.light.textTertiary}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Type</Text>
                <View style={styles.typeRow}>
                  {assetTypes.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.typePill, vanType === t.id && styles.typePillActive]}
                      onPress={() => setVanType(t.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.typePillText, vanType === t.id && styles.typePillTextActive]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.drawerButton, (!vanName.trim() || vanSaving) && styles.buttonDisabled]}
              onPress={handleAddVan}
              disabled={!vanName.trim() || vanSaving}
              activeOpacity={0.85}
            >
              {vanSaving ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.drawerButtonText}>Add Vehicle</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showLocDrawer} animationType="slide" transparent onRequestClose={() => setShowLocDrawer(false)}>
        <View style={styles.backdrop}>
          <TouchableOpacity style={styles.backdropTouchable} onPress={() => setShowLocDrawer(false)} />
          <View style={styles.drawer}>
            <View style={styles.drawerHandle} />
            <Text style={styles.drawerTitle}>Add Location</Text>

            <View style={styles.drawerForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location name</Text>
                <TextInput
                  style={styles.input}
                  value={locName}
                  onChangeText={setLocName}
                  placeholder="e.g., Main Shop, Downtown Bay"
                  placeholderTextColor={Colors.light.textTertiary}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={locAddress}
                  onChangeText={setLocAddress}
                  placeholder="123 Main St, Atlanta, GA 30305"
                  placeholderTextColor={Colors.light.textTertiary}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.drawerButton, (!locName.trim() || !locAddress.trim() || locSaving) && styles.buttonDisabled]}
              onPress={handleAddLocation}
              disabled={!locName.trim() || !locAddress.trim() || locSaving}
              activeOpacity={0.85}
            >
              {locSaving ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.drawerButtonText}>Add Location</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
  progressFill: {
    height: "100%",
    backgroundColor: Colors.foamBlue,
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: 16,
    paddingBottom: 140,
  },
  introBlock: { marginBottom: 32 },
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
  section: { marginBottom: 32 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  addButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.caption,
    color: Colors.foamBlue,
  },
  itemList: { gap: Spacing.sm },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    ...Shadows.light.level1,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: { flex: 1 },
  itemName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  itemMeta: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
    textTransform: "capitalize",
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Platform.OS === "web" ? 24 : 0,
    paddingTop: Spacing.md,
    alignItems: "center",
    gap: Spacing.sm,
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
  buttonDisabled: { opacity: 0.5 },
  primaryButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
  skipHint: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
    textAlign: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: Drawer.backdropStandard,
    justifyContent: "flex-end",
  },
  backdropTouchable: {
    flex: 1,
  },
  drawer: {
    backgroundColor: Drawer.background,
    borderTopLeftRadius: Drawer.borderRadius,
    borderTopRightRadius: Drawer.borderRadius,
    paddingHorizontal: Spacing.md,
    paddingBottom: Platform.OS === "web" ? 24 : 40,
    paddingTop: Drawer.dragHandleTopOffset,
    ...Shadows.light.level3,
  },
  drawerHandle: {
    width: Drawer.dragHandleWidth,
    height: Drawer.dragHandleHeight,
    borderRadius: 2,
    backgroundColor: Drawer.dragHandleColor,
    alignSelf: "center",
    marginBottom: 16,
  },
  drawerTitle: {
    fontFamily: Typography.display,
    fontSize: 20,
    color: Colors.light.textPrimary,
    marginBottom: 20,
  },
  drawerForm: { gap: Spacing.md, marginBottom: 24 },
  inputGroup: { gap: 6 },
  inputLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
    color: Colors.light.textSecondary,
  },
  input: {
    height: 48,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
  },
  typeRow: { flexDirection: "row", gap: Spacing.sm },
  typePill: {
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    backgroundColor: Colors.light.surface,
  },
  typePillActive: {
    backgroundColor: Colors.foamBlue,
    borderColor: Colors.foamBlue,
  },
  typePillText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  typePillTextActive: { color: Colors.white },
  drawerButton: {
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.light.level2,
  },
  drawerButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
});
