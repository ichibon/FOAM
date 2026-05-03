import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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

// Keep splash screen visible while loading fonts + session
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      // Not logged in → onboarding/auth flow
      router.replace("/auth/welcome");
    } else {
      // Logged in → route to correct experience by role
      switch (role) {
        case "customer":
          router.replace("/customer/discover");
          break;
        case "detailer":
          router.replace("/detailer/today");
          break;
        case "crew":
          router.replace("/crew/jobs");
          break;
        default:
          router.replace("/auth/welcome");
      }
    }
  }, [session, role, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="customer" />
      <Stack.Screen name="detailer" />
      <Stack.Screen name="crew" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_800ExtraBold_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <StatusBar style="light" />
        <RootLayoutNav />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
