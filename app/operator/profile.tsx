import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Layout } from "@/constants/design";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { LucideIcon } from "@/components/LucideIcon";

interface ProfileData {
  displayName: string;
  businessName: string;
  jobCount: number;
  rating: number | null;
  reviewCount: number;
}

function AvatarCircle({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (
    <View style={styles.avatarCircle}>
      <Text style={styles.avatarInitials}>{initials || "?"}</Text>
    </View>
  );
}

interface SettingsRowProps {
  iconName: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: React.ReactNode;
  onPress?: () => void;
}

function SettingsRow({ iconName, iconBg, iconColor, title, subtitle, onPress }: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress ?? (() => Alert.alert("Coming Soon", "This feature is on its way."))}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIconCircle, { backgroundColor: iconBg }]}>
        <LucideIcon name={iconName as any} size={20} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        {!!subtitle && (
          typeof subtitle === "string"
            ? <Text style={styles.rowSubtitle}>{subtitle}</Text>
            : subtitle
        )}
      </View>
      <LucideIcon name="ChevronRight" size={18} color={Colors.light.textTertiary} />
    </TouchableOpacity>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function SectionDivider() {
  return <View style={styles.sectionDivider} />;
}

export default function OperatorProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    displayName: "",
    businessName: "",
    jobCount: 0,
    rating: null,
    reviewCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const detailerIdRef = useRef<string | null>(null);

  useEffect(() => {
    void loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: dp } = await supabase
        .from("detailer_profiles")
        .select("id, display_name, business_name")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (dp?.id) detailerIdRef.current = dp.id;

      const displayName =
        dp?.display_name ||
        authUser.user_metadata?.full_name ||
        authUser.email?.split("@")[0] ||
        "Operator";
      const businessName = dp?.business_name || "";

      let jobCount = 0;
      let rating: number | null = null;
      let reviewCount = 0;

      if (dp?.id) {
        try {
          const { count } = await supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("detailer_id", dp.id)
            .eq("status", "completed");
          jobCount = count ?? 0;
        } catch { }

        try {
          const { data: reviews } = await supabase
            .from("reviews")
            .select("rating")
            .eq("detailer_id", dp.id);
          if (reviews && reviews.length > 0) {
            reviewCount = reviews.length;
            const sum = reviews.reduce((acc: number, r: { rating: number }) => acc + (r.rating ?? 0), 0);
            rating = Math.round((sum / reviewCount) * 10) / 10;
          }
        } catch { }
      }

      setProfile({ displayName, businessName, jobCount, rating, reviewCount });
    } catch (err) {
      console.warn("[OperatorProfile] loadProfile failed", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    if (Platform.OS !== "web") {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: () => void signOut() },
      ]);
    } else {
      await signOut();
    }
  }

  const displayName = loading ? "—" : profile.displayName;
  const businessName = loading ? "" : profile.businessName;
  const ratingLabel = loading
    ? "—"
    : profile.rating !== null
    ? `${profile.rating} ★`
    : "—";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Identity Header ── */}
        <View style={styles.identityCard}>
          <View style={styles.avatarWrapper}>
            <AvatarCircle name={displayName} />
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={() => Alert.alert("Coming Soon", "Photo upload is coming soon.")}
              activeOpacity={0.8}
            >
              <LucideIcon name="Camera" size={13} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.operatorName}>{displayName}</Text>
          {!!businessName && (
            <Text style={styles.businessName}>{businessName}</Text>
          )}

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <LucideIcon name="ShieldCheck" size={11} color="#15803D" />
              <Text style={styles.badgeText}>Verified</Text>
            </View>
            <View style={styles.badge}>
              <LucideIcon name="Building2" size={11} color="#15803D" />
              <Text style={styles.badgeText}>Licensed</Text>
            </View>
            <View style={styles.badge}>
              <LucideIcon name="Umbrella" size={11} color="#15803D" />
              <Text style={styles.badgeText}>Insured</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {loading ? "—" : String(profile.jobCount)}
              </Text>
              <Text style={styles.statLabel}>Jobs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{ratingLabel}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {loading ? "—" : String(profile.reviewCount)}
              </Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => Alert.alert("Coming Soon", "Profile preview is coming soon.")}
            activeOpacity={0.8}
          >
            <LucideIcon name="Eye" size={16} color={Colors.foamBlue} />
            <Text style={styles.previewButtonText}>Preview My Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => Alert.alert("Coming Soon", "Profile sharing is coming soon.")}
            activeOpacity={0.7}
          >
            <LucideIcon name="Share2" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.shareButtonText}>Share Profile Link</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.identityDivider} />

        {/* ── YOUR PROFILE ── */}
        <View style={styles.section}>
          <SectionLabel label="YOUR PROFILE" />
          <View style={styles.rowGroup}>
            <SettingsRow
              iconName="UserCircle"
              iconBg="rgba(51,157,199,0.12)"
              iconColor={Colors.foamBlue}
              title="Public Profile"
              subtitle="Photo, bio, portfolio photos"
            />
            <SettingsRow
              iconName="MapPin"
              iconBg="rgba(51,157,199,0.12)"
              iconColor={Colors.foamBlue}
              title="Service Area"
              subtitle="Set your coverage radius"
            />
            <SettingsRow
              iconName="Store"
              iconBg="rgba(51,157,199,0.12)"
              iconColor={Colors.foamBlue}
              title="Location & Hours"
              subtitle="Shop address, bays, open days"
            />
            <SettingsRow
              iconName="CalendarDays"
              iconBg="rgba(51,157,199,0.12)"
              iconColor={Colors.foamBlue}
              title="Availability"
              subtitle="Weekly schedule and blocked days"
            />
            <SettingsRow
              iconName="List"
              iconBg="rgba(51,157,199,0.12)"
              iconColor={Colors.foamBlue}
              title="Service Menu"
              subtitle="Services and add-ons"
            />
          </View>
          <SectionDivider />
        </View>

        {/* ── ACCOUNT ── */}
        <View style={styles.section}>
          <SectionLabel label="ACCOUNT" />
          <View style={styles.rowGroup}>
            <SettingsRow
              iconName="Landmark"
              iconBg="rgba(51,157,199,0.12)"
              iconColor={Colors.foamBlue}
              title="Bank & Payout"
              subtitle={
                <View style={styles.payoutRow}>
                  <View style={styles.payoutDot} />
                  <Text style={styles.rowSubtitle}>Payouts via Stripe Connect</Text>
                </View>
              }
            />
            <SettingsRow
              iconName="Crown"
              iconBg="rgba(51,157,199,0.12)"
              iconColor={Colors.foamBlue}
              title="Subscription"
              subtitle={
                <View style={styles.subscriptionRow}>
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>Pro</Text>
                  </View>
                  <Text style={styles.rowSubtitle}> · $69/mo</Text>
                </View>
              }
            />
            <SettingsRow
              iconName="Bell"
              iconBg="rgba(51,157,199,0.12)"
              iconColor={Colors.foamBlue}
              title="Notifications"
              subtitle="Push and SMS preferences"
            />
            <SettingsRow
              iconName="Settings"
              iconBg="rgba(51,157,199,0.12)"
              iconColor={Colors.foamBlue}
              title="Account Settings"
              subtitle="Name, email, phone, password"
            />
          </View>
          <SectionDivider />
        </View>

        {/* ── SUPPORT ── */}
        <View style={styles.section}>
          <SectionLabel label="SUPPORT" />
          <View style={styles.rowGroup}>
            <SettingsRow
              iconName="HelpCircle"
              iconBg="rgba(82,82,82,0.08)"
              iconColor={Colors.light.textSecondary}
              title="Help Center"
            />
            <SettingsRow
              iconName="MessageCircle"
              iconBg="rgba(82,82,82,0.08)"
              iconColor={Colors.light.textSecondary}
              title="Contact FOAM"
            />
            <SettingsRow
              iconName="Star"
              iconBg="rgba(82,82,82,0.08)"
              iconColor={Colors.light.textSecondary}
              title="Rate the App"
            />
          </View>
          <SectionDivider />
        </View>

        {/* ── Sign Out ── */}
        <View style={styles.signOutSection}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>FOAM v1.0.0 · Made in Atlanta</Text>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const BLUE_ICON_BG = "rgba(51,157,199,0.12)";
