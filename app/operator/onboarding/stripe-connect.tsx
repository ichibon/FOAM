import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/design";

type OnboardingStatus = "loading" | "ready" | "complete" | "error";

export default function StripeConnectScreen() {
  const { session } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus>("loading");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey] = useState(
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    initOnboarding();
  }, []);

  async function initOnboarding() {
    try {
      setStatus("loading");
      const supabase = getSupabase();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("detailer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Operator profile not found");

      const { data, error } = await supabase.functions.invoke(
        "stripe-create-connect-account",
        {
          body: {
            operator_id: profile.id,
            email: user.email,
          },
        }
      );

      if (error) throw new Error(error.message);
      if (!data?.client_secret)
        throw new Error("No client secret returned from server");

      setClientSecret(data.client_secret);
      setStatus("ready");
    } catch (err) {
      console.error("Stripe Connect init error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to start onboarding"
      );
      setStatus("error");
    }
  }

  function buildOnboardingHtml(secret: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0F2F3C;
      font-family: -apple-system, sans-serif;
      min-height: 100vh;
    }
    #mount {
      min-height: 100vh;
    }
    .error {
      color: #ff6b6b;
      padding: 24px;
      text-align: center;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div id="mount"></div>
  <script>
    (function() {
      function init() {
      try {
        const stripeConnect = StripeConnect.initStripeConnect({
          publishableKey: '${publishableKey}',
          fetchClientSecret: async () => '${secret}',
          appearance: {
            overlays: 'dialog',
            variables: {
              colorPrimary: '#339DC7',
              colorBackground: '#0F2F3C',
              colorText: '#FFFFFF',
              borderRadius: '12px',
              fontFamily: '-apple-system, sans-serif',
            },
          },
        });

        const accountOnboarding = stripeConnect.create('account-onboarding');

        accountOnboarding.setOnExit(() => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'onboarding_exit' }));
        });

        accountOnboarding.setFullTermsOfServiceUrl('https://foam.app/terms');
        accountOnboarding.setRecipientTermsOfServiceUrl('https://foam.app/terms/connect');
        accountOnboarding.setPrivacyPolicyUrl('https://foam.app/privacy');

        document.getElementById('mount').appendChild(accountOnboarding);
      } catch (e) {
        document.getElementById('mount').innerHTML =
          '<p class="error">Failed to load onboarding: ' + e.message + '</p>';
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.message }));
      }
      }
      var s = document.createElement('script');
      s.src = 'https://connect-js.stripe.com/v1/connect.js';
      s.onload = init;
      s.onerror = function() {
        document.getElementById('mount').innerHTML = '<p class="error">Failed to load Stripe Connect</p>';
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Failed to load Stripe Connect script' }));
      };
      document.head.appendChild(s);
    })();
  </script>
</body>
</html>`;
  }

  function handleWebViewMessage(event: { nativeEvent: { data: string } }) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "onboarding_exit") {
        setStatus("complete");
        router.replace("/operator/today");
      } else if (msg.type === "error") {
        setErrorMessage(msg.message ?? "Unknown error in onboarding");
        setStatus("error");
      }
    } catch {
      // Non-JSON postMessage — ignore
    }
  }

  if (status === "loading") {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.foamBlue} />
        <Text style={styles.loadingText}>Setting up your payment account…</Text>
      </SafeAreaView>
    );
  }

  if (status === "error") {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorBody}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={initOnboarding}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => router.replace("/operator/today")}
        >
          <Text style={styles.skipBtnText}>Skip for now</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (status === "complete") {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.foamBlue} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/operator/today")}
          style={styles.backBtn}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Setup</Text>
        <View style={styles.backBtn} />
      </View>

      {clientSecret ? (
        <WebView
          ref={webViewRef}
          source={{ html: buildOnboardingHtml(clientSecret) }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webViewLoader}>
              <ActivityIndicator size="large" color={Colors.foamBlue} />
            </View>
          )}
          onError={(e) => {
            setErrorMessage(e.nativeEvent.description);
            setStatus("error");
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const COLORS_LOCAL = {
  bg: "#0F2F3C",
  surface: "#1C5268",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.5)",
  blue: "#339DC7",
  red: "#FF6B6B",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS_LOCAL.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS_LOCAL.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS_LOCAL.text,
  },
  backBtn: {
    width: 80,
  },
  backBtnText: {
    color: COLORS_LOCAL.blue,
    fontSize: 15,
  },
  webView: {
    flex: 1,
    backgroundColor: COLORS_LOCAL.bg,
  },
  webViewLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS_LOCAL.bg,
  },
  loadingText: {
    marginTop: 16,
    color: COLORS_LOCAL.muted,
    fontSize: 15,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS_LOCAL.text,
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 14,
    color: COLORS_LOCAL.muted,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: COLORS_LOCAL.blue,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  retryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  skipBtn: {
    paddingVertical: 12,
  },
  skipBtnText: {
    color: COLORS_LOCAL.muted,
    fontSize: 15,
  },
});
