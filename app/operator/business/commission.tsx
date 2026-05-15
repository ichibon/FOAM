import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/hooks/useAuth";
import {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
} from "@/constants/design";

type TipDistribution = "assigned" | "split_daily";

interface TeamMemberRow {
  id: string;
  users: { full_name: string | null } | null;
  commission_rate: number | null;
}

interface MemberOverride {
  id: string;
  name: string;
  initials: string;
  rate: number | null;
  isEditing: boolean;
  editValue: string;
  isDirty: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function CommissionScreen() {
  const { user } = useAuth();
  const { memberId: preselectedId } = useLocalSearchParams<{ memberId?: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const [profileId, setProfileId] = useState<string | null>(null);
  const [defaultRate, setDefaultRate] = useState(38);
  const [originalDefaultRate, setOriginalDefaultRate] = useState(38);
  const [tipDistribution, setTipDistribution] = useState<TipDistribution>("assigned");
  const [originalTipDistribution, setOriginalTipDistribution] = useState<TipDistribution>("assigned");
  const [members, setMembers] = useState<MemberOverride[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setFetchError(false);
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();

      const { data: profileData, error: profileErr } = await supabase
        .from("detailer_profiles")
        .select("id, default_commission_rate, tip_distribution_model")
        .eq("user_id", user.id)
        .single();
      if (profileErr || !profileData) throw profileErr ?? new Error("no profile");

      const pid: string = profileData.id;
      const defRate = profileData.default_commission_rate ?? 38;
      const tipDist: TipDistribution = profileData.tip_distribution_model ?? "assigned";

      setProfileId(pid);
      setDefaultRate(defRate);
      setOriginalDefaultRate(defRate);
      setTipDistribution(tipDist);
      setOriginalTipDistribution(tipDist);

      const { data: teamData, error: teamErr } = await supabase
        .from("team_members")
        .select("id, users(full_name), commission_rate")
        .eq("manager_id", pid)
        .eq("is_active", true);

      if (teamErr) throw teamErr;

      const teamMembers = (teamData as unknown as TeamMemberRow[] | null) ?? [];
      const overrides: MemberOverride[] = teamMembers.map((tm) => ({
        id: tm.id,
        name: tm.users?.full_name ?? "Team Member",
        initials: getInitials(tm.users?.full_name ?? "TM"),
        rate: tm.commission_rate ?? null,
        isEditing: tm.id === preselectedId,
        editValue: String(tm.commission_rate ?? defRate),
        isDirty: false,
      }));
      setMembers(overrides);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [user, preselectedId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function startEdit(memberId: string) {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, isEditing: true, editValue: String(m.rate ?? defaultRate) }
          : m
      )
    );
  }

  function cancelEdit(memberId: string) {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, isEditing: false } : m))
    );
  }

  function confirmEdit(memberId: string) {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        const parsed = parseInt(m.editValue, 10);
        const newRate = isNaN(parsed) ? m.rate : Math.min(100, Math.max(0, parsed));
        return { ...m, isEditing: false, rate: newRate, isDirty: true };
      })
    );
  }

  function clearOverride(memberId: string) {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, rate: null, isEditing: false, isDirty: true } : m
      )
    );
  }

  function adjustDefaultRate(delta: number) {
    setDefaultRate((prev) => Math.min(100, Math.max(0, prev + delta)));
  }

  async function handleSave() {
    if (!profileId) return;
    setSaving(true);
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();

      const profileUpdates: Record<string, unknown> = {};
      if (defaultRate !== originalDefaultRate) profileUpdates.default_commission_rate = defaultRate;
      if (tipDistribution !== originalTipDistribution) profileUpdates.tip_distribution_model = tipDistribution;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileErr } = await supabase
          .from("detailer_profiles")
          .update(profileUpdates)
          .eq("id", profileId);
        if (profileErr) throw profileErr;
      }

      const dirtyMembers = members.filter((m) => m.isDirty);
      for (const m of dirtyMembers) {
        const { error: memberErr } = await supabase
          .from("team_members")
          .update({ commission_rate: m.rate })
          .eq("id", m.id);
        if (memberErr) throw memberErr;
      }

      setOriginalDefaultRate(defaultRate);
      setOriginalTipDistribution(tipDistribution);
      setMembers((prev) => prev.map((m) => ({ ...m, isDirty: false })));

      Alert.alert("Saved", "Commission rules updated. Changes apply to future jobs.");
    } catch {
      Alert.alert("Error", "Failed to save commission rules. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const hasPendingChanges =
    defaultRate !== originalDefaultRate ||
    tipDistribution !== originalTipDistribution ||
    members.some((m) => m.isDirty);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Commission Rules</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && !fetchError ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.foamBlue} size="large" />
        </View>
      ) : fetchError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.warningLight} />
          <Text style={styles.errorText}>Couldn't load commission rules</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={56}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Info banner */}
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.foamBlue} />
              <Text style={styles.infoText}>
                Commission rules determine how each job's revenue is split between your business
                and your team. Changes apply to future jobs only.
              </Text>
            </View>

            {/* Default rate */}
            <View style={[styles.card, styles.shadow]}>
              <Text style={styles.metaLabel}>DEFAULT RATE</Text>
              <Text style={styles.metaSub}>
                All new team members start at this rate unless overridden.
              </Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => adjustDefaultRate(-1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={18} color={Colors.light.textSecondary} />
                </TouchableOpacity>
                <View style={styles.rateDisplay}>
                  <Text style={styles.rateValue}>{defaultRate}</Text>
                  <Text style={styles.ratePercent}>%</Text>
                </View>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => adjustDefaultRate(1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={18} color={Colors.light.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Member overrides */}
            {members.length > 0 && (
              <View style={[styles.card, styles.shadow, { padding: 0 }]}>
                <View style={styles.sectionHeaderPad}>
                  <Text style={styles.metaLabel}>MEMBER OVERRIDES</Text>
                </View>
                {members.map((m, idx) => (
                  <View
                    key={m.id}
                    style={[
                      styles.memberRow,
                      idx < members.length - 1 && styles.memberRowBorder,
                    ]}
                  >
                    {m.isEditing ? (
                      <View style={styles.editingRow}>
                        <View style={styles.editingLeft}>
                          <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{m.initials}</Text>
                          </View>
                          <Text style={styles.memberName}>{m.name}</Text>
                        </View>
                        <View style={styles.editingRight}>
                          <View style={styles.editInputRow}>
                            <TextInput
                              style={styles.rateInput}
                              value={m.editValue}
                              onChangeText={(val) =>
                                setMembers((prev) =>
                                  prev.map((mm) =>
                                    mm.id === m.id ? { ...mm, editValue: val } : mm
                                  )
                                )
                              }
                              keyboardType="number-pad"
                              maxLength={3}
                              selectTextOnFocus
                            />
                            <Text style={styles.inputPercent}>%</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.confirmEditBtn}
                            onPress={() => confirmEdit(m.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="checkmark" size={16} color={Colors.white} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.cancelEditBtn}
                            onPress={() => cancelEdit(m.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="close" size={16} color={Colors.light.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.memberDisplayRow}>
                        <View style={styles.memberDisplayLeft}>
                          <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{m.initials}</Text>
                          </View>
                          <Text style={styles.memberName}>{m.name}</Text>
                        </View>
                        <View style={styles.memberDisplayRight}>
                          {m.rate !== null ? (
                            <>
                              <Text style={styles.overrideRate}>{m.rate}%</Text>
                              <TouchableOpacity
                                onPress={() => startEdit(m.id)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.editLink}>Edit</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => clearOverride(m.id)}
                                activeOpacity={0.7}
                              >
                                <Ionicons
                                  name="close-circle-outline"
                                  size={16}
                                  color={Colors.light.textTertiary}
                                />
                              </TouchableOpacity>
                            </>
                          ) : (
                            <>
                              <Text style={styles.defaultRateLabel}>
                                {defaultRate}% (default)
                              </Text>
                              <TouchableOpacity
                                onPress={() => startEdit(m.id)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.editLink}>Override</Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Tip distribution */}
            <View style={[styles.card, styles.shadow]}>
              <Text style={styles.metaLabel}>TIP DISTRIBUTION</Text>
              <Text style={styles.metaSub}>When customers add a tip, how is it split?</Text>
              <View style={styles.tipOptions}>
                <TouchableOpacity
                  style={[
                    styles.tipOption,
                    tipDistribution === "assigned" && styles.tipOptionSelected,
                  ]}
                  onPress={() => setTipDistribution("assigned")}
                  activeOpacity={0.7}
                >
                  {tipDistribution === "assigned" && (
                    <View style={styles.tipCheckmark}>
                      <Ionicons name="checkmark" size={10} color={Colors.white} />
                    </View>
                  )}
                  <Text style={styles.tipOptionText}>Full tip to assigned crew member</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tipOption,
                    tipDistribution === "split_daily" && styles.tipOptionSelected,
                  ]}
                  onPress={() => setTipDistribution("split_daily")}
                  activeOpacity={0.7}
                >
                  {tipDistribution === "split_daily" && (
                    <View style={styles.tipCheckmark}>
                      <Ionicons name="checkmark" size={10} color={Colors.white} />
                    </View>
                  )}
                  <Text style={styles.tipOptionText}>Split tip equally among today's crew</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Save button */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                !hasPendingChanges && styles.saveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={saving || !hasPendingChanges}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Rules</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.ctaNote}>Applies to jobs created after this change.</Text>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const cardBase = {
  backgroundColor: Colors.light.surface,
  borderRadius: Radius.lg,
  borderWidth: 1,
  borderColor: Colors.light.borderSubtle,
  padding: Spacing.md,
};

const shadowBase = Shadows.light.level1;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 17,
    color: Colors.light.textPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 140,
    gap: Spacing.md,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  errorText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
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
  infoBanner: {
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.md,
    padding: Spacing.mdSm,
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "flex-start",
  },
  infoText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    flex: 1,
    lineHeight: 19,
  },
  card: { ...cardBase },
  shadow: { ...shadowBase },
  metaLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: Typography.tracking.label,
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },
  metaSub: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.lg,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surface,
  },
  rateDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  rateValue: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 32,
    color: Colors.light.textPrimary,
  },
  ratePercent: {
    fontFamily: Typography.body,
    fontSize: 20,
    color: Colors.light.textSecondary,
  },
  sectionHeaderPad: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  memberRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.mdSm,
    minHeight: 52,
    justifyContent: "center",
  },
  memberRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  memberDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberDisplayLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.mdSm,
    flex: 1,
  },
  memberDisplayRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 13,
    color: Colors.white,
  },
  memberName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  overrideRate: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 13,
    color: Colors.foamBlue,
  },
  defaultRateLabel: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textTertiary,
  },
  editLink: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.foamBlue,
  },
  editingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  editingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.mdSm,
    flex: 1,
  },
  editingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  editInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.foamBlue,
    borderRadius: Radius.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: 2,
  },
  rateInput: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.light.textPrimary,
    width: 36,
    textAlign: "center",
    padding: 0,
  },
  inputPercent: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  confirmEditBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.xs,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelEditBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    alignItems: "center",
    justifyContent: "center",
  },
  tipOptions: { gap: Spacing.mdSm },
  tipOption: {
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    borderRadius: Radius.md,
    padding: Spacing.mdSm,
    position: "relative",
  },
  tipOptionSelected: {
    borderWidth: 2,
    borderColor: Colors.foamBlue,
  },
  tipCheckmark: {
    position: "absolute",
    top: Spacing.mdSm,
    right: Spacing.mdSm,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  tipOptionText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    paddingRight: Spacing.xl,
  },
  ctaContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === "ios" ? 32 : Spacing.md,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    gap: Spacing.sm,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 -4px 6px -1px rgba(0,0,0,0.05)" }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 8,
        }),
  },
  saveBtn: {
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: {
    backgroundColor: Colors.light.borderDefault,
  },
  saveBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  ctaNote: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
    textAlign: "center",
  },
});
