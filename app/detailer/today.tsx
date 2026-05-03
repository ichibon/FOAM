import { View, Text, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing } from "@/constants/design";

export default function DetailerTodayScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, Platform.OS === "web" && { paddingTop: 67 }]}>
        <Text style={styles.logoText}>foam</Text>
        <Text style={styles.screenTitle}>Today</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.placeholder}>Your daily job schedule — coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.foamDarkTeal,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.borderSubtle,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoText: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 24,
    color: Colors.foamBlue,
    letterSpacing: -0.5,
  },
  screenTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: Typography.size.bodyM,
    color: Colors.dark.textSecondary,
    letterSpacing: Typography.tracking.label,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  placeholder: {
    fontFamily: "Inter_400Regular",
    fontSize: Typography.size.bodyM,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
});
