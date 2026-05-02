import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius } from "@/constants/design";
import { supabase } from "@/lib/supabase";
import { UserRole } from "@/types/database";

const roles = [
  {
    role: "customer" as UserRole,
    title: "I need my car detailed",
    description: "Find and book the best mobile detailers near you.",
    emoji: "🚗",
  },
  {
    role: "detailer" as UserRole,
    title: "I run a detailing business",
    description: "Manage your bookings, customers, crew, and payments.",
    emoji: "✨",
  },
  {
    role: "crew" as UserRole,
    title: "I'm part of a crew",
    description: "See your assigned jobs and track your earnings.",
    emoji: "🤝",
  },
];

export default function RoleSelectScreen() {
  async function handleRoleSelect(role: UserRole) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update user role in database
    await supabase
      .from("users")
      .update({ role })
      .eq("id", user.id);

    // Create appropriate profile
    if (role === "customer") {
      await supabase
        .from("customer_profiles")
        .insert({ user_id: user.id });
      router.replace("/customer/onboarding");
    } else if (role === "detailer") {
      await supabase
        .from("detailer_profiles")
        .insert({ user_id: user.id });
      router.replace("/detailer/onboarding");
    }
    // Crew accounts are created by detailer owners
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
            <Text style={styles.roleEmoji}>{item.emoji}</Text>
            <View style={styles.roleText}>
              <Text style={styles.roleTitle}>{item.title}</Text>
              <Text style={styles.roleDescription}>{item.description}</Text>
            </View>
            <Text style={styles.roleChevron}>›</Text>
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
    paddingTop: Spacing.xl2,
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
  roleCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.borderSubtle,
  },
  roleEmoji: {
    fontSize: 28,
    marginRight: Spacing.md,
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
  roleChevron: {
    fontFamily: "Inter_400Regular",
    fontSize: 24,
    color: Colors.foamBlue,
    marginLeft: Spacing.sm,
  },
});
