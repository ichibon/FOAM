import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { LucideIcon } from "@/components/LucideIcon";

const WebView = Platform.OS !== "web"
  ? require("react-native-webview").WebView
  : null;

const PK = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

function buildAccountOnboardingHtml(clientSecret: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <script src="https://connect-js.stripe.com/v1.0/connect.js" async></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 16px; min-height: 100vh; }
    #account-onboarding { min-height: 100vh; }
    .loading { display: flex; align-items: center; justify-content: center; min-height: 200px; color: #A3A3A3; font-size: 14px; }
  </style>
</head>
<body>
  <div class="loading" id="loading">Setting up Stripe...</div>
  <div id="account-onboarding"></div>
  <script>
    function postMsg(data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    window.addEventListener('load', function() {
      if (!window.StripeConnect) {
        postMsg({ type: 'error', message: 'Stripe Connect JS failed to load' });
        return;
      }

      try {
        var instance = window.StripeConnect.initialize({
          publishableKey: '${PK}',
          clientSecret: '${clientSecret}',
          appearance: {
            overlays: 'dialog',
            variables: {
              colorPrimary: '#339DC7',
              borderRadius: '8px',
              fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
            }
          }
        });

        var onboarding = instance.create('account-onboarding');
        onboarding.setFullTermsOfServiceUrl('https://foam.app/terms');
        onboarding.setPrivacyPolicyUrl('https://foam.app/privacy');
        onboarding.setSkipTermsOfServiceCollection(false);

        onboarding.setOnExit(function() {
          postMsg({ type: 'exit' });
        });

        onboarding.setOnStepChange(function(stepChange) {
          postMsg({ type: 'step', step: stepChange.step });
        });

        var container = document.getElementById('account-onboarding');
        container.appendChild(onboarding);
        document.getElementById('loading').style.display = 'none';
        postMsg({ type: 'ready' });
      } catch (e) {
        postMsg({ type: 'error', message: e.message });
      }
    });
  </script>
</body>
</html>`;
}

const requirements = [
  "A US bank account for payouts",
  "Your SSN (for identity verification)",
  "A government-issued photo ID",
];

export default function StripeScreen() {
  const { refreshAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingHtml, setOnboardingHtml] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Please sign in again and retry.");
        setLoading(false);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke(
        "stripe-create-connect-account",
        { body: { user_id: user.id } }
      );

      if (fnError || !data) {
        setError("Could not start Stripe setup. Please try again.");
        setLoading(false);
        return;
      }

      if (data.client_secret) {
        const html = buildAccountOnboardingHtml(data.client_secret as string);
        setOnboardingHtml(html);
        setShowOnboarding(true);
      } else {
        setError("Stripe setup could not be initialized. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  async function markCompleteAndAdvance() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("users").update({ onboarding_complete: true }).eq("id", user.id);
      }
    } catch (err) {
      console.warn("[StripeOnboarding] onboarding_complete write failed", err);
    }
    await refreshAuth();
    router.replace("/operator/pending");
  }

  function handleWebViewMessage(event: { nativeEvent: { data: string } }) {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type: string };
      if (msg.type === "exit") {
        setShowOnboarding(false);
        void markCompleteAndAdvance();
      }
    } catch (err) {
      console.warn("[StripeOnboarding] WebView message parse failed", err);
    }
  }

  function handleWebViewNavigate(navState: { url: string }) {
    const url = navState.url ?? "";
    if (url.startsWith("foam://")) {
      setShowOnboarding(false);
      void markCompleteAndAdvance();
    }
  }

  function handleSkip() {
    void markCompleteAndAdvance();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.progressHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <LucideIcon name="ChevronLeft" size={20} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Step 4 of 4</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.progressTrackWrap}>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.introBlock}>
          <Text style={styles.headline}>Get paid.</Text>
          <Text style={styles.subheadline}>Connect your bank account to receive payouts.</Text>
        </View>

        <View style={styles.stripeCard}>
          <View style={styles.stripeCardHeader}>
            <Text style={styles.poweredBy}>Powered by Stripe</Text>
            <View style={styles.stripeBadge}>
              <Text style={styles.stripeBadgeText}>STRIPE</Text>
            </View>
          </View>

          <Text style={styles.stripeBody}>
            Stripe handles all payment processing and payouts for FOAM operators. Your financial data is secured by Stripe — FOAM never sees your bank details.
          </Text>

          <View style={styles.requirementsSection}>
            <Text style={styles.requirementsLabel}>YOU'LL NEED</Text>
            <View style={styles.requirementsList}>
              {requirements.map((req, i) => (
                <View key={i} style={styles.requirementRow}>
                  <View style={styles.checkCircle}>
                    <LucideIcon name="Check" size={10} color={Colors.foamBlue} />
                  </View>
                  <Text style={styles.requirementText}>{req}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <LucideIcon name="AlertCircle" size={14} color={Colors.errorLight} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.payoutAlert}>
          <View style={styles.payoutAlertIcon}>
            <LucideIcon name="DollarSign" size={12} color={Colors.foamBlue} />
          </View>
          <Text style={styles.payoutAlertText}>
            Payouts hit your account within 2 business days after each completed job.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleConnect}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <LucideIcon name="Link" size={18} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Connect with Stripe</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} disabled={loading} activeOpacity={0.7}>
          <Text style={styles.skipButtonText}>I'll do this later</Text>
        </TouchableOpacity>
        <Text style={styles.skipWarning}>
          You won't be able to receive payments until your bank is connected.
        </Text>
      </View>

      {WebView && (
        <Modal
          visible={showOnboarding}
          animationType="slide"
          onRequestClose={() => setShowOnboarding(false)}
        >
          <SafeAreaView style={styles.webViewContainer}>
            <View style={styles.webViewHeader}>
              <TouchableOpacity
                onPress={() => setShowOnboarding(false)}
                activeOpacity={0.7}
                style={styles.webViewClose}
              >
                <LucideIcon name="X" size={20} color={Colors.light.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.webViewTitle}>Stripe Onboarding</Text>
              <View style={styles.spacer} />
            </View>
            <WebView
              source={{ html: onboardingHtml ?? "" }}
              originWhitelist={["*"]}
              javaScriptEnabled
              domStorageEnabled
              onMessage={handleWebViewMessage}
              onNavigationStateChange={handleWebViewNavigate}
              style={styles.webView}
            />
          </SafeAreaView>
        </Modal>
      )}
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
  progressFill: {
    height: "100%",
    width: "100%",
    backgroundColor: Colors.foamBlue,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: 16,
  },
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
  stripeCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    marginBottom: 24,
    ...Shadows.light.level1,
  },
  stripeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  poweredBy: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
  },
  stripeBadge: {
    backgroundColor: Colors.foamBlue,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stripeBadgeText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 10,
    color: Colors.white,
    letterSpacing: 1,
  },
  stripeBody: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  requirementsSection: {},
  requirementsLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  requirementsList: { gap: Spacing.sm },
  requirementRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  requirementText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "rgba(220,38,38,0.07)",
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.18)",
  },
  errorText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.errorLight,
  },
  payoutAlert: {
    flexDirection: "row",
    gap: Spacing.sm,
    backgroundColor: Colors.foamLightBlue,
    borderRadius: Radius.md,
    padding: 12,
    alignItems: "flex-start",
  },
  payoutAlertIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(51,157,199,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  payoutAlertText: {
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    ...Shadows.light.level2,
  },
  buttonDisabled: { opacity: 0.5 },
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
    marginTop: 4,
  },
  skipButtonText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
  skipWarning: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.warningLight,
    textAlign: "center",
    maxWidth: 280,
  },
  webViewContainer: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  webViewHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  webViewClose: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  webViewTitle: {
    flex: 1,
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  webView: { flex: 1 },
});
