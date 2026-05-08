import { Stack } from "expo-router";

export default function TeamMemberLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="jobs" />
    </Stack>
  );
}
