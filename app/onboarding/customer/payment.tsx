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

const NativeStripe =
  Platform.OS !== "web" ? require("@stripe/stripe-react-native") : null;

const CardField: React.ComponentType<{
  postalCodeEnabled: boolean;
  style: object;
  cardStyle: object;
  onCardChange: (card: { complete: boolean }) => void;
}> | null = NativeStripe?.CardField ?? null;

export default function PaymentScreen() {
  const [cardComplete, setCardComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.functions.invoke("stripe-create-customer", {
          body: { user_id: user.id },
        });
        if (error) {
          console.warn("stripe-create-customer:", error.message);
        }
      }
    } catch (e) {
      console.warn("Payment setup error:", e);
    }
    setLoading(false);
    router.replace("/onboarding/customer/location");
  }

  function handleSkip() {
    router.replace("/onboarding/customer/location");
  }

  const canSubmit = Platform.OS === "web" ? true : cardComplete;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.progressHeader}>
        <Text style={styles.stepLabel}>Step 2 of 3</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "66%" }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.introBlock}>
          <Text style={styles.headline}>How do you want to pay?</Text>
          <Text style={styles.subheadline}>Securely saved for checkout. Remove anytime.</Text>
        </View>

        <View style={styles.cardFormCard}>
          <View style={styles.cardFormHeader}>
            <LucideIcon name="CreditCard" size={18} color={Colors.foamBlue} />
            <Text style={styles.cardFormLabel}>Card details</Text>
            <View style={styles.stripeBadge}>
              <Text style={styles.stripeBadgeText}>STRIPE</Text>
            </View>
          </View>

          {CardField ? (
            <CardField
              postalCodeEnabled
              style={styles.cardField}
              cardStyle={{
                backgroundColor: Colors.light.bgPrimary,
                textColor: Colors.light.textPrimary,
                placeholderColor: Colors.light.textTertiary,
                borderColor: Colors.light.borderSubtle,
                borderRadius: Radius.md,
                borderWidth: 1,
                fontSize: 15,
              }}
              onCardChange={(card) => setCardComplete(card.complete)}
            />
          ) : (
            <View style={styles.webNotice}>
              <LucideIcon name="Smartphone" size={24} color={Colors.foamBlue} />
              <Text style={styles.webNoticeTitle}>Use the mobile app</Text>
              <Text style={styles.webNoticeBody}>
                Card entry is available in the FOAM mobile app. Continue to save your account — you can add a card when you book.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.trustRow}>
          <LucideIcon name="Lock" size={14} color={Colors.foamBlue} />
          <Text style={styles.trustText}>Secured by Stripe. We never store your card details.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, (loading || !canSubmit) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={loading || !canSubmit}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Save & Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} disabled={loading} activeOpacity={0.7}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  progressHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    alignItems: "center",
  },
  stepLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
    marginBottom: Spacing.sm,
  },
  progressTrack: {
    width: "100%",
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
    paddingBottom: 160,
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
  cardFormCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    marginBottom: Spacing.md,
    ...Shadows.light.level1,
  },
  cardFormHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardFormLabel: {
    flex: 1,
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  stripeBadge: {
    backgroundColor: Colors.foamBlue,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  stripeBadgeText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 10,
    color: Colors.white,
    letterSpacing: 1,
  },
  cardField: {
    width: "100%",
    height: 52,
  },
  webNotice: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  webNoticeTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  webNoticeBody: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  trustText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textSecondary,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Platform.OS === "web" ? 24 : 0,
    paddingTop: Spacing.md,
    backgroundColor: Colors.light.bgPrimary,
    gap: 4,
    alignItems: "center",
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
  skipButton: {
    height: 44,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  skipButtonText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
});
