import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";

// ─── Raw DB row types ─────────────────────────────────────────────────────────

interface RawServicePackage {
  id: string;
  name: string;
  base_price: number;
  duration_mins: number;
  description: string | null;
}

interface RawCustomerRow {
  customer_id: string;
  users: { id: string; full_name: string | null; phone: string | null } | null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServicePackageOption {
  id: string;
  name: string;
  price: number;
  durationMins: number;
  description: string | null;
}

interface CustomerOption {
  userId: string;
  name: string;
  phone: string | null;
}

type SubmitState = "idle" | "saving" | "success" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildScheduledAt(dateStr: string, timeStr: string): string | null {
  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!dateMatch || !timeMatch) return null;

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const ampm = timeMatch[3]?.toUpperCase();
  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  const d = new Date(
    parseInt(dateMatch[1], 10),
    parseInt(dateMatch[2], 10) - 1,
    parseInt(dateMatch[3], 10),
    hours,
    minutes
  );
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function InputField({
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad" | "numeric";
}) {
  return (
    <TextInput
      style={styles.textInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.light.textTertiary}
      keyboardType={keyboardType ?? "default"}
      autoCapitalize="none"
    />
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NewBookingScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [detailerId, setDetailerId] = useState<string | null>(null);
  const [packages, setPackages] = useState<ServicePackageOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerOption[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form state
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState(todayString());
  const [bookingTime, setBookingTime] = useState("09:00 AM");
  const [serviceAddress, setServiceAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCustomerList, setShowCustomerList] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoadingData(true);
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();

      const { data: profileData } = await supabase
        .from("detailer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profileData) return;
      const dId: string = (profileData as { id: string }).id;
      setDetailerId(dId);

      const [pkgRes, custRes] = await Promise.all([
        supabase
          .from("service_packages")
          .select("id,name,base_price,duration_mins,description")
          .eq("detailer_id", dId)
          .eq("is_active", true)
          .order("display_order"),
        supabase
          .from("bookings")
          .select("customer_id, users!bookings_customer_id_fkey(id,full_name,phone)")
          .eq("detailer_id", dId)
          .limit(200),
      ]);

      const rawPkgs: RawServicePackage[] = (pkgRes.data as RawServicePackage[] | null) ?? [];
      setPackages(
        rawPkgs.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.base_price,
          durationMins: p.duration_mins,
          description: p.description,
        }))
      );

      // Deduplicate customers by user id
      const seen = new Set<string>();
      const custs: CustomerOption[] = [];
      for (const row of (custRes.data as RawCustomerRow[] | null) ?? []) {
        const u = row.users;
        if (u && !seen.has(u.id)) {
          seen.add(u.id);
          custs.push({ userId: u.id, name: u.full_name ?? "Unknown", phone: u.phone ?? null });
        }
      }
      setCustomers(custs);
    } catch (err) {
      console.warn("[NewBooking] fetchData error", err);
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!customerSearch.trim()) {
      setFilteredCustomers([]);
      setShowCustomerList(false);
      return;
    }
    const q = customerSearch.toLowerCase();
    const results = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? "").replace(/\D/g, "").includes(q.replace(/\D/g, ""))
    );
    setFilteredCustomers(results);
    setShowCustomerList(results.length > 0);
  }, [customerSearch, customers]);

  function selectCustomer(c: CustomerOption) {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setShowCustomerList(false);
  }

  async function handleSubmit() {
    if (!detailerId) return;

    if (!selectedCustomer) {
      setErrorMsg("Please select a customer from the list.");
      return;
    }
    if (!selectedPackageId) {
      setErrorMsg("Please select a service package.");
      return;
    }
    if (!bookingDate || !bookingTime) {
      setErrorMsg("Please enter a valid date and time.");
      return;
    }

    const scheduledAt = buildScheduledAt(bookingDate, bookingTime);
    if (!scheduledAt) {
      setErrorMsg("Invalid date or time format. Use YYYY-MM-DD and HH:MM AM/PM.");
      return;
    }

    setErrorMsg(null);
    setSubmitState("saving");

    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();

      // Create or look up vehicle for this customer
      let vehicleId: string | null = null;
      if (vehicleMake || vehicleModel) {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from("vehicles")
          .insert({
            customer_id: selectedCustomer.userId,
            make: vehicleMake || null,
            model: vehicleModel || null,
            year: vehicleYear ? parseInt(vehicleYear, 10) : null,
            color: vehicleColor || null,
            is_default: false,
          })
          .select("id")
          .single();

        if (!vehicleError && vehicleData) {
          vehicleId = (vehicleData as { id: string }).id;
        }
      }

      if (!vehicleId) {
        // Try to use the customer's existing default vehicle
        const { data: existingVehicle } = await supabase
          .from("vehicles")
          .select("id")
          .eq("customer_id", selectedCustomer.userId)
          .eq("is_default", true)
          .single();
        if (existingVehicle) {
          vehicleId = (existingVehicle as { id: string }).id;
        }
      }

      if (!vehicleId) {
        setErrorMsg(
          "Could not create vehicle. Please enter at least a make or model."
        );
        setSubmitState("error");
        return;
      }

      const { error: bookingError } = await supabase.from("bookings").insert({
        customer_id: selectedCustomer.userId,
        detailer_id: detailerId,
        vehicle_id: vehicleId,
        package_id: selectedPackageId,
        status: "confirmed",
        scheduled_at: scheduledAt,
        service_address: serviceAddress || null,
        notes: notes || null,
        tip_amount: 0,
        is_recurring: false,
      });

      if (bookingError) {
        console.warn("[NewBooking] insert error", bookingError);
        setErrorMsg("Failed to create booking. Please try again.");
        setSubmitState("error");
        return;
      }

      setSubmitState("success");
      setTimeout(() => router.back(), 1200);
    } catch (err) {
      console.warn("[NewBooking] submit error", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
      setSubmitState("error");
    }
  }

  const selectedPackage = packages.find((p) => p.id === selectedPackageId) ?? null;

  if (isLoadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>New Booking</Text>
          <View style={styles.navSpacer} />
        </View>
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={Colors.foamBlue} />
        </View>
      </SafeAreaView>
    );
  }

  if (submitState === "success") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerFill}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={36} color={Colors.foamBlue} />
          </View>
          <Text style={styles.successHeadline}>Booking Created</Text>
          <Text style={styles.successBody}>The booking has been added to your schedule.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <View style={styles.navTitleRow}>
          <Text style={styles.navTitle}>New Booking</Text>
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        </View>
        <View style={styles.navSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Customer */}
          <View
            style={[
              styles.card,
              Platform.OS === "web"
                ? ({ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.05)" } as object)
                : Shadows.light.level1,
            ]}
          >
            <Text style={styles.cardSectionLabel}>CUSTOMER</Text>
            <FieldLabel>Name or phone</FieldLabel>
            <TextInput
              style={styles.textInput}
              value={customerSearch}
              onChangeText={(v) => {
                setCustomerSearch(v);
                if (selectedCustomer && v !== selectedCustomer.name) {
                  setSelectedCustomer(null);
                }
              }}
              placeholder="Search existing customers…"
              placeholderTextColor={Colors.light.textTertiary}
              autoCapitalize="words"
            />
            {showCustomerList && (
              <View style={styles.dropdownList}>
                {filteredCustomers.map((c) => (
                  <TouchableOpacity
                    key={c.userId}
                    style={styles.dropdownItem}
                    onPress={() => selectCustomer(c)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.dropdownItemName}>{c.name}</Text>
                    {c.phone && (
                      <Text style={styles.dropdownItemSub}>{c.phone}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {selectedCustomer && (
              <View style={styles.selectedCustomerRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.successLight} />
                <Text style={styles.selectedCustomerText}>{selectedCustomer.name}</Text>
              </View>
            )}
            {customers.length === 0 && !isLoadingData && (
              <Text style={styles.hintText}>
                Customers appear here once they have booked with you.
              </Text>
            )}
          </View>

          {/* Vehicle */}
          <View
            style={[
              styles.card,
              Platform.OS === "web"
                ? ({ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.05)" } as object)
                : Shadows.light.level1,
            ]}
          >
            <Text style={styles.cardSectionLabel}>VEHICLE</Text>
            <View style={styles.twoCol}>
              <View style={styles.halfField}>
                <FieldLabel>Make</FieldLabel>
                <InputField value={vehicleMake} onChangeText={setVehicleMake} placeholder="Toyota" />
              </View>
              <View style={styles.halfField}>
                <FieldLabel>Model</FieldLabel>
                <InputField value={vehicleModel} onChangeText={setVehicleModel} placeholder="Camry" />
              </View>
            </View>
            <View style={styles.twoCol}>
              <View style={styles.halfField}>
                <FieldLabel>Year</FieldLabel>
                <InputField
                  value={vehicleYear}
                  onChangeText={setVehicleYear}
                  placeholder="2022"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <FieldLabel>Color</FieldLabel>
                <InputField value={vehicleColor} onChangeText={setVehicleColor} placeholder="Silver" />
              </View>
            </View>
          </View>

          {/* Service Package */}
          <View
            style={[
              styles.card,
              Platform.OS === "web"
                ? ({ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.05)" } as object)
                : Shadows.light.level1,
            ]}
          >
            <Text style={styles.cardSectionLabel}>SERVICE</Text>
            {packages.length === 0 ? (
              <Text style={styles.hintText}>
                No active service packages found. Add packages in your Business settings.
              </Text>
            ) : (
              <View style={styles.packageList}>
                {packages.map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[styles.packageRow, isSelected && styles.packageRowSelected]}
                      onPress={() => setSelectedPackageId(pkg.id)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.packageRowLeft}>
                        <Text style={[styles.packageName, isSelected && { color: Colors.foamBlue }]}>
                          {pkg.name}
                        </Text>
                        {pkg.description && (
                          <Text style={styles.packageDesc} numberOfLines={1}>
                            {pkg.description}
                          </Text>
                        )}
                        <Text style={styles.packageDuration}>
                          {pkg.durationMins < 60
                            ? `${pkg.durationMins} min`
                            : `${Math.round(pkg.durationMins / 60 * 10) / 10} hrs`}
                        </Text>
                      </View>
                      <View style={styles.packageRight}>
                        <Text style={[styles.packagePrice, isSelected && { color: Colors.foamBlue }]}>
                          ${pkg.price.toFixed(0)}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={18} color={Colors.foamBlue} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Date & Time */}
          <View
            style={[
              styles.card,
              Platform.OS === "web"
                ? ({ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.05)" } as object)
                : Shadows.light.level1,
            ]}
          >
            <Text style={styles.cardSectionLabel}>DATE & TIME</Text>
            <View style={styles.twoCol}>
              <View style={styles.halfField}>
                <FieldLabel>Date (YYYY-MM-DD)</FieldLabel>
                <InputField
                  value={bookingDate}
                  onChangeText={setBookingDate}
                  placeholder="2026-05-20"
                />
              </View>
              <View style={styles.halfField}>
                <FieldLabel>Time (HH:MM AM/PM)</FieldLabel>
                <InputField
                  value={bookingTime}
                  onChangeText={setBookingTime}
                  placeholder="09:00 AM"
                />
              </View>
            </View>
          </View>

          {/* Address & Notes */}
          <View
            style={[
              styles.card,
              Platform.OS === "web"
                ? ({ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.05)" } as object)
                : Shadows.light.level1,
            ]}
          >
            <Text style={styles.cardSectionLabel}>DETAILS</Text>
            <FieldLabel>Service address</FieldLabel>
            <InputField
              value={serviceAddress}
              onChangeText={setServiceAddress}
              placeholder="123 Main St, Atlanta, GA"
            />
            <View style={{ height: Spacing.mdSm }} />
            <FieldLabel>Notes for crew</FieldLabel>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any special instructions…"
              placeholderTextColor={Colors.light.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Summary */}
          {selectedPackage && selectedCustomer && (
            <View style={styles.summaryBar}>
              <View>
                <Text style={styles.summaryLabel}>
                  {selectedCustomer.name} · {selectedPackage.name}
                </Text>
                <Text style={styles.summaryDate}>
                  {bookingDate} at {bookingTime}
                </Text>
              </View>
              <Text style={styles.summaryPrice}>${selectedPackage.price.toFixed(0)}</Text>
            </View>
          )}

          {errorMsg && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.errorLight} />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* CTA footer */}
      <View style={styles.ctaFooter}>
        <TouchableOpacity
          style={[
            styles.ctaBtn,
            (submitState === "saving" || !selectedCustomer || !selectedPackageId) && {
              opacity: 0.55,
            },
          ]}
          onPress={handleSubmit}
          disabled={submitState === "saving" || !selectedCustomer || !selectedPackageId}
          activeOpacity={0.8}
        >
          {submitState === "saving" ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.ctaBtnText}>Create Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  centerFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.mdSm,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  navTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.h4,
    color: Colors.light.textPrimary,
  },
  newBadge: {
    backgroundColor: Colors.foamBlue,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  newBadgeText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 9,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  navSpacer: { width: 32 },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 120,
    gap: Spacing.mdSm,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    padding: Spacing.md,
  },
  cardSectionLabel: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
    marginBottom: Spacing.mdSm,
  },
  fieldLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.mdSm,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    backgroundColor: Colors.light.surface,
    marginBottom: Spacing.sm,
  },
  textArea: {
    height: 80,
    paddingTop: Spacing.mdSm,
  },
  twoCol: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  halfField: {
    flex: 1,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface,
    marginBottom: Spacing.sm,
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08)" }
      : Shadows.light.level2),
  },
  dropdownItem: {
    paddingHorizontal: Spacing.mdSm,
    paddingVertical: Spacing.mdSm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  dropdownItemName: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  dropdownItemSub: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  selectedCustomerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  selectedCustomerText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.successLight,
  },
  hintText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    lineHeight: 18,
  },
  packageList: {
    gap: Spacing.sm,
  },
  packageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.mdSm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.bgPrimary,
  },
  packageRowSelected: {
    borderColor: Colors.foamBlue,
    borderWidth: 2,
    backgroundColor: Colors.foamBlueSubtle,
  },
  packageRowLeft: { flex: 1, paddingRight: Spacing.md },
  packageName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    marginBottom: 2,
  },
  packageDesc: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    marginBottom: 2,
  },
  packageDuration: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
  },
  packageRight: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  packagePrice: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textPrimary,
  },
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.md,
    padding: Spacing.mdSm,
  },
  summaryLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  summaryDate: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
    marginTop: 2,
  },
  summaryPrice: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.h4,
    color: Colors.foamBlue,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(220,38,38,0.08)",
    borderRadius: Radius.md,
    padding: Spacing.mdSm,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.errorLight,
    lineHeight: 18,
  },
  ctaFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    paddingBottom: Platform.OS === "ios" ? 32 : Spacing.md,
    backgroundColor: Colors.light.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  ctaBtn: {
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  successHeadline: {
    fontFamily: Typography.display,
    fontSize: Typography.size.h2,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  successBody: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    textAlign: "center",
    maxWidth: 260,
  },
});
