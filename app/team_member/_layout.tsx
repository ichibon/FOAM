import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

export default function TeamMemberLayout() {
  const { pendingApproval } = useAuth();

  useEffect(() => {
    if (pendingApproval) {
      router.replace("/team_member/pending");
    }
  }, [pendingApproval]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="jobs" />
      <Stack.Screen name="pending" />
    </Stack>
  );
}
