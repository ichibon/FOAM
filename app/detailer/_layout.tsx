import { Stack } from "expo-router";

export default function DetailerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="today" />
    </Stack>
  );
}
