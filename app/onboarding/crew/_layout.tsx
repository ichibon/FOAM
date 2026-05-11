import { Stack } from "expo-router";

export default function CrewOnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="invite" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="pending" />
    </Stack>
  );
}
