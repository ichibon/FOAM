import { useEffect, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Layout } from "@/constants/design";

function TabBarIcon({
  name,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  focused: boolean;
}) {
  return (
    <Ionicons
      name={name}
      size={22}
      color={focused ? Colors.foamBlue : Colors.light.textTertiary}
    />
  );
}

export default function OperatorLayout() {
  const { user, pendingApproval } = useAuth();
  const [hasTeam, setHasTeam] = useState(false);

  // Redirect on every render cycle when pending — not just on change —
  // so a pending operator who deep-links or taps a tab cannot bypass lockout.
  useEffect(() => {
    if (pendingApproval) {
      router.replace("/operator/pending");
    }
  }, [pendingApproval]);

  useEffect(() => {
    if (!user) return;
    fetchHasTeam();
  }, [user]);

  async function fetchHasTeam() {
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();
      const { data } = await supabase
        .from("detailer_profiles")
        .select("has_team")
        .eq("user_id", user!.id)
        .single();
      if (data) setHasTeam(data.has_team === true);
    } catch {
      setHasTeam(false);
    }
  }

  // Hard render-gate: if the operator's approval is pending, never mount
  // the tab shell. The useEffect above fires the redirect concurrently,
  // but this guard ensures the tab bar and its screens are never visible
  // even for a single frame.
  if (pendingApproval) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.foamBlue,
        tabBarInactiveTintColor: Colors.light.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? "calendar" : "calendar-outline"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={
          hasTeam
            ? {
                title: "Team",
                tabBarIcon: ({ focused }) => (
                  <TabBarIcon name={focused ? "people" : "people-outline"} focused={focused} />
                ),
              }
            : { href: null }
        }
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              name={focused ? "clipboard" : "clipboard-outline"}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="business"
        options={{
          title: "Business",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              name={focused ? "bar-chart" : "bar-chart-outline"}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              name={focused ? "person-circle" : "person-circle-outline"}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen name="alerts" options={{ href: null }} />
      <Tabs.Screen name="pending" options={{ href: null }} />
      <Tabs.Screen name="locations-vans" options={{ href: null }} />
      <Tabs.Screen name="onboarding/stripe-connect" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.light.surface,
    borderTopColor: Colors.light.borderSubtle,
    borderTopWidth: 1,
    height: Layout.bottomNavHeight,
    paddingBottom: Platform.OS === "ios" ? 24 : 10,
    paddingTop: 8,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 -4px 6px -1px rgba(0,0,0,0.05)" }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 8,
        }),
  },
  tabLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    marginTop: 2,
  },
});
