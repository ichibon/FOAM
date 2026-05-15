import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerModal } from "@/components/DrawerModal";
import { DrawerHeader } from "@/components/DrawerHeader";
import { DrawerFooter } from "@/components/DrawerFooter";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComplaintDetail {
  id: string;
  status: string;
  scheduledAt: string;
  customerName: string;
  customerPhone?: string;
  vehicleDesc: string;
  packageName: string;
  crewName?: string;
  reviewRating?: number;
  reviewBody?: string;
  reviewCreatedAt?: string;
  photos: Array<{ url: string; type: "before" | "after" | "damage" }>;
}

export interface ComplaintReviewDrawerProps {
  visible: boolean;
  onRequestClose: () => void;
  bookingId?: string | null;
  onResolved?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  }) + " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= rating ? "star" : "star-outline"}
          size={16}
          color={rating <= 2 ? Colors.errorLight : rating <= 3 ? Colors.warningLight : Colors.successLight}
        />
      ))}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ComplaintReviewDrawer({
  visible,
  onRequestClose,
  bookingId,
  onResolved,
}: ComplaintReviewDrawerProps) {
  const [detail, setDetail] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoTab, setPhotoTab] = useState<"before" | "after">("before");
  const [resolving, setResolving] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();

      // Booking + joins
      const { data: booking } = await supabase
        .from("bookings")
        .select(
          "id, status, scheduled_at, crew_member_id," +
          "users!bookings_customer_id_fkey(full_name, phone)," +
          "vehicles(make, model, year, color)," +
          "service_packages(name)"
        )
        .eq("id", bookingId)
        .single();

      if (!booking) { setLoading(false); return; }

      const b = booking as unknown as {
        id: string;
        status: string;
        scheduled_at: string;
        crew_member_id: string | null;
        users: { full_name: string | null; phone: string | null } | null;
        vehicles: { make: string | null; model: string | null; year: number | null; color: string | null } | null;
        service_packages: { name: string } | null;
      };

      // Crew name if assigned
      let crewName: string | undefined;
      if (b.crew_member_id) {
        const { data: member } = await supabase
          .from("team_members")
          .select("user_id")
          .eq("id", b.crew_member_id)
          .single();
        if (member) {
          const { data: crewUser } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", (member as { user_id: string }).user_id)
            .single();
          crewName = (crewUser as { full_name: string | null } | null)?.full_name ?? undefined;
        }
      }

      // Review
      const { data: review } = await supabase
        .from("reviews")
        .select("rating, body, created_at")
        .eq("booking_id", bookingId)
        .single();

      // Photos
      const { data: photoRows } = await supabase
        .from("booking_photos")
        .select("photo_url, photo_type")
        .eq("booking_id", bookingId);

      const veh = b.vehicles;
      const vehicleDesc = veh
        ? [veh.year, veh.make, veh.model, veh.color].filter(Boolean).join(" ")
        : "Vehicle";

      const typedReview = review as { rating: number; body: string | null; created_at: string } | null;
      const typedPhotos = (photoRows as Array<{ photo_url: string; photo_type: string }> | null) ?? [];

      setDetail({
        id: b.id,
        status: b.status,
        scheduledAt: b.scheduled_at,
        customerName: b.users?.full_name ?? "Customer",
        customerPhone: b.users?.phone ?? undefined,
        vehicleDesc,
        packageName: b.service_packages?.name ?? "Service",
        crewName,
        reviewRating: typedReview?.rating,
        reviewBody: typedReview?.body ?? undefined,
        reviewCreatedAt: typedReview?.created_at,
        photos: typedPhotos.map((p) => ({
          url: p.photo_url,
          type: p.photo_type as "before" | "after" | "damage",
        })),
      });
    } catch (err) {
      console.warn("[ComplaintReview] fetchDetail error", err);
    }
    setLoading(false);
  }, [bookingId]);

  useEffect(() => {
    if (visible && bookingId) {
      fetchDetail();
    } else {
      setDetail(null);
      setPhotoTab("before");
    }
  }, [visible, bookingId, fetchDetail]);

  async function handleMarkResolved() {
    if (!bookingId) return;
    setResolving(true);
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();
      await supabase
        .from("bookings")
        .update({ notes: "[Complaint resolved by operator]" })
        .eq("id", bookingId);
      onResolved?.();
      onRequestClose();
    } catch (err) {
      console.warn("[ComplaintReview] markResolved error", err);
    }
    setResolving(false);
  }

  function handleCallCustomer() {
    if (detail?.customerPhone) {
      Linking.openURL(`tel:${detail.customerPhone}`);
    }
  }

  const beforePhotos = detail?.photos.filter((p) => p.type === "before") ?? [];
  const afterPhotos = detail?.photos.filter((p) => p.type === "after") ?? [];
  const visiblePhotos = photoTab === "before" ? beforePhotos : afterPhotos;

  const ratingColor =
    !detail?.reviewRating
      ? Colors.light.textTertiary
      : detail.reviewRating <= 2
      ? Colors.errorLight
      : detail.reviewRating <= 3
      ? Colors.warningLight
      : Colors.successLight;

  return (
    <DrawerModal visible={visible} onRequestClose={onRequestClose}>
      <DrawerHeader title="Complaint Review" onClose={onRequestClose} />

      {loading || !detail ? (
        <View style={styles.loadingBox}>
          {loading ? (
            <ActivityIndicator color={Colors.foamBlue} />
          ) : (
            <>
              <Ionicons name="alert-circle-outline" size={40} color={Colors.light.textDisabled} />
              <Text style={styles.emptyText}>No booking selected</Text>
            </>
          )}
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Booking summary */}
            <View style={styles.card}>
              <Text style={styles.customerName}>{detail.customerName}</Text>
              <Text style={styles.metaLine}>{detail.vehicleDesc}</Text>
              <Text style={styles.metaLine}>
                {detail.packageName} · {formatDate(detail.scheduledAt)}
              </Text>
              {detail.crewName && (
                <Text style={styles.metaLineSecondary}>Completed by {detail.crewName}</Text>
              )}
              {detail.reviewRating != null && (
                <View style={styles.ratingRow}>
                  <StarRating rating={detail.reviewRating} />
                  <View
                    style={[
                      styles.ratingBadge,
                      {
                        backgroundColor:
                          detail.reviewRating <= 2
                            ? "rgba(220,38,38,0.08)"
                            : "rgba(217,119,6,0.08)",
                      },
                    ]}
                  >
                    <Text style={[styles.ratingBadgeText, { color: ratingColor }]}>
                      {detail.reviewRating} star{detail.reviewRating !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Customer complaint */}
            {detail.reviewBody ? (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Customer Complaint</Text>
                <View
                  style={[
                    styles.complaintBox,
                    {
                      backgroundColor:
                        (detail.reviewRating ?? 5) <= 2
                          ? "rgba(220,38,38,0.06)"
                          : "rgba(217,119,6,0.06)",
                    },
                  ]}
                >
                  <Text style={styles.complaintText}>"{detail.reviewBody}"</Text>
                </View>
                {detail.reviewCreatedAt && (
                  <Text style={styles.submittedAt}>
                    Submitted {formatDate(detail.reviewCreatedAt)}
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Status</Text>
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      detail.status === "no_show"
                        ? styles.statusError
                        : styles.statusWarning,
                    ]}
                  >
                    <Ionicons
                      name={detail.status === "no_show" ? "warning" : "time-outline"}
                      size={13}
                      color={detail.status === "no_show" ? Colors.errorLight : Colors.warningLight}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            detail.status === "no_show"
                              ? Colors.errorLight
                              : Colors.warningLight,
                        },
                      ]}
                    >
                      {detail.status === "no_show"
                        ? "Customer no-show"
                        : "Awaiting confirmation"}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Job photos */}
            {detail.photos.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Job Photos</Text>
                {/* Tab toggle */}
                <View style={styles.photoTabRow}>
                  {(["before", "after"] as const).map((tab) => (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.photoTab, photoTab === tab && styles.photoTabActive]}
                      onPress={() => setPhotoTab(tab)}
                    >
                      <Text
                        style={[
                          styles.photoTabText,
                          photoTab === tab && styles.photoTabTextActive,
                        ]}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {visiblePhotos.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.photoRow}
                  >
                    {visiblePhotos.map((p, idx) => (
                      <View key={idx} style={styles.photoThumb} />
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.noPhotosText}>
                    No {photoTab} photos uploaded.
                  </Text>
                )}
              </View>
            )}

            {/* Resolution */}
            <View style={styles.card}>
              <Text style={styles.resolveTitle}>Resolve This Complaint</Text>
              <View style={styles.actionStack}>
                {/* Accept — Issue Refund */}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnPrimary]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color={Colors.white} />
                  <Text style={styles.actionBtnTextPrimary}>Accept — Issue Refund</Text>
                </TouchableOpacity>

                {/* Accept — Schedule Re-Do */}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnOutline]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={16} color={Colors.foamBlue} />
                  <Text style={[styles.actionBtnTextOutline, { color: Colors.foamBlue }]}>
                    Accept — Schedule Re-Do
                  </Text>
                </TouchableOpacity>

                {/* Dispute */}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnWarning]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="shield-outline" size={16} color={Colors.warningLight} />
                  <Text style={[styles.actionBtnTextOutline, { color: Colors.warningLight }]}>
                    Dispute Complaint
                  </Text>
                </TouchableOpacity>

                {/* Contact */}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnContact]}
                  activeOpacity={0.8}
                  onPress={handleCallCustomer}
                  disabled={!detail.customerPhone}
                >
                  <Ionicons name="call-outline" size={16} color={Colors.light.textSecondary} />
                  <Text style={[styles.actionBtnTextOutline, { color: Colors.light.textSecondary }]}>
                    Contact {detail.customerName.split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <DrawerFooter>
            <TouchableOpacity
              style={[styles.resolveBtn, resolving && { opacity: 0.6 }]}
              onPress={handleMarkResolved}
              disabled={resolving}
              activeOpacity={0.85}
            >
              {resolving ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
                  <Text style={styles.resolveBtnText}>Mark as Resolved</Text>
                </>
              )}
            </TouchableOpacity>
          </DrawerFooter>
        </>
      )}
    </DrawerModal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontFamily: Typography.body,
    fontSize: 15,
    color: Colors.light.textTertiary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    gap: 14,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }
      : Shadows.light.level1),
  },
  customerName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 17,
    color: Colors.light.textPrimary,
  },
  metaLine: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  metaLineSecondary: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textTertiary,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  starRow: { flexDirection: "row", gap: 2 },
  ratingBadge: {
    borderRadius: Radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingBadgeText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 12,
  },
  sectionLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: 11,
    color: Colors.errorLight,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  complaintBox: {
    borderRadius: Radius.sm,
    padding: 12,
  },
  complaintText: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontStyle: "italic",
    lineHeight: 20,
  },
  submittedAt: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.light.textTertiary,
  },
  statusRow: { flexDirection: "row" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  statusError: { backgroundColor: "rgba(220,38,38,0.08)" },
  statusWarning: { backgroundColor: "rgba(217,119,6,0.08)" },
  statusText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
  },
  photoTabRow: {
    flexDirection: "row",
    backgroundColor: Colors.light.bgSecondary,
    borderRadius: Radius.sm,
    padding: 3,
    gap: 2,
    marginTop: 2,
  },
  photoTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: Radius.xs,
    alignItems: "center",
  },
  photoTabActive: {
    backgroundColor: Colors.light.surface,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 1px 3px rgba(0,0,0,0.10)" }
      : Shadows.light.level1),
  },
  photoTabText: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  photoTabTextActive: { color: Colors.light.textPrimary },
  photoRow: { gap: 10, paddingTop: 8 },
  photoThumb: {
    width: 110,
    height: 148,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
  },
  noPhotosText: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textTertiary,
    paddingTop: 6,
  },
  resolveTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.light.textPrimary,
    marginBottom: 4,
  },
  actionStack: { gap: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: Radius.sm,
  },
  actionBtnPrimary: { backgroundColor: Colors.foamBlue },
  actionBtnWarning: {
    borderWidth: 1,
    borderColor: Colors.warningLight,
  },
  actionBtnOutline: {
    borderWidth: 1,
    borderColor: Colors.foamBlue,
  },
  actionBtnContact: {
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
  },
  actionBtnTextPrimary: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Colors.white,
  },
  actionBtnTextOutline: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
  },
  resolveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.successLight,
  },
  resolveBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Colors.white,
  },
});
