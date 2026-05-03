import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius } from "@/constants/design";
import { supabase } from "@/lib/supabase";
import { UserRole } from "@/types/database";

const roles: { role: UserRole; title: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  {
    role: "customer",
    title: "I need my car detailed",
    description: "Find and book the best mobile detailers near you.",
    icon: "car-outline",
  },
  {
    role: "detailer",
    title: "I run a detailing business",
    description: "Manage your bookings, customers, crew, and payments.",
    icon: "sparkles-outline",
  },
  {
    role: "crew",
    title: "I'm part of a crew",
    description: "See your assigned jobs and track your earnings.",
    icon: "people-outline",
  },
];

export default function RoleSelectScreen() {
  async function handleRoleSelect(role: UserRole) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("users")
      .update({ role })
      .eq("id", user.id);

    if (role === "customer") {
      await supabase
        .from("customer_profiles")
        .insert({ user_id: user.id });
      router.replace("/customer/discover");
    } else if (role === "detailer") {
      await supabase
        .from("detailer_profiles")
        .insert({ user_id: user.id });
      router.replace("/detailer/today");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>What brings you here?</Text>
      <Text style={styles.subheading}>
        Pick your role. You can always change it later.
      </Text>

      <View style={styles.rolesContainer}>
        {roles.map((item) => (
          <TouchableOpacity
            key={item.role}
            style={styles.roleCard}
            onPress={() => handleRoleSelect(item.role)}
            activeOpacity={0.8}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name={item.icon} size={26} color={Colors.foamBlue} />
            </View>
            <View style={styles.roleText}>
              <Text style={styles.roleTitle}>{item.title}</Text>
              <Text style={styles.roleDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.dark.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.foamDarkTeal,
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "web" ? 67 + Spacing.xl2 : Spacing.xl2,
  },
  heading: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: Typography.size.h1,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.sm,
  },
  subheading: {
    fontFamily: "Inter_400Regular",
    fontSize: Typography.size.bodyM,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xl,
  },
  rolesContainer: {
    gap: Spacing.sm,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  roleCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.borderSubtle,
  },
  roleText: {
    flex: 1,
  },
  roleTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: Typography.size.bodyL,
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  roleDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: Typography.size.bodyS,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
});
