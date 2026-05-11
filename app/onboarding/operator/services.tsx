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
  Switch,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Shadows, Drawer } from "@/constants/design";
import { supabase } from "@/lib/supabase";
import { LucideIcon } from "@/components/LucideIcon";

type VehiclePricing = {
  sedan: string;
  suv: string;
  truck: string;
  van: string;
};

type ServiceItem = {
  id: string;
  name: string;
  price: string;
  hours: number;
  minutes: number;
  description: string;
  vehiclePricing: boolean;
  pricing: VehiclePricing;
};

export default function ServicesScreen() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newHours, setNewHours] = useState(2);
  const [newMinutes, setNewMinutes] = useState(30);
  const [newDescription, setNewDescription] = useState("");
  const [vehiclePricing, setVehiclePricing] = useState(false);
  const [pricing, setPricing] = useState<VehiclePricing>({ sedan: "", suv: "", truck: "", van: "" });

  function openSheet() {
    setNewName("");
    setNewPrice("");
    setNewHours(2);
    setNewMinutes(30);
    setNewDescription("");
    setVehiclePricing(false);
    setPricing({ sedan: "", suv: "", truck: "", van: "" });
    setSheetOpen(true);
  }

  function addService() {
    if (!newName.trim() || !newPrice.trim()) return;
    setServices((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newName.trim(),
        price: newPrice.trim(),
        hours: newHours,
        minutes: newMinutes,
        description: newDescription.trim(),
        vehiclePricing,
        pricing,
      },
    ]);
    setSheetOpen(false);
  }

  function removeService(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleContinue() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user && services.length > 0) {
      const { data: profile } = await supabase
        .from("detailer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        const packages = services.map((s, idx) => ({
          detailer_id: profile.id,
          name: s.name,
          description: s.description || null,
          duration_mins: s.hours * 60 + s.minutes,
          base_price: parseFloat(s.price),
          is_active: true,
          display_order: idx,
        }));
        await supabase.from("service_packages").insert(packages);
      }
    }
    router.push("/onboarding/operator/stripe");
    setSaving(false);
  }

  const durationLabel = (h: number, m: number) => {
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.progressHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
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
          <Text style={styles.headline}>What you offer.</Text>
          <Text style={styles.subheadline}>Add your services and pricing. You can edit these anytime.</Text>
        </View>

        {services.length > 0 && (
          <View style={styles.servicesList}>
            {services.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceCardTop}>
                  <View>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceMeta}>
                      ${service.price} · ~{durationLabel(service.hours, service.minutes)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {}}
                    activeOpacity={0.7}
                    style={styles.editBtn}
                  >
                    <LucideIcon name="Pencil" size={16} color={Colors.light.textTertiary} />
                  </TouchableOpacity>
                </View>

                {service.description ? (
                  <Text style={styles.serviceDescription} numberOfLines={2}>
                    {service.description}
                  </Text>
                ) : null}

                <View style={styles.serviceBottom}>
                  <View style={styles.serviceChips}>
                    {service.vehiclePricing && service.pricing.sedan ? (
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>Sedan ${service.pricing.sedan}</Text>
                      </View>
                    ) : null}
                    {service.vehiclePricing && service.pricing.suv ? (
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>SUV +${service.pricing.suv}</Text>
                      </View>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => removeService(service.id)} activeOpacity={0.7}>
                    <LucideIcon name="Trash2" size={16} color={Colors.light.textTertiary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.addTrigger} onPress={openSheet} activeOpacity={0.8}>
          <LucideIcon name="Plus" size={20} color={Colors.foamBlue} />
          <Text style={styles.addTriggerText}>Add a Service</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, (services.length === 0 || saving) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={services.length === 0 || saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.footnote}>You can add more services anytime from your profile.</Text>
      </View>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity style={styles.backdropTouch} onPress={() => setSheetOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.dragHandle} />
            <Text style={styles.sheetTitle}>New Service</Text>

            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sheetInputGroup}>
                <Text style={styles.sheetLabel}>Service name</Text>
                <TextInput
                  style={styles.sheetInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="e.g., Exterior Wash, Full Detail"
                  placeholderTextColor={Colors.light.textTertiary}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.sheetInputGroup}>
                <Text style={styles.sheetLabel}>Base price</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={[styles.sheetInput, styles.priceInput]}
                    value={newPrice}
                    onChangeText={setNewPrice}
                    placeholder="0.00"
                    placeholderTextColor={Colors.light.textTertiary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.sheetInputGroup}>
                <Text style={styles.sheetLabel}>Estimated duration</Text>
                <View style={styles.durationRow}>
                  <View style={styles.flex1}>
                    <TouchableOpacity
                      style={styles.durationSelect}
                      onPress={() => setNewHours((h) => (h + 1) % 13)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.durationSelectText}>{newHours} hour{newHours !== 1 ? "s" : ""}</Text>
                      <LucideIcon name="ChevronDown" size={14} color={Colors.light.textTertiary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.flex1}>
                    <TouchableOpacity
                      style={styles.durationSelect}
                      onPress={() => setNewMinutes((m) => (m === 45 ? 0 : m + 15))}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.durationSelectText}>{newMinutes} min</Text>
                      <LucideIcon name="ChevronDown" size={14} color={Colors.light.textTertiary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.sheetInputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.sheetLabel}>Description</Text>
                  <Text style={styles.optional}>Optional</Text>
                </View>
                <TextInput
                  style={[styles.sheetInput, styles.textArea]}
                  value={newDescription}
                  onChangeText={setNewDescription}
                  placeholder="What's included in this service?"
                  placeholderTextColor={Colors.light.textTertiary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.vehiclePricingSection}>
                <View style={styles.switchRow}>
                  <Text style={styles.sheetLabel}>Different pricing by vehicle size</Text>
                  <Switch
                    value={vehiclePricing}
                    onValueChange={setVehiclePricing}
                    trackColor={{ false: Colors.light.borderDefault, true: Colors.foamBlue }}
                    thumbColor={Colors.white}
                  />
                </View>

                {vehiclePricing && (
                  <View style={styles.vehicleInputs}>
                    {(["sedan", "suv", "truck", "van"] as (keyof VehiclePricing)[]).map((type) => (
                      <View key={type} style={styles.vehicleRow}>
                        <Text style={styles.vehicleLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                        <View style={styles.vehiclePriceInput}>
                          <Text style={styles.currencySymbol}>{type === "sedan" ? "$" : "+$"}</Text>
                          <TextInput
                            style={styles.vehicleInput}
                            value={pricing[type]}
                            onChangeText={(v) => setPricing((p) => ({ ...p, [type]: v }))}
                            placeholder={type === "sedan" ? "220" : "30"}
                            placeholderTextColor={Colors.light.textTertiary}
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.sheetFooter}>
              <TouchableOpacity
                style={[styles.sheetCta, (!newName.trim() || !newPrice.trim()) && styles.buttonDisabled]}
                onPress={addService}
                disabled={!newName.trim() || !newPrice.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.sheetCtaText}>Add Service</Text>
              </TouchableOpacity>
            </View>
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
  progressFill: { height: "100%", backgroundColor: Colors.foamBlue, borderRadius: 2 },
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
  servicesList: { gap: Spacing.md, marginBottom: Spacing.md },
  serviceCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    gap: Spacing.sm,
    ...Shadows.light.level1,
  },
  serviceCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  serviceName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
  },
  serviceMeta: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  editBtn: { padding: 4 },
  serviceDescription: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    lineHeight: 18,
  },
  serviceBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  serviceChips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.bgPrimary,
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
  },
  addTriggerText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
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
  footnote: {
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
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Drawer.background,
    borderTopLeftRadius: Drawer.borderRadius,
    borderTopRightRadius: Drawer.borderRadius,
    maxHeight: "85%",
    ...Shadows.light.level3,
  },
  dragHandle: {
    width: Drawer.dragHandleWidth,
    height: Drawer.dragHandleHeight,
    borderRadius: 2,
    backgroundColor: Drawer.dragHandleColor,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 17,
    color: Colors.light.textPrimary,
    textAlign: "center",
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  sheetScroll: { maxHeight: 500 },
  sheetContent: {
    padding: Spacing.md,
    gap: 24,
    paddingBottom: 100,
  },
  sheetInputGroup: { gap: 6 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  optional: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
  },
  sheetInput: {
    height: 48,
    backgroundColor: Colors.light.bgPrimary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
  },
  textArea: {
    height: 80,
    paddingTop: Spacing.md,
    textAlignVertical: "top",
  },
  priceRow: { position: "relative" },
  priceInput: { paddingLeft: 32 },
  currencySymbol: {
    position: "absolute",
    left: 16,
    top: 14,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    zIndex: 1,
  },
  durationRow: { flexDirection: "row", gap: Spacing.sm },
  flex1: { flex: 1 },
  durationSelect: {
    height: 48,
    backgroundColor: Colors.light.bgPrimary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  durationSelectText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  vehiclePricingSection: {
    gap: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vehicleInputs: { gap: Spacing.sm },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vehicleLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    width: 60,
  },
  vehiclePriceInput: { position: "relative", width: 140 },
  vehicleInput: {
    height: 52,
    backgroundColor: Colors.light.bgPrimary,
    borderRadius: Radius.md,
    paddingLeft: 40,
    paddingRight: Spacing.md,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    textAlign: "right",
  },
  sheetFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    paddingBottom: Platform.OS === "web" ? 16 : 32,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  sheetCta: {
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.light.level2,
  },
  sheetCtaText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
});