const SUCCESS_GREEN = "#15803D";
const SUCCESS_BG = "rgba(22,163,74,0.10)";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.bgPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Layout.bottomNavHeight + Spacing.lg,
  },

  // ── Identity card ──
  identityCard: {
    backgroundColor: Colors.light.surface,
    alignItems: "center",
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.mdLg,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: Spacing.sm,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BLUE_ICON_BG,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.h3,
    color: Colors.foamBlue,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },

  operatorName: {
    fontFamily: Typography.display,
    fontSize: 22,
    color: Colors.light.textPrimary,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  businessName: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.mdSm,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: SUCCESS_BG,
  },
  badgeText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: SUCCESS_GREEN,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.mdLg,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 18,
    color: Colors.light.textPrimary,
  },
  statLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.light.borderSubtle,
  },

  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    width: "100%",
    height: 44,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.foamBlue,
    backgroundColor: Colors.light.surface,
    marginTop: Spacing.md,
  },
  previewButtonText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    width: "100%",
    height: 44,
    marginTop: Spacing.xs,
  },
  shareButtonText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
  },

  identityDivider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
  },

  // ── Sections ──
  section: {
    marginTop: Spacing.md,
  },
  sectionLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: Spacing.mdLg,
    marginBottom: 0,
  },
  rowGroup: {
    backgroundColor: Colors.light.surface,
    marginTop: Spacing.xs,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
    marginTop: Spacing.md,
  },

  // ── Row ──
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm + Spacing.xs,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  rowIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  rowSubtitle: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
    marginTop: 1,
  },

  // ── Bank & Payout row ──
  payoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 1,
  },
  payoutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.successLight,
    flexShrink: 0,
  },

  // ── Subscription row ──
  subscriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 1,
  },
  planBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    backgroundColor: "rgba(37,99,235,0.10)",
  },
  planBadgeText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 10,
    color: "#1D4ED8",
  },

  // ── Sign Out ──
  signOutSection: {
    paddingHorizontal: Spacing.mdLg,
    paddingTop: Spacing.mdLg,
  },
  signOutButton: {
    width: "100%",
    height: 44,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.errorLight,
  },
  versionText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});
