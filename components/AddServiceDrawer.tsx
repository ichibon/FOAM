import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerModal } from "@/components/DrawerModal";
import { DrawerHeader } from "@/components/DrawerHeader";
import { DrawerFooter } from "@/components/DrawerFooter";
import { Colors, Typography, Spacing, Radius } from "@/constants/design";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AddServiceDrawerProps {
  visible: boolean;
  onRequestClose: () => void;
  detailerId: string;
  onAdded: (newPackageId: string) => void;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AddServiceDrawer({
  visible,
  onRequestClose,
  detailerId,
  onAdded,
}: AddServiceDrawerProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [durationMins, setDurationMins] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setDescription("");
    setPrice("");
    setDurationMins("");
    setError(null);
  }

  function handleClose() {
    reset();
    onRequestClose();
  }

  async function handleSave() {
    const nameTrimmed = name.trim();
    const priceNum = parseFloat(price.replace(/[^0-9.]/g, ""));
    const durNum = parseInt(durationMins.replace(/[^0-9]/g, ""), 10);

    if (!nameTrimmed) {
      setError("Service name is required.");
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Enter a valid price greater than $0.");
      return;
    }
    if (isNaN(durNum) || durNum <= 0) {
      setError("Enter a valid duration in minutes.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();

      const { data: newRow, error: dbErr } = await supabase
        .from("service_packages")
        .insert({
          detailer_id: detailerId,
          name: nameTrimmed,
          description: description.trim() || null,
          base_price: priceNum,
          duration_mins: durNum,
          is_active: true,
          display_order: 0,
        })
        .select("id")
        .single();

      if (dbErr) throw dbErr;
      if (!newRow) throw new Error("No data returned from insert.");

      const id: string = (newRow as { id: string }).id;
      reset();
      onAdded(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save service.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const canSave = name.trim().length > 0 && price.length > 0 && durationMins.length > 0;

  return (
    <DrawerModal visible={visible} onRequestClose={handleClose}>
      <DrawerHeader title="Add a Service" onClose={handleClose} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tip card */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={16} color={Colors.foamBlue} style={styles.tipIcon} />
          <Text style={styles.tipText}>
            Start with your most popular service. You can always add more.
          </Text>
        </View>

        {/* Service name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Service name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Full Detail, Exterior Wash"
            placeholderTextColor={Colors.light.textTertiary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Description{" "}
            <Text style={styles.labelOptional}>(Optional)</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Briefly describe what's included"
            placeholderTextColor={Colors.light.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Price + Duration row */}
        <View style={styles.twoCol}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Price ($)</Text>
            <TextInput
              style={styles.input}
              placeholder="149"
              placeholderTextColor={Colors.light.textTertiary}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Duration (min)</Text>
            <TextInput
              style={styles.input}
              placeholder="120"
              placeholderTextColor={Colors.light.textTertiary}
              value={durationMins}
              onChangeText={setDurationMins}
              keyboardType="number-pad"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={15} color={Colors.errorLight} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

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
            <Text style={styles.saveBtnText}>Add Service</Text>
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
    gap: 18,
    paddingBottom: 8,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.mdSm,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    borderRadius: Radius.md,
    padding: Spacing.mdSm,
  },
  tipIcon: { marginTop: 1 },
  tipText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 19,
  },
  fieldGroup: { gap: 6 },
  twoCol: { flexDirection: "row", gap: Spacing.mdSm },
  label: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.light.textPrimary,
  },
  labelOptional: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textTertiary,
  },
  input: {
    height: 48,
    backgroundColor: Colors.light.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    fontFamily: Typography.body,
    fontSize: 15,
    color: Colors.light.textPrimary,
  },
  textArea: {
    height: 72,
    paddingTop: 12,
    paddingBottom: 12,
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
    fontSize: 13,
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
    fontSize: 14,
    color: Colors.white,
  },
});
