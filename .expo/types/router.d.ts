/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/_sitemap` | `/auth` | `/auth/login` | `/auth/role-select` | `/auth/signup` | `/auth/welcome` | `/customer` | `/customer/booking/payment` | `/customer/discover` | `/dev-qa` | `/operator` | `/operator/onboarding/stripe-connect` | `/operator/today` | `/team_member` | `/team_member/jobs`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
