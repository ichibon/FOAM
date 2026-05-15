import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { DrawerModal } from "@/components/DrawerModal";
import { DrawerHeader } from "@/components/DrawerHeader";
import { DrawerFooter } from "@/components/DrawerFooter";
import { LucideIcon } from "@/components/LucideIcon";
import { Colors, Typography, Spacing, Radius } from "@/constants/design";

// ─── Types ────────────────────────────────────────────────────────────────────

type VehiclePricing = {
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

const EMPTY_PRICING: VehiclePricing = { suv: "", truck: "", van: "" };

// ─── Duration picker options ───────────────────────────────────────────────────

const HOUR_OPTIONS = Array.from({ length: 9 }, (_, i) => ({
  value: i,
  label: i === 1 ? "1 hour" : `${i} hours`,
}));

const MINUTE_OPTIONS = [
  { value: 0, label: ":00" },
  { value: 15, label: ":15" },
  { value: 30, label: ":30" },
  { value: 45, label: ":45" },
];

// ─── DurationPicker ───────────────────────────────────────────────────────────

interface DurationOption {
  value: number;
  label: string;
}

function DurationPicker({
  selectedValue,
  selectedLabel,
  options,
  onSelect,
}: {
  selectedValue: number;
  selectedLabel: string;
  options: DurationOption[];
  onSelect: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.selectBtn} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={styles.selectBtnText}>{selectedLabel}</Text>
        <LucideIcon name="ChevronDown" size={14} color={Colors.light.textTertiary} />
      </TouchableOpacity>
      <Modal
        visible={open}
        transparent
        animationType={Platform.OS === "web" ? "fade" : "slide"}
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.pickerBackdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={Platform.OS === "web" ? styles.webPickerSheet : styles.nativePickerSheet}>
            {Platform.OS !== "web" && <View style={styles.nativePickerHandle} />}
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {options.map((opt) => {
                const isSelected = opt.value === selectedValue;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.pickerOption, isSelected && styles.pickerOptionSelected]}
                    activeOpacity={0.7}
                    onPress={() => {
                      onSelect(opt.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        isSelected && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <LucideIcon name="Check" size={16} color={Colors.foamBlue} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

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
        const { data: maxRow } = await supabase
          .from("service_packages")
          .select("display_order")
          .eq("detailer_id", detailerId)
          .eq("is_active", true)
          .order("display_order", { ascending: false })
          .limit(1)
          .maybeSingle();
        const nextOrder = maxRow
          ? (maxRow as unknown as { display_order: number }).display_order + 1
          : 0;

        const { data: newRow, error: dbErr } = await supabase
          .from("service_packages")
          .insert({
            ...payload,
            detailer_id: detailerId,
            is_active: true,
            display_order: nextOrder,
          })
          .select("id")
          .single();
        if (dbErr) throw dbErr;
        if (!newRow) throw new Error("No data returned from insert.");
        packageId = (newRow as unknown as { id: string }).id;
      }

      // ── Vehicle size pricing ─────────────────────────────────────────────────
      // Delete all existing rows for this package, then re-insert current values.
      await supabase.from("vehicle_size_pricing").delete().eq("package_id", packageId);

      if (vehiclePricingEnabled) {
        const vehicleRows = (["suv", "truck", "van"] as (keyof VehiclePricing)[])
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

  const hoursLabel = HOUR_OPTIONS.find((o) => o.value === hours)?.label ?? `${hours} hours`;
  const minutesLabel = MINUTE_OPTIONS.find((o) => o.value === minutes)?.label ?? `:${minutes}`;
  const canSave = name.trim().length > 0 && price.length > 0 && (hours > 0 || minutes > 0);

  return (
    <DrawerModal visible={visible} onRequestClose={onRequestClose}>
      <DrawerHeader title={isEdit ? "Edit Service" : "New Service"} onClose={onRequestClose} />

      <KeyboardAvoidingView
        style={styles.kav}
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
              <View style={styles.flex1}>
                <DurationPicker
                  selectedValue={hours}
                  selectedLabel={hoursLabel}
                  options={HOUR_OPTIONS}
                  onSelect={setHours}
                />
              </View>
              <View style={styles.flex1}>
                <DurationPicker
                  selectedValue={minutes}
                  selectedLabel={minutesLabel}
                  options={MINUTE_OPTIONS}
                  onSelect={setMinutes}
                />
              </View>
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
                {(["suv", "truck", "van"] as (keyof VehiclePricing)[]).map((type) => (
                  <View key={type} style={styles.vehicleRow}>
                    <Text style={styles.vehicleLabel}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                    <View style={styles.vehiclePriceWrap}>
                      <Text style={styles.vehicleCurrencySymbol}>$</Text>
                      <TextInput
                        style={styles.vehicleInput}
                        value={pricing[type]}
                        onChangeText={(v) => setPricing((p) => ({ ...p, [type]: v }))}
                        placeholder="0.00"
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
  kav: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
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

  // DurationPicker trigger
  selectBtn: {
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
  selectBtnText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },

  // Web modal picker
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  webPickerSheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: 300,
    paddingBottom: 24,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.borderSubtle,
  },
  pickerOptionSelected: {
    backgroundColor: Colors.foamBlueSubtle,
  },
  pickerOptionText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  pickerOptionTextSelected: {
    fontFamily: Typography.bodyMedium,
    color: Colors.foamBlue,
  },

  // Native modal picker
  nativePickerSheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    maxHeight: 300,
  },
  nativePickerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.borderDefault,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
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
