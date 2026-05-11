import { useEffect } from "react";
import { router } from "expo-router";

export default function CrewOnboardingPendingRedirect() {
  useEffect(() => {
    router.replace("/team_member/pending");
  }, []);
  return null;
}
