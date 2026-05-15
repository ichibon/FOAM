import { useEffect, type ReactNode } from "react";
import { Platform } from "react-native";
import { Stack, router, usePathname } from "expo-router";
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
import type { UserRole } from "@/lib/supabase";

const StripeProvider =
  Platform.OS !== "web"
    ? require("@stripe/stripe-react-native").StripeProvider
    : ({ children }: { children: ReactNode }) => <>{children}</>;

SplashScreen.preventAutoHideAsync();

function onboardingEntryFor(role: UserRole): string {
  switch (role) {
    case "customer": return "/onboarding/customer/vehicle";
    case "operator": return "/onboarding/operator/build";
    case "manager": return "/onboarding/operator/build";
    case "team_member": return "/onboarding/crew/invite";
    default: return "/auth/role-select";
  }
}

function mainTabFor(role: UserRole): string {
  switch (role) {
    case "customer": return "/customer/discover";
    case "operator": return "/operator/today";
    case "manager": return "/operator/today";
    case "team_member": return "/team_member/jobs";
    default: return "/onboarding/splash";
  }
}

function RootLayoutNav() {
  const { session, role, onboardingComplete, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace("/onboarding/splash");
      return;
    }

    if (!role) {
      // Don't bounce the user mid-SSO signup — the signup screen writes the
      // role and navigates itself. Redirecting here would race with that write.
      if (pathname === "/auth/signup") return;
      router.replace("/auth/role-select");
      return;
    }

    if (!onboardingComplete) {
      const entry = onboardingEntryFor(role);
      router.replace(entry as Parameters<typeof router.replace>[0]);
      return;
    }

    const tab = mainTabFor(role);
    router.replace(tab as Parameters<typeof router.replace>[0]);
  }, [session, role, onboardingComplete, loading, pathname]);

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
          merchantIdentifier="merchant.com.foamauto.app"
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
