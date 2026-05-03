/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/_sitemap` | `/auth` | `/auth/login` | `/auth/role-select` | `/auth/signup` | `/auth/welcome` | `/crew` | `/crew/jobs` | `/customer` | `/customer/discover` | `/detailer` | `/detailer/today`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
