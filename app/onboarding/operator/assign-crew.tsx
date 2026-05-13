import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { supabase } from "@/lib/supabase";
import { LucideIcon } from "@/components/LucideIcon";

interface UnitVan {
  id: string;
  name: string;
  asset_type: string;
  crew: CrewChip[];
}

interface UnitLocation {
  id: string;
  name: string;
  address: string;
  crew: CrewChip[];
}

interface CrewChip {
  id: string;
  label: string;
}

export default function AssignCrewScreen() {
  const [vans, setVans] = useState<UnitVan[]>([]);
  const [locations, setLocations] = useState<UnitLocation[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [continuing, setContinuing] = useState(false);

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

      const [{ data: assetsData }, { data: locsData }] = await Promise.all([
        supabase
          .from("business_assets")
          .select("id, name, asset_type")
          .eq("detailer_id", profile.id)
          .eq("is_active", true)
          .order("created_at"),
        supabase
          .from("business_locations")
          .select("id, name, address")
          .eq("detailer_id", profile.id)
          .eq("is_active", true)
          .order("created_at"),
      ]);

      setVans((assetsData ?? []).map((a) => ({ ...a, crew: [] })));
      setLocations((locsData ?? []).map((l) => ({ ...l, crew: [] })));
    } catch (err) {
      console.warn("[AssignCrew] loadUnits failed", err);
    }
    setLoadingUnits(false);
  }, []);

  useEffect(() => {
    void loadUnits();
  }, [loadUnits]);

  function handleAddCrewToUnit(unitId: string, unitType: "van" | "location") {
    router.push(
      `/onboarding/operator/add-team-member?unit_id=${unitId}&unit_type=${unitType}`
    );
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

  const totalUnits = vans.length + locations.length;

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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introBlock}>
          <Text style={styles.headline}>Assign your crew.</Text>
          <Text style={styles.subheadline}>
            Invite team members to each van or location. You can always change this later.
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
            {vans.map((van) => (
              <UnitCrewCard
                key={van.id}
                icon={getUnitIcon(van.asset_type)}
                name={van.name}
                crew={van.crew}
                onAddCrew={() => handleAddCrewToUnit(van.id, "van")}
              />
            ))}
            {locations.map((loc) => (
              <UnitCrewCard
                key={loc.id}
                icon="Building2"
                name={loc.name}
                crew={loc.crew}
                onAddCrew={() => handleAddCrewToUnit(loc.id, "location")}
              />
            ))}
          </View>
        )}

        <View style={styles.infoBox}>
          <LucideIcon name="Users" size={16} color={Colors.foamBlue} />
          <Text style={styles.infoBoxText}>
            Your team members will receive an invite and create their FOAM crew account to clock in, track jobs, and get paid.
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
    </SafeAreaView>
  );
}

interface UnitCrewCardProps {
  icon: string;
  name: string;
  crew: CrewChip[];
  onAddCrew: () => void;
}

function UnitCrewCard({ icon, name, crew, onAddCrew }: UnitCrewCardProps) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.cardHeader}>
        <View style={cardStyles.iconCircle}>
          <LucideIcon name={icon} size={22} color={Colors.foamBlue} />
        </View>
        <Text style={cardStyles.unitName}>{name}</Text>
      </View>

      <View style={cardStyles.divider} />

      <View style={cardStyles.crewRow}>
        <Text style={cardStyles.crewLabel}>CREW</Text>
        <View style={cardStyles.chipsRow}>
          {crew.length === 0 ? (
            <View style={cardStyles.noCrewChip}>
              <LucideIcon name="AlertCircle" size={12} color={Colors.warningLight} />
              <Text style={cardStyles.noCrewText}>No crew assigned</Text>
            </View>
          ) : (
            crew.map((c) => (
              <View key={c.id} style={cardStyles.crewChip}>
                <Text style={cardStyles.crewChipText}>{c.label}</Text>
              </View>
            ))
          )}
          <TouchableOpacity style={cardStyles.addButton} onPress={onAddCrew} activeOpacity={0.8}>
            <LucideIcon name="Plus" size={16} color={Colors.foamBlue} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

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
  },
  unitName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.light.textPrimary,
    flex: 1,
  },
  divider: { height: 1, backgroundColor: Colors.light.borderSubtle },
  crewRow: { padding: 16, gap: 10 },
  crewLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
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
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  crewChipText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
    color: Colors.foamBlue,
  },
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
  loadingContainer: {
    alignItems: "center",
    marginTop: 60,
    gap: 12,
  },
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
