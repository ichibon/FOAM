import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { supabase } from "@/lib/supabase";
import { DrawerModal } from "@/components/DrawerModal";
import { LucideIcon } from "@/components/LucideIcon";

type InputMode = "phone" | "email";
type InviteTab = "invite" | "code";
type InviteRole = "team_member" | "manager";

interface TeamMember {
  id: string;
  display_name: string;
  team_role: string;
}

interface UnitVan {
  id: string;
  name: string;
  asset_type: string;
}

interface UnitLocation {
  id: string;
  name: string;
  address: string;
  bay_count: number;
}

const SHARE_CODE = "FOAM-K7X2";
const DEFAULT_COMMISSION = "38";

export default function AssignCrewScreen() {
  const [vans, setVans] = useState<UnitVan[]>([]);
  const [locations, setLocations] = useState<UnitLocation[]>([]);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  // map: assetId -> Set<memberId> (assigned today)
  const [vanCrewMap, setVanCrewMap] = useState<Record<string, Set<string>>>({});
  // map: locationId -> Set<memberId> (local only — no DB table for location_crew_assignments)
  const [locCrewMap, setLocCrewMap] = useState<Record<string, Set<string>>>({});
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [continuing, setContinuing] = useState(false);
  const [detailerId, setDetailerId] = useState<string | null>(null);

  // Add crew drawer
  const [showAddCrewDrawer, setShowAddCrewDrawer] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<{
    id: string;
    type: "van" | "location";
    name: string;
  } | null>(null);
  const [inviteTab, setInviteTab] = useState<InviteTab>("invite");
  const [inputMode, setInputMode] = useState<InputMode>("phone");
  const [currentInput, setCurrentInput] = useState("");
  const [recipients, setRecipients] = useState<{ id: string; value: string; mode: InputMode }[]>([]);
  const [inviteRole, setInviteRole] = useState<InviteRole>("team_member");
  const [commission, setCommission] = useState(DEFAULT_COMMISSION);
  const [sending, setSending] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const loadUnits = useCallback(async () => {
    setLoadingUnits(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("detailer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!profile) return;
      setDetailerId(profile.id);

      // Load units, team members, and today's crew assignments in parallel
      const today = new Date().toISOString().split("T")[0];

      const [assetsResult, locsResult, membersResult] = await Promise.all([
        supabase
          .from("business_assets")
          .select("id, name, asset_type")
          .eq("detailer_id", profile.id)
          .eq("is_active", true)
          .order("created_at"),
        supabase
          .from("business_locations")
          .select("id, name, address, bay_count")
          .eq("detailer_id", profile.id)
          .eq("is_active", true)
          .order("created_at"),
        supabase
          .from("team_members")
          .select("id, display_name, team_role")
          .eq("manager_id", profile.id)
          .eq("is_active", true)
          .order("display_name"),
      ]);

      const assetsData = assetsResult.data ?? [];
      const locsData = locsResult.data ?? [];
      const membersData = membersResult.data ?? [];

      setVans(assetsData);
      setLocations(
        locsData.map((l) => ({
          id: l.id,
          name: l.name,
          address: (l.address as string) ?? "",
          bay_count: (l.bay_count as number) ?? 0,
        }))
      );
      setAllMembers(membersData);

      // Load today's crew assignments for all vans
      if (assetsData.length > 0) {
        const assetIds = assetsData.map((a) => a.id);
        const { data: assignmentsData } = await supabase
          .from("asset_crew_assignments")
          .select("asset_id, team_member_id")
          .in("asset_id", assetIds)
          .eq("assigned_date", today);

        const crewMap: Record<string, Set<string>> = {};
        for (const a of assetsData) {
          crewMap[a.id] = new Set(
            (assignmentsData ?? [])
              .filter((ac) => ac.asset_id === a.id)
              .map((ac) => ac.team_member_id)
          );
        }
        setVanCrewMap(crewMap);
      }

      // Initialize empty location crew map
      const initLocMap: Record<string, Set<string>> = {};
      for (const l of locsData) {
        initLocMap[l.id] = new Set();
      }
      setLocCrewMap(initLocMap);
    } catch (err) {
      console.warn("[AssignCrew] loadUnits failed", err);
    }
    setLoadingUnits(false);
  }, []);

  useEffect(() => {
    void loadUnits();
  }, [loadUnits]);

  async function handleToggleCrewOnVan(vanId: string, memberId: string) {
    const today = new Date().toISOString().split("T")[0];
    const isAssigned = vanCrewMap[vanId]?.has(memberId) ?? false;
    const toggleKey = `${vanId}:${memberId}`;
    setTogglingId(toggleKey);

    // Optimistic update
    setVanCrewMap((prev) => {
      const next = { ...prev };
      const updated = new Set(next[vanId] ?? []);
      if (isAssigned) updated.delete(memberId);
      else updated.add(memberId);
      next[vanId] = updated;
      return next;
    });

    try {
      if (isAssigned) {
        await supabase
          .from("asset_crew_assignments")
          .delete()
          .eq("asset_id", vanId)
          .eq("team_member_id", memberId)
          .eq("assigned_date", today);
      } else {
        await supabase
          .from("asset_crew_assignments")
          .upsert({ asset_id: vanId, team_member_id: memberId, assigned_date: today });
      }
    } catch (err) {
      console.warn("[AssignCrew] toggleCrewOnVan failed", err);
      // Revert on error
      setVanCrewMap((prev) => {
        const next = { ...prev };
        const reverted = new Set(next[vanId] ?? []);
        if (isAssigned) reverted.add(memberId);
        else reverted.delete(memberId);
        next[vanId] = reverted;
        return next;
      });
    }
    setTogglingId(null);
  }

  function handleToggleCrewOnLocation(locId: string, memberId: string) {
    setLocCrewMap((prev) => {
      const next = { ...prev };
      const updated = new Set(next[locId] ?? []);
      if (updated.has(memberId)) updated.delete(memberId);
      else updated.add(memberId);
      next[locId] = updated;
      return next;
    });
  }

  function openAddCrewDrawer(unitId: string, unitType: "van" | "location", unitName: string) {
    setSelectedUnit({ id: unitId, type: unitType, name: unitName });
    setInviteTab("invite");
    setInputMode("phone");
    setCurrentInput("");
    setRecipients([]);
    setInviteRole("team_member");
    setCommission(DEFAULT_COMMISSION);
    setInviteError(null);
    setCodeCopied(false);
    setShowAddCrewDrawer(true);
  }

  function handleAddRecipient() {
    const val = currentInput.trim();
    if (!val) return;
    setRecipients((prev) => [
      ...prev,
      { id: Date.now().toString(), value: val, mode: inputMode },
    ]);
    setCurrentInput("");
  }

  function removeRecipient(id: string) {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleSendInvite() {
    const allRecipients = [
      ...recipients,
      ...(currentInput.trim()
        ? [{ id: "cur", value: currentInput.trim(), mode: inputMode }]
        : []),
    ];
    if (allRecipients.length === 0 || !detailerId || !selectedUnit) return;
    setSending(true);
    setInviteError(null);
    try {
      await supabase.from("operator_invites").insert(
        allRecipients.map((r) => ({
          detailer_id: detailerId,
          contact: r.value,
          contact_type: r.mode,
          role: inviteRole,
          commission_rate: commission ? parseFloat(commission) / 100 : 0.38,
          asset_id: selectedUnit.type === "van" ? selectedUnit.id : null,
          location_id: selectedUnit.type === "location" ? selectedUnit.id : null,
        }))
      );
      setShowAddCrewDrawer(false);
    } catch (err) {
      console.warn("[AssignCrew] handleSendInvite failed", err);
      setInviteError(
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

  async function handleContinue() {
    setContinuing(true);
    router.push("/onboarding/operator/stripe");
    setContinuing(false);
  }

  function getUnitIcon(assetType: string): string {
    switch (assetType) {
      case "trailer":
        return "Package";
      case "truck":
        return "Truck";
      default:
        return "Truck";
    }
  }

  function assetTypeLabel(type: string): string {
    switch (type) {
      case "trailer": return "Trailer";
      case "truck": return "Truck";
      case "other": return "Vehicle";
      default: return "Van";
    }
  }

  const totalUnits = vans.length + locations.length;
  const canSend = recipients.length > 0 || currentInput.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.progressHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
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
          <Text style={styles.headline}>Assign your crew.</Text>
          <Text style={styles.subheadline}>
            Tap a crew member to assign them to a unit. Use{" "}
            <Text style={styles.subheadlineBold}>+</Text> to invite someone new.
          </Text>
        </View>

        {loadingUnits ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.foamBlue} />
            <Text style={styles.loadingText}>Loading your operation...</Text>
          </View>
        ) : totalUnits === 0 ? (
          <View style={styles.emptyBanner}>
            <LucideIcon name="Info" size={18} color={Colors.foamBlue} />
            <Text style={styles.emptyBannerText}>
              No vans or locations added yet. Go back to build your operation first.
            </Text>
          </View>
        ) : (
          <View style={styles.unitList}>
            {vans.map((van) => {
              const assignedIds = vanCrewMap[van.id] ?? new Set<string>();
              return (
                <UnitCrewCard
                  key={van.id}
                  icon={getUnitIcon(van.asset_type)}
                  name={van.name}
                  meta={`${assetTypeLabel(van.asset_type)} · Mobile service`}
                  allMembers={allMembers}
                  assignedMemberIds={assignedIds}
                  togglingId={togglingId}
                  onToggleMember={(memberId) => handleToggleCrewOnVan(van.id, memberId)}
                  onAddCrew={() => openAddCrewDrawer(van.id, "van", van.name)}
                />
              );
            })}
            {locations.map((loc) => {
              const assignedIds = locCrewMap[loc.id] ?? new Set<string>();
              return (
                <UnitCrewCard
                  key={loc.id}
                  icon="Building2"
                  name={loc.name}
                  meta={[
                    loc.address.split(",")[0],
                    loc.bay_count > 0
                      ? `${loc.bay_count} ${loc.bay_count === 1 ? "bay" : "bays"}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  allMembers={allMembers}
                  assignedMemberIds={assignedIds}
                  togglingId={togglingId}
                  onToggleMember={(memberId) => handleToggleCrewOnLocation(loc.id, memberId)}
                  onAddCrew={() => openAddCrewDrawer(loc.id, "location", loc.name)}
                />
              );
            })}
          </View>
        )}

        <View style={styles.infoBox}>
          <LucideIcon name="Users" size={16} color={Colors.foamBlue} />
          <Text style={styles.infoBoxText}>
            {allMembers.length === 0
              ? "No crew members yet. Use + to invite your first team member — they'll appear here once they join."
              : "Tap a crew member chip to assign or unassign them from a unit. Use + to invite someone new."}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, continuing && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={continuing}
          activeOpacity={0.85}
        >
          {continuing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleContinue}
          disabled={continuing}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Assign crew later</Text>
        </TouchableOpacity>
      </View>

      {/* Inline Add Crew DrawerModal */}
      <DrawerModal
        visible={showAddCrewDrawer}
        onRequestClose={() => setShowAddCrewDrawer(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={drawerStyles.drawerContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {selectedUnit && (
              <View style={drawerStyles.unitBanner}>
                <LucideIcon
                  name={selectedUnit.type === "location" ? "Building2" : "Truck"}
                  size={14}
                  color={Colors.foamBlue}
                />
                <Text style={drawerStyles.unitBannerText}>
                  Inviting crew for{" "}
                  <Text style={drawerStyles.unitBannerBold}>{selectedUnit.name}</Text>
                </Text>
              </View>
            )}

            {/* Tabs */}
            <View style={drawerStyles.tabBar}>
              {(["invite", "code"] as InviteTab[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[drawerStyles.tab, inviteTab === tab && drawerStyles.tabActive]}
                  onPress={() => setInviteTab(tab)}
                  activeOpacity={0.8}
                >
                  <LucideIcon
                    name={tab === "invite" ? "Mail" : "Share2"}
                    size={15}
                    color={inviteTab === tab ? Colors.foamBlue : Colors.light.textTertiary}
                  />
                  <Text
                    style={[
                      drawerStyles.tabText,
                      inviteTab === tab && drawerStyles.tabTextActive,
                    ]}
                  >
                    {tab === "invite" ? "Send Invite" : "Share Code"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {inviteTab === "invite" ? (
              <View style={drawerStyles.section}>
                {/* Mode Toggle */}
                <View style={drawerStyles.modeToggleRow}>
                  {(["phone", "email"] as InputMode[]).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        drawerStyles.modeChip,
                        inputMode === m && drawerStyles.modeChipActive,
                      ]}
                      onPress={() => setInputMode(m)}
                      activeOpacity={0.8}
                    >
                      <LucideIcon
                        name={m === "phone" ? "Phone" : "Mail"}
                        size={13}
                        color={inputMode === m ? Colors.foamBlue : Colors.light.textTertiary}
                      />
                      <Text
                        style={[
                          drawerStyles.modeChipText,
                          inputMode === m && drawerStyles.modeChipTextActive,
                        ]}
                      >
                        {m === "phone" ? "Phone" : "Email"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Recipient chips */}
                {recipients.length > 0 && (
                  <View style={drawerStyles.recipientChips}>
                    {recipients.map((r) => (
                      <View key={r.id} style={drawerStyles.recipientChip}>
                        <Text style={drawerStyles.recipientChipText}>{r.value}</Text>
                        <TouchableOpacity onPress={() => removeRecipient(r.id)} hitSlop={8}>
                          <LucideIcon name="X" size={12} color={Colors.foamBlue} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <View style={drawerStyles.inputRow}>
                  <TextInput
                    style={drawerStyles.textInput}
                    placeholder={
                      inputMode === "phone" ? "+1 (555) 000-0000" : "name@example.com"
                    }
                    placeholderTextColor={Colors.light.textDisabled}
                    value={currentInput}
                    onChangeText={setCurrentInput}
                    keyboardType={inputMode === "phone" ? "phone-pad" : "email-address"}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleAddRecipient}
                  />
                  <TouchableOpacity
                    style={drawerStyles.addRecipientButton}
                    onPress={handleAddRecipient}
                    activeOpacity={0.8}
                  >
                    <LucideIcon name="Plus" size={18} color={Colors.foamBlue} />
                  </TouchableOpacity>
                </View>

                {/* Role */}
                <Text style={drawerStyles.fieldLabel}>ROLE</Text>
                <View style={drawerStyles.roleCards}>
                  {(
                    [
                      {
                        id: "team_member" as InviteRole,
                        label: "Team Member",
                        desc: "Executes jobs, clocks in/out",
                        icon: "User",
                      },
                      {
                        id: "manager" as InviteRole,
                        label: "Manager",
                        desc: "Can manage crew & view reports",
                        icon: "ShieldCheck",
                      },
                    ] as const
                  ).map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        drawerStyles.roleCard,
                        inviteRole === r.id && drawerStyles.roleCardActive,
                      ]}
                      onPress={() => setInviteRole(r.id)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          drawerStyles.roleIconCircle,
                          inviteRole === r.id && drawerStyles.roleIconCircleActive,
                        ]}
                      >
                        <LucideIcon
                          name={r.icon}
                          size={18}
                          color={
                            inviteRole === r.id ? Colors.foamBlue : Colors.light.textTertiary
                          }
                        />
                      </View>
                      <View style={drawerStyles.roleTextBlock}>
                        <Text
                          style={[
                            drawerStyles.roleLabel,
                            inviteRole === r.id && drawerStyles.roleLabelActive,
                          ]}
                        >
                          {r.label}
                        </Text>
                        <Text style={drawerStyles.roleDesc}>{r.desc}</Text>
                      </View>
                      {inviteRole === r.id && (
                        <LucideIcon name="CheckCircle" size={18} color={Colors.foamBlue} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Commission */}
                <Text style={drawerStyles.fieldLabel}>COMMISSION RATE</Text>
                <View style={drawerStyles.commissionRow}>
                  <TextInput
                    style={[drawerStyles.textInput, { flex: 1 }]}
                    placeholder="38"
                    placeholderTextColor={Colors.light.textDisabled}
                    value={commission}
                    onChangeText={(v) => setCommission(v.replace(/[^0-9.]/g, ""))}
                    keyboardType="decimal-pad"
                  />
                  <View style={drawerStyles.commissionSuffix}>
                    <Text style={drawerStyles.commissionSuffixText}>%</Text>
                  </View>
                </View>

                {inviteError && (
                  <View style={drawerStyles.errorRow}>
                    <LucideIcon name="AlertCircle" size={14} color={Colors.error} />
                    <Text style={drawerStyles.errorText}>{inviteError}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    drawerStyles.sendButton,
                    !canSend && drawerStyles.sendButtonDisabled,
                  ]}
                  onPress={handleSendInvite}
                  disabled={!canSend || sending}
                  activeOpacity={0.85}
                >
                  {sending ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <LucideIcon name="Send" size={16} color={Colors.white} />
                      <Text style={drawerStyles.sendButtonText}>Send Invite</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={drawerStyles.section}>
                <View style={drawerStyles.codeCard}>
                  <Text style={drawerStyles.codeLabel}>YOUR TEAM CODE</Text>
                  <Text style={drawerStyles.codeValue}>{SHARE_CODE}</Text>
                  <TouchableOpacity
                    style={[
                      drawerStyles.copyButton,
                      codeCopied && drawerStyles.copyButtonDone,
                    ]}
                    onPress={handleCopyCode}
                    activeOpacity={0.85}
                  >
                    <LucideIcon
                      name={codeCopied ? "Check" : "Copy"}
                      size={16}
                      color={codeCopied ? Colors.successLight : Colors.foamBlue}
                    />
                    <Text
                      style={[
                        drawerStyles.copyButtonText,
                        codeCopied && drawerStyles.copyButtonTextDone,
                      ]}
                    >
                      {codeCopied ? "Copied!" : "Copy Code"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={drawerStyles.codeInstructions}>
                  Share this code with your team. They enter it during signup to join your
                  operation automatically.
                </Text>
                {[
                  { icon: "Download", text: "Team member downloads FOAM Crew app" },
                  { icon: "KeyRound", text: "They enter this code at signup" },
                  { icon: "CheckCircle", text: "They appear in your crew roster" },
                ].map((step, i) => (
                  <View key={i} style={drawerStyles.codeStep}>
                    <View style={drawerStyles.codeStepIcon}>
                      <LucideIcon name={step.icon} size={14} color={Colors.foamBlue} />
                    </View>
                    <Text style={drawerStyles.codeStepText}>{step.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </DrawerModal>
    </SafeAreaView>
  );
}

interface UnitCrewCardProps {
  icon: string;
  name: string;
  meta: string;
  allMembers: TeamMember[];
  assignedMemberIds: Set<string>;
  togglingId: string | null;
  onToggleMember: (memberId: string) => void;
  onAddCrew: () => void;
}

function UnitCrewCard({
  icon,
  name,
  meta,
  allMembers,
  assignedMemberIds,
  togglingId,
  onToggleMember,
  onAddCrew,
}: UnitCrewCardProps) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.cardHeader}>
        <View style={cardStyles.iconCircle}>
          <LucideIcon name={icon} size={22} color={Colors.foamBlue} />
        </View>
        <View style={cardStyles.headerText}>
          <Text style={cardStyles.unitName}>{name}</Text>
          <Text style={cardStyles.unitMeta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
      </View>

      <View style={cardStyles.divider} />

      <View style={cardStyles.crewRow}>
        <Text style={cardStyles.crewLabel}>CREW</Text>
        <View style={cardStyles.chipsRow}>
          {allMembers.length === 0 ? (
            <View style={cardStyles.noCrewChip}>
              <LucideIcon name="AlertCircle" size={12} color={Colors.warningLight} />
              <Text style={cardStyles.noCrewText}>No crew assigned</Text>
            </View>
          ) : (
            allMembers.map((member) => {
              const isAssigned = assignedMemberIds.has(member.id);
              const isToggling = togglingId === `${name}:${member.id}`;
              return (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    cardStyles.crewChip,
                    isAssigned && cardStyles.crewChipAssigned,
                  ]}
                  onPress={() => onToggleMember(member.id)}
                  disabled={isToggling}
                  activeOpacity={0.8}
                >
                  {isAssigned && (
                    <LucideIcon name="Check" size={11} color={Colors.foamBlue} />
                  )}
                  <Text
                    style={[
                      cardStyles.crewChipText,
                      isAssigned && cardStyles.crewChipTextAssigned,
                    ]}
                  >
                    {member.display_name}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
          <TouchableOpacity
            style={cardStyles.addButton}
            onPress={onAddCrew}
            activeOpacity={0.8}
          >
            <LucideIcon name="Plus" size={16} color={Colors.foamBlue} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const drawerStyles = StyleSheet.create({
  drawerContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Platform.OS === "web" ? 32 : 24,
    gap: 16,
  },
  unitBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  unitBannerText: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.foamBlue,
  },
  unitBannerBold: { fontFamily: Typography.bodySemiBold },
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.light.bgSecondary,
    borderRadius: Radius.sm,
    padding: 4,
    gap: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.xs,
  },
  tabActive: { backgroundColor: Colors.light.surface, ...Shadows.light.level1 },
  tabText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.light.textTertiary,
  },
  tabTextActive: { color: Colors.foamBlue },
  section: { gap: 14 },
  modeToggleRow: { flexDirection: "row", gap: 8 },
  modeChip: {
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
  modeChipActive: {
    borderColor: Colors.foamBlue,
    backgroundColor: Colors.foamBlueSubtle,
  },
  modeChipText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.light.textTertiary,
  },
  modeChipTextActive: { color: Colors.foamBlue },
  recipientChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  recipientChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recipientChipText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.foamBlue,
  },
  inputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  textInput: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.light.textPrimary,
    backgroundColor: Colors.light.surface,
  },
  addRecipientButton: {
    width: 46,
    height: 46,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.foamBlue,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
    marginBottom: -4,
  },
  roleCards: { gap: 10 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    backgroundColor: Colors.light.surface,
  },
  roleCardActive: {
    borderColor: Colors.foamBlue,
    backgroundColor: Colors.foamBlueSubtle,
  },
  roleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  roleIconCircleActive: { backgroundColor: "rgba(51,157,199,0.15)" },
  roleTextBlock: { flex: 1 },
  roleLabel: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  roleLabelActive: { color: Colors.foamBlue },
  roleDesc: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  commissionRow: { flexDirection: "row", gap: 8 },
  commissionSuffix: {
    height: 46,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  commissionSuffixText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
  errorRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: "rgba(239,68,68,0.06)",
    borderRadius: Radius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.18)",
  },
  errorText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.error,
    lineHeight: 18,
  },
  sendButton: {
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Shadows.light.level2,
  },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
  codeCard: {
    backgroundColor: Colors.foamDarkTeal,
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  codeLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 1,
  },
  codeValue: {
    fontFamily: Typography.display,
    fontSize: 32,
    color: Colors.white,
    letterSpacing: 4,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.foamBlue,
    backgroundColor: "rgba(51,157,199,0.15)",
  },
  copyButtonDone: {
    borderColor: Colors.successLight,
    backgroundColor: "rgba(22,163,74,0.12)",
  },
  copyButtonText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 14,
    color: Colors.foamBlue,
  },
  copyButtonTextDone: { color: Colors.successLight },
  codeInstructions: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    textAlign: "center",
  },
  codeStep: { flexDirection: "row", alignItems: "center", gap: 12 },
  codeStepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  codeStepText: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
    flex: 1,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    overflow: "hidden",
    ...Shadows.light.level1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerText: { flex: 1 },
  unitName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.light.textPrimary,
  },
  unitMeta: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  divider: { height: 1, backgroundColor: Colors.light.borderSubtle },
  crewRow: { padding: 16, gap: 10 },
  crewLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  noCrewChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(217,119,6,0.08)",
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(217,119,6,0.20)",
  },
  noCrewText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
    color: Colors.warningLight,
  },
  crewChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    backgroundColor: Colors.light.surface,
  },
  crewChipAssigned: {
    backgroundColor: Colors.foamBlueSubtle,
    borderColor: Colors.foamBlue,
  },
  crewChipText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
    color: Colors.light.textSecondary,
  },
  crewChipTextAssigned: { color: Colors.foamBlue },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.foamBlue,
  },
});

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
  content: { paddingHorizontal: Spacing.md, paddingTop: 16, paddingBottom: 140 },
  introBlock: { marginBottom: 24 },
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
  subheadlineBold: { fontFamily: Typography.bodySemiBold, color: Colors.light.textPrimary },
  loadingContainer: { alignItems: "center", marginTop: 60, gap: 12 },
  loadingText: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.light.textTertiary,
  },
  emptyBanner: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: Colors.foamLightBlue,
    borderRadius: Radius.md,
    padding: 16,
    alignItems: "flex-start",
    marginBottom: 24,
  },
  emptyBannerText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.foamBlue,
    lineHeight: 20,
  },
  unitList: { gap: 16, marginBottom: 24 },
  infoBox: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: Colors.foamLightBlue,
    borderRadius: Radius.md,
    padding: 16,
    alignItems: "flex-start",
  },
  infoBoxText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Platform.OS === "web" ? 24 : 0,
    paddingTop: Spacing.md,
    alignItems: "center",
    gap: 4,
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
  buttonDisabled: { opacity: 0.4 },
  primaryButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
  skipButton: {
    height: 44,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButtonText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textTertiary,
  },
});
