import { Redirect } from "expo-router";

/**
 * Development QA gallery — PRODUCTION STUB
 *
 * The actual component gallery lives in dev/DevQA.tsx (outside the app/
 * routing tree). This file exists only because Expo Router cannot exclude
 * individual files from routing without build-time configuration changes.
 *
 * Behaviour:
 *   - Any navigation to /dev-qa immediately redirects to /auth/welcome.
 *   - The QA gallery is never rendered in production.
 *   - Delete this file (or replace with a proper route) if /dev-qa is ever
 *     needed for a real feature.
 *
 * To use during development:
 *   import DevQA from '@/dev/DevQA';  // render directly inside any screen
 */
export default function DevQARedirect() {
  return <Redirect href="/auth/welcome" />;
}
