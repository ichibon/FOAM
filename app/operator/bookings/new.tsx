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

type CustomerMode = "search" | "create";
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

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={[
        styles.card,
        Platform.OS === "web"
          ? ({ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.05)" } as object)
          : Shadows.light.level1,
      ]}
    >
      {children}
    </View>
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

  // Customer mode: search existing or create new
  const [customerMode, setCustomerMode] = useState<CustomerMode>("search");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [showCustomerList, setShowCustomerList] = useState(false);

  // Create new customer fields
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");

  // Booking fields
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
          .limit(300),
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

  function switchToCreate() {
    setCustomerMode("create");
    setSelectedCustomer(null);
    setCustomerSearch("");
    setShowCustomerList(false);
  }

  function switchToSearch() {
    setCustomerMode("search");
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewCustomerEmail("");
  }

  // ── Resolve or create customer, then create booking ──────────────────────────
  async function resolveCustomerId(): Promise<string | null> {
    const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
    const supabase = getSupabase();

    if (customerMode === "search") {
      return selectedCustomer?.userId ?? null;
    }

    // Create new customer: insert into users table with role customer
    const trimName = newCustomerName.trim();
    const trimPhone = newCustomerPhone.trim();
    const trimEmail = newCustomerEmail.trim();

    if (!trimName) return null;

    const insertPayload: Record<string, string> = {
      full_name: trimName,
      role: "customer",
    };
    if (trimPhone) insertPayload.phone = trimPhone;
    if (trimEmail) insertPayload.email = trimEmail;

    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert(insertPayload)
      .select("id")
      .single();

    if (userError || !newUser) {
      console.warn("[NewBooking] create customer error", userError);
      throw new Error(
        "Could not create customer account. They may need to sign up through the FOAM app first."
      );
    }
    return (newUser as { id: string }).id;
  }

  async function handleSubmit() {
    if (!detailerId) return;

    const isCreateMode = customerMode === "create";

    if (!isCreateMode && !selectedCustomer) {
      setErrorMsg("Please select a customer or create a new one.");
      return;
    }
    if (isCreateMode && !newCustomerName.trim()) {
      setErrorMsg("Please enter the customer's name.");
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

      let customerId: string | null = null;
      try {
        customerId = await resolveCustomerId();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to resolve customer.";
        setErrorMsg(msg);
        setSubmitState("error");
        return;
      }

      if (!customerId) {
        setErrorMsg(isCreateMode ? "Customer name is required." : "Please select a customer.");
        setSubmitState("error");
        return;
      }

      // Create vehicle record if make or model provided
      let vehicleId: string | null = null;
      if (vehicleMake.trim() || vehicleModel.trim()) {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from("vehicles")
          .insert({
            customer_id: customerId,
            make: vehicleMake.trim() || null,
            model: vehicleModel.trim() || null,
            year: vehicleYear.trim() ? parseInt(vehicleYear.trim(), 10) : null,
            color: vehicleColor.trim() || null,
            is_default: false,
          })
          .select("id")
          .single();

        if (!vehicleError && vehicleData) {
          vehicleId = (vehicleData as { id: string }).id;
        }
      }

      // Fallback: use existing default vehicle if any
      if (!vehicleId) {
        const { data: existingVehicle } = await supabase
          .from("vehicles")
          .select("id")
          .eq("customer_id", customerId)
          .eq("is_default", true)
          .limit(1)
          .single();
        if (existingVehicle) vehicleId = (existingVehicle as { id: string }).id;
      }

      if (!vehicleId) {
        setErrorMsg("Please enter at least a vehicle make or model so a record can be created.");
        setSubmitState("error");
        return;
      }

      const { error: bookingError } = await supabase.from("bookings").insert({
        customer_id: customerId,
        detailer_id: detailerId,
        vehicle_id: vehicleId,
        package_id: selectedPackageId,
        status: "confirmed",
        scheduled_at: scheduledAt,
        service_address: serviceAddress.trim() || null,
        notes: notes.trim() || null,
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
      setTimeout(() => router.back(), 1400);
    } catch (err) {
      console.warn("[NewBooking] submit error", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
      setSubmitState("error");
    }
  }

  const selectedPackage = packages.find((p) => p.id === selectedPackageId) ?? null;
  const effectiveCustomerName =
    customerMode === "search"
      ? (selectedCustomer?.name ?? null)
      : newCustomerName.trim() || null;

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isLoadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <NavHeader onBack={() => router.back()} />
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={Colors.foamBlue} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────────
  if (submitState === "success") {
    return (
      <SafeAreaView style={styles.container}>
        <NavHeader onBack={() => router.back()} />
        <View style={styles.centerFill}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={36} color={Colors.foamBlue} />
          </View>
          <Text style={styles.successHeadline}>Booking Created</Text>
          <Text style={styles.successBody}>
            The booking has been added to your schedule.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <NavHeader onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Customer section ── */}
          <SectionCard>
            <Text style={styles.cardSectionLabel}>CUSTOMER</Text>

            {/* Mode toggle */}
            <View style={styles.modeToggleRow}>
              <TouchableOpacity
                style={[styles.modeTab, customerMode === "search" && styles.modeTabActive]}
                onPress={switchToSearch}
                activeOpacity={0.75}
              >
                <Text style={[styles.modeTabText, customerMode === "search" && styles.modeTabTextActive]}>
                  Existing
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeTab, customerMode === "create" && styles.modeTabActive]}
                onPress={switchToCreate}
                activeOpacity={0.75}
              >
                <Text style={[styles.modeTabText, customerMode === "create" && styles.modeTabTextActive]}>
                  New Customer
                </Text>
              </TouchableOpacity>
            </View>

            {customerMode === "search" ? (
              <>
                <FieldLabel>Search by name or phone</FieldLabel>
                <TextInput
                  style={styles.textInput}
                  value={customerSearch}
                  onChangeText={(v) => {
                    setCustomerSearch(v);
                    if (selectedCustomer && v !== selectedCustomer.name) setSelectedCustomer(null);
                  }}
                  placeholder="Start typing to search…"
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
                        {c.phone && <Text style={styles.dropdownItemSub}>{c.phone}</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {selectedCustomer && (
                  <View style={styles.selectedRow}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.successLight} />
                    <Text style={styles.selectedText}>{selectedCustomer.name} selected</Text>
                  </View>
                )}
                {customers.length === 0 && (
                  <View style={styles.hintBox}>
                    <Ionicons name="information-circle-outline" size={15} color={Colors.light.textTertiary} />
                    <Text style={styles.hintText}>
                      No prior customers found. Use "New Customer" for first-time bookings.
                    </Text>
                  </View>
                )}
                {!selectedCustomer && customers.length > 0 && !customerSearch && (
                  <TouchableOpacity onPress={switchToCreate} style={styles.createLink} activeOpacity={0.7}>
                    <Text style={styles.createLinkText}>Can't find them? Create new customer →</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <FieldLabel>Full name *</FieldLabel>
                <TextInput
                  style={styles.textInput}
                  value={newCustomerName}
                  onChangeText={setNewCustomerName}
                  placeholder="Jane Smith"
                  placeholderTextColor={Colors.light.textTertiary}
                  autoCapitalize="words"
                />
                <FieldLabel>Phone number</FieldLabel>
                <TextInput
                  style={styles.textInput}
                  value={newCustomerPhone}
                  onChangeText={setNewCustomerPhone}
                  placeholder="(555) 123-4567"
                  placeholderTextColor={Colors.light.textTertiary}
                  keyboardType="phone-pad"
                />
                <FieldLabel>Email (optional)</FieldLabel>
                <TextInput
                  style={styles.textInput}
                  value={newCustomerEmail}
                  onChangeText={setNewCustomerEmail}
                  placeholder="jane@example.com"
                  placeholderTextColor={Colors.light.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View style={styles.hintBox}>
                  <Ionicons name="information-circle-outline" size={15} color={Colors.light.textTertiary} />
                  <Text style={styles.hintText}>
                    A customer profile will be created. They can claim it later by signing up with the same phone or email.
                  </Text>
                </View>
              </>
            )}
          </SectionCard>

          {/* ── Vehicle ── */}
          <SectionCard>
            <Text style={styles.cardSectionLabel}>VEHICLE</Text>
            <View style={styles.twoCol}>
              <View style={styles.halfField}>
                <FieldLabel>Make</FieldLabel>
                <TextInput
                  style={styles.textInput}
                  value={vehicleMake}
                  onChangeText={setVehicleMake}
                  placeholder="Toyota"
                  placeholderTextColor={Colors.light.textTertiary}
                />
              </View>
              <View style={styles.halfField}>
                <FieldLabel>Model</FieldLabel>
                <TextInput
                  style={styles.textInput}
                  value={vehicleModel}
                  onChangeText={setVehicleModel}
                  placeholder="Camry"
                  placeholderTextColor={Colors.light.textTertiary}
                />
              </View>
            </View>
            <View style={styles.twoCol}>
              <View style={styles.halfField}>
                <FieldLabel>Year</FieldLabel>
                <TextInput
                  style={styles.textInput}
                  value={vehicleYear}
                  onChangeText={setVehicleYear}
                  placeholder="2022"
                  placeholderTextColor={Colors.light.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfField}>
                <FieldLabel>Color</FieldLabel>
                <TextInput
                  style={styles.textInput}
                  value={vehicleColor}
                  onChangeText={setVehicleColor}
                  placeholder="Silver"
                  placeholderTextColor={Colors.light.textTertiary}
                />
              </View>
            </View>
          </SectionCard>

          {/* ── Service Package ── */}
          <SectionCard>
            <Text style={styles.cardSectionLabel}>SERVICE</Text>
            {packages.length === 0 ? (
              <Text style={styles.hintText}>
                No active packages. Add service packages in your Business settings.
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
                          <Text style={styles.packageDesc} numberOfLines={1}>{pkg.description}</Text>
                        )}
                        <Text style={styles.packageDuration}>
                          {pkg.durationMins < 60
                            ? `${pkg.durationMins} min`
                            : `${Math.round((pkg.durationMins / 60) * 10) / 10} hrs`}
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
          </SectionCard>

          {/* ── Date & Time ── */}
          <SectionCard>
            <Text style={styles.cardSectionLabel}>DATE &amp; TIME</Text>
            <View style={styles.twoCol}>
              <View style={styles.halfField}>
                <FieldLabel>Date (YYYY-MM-DD)</FieldLabel>
                <TextInput
                  style={styles.textInput}
                  value={bookingDate}
                  onChangeText={setBookingDate}
                  placeholder={todayString()}
                  placeholderTextColor={Colors.light.textTertiary}
                />
              </View>
              <View style={styles.halfField}>
                <FieldLabel>Time (HH:MM AM/PM)</FieldLabel>
                <TextInput
                  style={styles.textInput}
                  value={bookingTime}
                  onChangeText={setBookingTime}
                  placeholder="09:00 AM"
                  placeholderTextColor={Colors.light.textTertiary}
                />
              </View>
            </View>
          </SectionCard>

          {/* ── Address & Notes ── */}
          <SectionCard>
            <Text style={styles.cardSectionLabel}>DETAILS</Text>
            <FieldLabel>Service address</FieldLabel>
            <TextInput
              style={styles.textInput}
              value={serviceAddress}
              onChangeText={setServiceAddress}
              placeholder="123 Main St, Atlanta, GA"
              placeholderTextColor={Colors.light.textTertiary}
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
          </SectionCard>

          {/* ── Summary bar ── */}
          {selectedPackage && effectiveCustomerName && (
            <View style={styles.summaryBar}>
              <View>
                <Text style={styles.summaryLabel}>
                  {effectiveCustomerName} · {selectedPackage.name}
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

      {/* ── CTA footer ── */}
      <View style={styles.ctaFooter}>
        <TouchableOpacity
          style={[
            styles.ctaBtn,
            (submitState === "saving" ||
              !selectedPackageId ||
              (customerMode === "search" && !selectedCustomer) ||
              (customerMode === "create" && !newCustomerName.trim())) && { opacity: 0.55 },
          ]}
          onPress={handleSubmit}
          disabled={
            submitState === "saving" ||
            !selectedPackageId ||
            (customerMode === "search" && !selectedCustomer) ||
            (customerMode === "create" && !newCustomerName.trim())
          }
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

// ─── NavHeader ────────────────────────────────────────────────────────────────

function NavHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.navHeader}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
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
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  navTitleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
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
  modeToggleRow: {
    flexDirection: "row",
    backgroundColor: Colors.light.bgSecondary,
    borderRadius: Radius.sm,
    padding: 3,
    marginBottom: Spacing.mdSm,
  },
  modeTab: {
    flex: 1,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  modeTabActive: {
    backgroundColor: Colors.light.surface,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.08)" } as object)
      : Shadows.light.level1),
  },
  modeTabText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  modeTabTextActive: {
    fontFamily: Typography.bodySemiBold,
    color: Colors.light.textPrimary,
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
  twoCol: { flexDirection: "row", gap: Spacing.sm },
  halfField: { flex: 1 },
  dropdownList: {
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface,
    marginBottom: Spacing.sm,
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08)" } as object)
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
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  selectedText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.successLight,
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  hintText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    lineHeight: 18,
  },
  createLink: { paddingVertical: Spacing.sm },
  createLinkText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.foamBlue,
    textDecorationLine: "underline",
  },
  packageList: { gap: Spacing.sm },
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
  packageRight: { alignItems: "flex-end", gap: Spacing.xs },
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
