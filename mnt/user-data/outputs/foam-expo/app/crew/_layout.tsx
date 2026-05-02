import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography } from "@/constants/design";

export default function CrewLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.dark.bgElevated,
          borderTopColor: Colors.dark.borderSubtle,
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.foamBlue,
        tabBarInactiveTintColor: Colors.dark.textTertiary,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: Typography.size.caption,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="jobs"
        options={{
          title: "My Jobs",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
