import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { supabase } from "@/lib/supabase";
import { LucideIcon } from "@/components/LucideIcon";

type TabId = "invite" | "code";
type RoleId = "team_member" | "manager";
type InputMode = "phone" | "email";

interface Recipient {
  id: string;
  value: string;
  mode: InputMode;
}

const SHARE_CODE = "FOAM-K7X2";

export default function AddTeamMemberScreen() {
  const { unit_id, unit_type } = useLocalSearchParams<{
    unit_id?: string;
    unit_type?: string;
  }>();

  const [activeTab, setActiveTab] = useState<TabId>("invite");
  const [inputMode, setInputMode] = useState<InputMode>("phone");
  const [currentInput, setCurrentInput] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [role, setRole] = useState<RoleId>("team_member");
  const [commissionRate, setCommissionRate] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  function handleAddRecipient() {
    const val = currentInput.trim();
    if (!val) return;
    setRecipients((prev) => [
      ...prev,
      { id: Date.now().toString(), value: val, mode: inputMode },
    ]);
    setCurrentInput("");
  }

  function handleRemoveRecipient(id: string) {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleSendInvite() {
    const allRecipients = [...recipients];
    if (currentInput.trim()) {
      allRecipients.push({
        id: "current",
        value: currentInput.trim(),
        mode: inputMode,
      });
    }
    if (allRecipients.length === 0) return;

    setSending(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No session");

      const { data: profile } = await supabase
        .from("detailer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!profile) throw new Error("Profile not found");

      const invites = allRecipients.map((r) => ({
        detailer_id: profile.id,
        contact: r.value,
        contact_type: r.mode,
        role,
        commission_rate: commissionRate ? parseFloat(commissionRate) : null,
        unit_id: unit_id ?? null,
        unit_type: unit_type ?? null,
        status: "pending",
      }));

      const { error: insertError } = await supabase
        .from("operator_invites")
        .insert(invites);
      if (insertError) throw insertError;

      router.back();
    } catch (err) {
      console.warn("[AddTeamMember] handleSendInvite failed", err);
      setError(
        "Invite couldn't be sent right now. Your team member can still join using the share code."
      );
    }
    setSending(false);
  }

  function handleCopyCode() {
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        void navigator.clipboard.writeText(SHARE_CODE);
      }
    } catch {
      // no-op
    }
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  const canSend = recipients.length > 0 || currentInput.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <LucideIcon name="ChevronLeft" size={20} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Team Member</Text>
        <View style={styles.spacer} />
      </View>

      {unit_id && (
        <View style={styles.unitBanner}>
          <LucideIcon
            name={unit_type === "location" ? "Building2" : "Truck"}
            size={14}
            color={Colors.foamBlue}
          />
          <Text style={styles.unitBannerText}>
            Assigning crew to {unit_type === "location" ? "location" : "van"}
          </Text>
        </View>
      )}

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "invite" && styles.tabActive]}
          onPress={() => setActiveTab("invite")}
          activeOpacity={0.8}
        >
          <LucideIcon
            name="Mail"
            size={16}
            color={activeTab === "invite" ? Colors.foamBlue : Colors.light.textTertiary}
          />
          <Text style={[styles.tabText, activeTab === "invite" && styles.tabTextActive]}>
            Send Invite
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "code" && styles.tabActive]}
          onPress={() => setActiveTab("code")}
          activeOpacity={0.8}
        >
          <LucideIcon
            name="Share2"
            size={16}
            color={activeTab === "code" ? Colors.foamBlue : Colors.light.textTertiary}
          />
          <Text style={[styles.tabText, activeTab === "code" && styles.tabTextActive]}>
            Share Code
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === "invite" ? (
          <View style={styles.inviteForm}>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>CONTACT</Text>

              <View style={styles.inputModeRow}>
                <TouchableOpacity
                  style={[styles.modePill, inputMode === "phone" && styles.modePillActive]}
                  onPress={() => setInputMode("phone")}
                  activeOpacity={0.8}
                >
                  <LucideIcon
                    name="Phone"
                    size={14}
                    color={inputMode === "phone" ? Colors.white : Colors.light.textSecondary}
                  />
                  <Text style={[styles.modePillText, inputMode === "phone" && styles.modePillTextActive]}>
                    Phone
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modePill, inputMode === "email" && styles.modePillActive]}
                  onPress={() => setInputMode("email")}
                  activeOpacity={0.8}
                >
                  <LucideIcon
                    name="AtSign"
                    size={14}
                    color={inputMode === "email" ? Colors.white : Colors.light.textSecondary}
                  />
                  <Text style={[styles.modePillText, inputMode === "email" && styles.modePillTextActive]}>
                    Email
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputAddRow}>
                <View style={styles.inputWithIconWrap}>
                  <View style={styles.inputIconLeft}>
                    <LucideIcon
                      name={inputMode === "phone" ? "Phone" : "AtSign"}
                      size={17}
                      color={Colors.light.textTertiary}
                    />
                  </View>
                  <TextInput
                    style={styles.inputWithIconField}
                    value={currentInput}
                    onChangeText={setCurrentInput}
                    placeholder={
                      inputMode === "phone"
                        ? "(404) 555-0123"
                        : "crew@example.com"
                    }
                    placeholderTextColor={Colors.light.textTertiary}
                    keyboardType={inputMode === "phone" ? "phone-pad" : "email-address"}
                    autoCapitalize="none"
                    onSubmitEditing={handleAddRecipient}
                    returnKeyType="done"
                  />
                </View>
                <TouchableOpacity
                  style={styles.addRecipientButton}
                  onPress={handleAddRecipient}
                  activeOpacity={0.8}
                >
                  <LucideIcon name="Plus" size={20} color={Colors.white} />
                </TouchableOpacity>
              </View>

              {recipients.length > 0 && (
                <View style={styles.recipientList}>
                  {recipients.map((r) => (
                    <View key={r.id} style={styles.recipientChip}>
                      <LucideIcon
                        name={r.mode === "phone" ? "Phone" : "AtSign"}
                        size={13}
                        color={Colors.foamBlue}
                      />
                      <Text style={styles.recipientChipText}>{r.value}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveRecipient(r.id)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        activeOpacity={0.7}
                      >
                        <LucideIcon name="X" size={13} color={Colors.light.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>ROLE</Text>
              <View style={styles.roleCards}>
                <RoleCard
                  id="team_member"
                  label="Team Member"
                  description="Clock in, complete jobs, track earnings"
                  icon="User"
                  selected={role === "team_member"}
                  onSelect={() => setRole("team_member")}
                />
                <RoleCard
                  id="manager"
                  label="Team Manager"
                  description="Manage crew, view schedule, access reports"
                  icon="UserCheck"
                  selected={role === "manager"}
                  onSelect={() => setRole("manager")}
                />
              </View>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>
                COMMISSION RATE <Text style={styles.optionalLabel}>(Optional)</Text>
              </Text>
              <View style={styles.commissionInputWrap}>
                <View style={styles.inputWithIconWrap}>
                  <View style={styles.inputIconLeft}>
                    <Text style={styles.percentSign}>%</Text>
                  </View>
                  <TextInput
                    style={styles.inputWithIconField}
                    value={commissionRate}
                    onChangeText={setCommissionRate}
                    placeholder="e.g., 30"
                    placeholderTextColor={Colors.light.textTertiary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <Text style={styles.fieldHint}>
                Percentage of each job paid to this team member. You can set individual rates per job as well.
              </Text>
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <LucideIcon name="AlertCircle" size={15} color={Colors.warningLight} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.codeTab}>
            <View style={styles.codeCard}>
              <View style={styles.codeIconCircle}>
                <LucideIcon name="Share2" size={28} color={Colors.foamBlue} />
              </View>
              <Text style={styles.codeTitle}>Share your code</Text>
              <Text style={styles.codeBody}>
                Your team member downloads the FOAM Crew app, enters this code, and is instantly linked to your operation.
              </Text>

              <View style={styles.codeDisplay}>
                <Text style={styles.codeText}>{SHARE_CODE}</Text>
              </View>

              <TouchableOpacity
                style={[styles.copyButton, codeCopied && styles.copyButtonCopied]}
                onPress={handleCopyCode}
                activeOpacity={0.85}
              >
                <LucideIcon
                  name={codeCopied ? "Check" : "Copy"}
                  size={18}
                  color={Colors.white}
                />
                <Text style={styles.copyButtonText}>
                  {codeCopied ? "Copied!" : "Copy Code"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.howItWorksList}>
              <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
              {[
                {
                  step: "1",
                  text: "Your crew downloads the FOAM Crew app from the App Store or Google Play",
                },
                {
                  step: "2",
                  text: 'They tap "Join an Operation" and enter the code above',
                },
                {
                  step: "3",
                  text: "They show up on your dashboard ready to be assigned to jobs",
                },
              ].map((s) => (
                <View key={s.step} style={styles.howStep}>
                  <View style={styles.howStepNum}>
                    <Text style={styles.howStepNumText}>{s.step}</Text>
                  </View>
                  <Text style={styles.howStepText}>{s.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {activeTab === "invite" && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.sendButton, (!canSend || sending) && styles.buttonDisabled]}
            onPress={handleSendInvite}
            disabled={!canSend || sending}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <LucideIcon name="Send" size={18} color={Colors.white} />
                <Text style={styles.sendButtonText}>Send Invite</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

interface RoleCardProps {
  id: RoleId;
  label: string;
  description: string;
  icon: string;
  selected: boolean;
  onSelect: () => void;
}

function RoleCard({ label, description, icon, selected, onSelect }: RoleCardProps) {
  return (
    <TouchableOpacity
      style={[roleStyles.card, selected && roleStyles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.85}
    >
      <View style={[roleStyles.iconCircle, selected && roleStyles.iconCircleSelected]}>
        <LucideIcon name={icon} size={20} color={selected ? Colors.foamBlue : Colors.light.textTertiary} />
      </View>
      <View style={roleStyles.textBlock}>
        <Text style={[roleStyles.label, selected && roleStyles.labelSelected]}>{label}</Text>
        <Text style={roleStyles.description}>{description}</Text>
      </View>
      <View style={[roleStyles.radio, selected && roleStyles.radioSelected]}>
        {selected && <View style={roleStyles.radioDot} />}
      </View>
    </TouchableOpacity>
  );
}

const roleStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.light.borderSubtle,
  },
  cardSelected: {
    borderColor: Colors.foamBlue,
    backgroundColor: Colors.foamBlueSubtle,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconCircleSelected: { backgroundColor: "rgba(51,157,199,0.20)" },
  textBlock: { flex: 1 },
  label: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  labelSelected: { color: Colors.foamBlue },
  description: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 2,
    lineHeight: 16,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.borderDefault,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioSelected: { borderColor: Colors.foamBlue },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.foamBlue,
  },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xl2,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    flex: 1,
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  spacer: { width: 44 },
  unitBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    backgroundColor: Colors.foamLightBlue,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  unitBannerText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
    color: Colors.foamBlue,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: Colors.foamBlue },
  tabText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 14,
    color: Colors.light.textTertiary,
  },
  tabTextActive: { color: Colors.foamBlue },
  content: { paddingHorizontal: Spacing.md, paddingTop: 20, paddingBottom: 120 },
  inviteForm: { gap: 24 },
  sectionBlock: { gap: 12 },
  sectionLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  optionalLabel: {
    fontFamily: Typography.body,
    color: Colors.light.textDisabled,
    letterSpacing: 0,
    textTransform: "none",
  },
  inputModeRow: { flexDirection: "row", gap: 8 },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    backgroundColor: Colors.light.surface,
  },
  modePillActive: { backgroundColor: Colors.foamBlue, borderColor: Colors.foamBlue },
  modePillText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  modePillTextActive: { color: Colors.white },
  inputAddRow: { flexDirection: "row", gap: 8 },
  inputWithIconWrap: {
    flex: 1,
    position: "relative",
    height: 52,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    flexDirection: "row",
    alignItems: "center",
  },
  inputIconLeft: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  percentSign: {
    fontFamily: Typography.bodyMedium,
    fontSize: 16,
    color: Colors.light.textTertiary,
  },
  inputWithIconField: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: 15,
    color: Colors.light.textPrimary,
    paddingRight: 12,
  },
  addRecipientButton: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    ...Shadows.light.level2,
  },
  recipientList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  recipientChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.foamBlue,
  },
  recipientChipText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.foamBlue,
  },
  roleCards: { gap: 10 },
  commissionInputWrap: {},
  fieldHint: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    lineHeight: 16,
  },
  errorBanner: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(217,119,6,0.08)",
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(217,119,6,0.20)",
    alignItems: "flex-start",
  },
  errorBannerText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.warningLight,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Platform.OS === "web" ? 24 : 0,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  sendButton: {
    height: 52,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    ...Shadows.light.level2,
  },
  buttonDisabled: { opacity: 0.4 },
  sendButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
  codeTab: { gap: 28 },
  codeCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    ...Shadows.light.level1,
  },
  codeIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  codeTitle: {
    fontFamily: Typography.display,
    fontSize: 20,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  codeBody: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
  codeDisplay: {
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.md,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: Colors.foamBlue,
    marginVertical: 4,
  },
  codeText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 22,
    color: Colors.foamBlue,
    letterSpacing: 3,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 48,
    paddingHorizontal: 24,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.pill,
    ...Shadows.light.level2,
  },
  copyButtonCopied: { backgroundColor: Colors.successLight },
  copyButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Colors.white,
  },
  howItWorksList: { gap: 16 },
  howStep: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  howStepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  howStepNumText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 13,
    color: Colors.foamBlue,
  },
  howStepText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 21,
  },
});
