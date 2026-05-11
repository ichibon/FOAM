import { Stack } from "expo-router";

export default function OperatorOnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="type" />
      <Stack.Screen name="build" />
      <Stack.Screen name="services" />
      <Stack.Screen name="stripe" />
      <Stack.Screen name="pending" />
    </Stack>
  );
}
