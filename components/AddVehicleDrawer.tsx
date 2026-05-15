import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerModal } from "@/components/DrawerModal";
import { DrawerHeader } from "@/components/DrawerHeader";
import { DrawerFooter } from "@/components/DrawerFooter";
import { Colors, Typography, Spacing, Radius } from "@/constants/design";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AddVehicleDrawerProps {
  visible: boolean;
  onRequestClose: () => void;
  detailerId: string;
  onAdded?: () => void;
}

const RADIUS_MIN = 5;
const RADIUS_MAX = 50;

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AddVehicleDrawer({
  visible,
  onRequestClose,
  detailerId,
  onAdded,
}: AddVehicleDrawerProps) {
  const [name, setName] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [address, setAddress] = useState("");
  const [serviceRadius, setServiceRadius] = useState(15);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setLicensePlate("");
    setAddress("");
    setServiceRadius(15);
    setNotes("");
    setError(null);
  }

  function handleClose() {
    reset();
    onRequestClose();
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Van name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();

      const { error: dbErr } = await supabase.from("business_assets").insert({
        detailer_id: detailerId,
        name: name.trim(),
        asset_type: "van",
        license_plate: licensePlate.trim() || null,
        home_base_address: address.trim() || null,
        service_radius_miles: serviceRadius,
        equipment_notes: notes.trim() || null,
        is_active: true,
      });

      if (dbErr) throw dbErr;

      reset();
      onAdded?.();
      onRequestClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save van.";
      setError(msg);
    }
    setSaving(false);
  }

  function adjustRadius(delta: number) {
    setServiceRadius((r) => Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, r + delta)));
  }

  return (
    <DrawerModal visible={visible} onRequestClose={handleClose}>
      <DrawerHeader title="Add Van" onClose={handleClose} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Van Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Van name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Van 1, Marcus's Rig, Team Blue"
            placeholderTextColor={Colors.light.textTertiary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />
          <Text style={styles.hint}>Visible to crew and in your dashboard.</Text>
        </View>

        {/* License Plate */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            License plate{" "}
            <Text style={styles.labelOptional}>(Optional)</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. GHK-4821"
            placeholderTextColor={Colors.light.textTertiary}
            value={licensePlate}
            onChangeText={setLicensePlate}
            autoCapitalize="characters"
            returnKeyType="next"
          />
        </View>

        {/* Home Base */}
        <View style={styles.fieldGroup}>
          <Text style={styles.labelCaps}>Home Base</Text>
          <Text style={styles.hint}>Where does this van start and end each day?</Text>
          <View style={styles.inputIconRow}>
            <Ionicons
              name="location-outline"
              size={18}
              color={Colors.foamBlue}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              placeholder="Start typing address..."
              placeholderTextColor={Colors.light.textTertiary}
              value={address}
              onChangeText={setAddress}
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Service Radius */}
        <View style={styles.radiusCard}>
          <Text style={styles.labelCaps}>Service Radius</Text>
          <View style={styles.radiusValueRow}>
            <TouchableOpacity
              style={styles.radiusBtn}
              onPress={() => adjustRadius(-5)}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={18} color={Colors.foamBlue} />
            </TouchableOpacity>
            <View style={styles.radiusDisplay}>
              <Text style={styles.radiusValue}>{serviceRadius}</Text>
              <Text style={styles.radiusUnit}>miles</Text>
            </View>
            <TouchableOpacity
              style={styles.radiusBtn}
              onPress={() => adjustRadius(5)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={18} color={Colors.foamBlue} />
            </TouchableOpacity>
          </View>
          {/* Visual bar */}
          <View style={styles.radiusBarTrack}>
            <View
              style={[
                styles.radiusBarFill,
                {
                  width: `${((serviceRadius - RADIUS_MIN) / (RADIUS_MAX - RADIUS_MIN)) * 100}%`,
                },
              ]}
            />
          </View>
          <View style={styles.radiusBarLabels}>
            <Text style={styles.radiusBarLabel}>{RADIUS_MIN}mi</Text>
            <Text style={styles.radiusBarLabel}>{RADIUS_MAX}mi</Text>
          </View>
          <View style={styles.radiusHint}>
            <Text style={styles.radiusHintText}>
              At {serviceRadius} miles you'll cover a wide service area.
            </Text>
          </View>
        </View>

        {/* Equipment Notes */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Equipment notes{" "}
            <Text style={styles.labelOptional}>(Optional)</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Has steam cleaner, no clay bar"
            placeholderTextColor={Colors.light.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
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
          style={[styles.saveBtn, (saving || !name.trim()) && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving || !name.trim()}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save Van</Text>
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
  fieldGroup: { gap: 6 },
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
  labelCaps: {
    fontFamily: Typography.bodyMedium,
    fontSize: 11,
    color: Colors.light.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  hint: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.light.textTertiary,
    lineHeight: 16,
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
  inputWithIcon: {
    flex: 1,
    paddingLeft: 40,
  },
  inputIconRow: { flexDirection: "row", alignItems: "center", position: "relative" },
  inputIcon: { position: "absolute", left: 13, zIndex: 1 },
  textArea: {
    height: 72,
    paddingTop: 12,
    paddingBottom: 12,
  },
  radiusCard: {
    backgroundColor: Colors.light.bgPrimary,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    padding: 14,
    gap: 12,
  },
  radiusValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  radiusBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  radiusDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  radiusValue: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 28,
    color: Colors.light.textPrimary,
  },
  radiusUnit: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  radiusBarTrack: {
    height: 6,
    backgroundColor: Colors.light.borderSubtle,
    borderRadius: 3,
    overflow: "hidden",
  },
  radiusBarFill: {
    height: 6,
    backgroundColor: Colors.foamBlue,
    borderRadius: 3,
  },
  radiusBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  radiusBarLabel: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.light.textTertiary,
  },
  radiusHint: {
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.sm,
    padding: 10,
  },
  radiusHintText: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.light.textSecondary,
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
