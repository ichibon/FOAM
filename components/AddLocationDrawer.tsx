import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerModal } from "@/components/DrawerModal";
import { DrawerHeader } from "@/components/DrawerHeader";
import { DrawerFooter } from "@/components/DrawerFooter";
import { Colors, Typography, Spacing, Radius } from "@/constants/design";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AddLocationDrawerProps {
  visible: boolean;
  onRequestClose: () => void;
  detailerId: string;
  onAdded?: () => void;
}

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];
const DEFAULT_HOURS = "9:00 AM – 6:00 PM";

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AddLocationDrawer({
  visible,
  onRequestClose,
  detailerId,
  onAdded,
}: AddLocationDrawerProps) {
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [bayCount, setBayCount] = useState(2);
  const [acceptsWalkins, setAcceptsWalkins] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hours toggle per day (true = open)
  const [hoursEnabled, setHoursEnabled] = useState<Record<DayKey, boolean>>({
    mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false,
  });

  function reset() {
    setLocationName("");
    setAddress("");
    setBayCount(2);
    setAcceptsWalkins(true);
    setHoursEnabled({ mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false });
    setError(null);
  }

  function handleClose() {
    reset();
    onRequestClose();
  }

  async function handleSave() {
    if (!locationName.trim()) {
      setError("Location name is required.");
      return;
    }
    if (!address.trim()) {
      setError("Address is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();

      // Build hours object
      const hours: Record<string, { open: string; close: string } | null> = {};
      for (const { key } of DAYS) {
        hours[key] = hoursEnabled[key] ? { open: "09:00", close: "18:00" } : null;
      }

      const { error: dbErr } = await supabase.from("business_locations").insert({
        detailer_id: detailerId,
        name: locationName.trim(),
        address: address.trim(),
        bay_count: bayCount,
        accepts_walkins: acceptsWalkins,
        location_hours: hours,
        is_active: true,
      });

      if (dbErr) throw dbErr;

      reset();
      onAdded?.();
      onRequestClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save location.";
      setError(msg);
    }
    setSaving(false);
  }

  function toggleDay(key: DayKey) {
    setHoursEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <DrawerModal visible={visible} onRequestClose={handleClose}>
      <DrawerHeader title="Add Location" onClose={handleClose} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Location Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Location name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Buckhead Shop, Main Street Location"
            placeholderTextColor={Colors.light.textTertiary}
            value={locationName}
            onChangeText={setLocationName}
            autoCapitalize="words"
            returnKeyType="next"
          />
          <Text style={styles.hint}>Customers will see this name when booking.</Text>
        </View>

        {/* Address */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Address</Text>
          <View style={styles.inputIconRow}>
            <Ionicons
              name="location-outline"
              size={18}
              color={Colors.foamBlue}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              placeholder="Start typing your address..."
              placeholderTextColor={Colors.light.textTertiary}
              value={address}
              onChangeText={setAddress}
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Bay Count */}
        <View style={styles.bayCard}>
          <Text style={styles.labelCaps}>Number of Bays</Text>
          <Text style={styles.hint}>How many vehicles can you service simultaneously?</Text>
          <View style={styles.bayCounter}>
            <TouchableOpacity
              style={styles.bayBtn}
              onPress={() => setBayCount((c) => Math.max(1, c - 1))}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={20} color={Colors.foamBlue} />
            </TouchableOpacity>
            <Text style={styles.bayCount}>{bayCount}</Text>
            <TouchableOpacity
              style={styles.bayBtn}
              onPress={() => setBayCount((c) => Math.min(20, c + 1))}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color={Colors.foamBlue} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Operating Hours */}
        <View style={styles.hoursCard}>
          <Text style={styles.labelCaps}>Default Hours</Text>
          <Text style={styles.hint}>You can override specific days later.</Text>
          <View style={styles.dayList}>
            {DAYS.map(({ key, label }) => (
              <View key={key} style={styles.dayRow}>
                <View style={styles.dayLeft}>
                  <Text style={styles.dayLabel}>{label}</Text>
                  {hoursEnabled[key] ? (
                    <View style={styles.hoursTag}>
                      <Text style={styles.hoursTagText}>{DEFAULT_HOURS}</Text>
                    </View>
                  ) : (
                    <Text style={styles.unavailableText}>Unavailable</Text>
                  )}
                </View>
                <Switch
                  value={hoursEnabled[key]}
                  onValueChange={() => toggleDay(key)}
                  trackColor={{ false: Colors.light.borderDefault, true: Colors.foamBlue }}
                  thumbColor={Colors.white}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Walk-ins */}
        <View style={styles.walkinCard}>
          <View style={styles.walkinRow}>
            <View style={styles.walkinIcon}>
              <Ionicons name="walk-outline" size={18} color={Colors.foamBlue} />
            </View>
            <View style={styles.walkinInfo}>
              <Text style={styles.walkinTitle}>Accept walk-ins</Text>
              <Text style={styles.walkinHint}>
                Walk-in customers can arrive without an appointment.
              </Text>
            </View>
            <Switch
              value={acceptsWalkins}
              onValueChange={setAcceptsWalkins}
              trackColor={{ false: Colors.light.borderDefault, true: Colors.foamBlue }}
              thumbColor={Colors.white}
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
          style={[
            styles.saveBtn,
            (saving || !locationName.trim() || !address.trim()) && { opacity: 0.6 },
          ]}
          onPress={handleSave}
          disabled={saving || !locationName.trim() || !address.trim()}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save Location</Text>
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
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    fontFamily: Typography.body,
    fontSize: 15,
    color: Colors.light.textPrimary,
  },
  inputWithIcon: { flex: 1, paddingLeft: 40 },
  inputIconRow: { flexDirection: "row", alignItems: "center", position: "relative" },
  inputIcon: { position: "absolute", left: 13, zIndex: 1 },
  bayCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    padding: 14,
    gap: 10,
  },
  bayCounter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 4,
  },
  bayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  bayCount: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 28,
    color: Colors.light.textPrimary,
    minWidth: 36,
    textAlign: "center",
  },
  hoursCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    padding: Spacing.md,
    gap: 8,
  },
  dayList: { gap: 2 },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  dayLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  dayLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: 14,
    color: Colors.light.textPrimary,
    width: 32,
  },
  hoursTag: {
    backgroundColor: Colors.light.bgSecondary,
    borderRadius: Radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hoursTagText: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.light.textPrimary,
  },
  unavailableText: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textTertiary,
  },
  walkinCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    padding: 14,
  },
  walkinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  walkinIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  walkinInfo: { flex: 1 },
  walkinTitle: {
    fontFamily: Typography.bodyMedium,
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  walkinHint: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.light.textTertiary,
    marginTop: 2,
    lineHeight: 15,
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
