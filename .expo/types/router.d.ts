/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/_sitemap` | `/auth` | `/auth/callback` | `/auth/login` | `/auth/role-select` | `/auth/signup` | `/auth/welcome` | `/customer` | `/customer/booking/payment` | `/customer/discover` | `/dev-qa` | `/onboarding` | `/onboarding/crew` | `/onboarding/crew/invite` | `/onboarding/crew/pending` | `/onboarding/crew/profile` | `/onboarding/customer` | `/onboarding/customer/complete` | `/onboarding/customer/location` | `/onboarding/customer/payment` | `/onboarding/customer/vehicle` | `/onboarding/operator` | `/onboarding/operator/add-team-member` | `/onboarding/operator/assign-crew` | `/onboarding/operator/build` | `/onboarding/operator/pending` | `/onboarding/operator/services` | `/onboarding/operator/stripe` | `/onboarding/splash` | `/operator` | `/operator/alerts` | `/operator/bookings` | `/operator/bookings/` | `/operator/bookings/assign` | `/operator/bookings/crew-assignment` | `/operator/bookings/new` | `/operator/bookings/unassigned` | `/operator/business` | `/operator/business/` | `/operator/business/commission` | `/operator/business/payroll` | `/operator/locations-vans` | `/operator/onboarding/stripe-connect` | `/operator/pending` | `/operator/profile` | `/operator/team` | `/operator/today` | `/team_member` | `/team_member/jobs` | `/team_member/pending`;
      DynamicRoutes: `/operator/bookings/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/operator/bookings/[id]`;
    }
  }
}
