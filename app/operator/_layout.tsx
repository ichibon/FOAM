import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

export default function OperatorLayout() {
  const { pendingApproval } = useAuth();

  useEffect(() => {
    if (pendingApproval) {
      router.replace("/operator/pending");
    }
  }, [pendingApproval]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="today" />
      <Stack.Screen name="pending" />
    </Stack>
  );
}
