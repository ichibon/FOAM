/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/_sitemap` | `/auth` | `/auth/callback` | `/auth/login` | `/auth/role-select` | `/auth/signup` | `/auth/welcome` | `/customer` | `/customer/booking/payment` | `/customer/discover` | `/dev-qa` | `/onboarding` | `/onboarding/crew` | `/onboarding/crew/invite` | `/onboarding/crew/pending` | `/onboarding/crew/profile` | `/onboarding/customer` | `/onboarding/customer/complete` | `/onboarding/customer/location` | `/onboarding/customer/payment` | `/onboarding/customer/vehicle` | `/onboarding/operator` | `/onboarding/operator/build` | `/onboarding/operator/pending` | `/onboarding/operator/services` | `/onboarding/operator/stripe` | `/onboarding/operator/type` | `/onboarding/splash` | `/operator` | `/operator/onboarding/stripe-connect` | `/operator/pending` | `/operator/today` | `/team_member` | `/team_member/jobs` | `/team_member/pending`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
