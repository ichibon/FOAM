import { useEffect } from "react";
import { StyleSheet, Platform } from "react-native";
import { Tabs, Stack, router } from "expo-router";
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
  const { pendingApproval } = useAuth();

  // Redirect pending operators whenever pendingApproval changes or the
  // layout mounts, ensuring deep-links to any tab screen are blocked.
  useEffect(() => {
    if (pendingApproval) {
      router.replace("/operator/pending");
    }
  }, [pendingApproval]);

  // Pending operators: render a headerless Stack so /operator/pending can
  // display its own full-screen UI. The Tabs shell is never mounted, so
  // there is no tab bar they could tap to escape to other screens.
  if (pendingApproval) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="pending" />
      </Stack>
    );
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
        options={{
          title: "Team",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? "people" : "people-outline"} focused={focused} />
          ),
        }}
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
      <Tabs.Screen name="services" options={{ href: null }} />
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
