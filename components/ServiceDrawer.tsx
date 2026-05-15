import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { DrawerModal } from "@/components/DrawerModal";
import { DrawerHeader } from "@/components/DrawerHeader";
import { DrawerFooter } from "@/components/DrawerFooter";
import { LucideIcon } from "@/components/LucideIcon";
import { Colors, Typography, Spacing, Radius } from "@/constants/design";

// ─── Types ────────────────────────────────────────────────────────────────────

type VehiclePricing = {
  sedan: string;
  suv: string;
  truck: string;
  van: string;
};

export interface ServiceDrawerService {
  id: string;
  name: string;
  price: number;
  hours: number;
  minutes: number;
  description: string | null;
  vehiclePricing: boolean;
  pricing: VehiclePricing;
}

export interface ServiceDrawerProps {
  visible: boolean;
  onRequestClose: () => void;
  detailerId: string;
  service?: ServiceDrawerService;
  onSaved: (saved: { id: string; name: string }) => void;
}

const EMPTY_PRICING: VehiclePricing = { sedan: "", suv: "", truck: "", van: "" };

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ServiceDrawer({
  visible,
  onRequestClose,
  detailerId,
  service,
  onSaved,
}: ServiceDrawerProps) {
  const isEdit = !!service?.id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [hours, setHours] = useState(2);
  const [minutes, setMinutes] = useState(30);
  const [vehiclePricingEnabled, setVehiclePricingEnabled] = useState(false);
  const [pricing, setPricing] = useState<VehiclePricing>(EMPTY_PRICING);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (service) {
      setName(service.name);
      setDescription(service.description ?? "");
      setPrice(service.price.toString());
      setHours(service.hours);
      setMinutes(service.minutes);
      setVehiclePricingEnabled(service.vehiclePricing);
      setPricing(service.pricing ?? EMPTY_PRICING);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setHours(2);
      setMinutes(30);
      setVehiclePricingEnabled(false);
      setPricing(EMPTY_PRICING);
    }
    setError(null);
  }, [visible, service]);

  async function handleSave() {
    const nameTrimmed = name.trim();
    const priceNum = parseFloat(price.replace(/[^0-9.]/g, ""));
    const durationMins = hours * 60 + minutes;

    if (!nameTrimmed) {
      setError("Service name is required.");
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Enter a valid price greater than $0.");
      return;
    }
    if (durationMins <= 0) {
      setError("Duration must be at least 1 minute.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();

      const payload = {
        name: nameTrimmed,
        description: description.trim() || null,
        base_price: priceNum,
        duration_mins: durationMins,
      };

      let packageId: string;

      if (isEdit) {
        const { error: dbErr } = await supabase
          .from("service_packages")
          .update(payload)
          .eq("id", service!.id);
        if (dbErr) throw dbErr;
        packageId = service!.id;
      } else {
        const { data: newRow, error: dbErr } = await supabase
          .from("service_packages")
          .insert({
            ...payload,
            detailer_id: detailerId,
            is_active: true,
            display_order: 0,
          })
          .select("id")
          .single();
        if (dbErr) throw dbErr;
        if (!newRow) throw new Error("No data returned from insert.");
        packageId = (newRow as unknown as { id: string }).id;
      }

      // ── Vehicle size pricing ─────────────────────────────────────────────────
      // Always delete existing rows for this package, then insert current values.
      await supabase.from("vehicle_size_pricing").delete().eq("package_id", packageId);

      if (vehiclePricingEnabled) {
        const vehicleRows = (["sedan", "suv", "truck", "van"] as (keyof VehiclePricing)[])
          .filter((t) => pricing[t].trim() !== "")
          .map((t) => ({
            package_id: packageId,
            vehicle_type: t,
            price_adjustment: parseFloat(pricing[t]),
          }))
          .filter((r) => !isNaN(r.price_adjustment));

        if (vehicleRows.length > 0) {
          const { error: vErr } = await supabase.from("vehicle_size_pricing").insert(vehicleRows);
          if (vErr) throw vErr;
        }
      }

      onSaved({ id: packageId, name: nameTrimmed });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save service.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const canSave = name.trim().length > 0 && price.length > 0 && (hours > 0 || minutes > 0);

  return (
    <DrawerModal visible={visible} onRequestClose={onRequestClose}>
      <DrawerHeader title={isEdit ? "Edit Service" : "New Service"} onClose={onRequestClose} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Service name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Exterior Wash, Full Detail"
              placeholderTextColor={Colors.light.textTertiary}
              autoCapitalize="words"
            />
          </View>

          {/* Base price */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Base price</Text>
            <View style={styles.priceRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={[styles.input, styles.priceInput]}
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor={Colors.light.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Duration */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estimated duration</Text>
            <View style={styles.durationRow}>
              <TouchableOpacity
                style={[styles.durationBtn, styles.flex1]}
                onPress={() => setHours((h) => (h + 1) % 13)}
                activeOpacity={0.7}
              >
                <Text style={styles.durationBtnText}>
                  {hours} hour{hours !== 1 ? "s" : ""}
                </Text>
                <LucideIcon name="ChevronDown" size={14} color={Colors.light.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.durationBtn, styles.flex1]}
                onPress={() => setMinutes((m) => (m === 45 ? 0 : m + 15))}
                activeOpacity={0.7}
              >
                <Text style={styles.durationBtnText}>{minutes} min</Text>
                <LucideIcon name="ChevronDown" size={14} color={Colors.light.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.optional}>Optional</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="What's included in this service?"
              placeholderTextColor={Colors.light.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Vehicle pricing */}
          <View style={styles.vehicleSection}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Different pricing by vehicle size</Text>
              <Switch
                value={vehiclePricingEnabled}
                onValueChange={setVehiclePricingEnabled}
                trackColor={{ false: Colors.light.borderDefault, true: Colors.foamBlue }}
                thumbColor={Colors.white}
              />
            </View>

            {vehiclePricingEnabled && (
              <View style={styles.vehicleInputs}>
                {(["sedan", "suv", "truck", "van"] as (keyof VehiclePricing)[]).map((type) => (
                  <View key={type} style={styles.vehicleRow}>
                    <Text style={styles.vehicleLabel}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                    <View style={styles.vehiclePriceWrap}>
                      <Text style={styles.vehicleCurrencySymbol}>
                        {type === "sedan" ? "$" : "+$"}
                      </Text>
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

          {error ? (
            <View style={styles.errorBox}>
              <LucideIcon name="AlertCircle" size={15} color={Colors.errorLight} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <DrawerFooter>
        <TouchableOpacity
          style={[styles.saveBtn, (!canSave || saving) && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={!canSave || saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>
              {isEdit ? "Save Changes" : "Add Service"}
            </Text>
          )}
        </TouchableOpacity>
      </DrawerFooter>
    </DrawerModal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    gap: 24,
    paddingBottom: 24,
  },
  inputGroup: { gap: 6 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  optional: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
  },
  input: {
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
  textArea: {
    height: 80,
    paddingTop: Spacing.md,
    textAlignVertical: "top",
  },
  durationRow: { flexDirection: "row", gap: Spacing.sm },
  flex1: { flex: 1 },
  durationBtn: {
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
  durationBtnText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  vehicleSection: {
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
  vehiclePriceWrap: { position: "relative", width: 140 },
  vehicleCurrencySymbol: {
    position: "absolute",
    left: 16,
    top: 16,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    zIndex: 1,
  },
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
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(220,38,38,0.07)",
    borderRadius: Radius.sm,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.errorLight,
  },
  saveBtn: {
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
});
