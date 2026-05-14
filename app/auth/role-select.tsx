import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import type { UserRole } from "@/lib/supabase";
import { LucideIcon } from "@/components/LucideIcon";

type LucideIconName = "Car" | "Briefcase" | "Users";

const roles: {
  role: UserRole;
  title: string;
  description: string;
  icon: LucideIconName;
}[] = [
  {
    role: "customer",
    title: "I need my car cleaned",
    description: "Find detailers, book, and pay.",
    icon: "Car",
  },
  {
    role: "operator",
    title: "I operate a business",
    description: "Manage bookings, crew, and payments.",
    icon: "Briefcase",
  },
  {
    role: "team_member",
    title: "I'm part of a team",
    description: "See your jobs and track your earnings.",
    icon: "Users",
  },
];

export default function RoleSelectScreen() {
  function handleRoleSelect(role: UserRole) {
    router.push(`/auth/signup?role=${role}`);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.heading}>What brings you here?</Text>
          <Text style={styles.subheading}>
            We'll build your experience around your answer.
          </Text>
        </View>

        <View style={styles.cards}>
          {roles.map((item) => (
            <TouchableOpacity
              key={item.role}
              style={styles.roleCard}
              onPress={() => handleRoleSelect(item.role)}
              activeOpacity={0.85}
            >
              <View style={styles.iconCircle}>
                <LucideIcon name={item.icon} size={28} color={Colors.foamBlue} />
              </View>

              <View style={styles.roleText}>
                <Text style={styles.roleTitle}>{item.title}</Text>
                <Text style={styles.roleDescription}>{item.description}</Text>
              </View>

              <LucideIcon
                name="ChevronRight"
                size={20}
                color={Colors.light.textTertiary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    ...Shadows.light.level1,
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
  roleDescription: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
});
