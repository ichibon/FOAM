import { Redirect } from "expo-router";

/**
 * The development QA screen lives outside the app routing tree.
 * See dev/DevQA.tsx for the full component gallery used during development.
 * This stub redirects to home to prevent accidental production access.
 */
export default function DevQARedirect() {
  return <Redirect href="/auth/welcome" />;
}
