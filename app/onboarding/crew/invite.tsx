import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { supabase } from "@/lib/supabase";
import { LucideIcon } from "@/components/LucideIcon";

export default function InviteCodeScreen() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    if (code.trim().length < 6) {
      setError("Please enter a valid 6-character invite code.");
      return;
    }
    setLoading(true);
    setError(null);

    const { data: match } = await supabase
      .from("team_members")
      .select("id")
      .eq("invite_code", code.trim().toUpperCase())
      .single();

    if (!match) {
      setError("That code doesn't match any team. Double-check with your manager.");
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("team_members")
        .update({ user_id: user.id })
        .eq("id", match.id);
    }

    setLoading(false);
    router.push("/onboarding/crew/profile");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <LucideIcon name="ChevronLeft" size={20} color={Colors.light.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.introBlock}>
          <Text style={styles.headline}>Enter your invite code.</Text>
          <Text style={styles.subheadline}>
            Your manager sent this when they added you to their team.
          </Text>
        </View>

        <View style={styles.codeInputArea}>
          <TextInput
            style={[styles.codeInput, !!error && styles.codeInputError]}
            value={code}
            onChangeText={(t) => {
              setCode(t.toUpperCase().slice(0, 6));
              if (error) setError(null);
            }}
            placeholder="_ _ _ _ _ _"
            placeholderTextColor={Colors.light.textTertiary}
            autoCapitalize="characters"
            maxLength={6}
            autoCorrect={false}
            textAlign="center"
          />
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>

        <View style={styles.hintCard}>
          <LucideIcon name="Info" size={18} color={Colors.foamBlue} />
          <Text style={styles.hintText}>
            Codes look like: AB12CD. Check your text messages or email from your manager.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, (code.length < 6 || loading) && styles.buttonDisabled]}
          onPress={handleJoin}
          disabled={code.length < 6 || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Join Team</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpButton} activeOpacity={0.7}>
          <Text style={styles.helpButtonText}>Don't have a code?</Text>
        </TouchableOpacity>
        <Text style={styles.helpSubtext}>
          Contact your manager and ask them to add you in their Team tab.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  header: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xl2,
    paddingBottom: Spacing.sm,
  },
  backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: 24,
  },
  introBlock: { marginBottom: 32 },
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
  codeInputArea: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  codeInput: {
    width: "100%",
    height: 72,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.light.borderSubtle,
    fontFamily: Typography.bodySemiBold,
    fontSize: 32,
    color: Colors.light.textPrimary,
    letterSpacing: 12,
    textAlign: "center",
    ...Shadows.light.level1,
  },
  codeInputError: {
    borderColor: Colors.errorLight,
  },
  errorText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.errorLight,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  hintCard: {
    flexDirection: "row",
    gap: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    alignItems: "flex-start",
    ...Shadows.light.level1,
  },
  hintText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    lineHeight: 18,
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
  buttonDisabled: { opacity: 0.5 },
  primaryButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
  helpButton: {
    height: 44,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  helpButtonText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
  helpSubtext: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
});
