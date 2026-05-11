import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="customer" />
      <Stack.Screen name="operator" />
      <Stack.Screen name="crew" />
    </Stack>
  );
}
