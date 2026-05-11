import { useEffect } from "react";
import { router } from "expo-router";

export default function OperatorOnboardingPendingRedirect() {
  useEffect(() => {
    router.replace("/operator/pending");
  }, []);
  return null;
}
