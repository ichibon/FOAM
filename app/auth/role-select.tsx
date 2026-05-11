import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { supabase, UserRole } from "@/lib/supabase";
import { LucideIcon } from "@/components/LucideIcon";

type LucideIconName = "Car" | "Briefcase" | "Users";

const roles: {
  role: UserRole;
  title: string;
  description: string;
  icon: LucideIconName;
  featured?: boolean;
}[] = [
  {
    role: "customer",
    title: "Book a detail",
    description: "Find detailers, book, and pay.",
    icon: "Car",
  },
  {
    role: "operator",
    title: "Grow my business",
    description: "Manage bookings, crew, and payments.",
    icon: "Briefcase",
    featured: true,
  },
  {
    role: "team_member",
    title: "Join a crew",
    description: "See your jobs and track your earnings.",
    icon: "Users",
  },
];

export default function RoleSelectScreen() {
  const [loading, setLoading] = useState(false);

  async function handleRoleSelect(role: UserRole) {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    await supabase.from("users").update({ role }).eq("id", user.id);

    if (role === "customer") {
      await supabase.from("customer_profiles").insert({ user_id: user.id });
      router.replace("/onboarding/customer/vehicle");
    } else if (role === "operator") {
      await supabase.from("detailer_profiles").insert({ user_id: user.id });
      router.replace("/onboarding/operator/type");
    } else if (role === "team_member") {
      router.replace("/onboarding/crew/invite");
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.heading}>What brings you here?</Text>
          <Text style={styles.subheading}>We'll build your experience around your answer.</Text>
        </View>

        <View style={styles.cards}>
          {roles.map((item) => (
            <TouchableOpacity
              key={item.role}
              style={[styles.roleCard, item.featured && styles.roleCardFeatured]}
              onPress={() => handleRoleSelect(item.role)}
              disabled={loading}
              activeOpacity={0.85}
            >
              {item.featured && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Most popular</Text>
                </View>
              )}

              <View style={styles.iconCircle}>
                <LucideIcon name={item.icon} size={28} color={Colors.foamBlue} />
              </View>

              <View style={styles.roleText}>
                <Text style={[styles.roleTitle, item.featured && styles.roleTitleFeatured]}>
                  {item.title}
                </Text>
                <Text style={styles.roleDescription}>{item.description}</Text>
              </View>

              <LucideIcon name="ChevronRight" size={20} color={Colors.light.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footnote}>Not sure? You can always change this later.</Text>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.foamBlue} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.bgPrimary,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: 64,
    paddingBottom: 40,
  },
  headerBlock: {
    marginBottom: Spacing.xl,
  },
  heading: {
    fontFamily: Typography.display,
    fontSize: 28,
    color: Colors.light.textPrimary,
    lineHeight: 34,
    marginBottom: Spacing.sm,
  },
  subheading: {
    fontFamily: Typography.body,
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 21,
  },
  cards: {
    gap: Spacing.sm,
    flex: 1,
  },
  roleCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    position: "relative",
    ...Shadows.light.level1,
  },
  roleCardFeatured: {
    borderWidth: 2,
    borderColor: Colors.foamBlue,
    ...Shadows.light.level2,
  },
  badge: {
    position: "absolute",
    top: -10,
    right: 16,
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(51,157,199,0.2)",
  },
  badgeText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.foamBlue,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  roleText: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  roleTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 17,
    color: Colors.light.textPrimary,
    marginBottom: 2,
  },
  roleTitleFeatured: {
    color: Colors.light.textPrimary,
  },
  roleDescription: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  footnote: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
    textAlign: "center",
    marginTop: Spacing.xl,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(250,250,250,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
});
