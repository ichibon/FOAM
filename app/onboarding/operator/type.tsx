import { useState } from "react";
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

type OperationType = "mobile" | "fixed" | "both";

const types: {
  id: OperationType;
  title: string;
  description: string;
  icon: "Navigation" | "MapPin" | "Zap";
  chips: string[];
  advanced?: boolean;
}[] = [
  {
    id: "mobile",
    title: "Mobile Detailer",
    description: "You go to your customers. Set your service radius and schedule.",
    icon: "Navigation",
    chips: ["Service radius", "Home base", "Route planning"],
  },
  {
    id: "fixed",
    title: "Fixed Location",
    description: "Customers come to you. Configure your bays, hours, and walk-ins.",
    icon: "MapPin",
    chips: ["Bay management", "Operating hours", "Walk-in toggle"],
  },
  {
    id: "both",
    title: "Both",
    description: "Run mobile jobs and a fixed location from one unified view.",
    icon: "Zap",
    chips: ["Unified calendar", "Channel revenue", "Full flexibility"],
    advanced: true,
  },
];

export default function OperatorTypeScreen() {
  const [selected, setSelected] = useState<OperationType | null>("mobile");
  const [loading, setLoading] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);
    setWriteError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No session");

      const { error: updateError } = await supabase
        .from("detailer_profiles")
        .update({ operation_type: selected })
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      router.push("/onboarding/operator/build");
    } catch (err) {
      console.warn("[OperatorType] write failed", err);
      setWriteError("Couldn't save your selection. Please try again.");
    }

    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.progressHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <LucideIcon name="ChevronLeft" size={20} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Step 1 of 4</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.progressTrackWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "25%" }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introBlock}>
          <Text style={styles.headline}>How do you operate?</Text>
          <Text style={styles.subheadline}>This sets up the right tools for your business.</Text>
        </View>

        <View style={styles.cards}>
          {types.map((type) => {
            const isSelected = selected === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                onPress={() => setSelected(type.id)}
                activeOpacity={0.85}
              >
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <LucideIcon name="Check" size={12} color={Colors.white} />
                  </View>
                )}

                <View style={styles.cardTop}>
                  <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                    <LucideIcon name={type.icon} size={24} color={Colors.foamBlue} />
                  </View>
                  <View style={styles.titleRow}>
                    <Text style={styles.typeTitle}>{type.title}</Text>
                    {type.advanced && (
                      <View style={styles.advancedBadge}>
                        <Text style={styles.advancedBadgeText}>Advanced</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text style={styles.typeDescription}>{type.description}</Text>

                <View style={styles.chips}>
                  {type.chips.map((chip) => (
                    <View key={chip} style={[styles.chip, isSelected && styles.chipSelected]}>
                      <Text style={styles.chipText}>{chip}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {writeError && (
          <Text style={styles.writeError}>{writeError}</Text>
        )}
        <TouchableOpacity
          style={[styles.primaryButton, (!selected || loading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selected || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.footnote}>You can add a second operation type later.</Text>
      </View>
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
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: {
    flex: 1,
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  spacer: { width: 44 },
  progressTrackWrap: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.light.borderSubtle,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.foamBlue,
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: 20,
    paddingBottom: 140,
  },
  introBlock: { marginBottom: Spacing.lg },
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
    marginTop: Spacing.sm,
  },
  cards: { gap: Spacing.sm },
  typeCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    position: "relative",
    ...Shadows.light.level1,
  },
  typeCardSelected: {
    borderWidth: 2,
    borderColor: Colors.foamBlue,
    backgroundColor: Colors.foamBlueSubtle,
  },
  checkBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.light.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxSelected: {
    backgroundColor: Colors.white,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  typeTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 17,
    color: Colors.light.textPrimary,
  },
  advancedBadge: {
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  advancedBadgeText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.foamBlue,
  },
  typeDescription: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    backgroundColor: Colors.light.bgSecondary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  chipSelected: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
  },
  chipText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textSecondary,
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
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  footnote: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
    textAlign: "center",
  },
  writeError: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.error,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
});
