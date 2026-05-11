import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { LucideIcon } from "@/components/LucideIcon";

export default function PaymentScreen() {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [zip, setZip] = useState("");

  function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }

  function handleContinue() {
    router.replace("/onboarding/customer/location");
  }

  function handleSkip() {
    router.replace("/onboarding/customer/location");
  }

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

        <View style={styles.cardForm}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Card number</Text>
            <View style={styles.cardNumberRow}>
              <TextInput
                style={[styles.input, styles.cardNumberInput]}
                value={cardNumber}
                onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={Colors.light.textTertiary}
                keyboardType="number-pad"
                maxLength={19}
              />
              <View style={styles.cardBrands}>
                <Text style={[styles.cardBrand, styles.visa]}>VISA</Text>
                <Text style={[styles.cardBrand, styles.mc]}>MC</Text>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Expiry</Text>
              <TextInput
                style={styles.input}
                value={expiry}
                onChangeText={(t) => setExpiry(formatExpiry(t))}
                placeholder="MM/YY"
                placeholderTextColor={Colors.light.textTertiary}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>CVC</Text>
              <View style={styles.cvcRow}>
                <TextInput
                  style={[styles.input, styles.cvcInput]}
                  value={cvc}
                  onChangeText={setCvc}
                  placeholder="123"
                  placeholderTextColor={Colors.light.textTertiary}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
                <View style={styles.lockIcon}>
                  <LucideIcon name="Lock" size={14} color={Colors.light.textTertiary} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ZIP code</Text>
            <TextInput
              style={styles.input}
              value={zip}
              onChangeText={setZip}
              placeholder="30305"
              placeholderTextColor={Colors.light.textTertiary}
              keyboardType="number-pad"
              maxLength={5}
            />
            <Text style={styles.inputHint}>Used for billing verification only.</Text>
          </View>
        </View>

        <View style={styles.trustRow}>
          <LucideIcon name="Lock" size={14} color={Colors.foamBlue} />
          <Text style={styles.trustText}>Secured by Stripe. We never store your card details.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Save & Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
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
  cardForm: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    ...Shadows.light.level1,
  },
  inputGroup: { gap: 6 },
  label: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
  },
  input: {
    height: 52,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
  },
  cardNumberRow: { position: "relative" },
  cardNumberInput: { paddingRight: 80 },
  cardBrands: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardBrand: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  visa: {
    backgroundColor: "#1434CB",
    color: Colors.white,
  },
  mc: {
    backgroundColor: "#EB001B",
    color: Colors.white,
  },
  row: { flexDirection: "row", gap: Spacing.sm },
  flex1: { flex: 1 },
  cvcRow: { position: "relative" },
  cvcInput: { paddingRight: 40 },
  lockIcon: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  inputHint: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    marginTop: Spacing.md,
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
  },
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
