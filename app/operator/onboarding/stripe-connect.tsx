import { useEffect, useState } from "react";
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
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
      if (!data?.account_link_url)
        throw new Error("No onboarding URL returned from server");

      setOnboardingUrl(data.account_link_url);
      setStatus("ready");
    } catch (err) {
      console.error("Stripe Connect init error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to start onboarding"
      );
      setStatus("error");
    }
  }

  function handleNavigationStateChange(navState: { url: string }) {
    if (navState.url.includes("getfoam.app/stripe/return")) {
      setStatus("complete");
      router.replace("/operator/today");
    } else if (navState.url.includes("getfoam.app/stripe/refresh")) {
      initOnboarding();
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

      {onboardingUrl ? (
        <WebView
          ref={webViewRef}
          source={{ uri: onboardingUrl }}
          style={styles.webView}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          onNavigationStateChange={handleNavigationStateChange}
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
