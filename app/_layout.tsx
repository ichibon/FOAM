import { useEffect, type ReactNode } from "react";
import { Platform } from "react-native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_800ExtraBold_Italic,
} from "@expo-google-fonts/playfair-display";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

const StripeProvider =
  Platform.OS !== "web"
    ? require("@stripe/stripe-react-native").StripeProvider
    : ({ children }: { children: ReactNode }) => <>{children}</>;

SplashScreen.preventAutoHideAsync();

const ONBOARDING_ENTRY: Record<string, string> = {
  customer: "/onboarding/customer/vehicle",
  operator: "/onboarding/operator/type",
  manager: "/onboarding/operator/type",
  team_member: "/onboarding/crew/profile",
};

const MAIN_TAB: Record<string, string> = {
  customer: "/customer/discover",
  operator: "/operator/today",
  manager: "/operator/today",
  team_member: "/team_member/jobs",
};

function RootLayoutNav() {
  const { session, role, onboardingComplete, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace("/onboarding/splash");
      return;
    }

    if (!role) {
      router.replace("/auth/role-select");
      return;
    }

    if (!onboardingComplete) {
      const entry = ONBOARDING_ENTRY[role] ?? "/onboarding/splash";
      router.replace(entry as any);
      return;
    }

    const tab = MAIN_TAB[role] ?? "/onboarding/splash";
    router.replace(tab as any);
  }, [session, role, onboardingComplete, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="customer" />
      <Stack.Screen name="operator" />
      <Stack.Screen name="team_member" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_800ExtraBold_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StripeProvider
          publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""}
          merchantIdentifier="merchant.app.foam.mobile"
          urlScheme="foam"
        >
          <AuthProvider>
            <StatusBar style="dark" />
            <RootLayoutNav />
          </AuthProvider>
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
