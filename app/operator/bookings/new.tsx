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
import { ServiceDrawer } from "@/components/ServiceDrawer";
import { DateTimeDrawer } from "@/components/DateTimeDrawer";

// ─── Raw DB row types ─────────────────────────────────────────────────────────

interface RawVehiclePricingRow {
  vehicle_type: string;
  price_adjustment: number;
}

interface RawServicePackage {
  id: string;
  name: string;
  base_price: number;
  duration_mins: number;
  description: string | null;
  vehicle_size_pricing: RawVehiclePricingRow[];
}

interface RawCustomerRow {
  customer_id: string;
  users: { id: string; full_name: string | null; phone: string | null } | null;
}

interface RawAssetRow {
  id: string;
  name: string;
  asset_type: string;
}

interface RawLocationRow {
  id: string;
  name: string;
  address: string | null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type VehicleSizeKey = "sedan" | "suv" | "truck" | "van";

interface VehicleSizePricingEntry {
  vehicleType: VehicleSizeKey;
  priceAdjustment: number;
}

interface ServicePackageOption {
  id: string;
  name: string;
  price: number;
  durationMins: number;
  description: string | null;
  vehicleSizePricing: VehicleSizePricingEntry[];
}

interface CustomerOption {
  userId: string;
  name: string;
  phone: string | null;
}

type CustomerMode = "search" | "create";
type BookingSourceType = "asset" | "location";
type SubmitState = "idle" | "saving" | "success" | "error";

interface BookingSourceOption {
  id: string;
  type: BookingSourceType;
  name: string;
  address?: string | null;
  assetType?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatScheduledAt(iso: string | null): string {
  if (!iso) return "Select date and time";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Select date and time";
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h < 12 ? "AM" : "PM";
    const dH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const dM = m === 0 ? "00" : String(m);
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()} at ${dH}:${dM} ${ampm}`;
  } catch {
    return "Select date and time";
  }
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

  // Booking source: which van or physical location this booking is for
  const [bookingSources, setBookingSources] = useState<BookingSourceOption[]>([]);
  const [selectedSource, setSelectedSource] = useState<BookingSourceOption | null>(null);
  const [showSourcePicker, setShowSourcePicker] = useState(false);

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
  const [vehicleType, setVehicleType] = useState<VehicleSizeKey | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [dateTimeDrawerVisible, setDateTimeDrawerVisible] = useState(false);
  const [serviceAddress, setServiceAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addServiceVisible, setAddServiceVisible] = useState(false);

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

      const [pkgRes, custRes, assetRes, locationRes] = await Promise.all([
        supabase
          .from("service_packages")
          .select("id,name,base_price,duration_mins,description,vehicle_size_pricing(vehicle_type,price_adjustment)")
          .eq("detailer_id", dId)
          .eq("is_active", true)
          .order("display_order"),
        supabase
          .from("bookings")
          .select("customer_id, users!bookings_customer_id_fkey(id,full_name,phone)")
          .eq("detailer_id", dId)
          .limit(300),
        supabase
          .from("business_assets")
          .select("id,name,asset_type")
          .eq("detailer_id", dId)
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("business_locations")
          .select("id,name,address")
          .eq("detailer_id", dId)
          .eq("is_active", true)
          .order("name"),
      ]);

      const rawPkgs: RawServicePackage[] = (pkgRes.data as RawServicePackage[] | null) ?? [];
      setPackages(
        rawPkgs.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.base_price,
          durationMins: p.duration_mins,
          description: p.description,
          vehicleSizePricing: (p.vehicle_size_pricing ?? [])
            .filter((r) => ["sedan", "suv", "truck", "van"].includes(r.vehicle_type))
            .map((r) => ({
              vehicleType: r.vehicle_type as VehicleSizeKey,
              priceAdjustment: r.price_adjustment,
            })),
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

      const sources: BookingSourceOption[] = [
        ...((assetRes.data as RawAssetRow[] | null) ?? []).map((a) => ({
          id: a.id,
          type: "asset" as BookingSourceType,
          name: a.name,
          assetType: a.asset_type,
        })),
        ...((locationRes.data as RawLocationRow[] | null) ?? []).map((l) => ({
          id: l.id,
          type: "location" as BookingSourceType,
          name: l.name,
          address: l.address,
        })),
      ];
      setBookingSources(sources);
    } catch (err) {
      console.warn("[NewBooking] fetchData error", err);
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function reloadPackages() {
    if (!detailerId) return;
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("service_packages")
        .select("id,name,base_price,duration_mins,description,vehicle_size_pricing(vehicle_type,price_adjustment)")
        .eq("detailer_id", detailerId)
        .eq("is_active", true)
        .order("display_order");
      if (error) {
        console.warn("[NewBooking] reloadPackages db error", error.message);
        return;
      }
      const rawPkgs: RawServicePackage[] = (data as RawServicePackage[] | null) ?? [];
      setPackages(
        rawPkgs.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.base_price,
          durationMins: p.duration_mins,
          description: p.description,
          vehicleSizePricing: (p.vehicle_size_pricing ?? [])
            .filter((r) => ["sedan", "suv", "truck", "van"].includes(r.vehicle_type))
            .map((r) => ({
              vehicleType: r.vehicle_type as VehicleSizeKey,
              priceAdjustment: r.price_adjustment,
            })),
        }))
      );
    } catch (err) {
      console.warn("[NewBooking] reloadPackages error", err);
    }
  }

  function getEffectivePrice(pkg: ServicePackageOption, vType: VehicleSizeKey | null): number {
    if (!vType || pkg.vehicleSizePricing.length === 0) return pkg.price;
    const entry = pkg.vehicleSizePricing.find((e) => e.vehicleType === vType);
    if (!entry) return pkg.price;
    if (vType === "sedan") return entry.priceAdjustment;
    return pkg.price + entry.priceAdjustment;
  }

  function handleServiceAdded(newPackageId: string) {
    setAddServiceVisible(false);
    reloadPackages().then(() => {
      setSelectedPackageId(newPackageId);
    });
  }

  // Auto-select when only one van or location exists — no need to show the picker
  useEffect(() => {
    if (bookingSources.length === 1) {
      setSelectedSource(bookingSources[0]);
    }
  }, [bookingSources]);

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

  function selectSource(src: BookingSourceOption) {
    setSelectedSource(src);
    setShowSourcePicker(false);
    if (src.type === "location") setServiceAddress("");
  }

  // ── Resolve or create customer, then create booking ──────────────────────────
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
    if (!scheduledAt) {
      setErrorMsg("Please select a date and time.");
      return;
    }

    setErrorMsg(null);
    setSubmitState("saving");

    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();

      if (isCreateMode) {
        // ── Walk-in / phone booking ─────────────────────────────────────────────
        // Store contact + vehicle info in booking_contacts (operator-owned table).
        // booking.customer_id and booking.vehicle_id are left null; booking_contacts
        // is the source of truth for this booking's contact details.
        const contactPayload: Record<string, unknown> = {
          detailer_id: detailerId,
          full_name: newCustomerName.trim(),
        };
        if (newCustomerPhone.trim()) contactPayload.phone = newCustomerPhone.trim();
        if (newCustomerEmail.trim()) contactPayload.email = newCustomerEmail.trim();
        if (vehicleMake.trim()) contactPayload.vehicle_make = vehicleMake.trim();
        if (vehicleModel.trim()) contactPayload.vehicle_model = vehicleModel.trim();
        if (vehicleYear.trim()) contactPayload.vehicle_year = parseInt(vehicleYear.trim(), 10);
        if (vehicleColor.trim()) contactPayload.vehicle_color = vehicleColor.trim();

        const { data: contactRow, error: contactError } = await supabase
          .from("booking_contacts")
          .insert(contactPayload)
          .select("id")
          .single();

        if (contactError || !contactRow) {
          console.warn("[NewBooking] booking_contacts insert error", contactError);
          setErrorMsg("Failed to save contact info. Please try again.");
          setSubmitState("error");
          return;
        }

        const contactId: string = (contactRow as { id: string }).id;

        const { error: bookingError } = await supabase.from("bookings").insert({
          contact_id: contactId,
          detailer_id: detailerId,
          package_id: selectedPackageId,
          status: "confirmed",
          scheduled_at: scheduledAt,
          service_address: serviceAddress.trim() || null,
          notes: notes.trim() || null,
          tip_amount: 0,
          is_recurring: false,
          asset_id: selectedSource?.type === "asset" ? selectedSource.id : null,
          location_id: selectedSource?.type === "location" ? selectedSource.id : null,
        });

        if (bookingError) {
          console.warn("[NewBooking] walk-in booking insert error", bookingError);
          setErrorMsg("Failed to create booking. Please try again.");
          setSubmitState("error");
          return;
        }
      } else {
        // ── Existing registered customer ────────────────────────────────────────
        const customerId = selectedCustomer!.userId;

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
              vehicle_type: vehicleType ?? null,
              is_default: false,
            })
            .select("id")
            .single();

          if (!vehicleError && vehicleData) {
            vehicleId = (vehicleData as { id: string }).id;
          }
        }

        // Fallback: use the customer's default vehicle
        if (!vehicleId) {
          const { data: existingVehicle } = await supabase
            .from("vehicles")
            .select("id")
            .eq("customer_id", customerId)
            .eq("is_default", true)
            .limit(1)
            .maybeSingle();
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
          asset_id: selectedSource?.type === "asset" ? selectedSource.id : null,
          location_id: selectedSource?.type === "location" ? selectedSource.id : null,
        });

        if (bookingError) {
          console.warn("[NewBooking] booking insert error", bookingError);
          setErrorMsg("Failed to create booking. Please try again.");
          setSubmitState("error");
          return;
        }
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
  const effectivePrice = selectedPackage ? getEffectivePrice(selectedPackage, vehicleType) : 0;
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

          {/* ── Booking source — only shown when there's a real choice to make ── */}
          {bookingSources.length > 1 && <SectionCard>
            <Text style={styles.cardSectionLabel}>BOOKED AT</Text>
            <TouchableOpacity
              style={styles.sourcePickerField}
              onPress={() => setShowSourcePicker((v) => !v)}
              activeOpacity={0.8}
            >
              {selectedSource ? (
                <View style={styles.sourcePickerSelected}>
                  <Ionicons
                    name={selectedSource.type === "asset" ? "car-outline" : "storefront-outline"}
                    size={18}
                    color={Colors.foamBlue}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sourcePickerName}>{selectedSource.name}</Text>
                    <Text style={styles.sourcePickerSub}>
                      {selectedSource.type === "asset" ? "Mobile" : selectedSource.address ?? "Physical Location"}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.sourcePickerPlaceholder}>Select van or location…</Text>
              )}
              <Ionicons
                name={showSourcePicker ? "chevron-up" : "chevron-down"}
                size={18}
                color={Colors.light.textSecondary}
              />
            </TouchableOpacity>

            {showSourcePicker && (
              <View style={styles.sourcePickerList}>
                {bookingSources.length === 0 ? (
                  <View style={styles.sourcePickerEmpty}>
                    <Text style={styles.sourcePickerEmptyText}>
                      No vans or locations set up yet. Add them in Business Settings.
                    </Text>
                  </View>
                ) : (
                  <>
                    {bookingSources.some((s) => s.type === "asset") && (
                      <Text style={styles.sourcePickerGroupLabel}>MOBILE FLEET</Text>
                    )}
                    {bookingSources.filter((s) => s.type === "asset").map((src) => (
                      <TouchableOpacity
                        key={src.id}
                        style={[
                          styles.sourcePickerItem,
                          selectedSource?.id === src.id && styles.sourcePickerItemActive,
                        ]}
                        onPress={() => selectSource(src)}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="car-outline" size={16} color={selectedSource?.id === src.id ? Colors.foamBlue : Colors.light.textSecondary} />
                        <Text style={[styles.sourcePickerItemText, selectedSource?.id === src.id && styles.sourcePickerItemTextActive]}>
                          {src.name}
                        </Text>
                        {selectedSource?.id === src.id && (
                          <Ionicons name="checkmark" size={16} color={Colors.foamBlue} />
                        )}
                      </TouchableOpacity>
                    ))}

                    {bookingSources.some((s) => s.type === "location") && (
                      <Text style={[styles.sourcePickerGroupLabel, { marginTop: Spacing.sm }]}>SHOP LOCATIONS</Text>
                    )}
                    {bookingSources.filter((s) => s.type === "location").map((src) => (
                      <TouchableOpacity
                        key={src.id}
                        style={[
                          styles.sourcePickerItem,
                          selectedSource?.id === src.id && styles.sourcePickerItemActive,
                        ]}
                        onPress={() => selectSource(src)}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="storefront-outline" size={16} color={selectedSource?.id === src.id ? Colors.foamBlue : Colors.light.textSecondary} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.sourcePickerItemText, selectedSource?.id === src.id && styles.sourcePickerItemTextActive]}>
                            {src.name}
                          </Text>
                          {src.address && (
                            <Text style={styles.sourcePickerItemSub}>{src.address}</Text>
                          )}
                        </View>
                        {selectedSource?.id === src.id && (
                          <Ionicons name="checkmark" size={16} color={Colors.foamBlue} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </View>
            )}
          </SectionCard>}

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
                    Contact info is saved to this booking only. If they later download the FOAM app, they can connect their account to see booking history.
                  </Text>
                </View>
              </>
            )}
          </SectionCard>

          {/* ── Vehicle ── */}
          <SectionCard>
            <Text style={styles.cardSectionLabel}>VEHICLE</Text>

            {/* Vehicle type selector */}
            <FieldLabel>Vehicle type</FieldLabel>
            <View style={styles.vehicleTypeRow}>
              {(["sedan", "suv", "truck", "van"] as VehicleSizeKey[]).map((vt) => (
                <TouchableOpacity
                  key={vt}
                  style={[
                    styles.vehicleTypeBtn,
                    vehicleType === vt && styles.vehicleTypeBtnActive,
                  ]}
                  onPress={() => setVehicleType((prev) => (prev === vt ? null : vt))}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.vehicleTypeBtnText,
                      vehicleType === vt && styles.vehicleTypeBtnTextActive,
                    ]}
                  >
                    {vt.charAt(0).toUpperCase() + vt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
              <View style={styles.noServicesBox}>
                <View style={styles.noServicesIconCircle}>
                  <Ionicons name="construct-outline" size={32} color={Colors.foamBlue} />
                </View>
                <Text style={styles.noServicesHeading}>No services yet.</Text>
                <Text style={styles.noServicesBody}>
                  Add your first service and start taking bookings.
                </Text>
                <TouchableOpacity
                  style={styles.addServiceBtn}
                  onPress={() => setAddServiceVisible(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.addServiceBtnText}>Add a Service</Text>
                </TouchableOpacity>
                <View style={styles.tipCard}>
                  <Ionicons name="bulb-outline" size={14} color={Colors.foamBlue} />
                  <Text style={styles.tipText}>
                    Start with your most popular service. You can always add more.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.packageList}>
                {packages.map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  const displayPrice = getEffectivePrice(pkg, vehicleType);
                  const hasPriceAdjustment =
                    vehicleType !== null &&
                    pkg.vehicleSizePricing.some((e) => e.vehicleType === vehicleType) &&
                    displayPrice !== pkg.price;
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
                          ${displayPrice.toFixed(0)}
                        </Text>
                        {hasPriceAdjustment && (
                          <Text style={styles.packageBasePrice}>
                            base ${pkg.price.toFixed(0)}
                          </Text>
                        )}
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
            <FieldLabel>Date &amp; time</FieldLabel>
            <TouchableOpacity
              style={styles.dateTimeField}
              onPress={() => setDateTimeDrawerVisible(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dateTimeFieldText,
                  !scheduledAt && styles.dateTimeFieldPlaceholder,
                ]}
              >
                {formatScheduledAt(scheduledAt)}
              </Text>
              <Ionicons name="calendar-outline" size={18} color={Colors.foamBlue} />
            </TouchableOpacity>
          </SectionCard>

          {/* ── Address & Notes ── */}
          <SectionCard>
            <Text style={styles.cardSectionLabel}>DETAILS</Text>
            {(selectedSource === null || selectedSource.type === "asset") && (
              <>
                <FieldLabel>Service address</FieldLabel>
                <TextInput
                  style={styles.textInput}
                  value={serviceAddress}
                  onChangeText={setServiceAddress}
                  placeholder="123 Main St, Atlanta, GA"
                  placeholderTextColor={Colors.light.textTertiary}
                />
                <View style={{ height: Spacing.mdSm }} />
              </>
            )}
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
                  {vehicleType ? ` · ${vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}` : ""}
                </Text>
                <Text style={styles.summaryDate}>
                  {formatScheduledAt(scheduledAt)}
                </Text>
              </View>
              <Text style={styles.summaryPrice}>${effectivePrice.toFixed(0)}</Text>
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

      {detailerId ? (
        <ServiceDrawer
          visible={addServiceVisible}
          onRequestClose={() => setAddServiceVisible(false)}
          detailerId={detailerId}
          onSaved={(saved) => handleServiceAdded(saved.id)}
        />
      ) : null}

      <DateTimeDrawer
        visible={dateTimeDrawerVisible}
        onRequestClose={() => setDateTimeDrawerVisible(false)}
        value={scheduledAt}
        onConfirm={(iso) => {
          setScheduledAt(iso);
          setDateTimeDrawerVisible(false);
        }}
      />

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
  dateTimeField: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: Colors.foamBlue,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.mdSm,
    backgroundColor: Colors.light.surface,
  },
  dateTimeFieldText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    flex: 1,
  },
  dateTimeFieldPlaceholder: {
    color: Colors.light.textTertiary,
  },
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
  noServicesBox: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  noServicesIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  noServicesHeading: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.h4,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  noServicesBody: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 21,
  },
  addServiceBtn: {
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xs,
    alignSelf: "stretch",
  },
  addServiceBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.mdSm,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    borderRadius: Radius.md,
    padding: Spacing.mdSm,
    alignSelf: "stretch",
    marginTop: Spacing.xs,
  },
  tipText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 19,
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
  packageBasePrice: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
    textDecorationLine: "line-through",
  },
  vehicleTypeRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  vehicleTypeBtn: {
    flex: 1,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.bgPrimary,
  },
  vehicleTypeBtnActive: {
    borderColor: Colors.foamBlue,
    backgroundColor: Colors.foamBlueSubtle,
    borderWidth: 2,
  },
  vehicleTypeBtnText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  vehicleTypeBtnTextActive: {
    fontFamily: Typography.bodySemiBold,
    color: Colors.foamBlue,
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
  sourcePickerField: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.mdSm,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.surface,
    gap: Spacing.sm,
  },
  sourcePickerSelected: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.mdSm,
  },
  sourcePickerName: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  sourcePickerSub: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    marginTop: 1,
  },
  sourcePickerPlaceholder: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textTertiary,
  },
  sourcePickerList: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    borderRadius: Radius.md,
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)" } as object)
      : Shadows.light.level2),
  },
  sourcePickerGroupLabel: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 10,
    color: Colors.light.textTertiary,
    letterSpacing: 0.7,
    paddingHorizontal: Spacing.mdSm,
    paddingTop: Spacing.mdSm,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.light.bgSecondary,
  },
  sourcePickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.mdSm,
    paddingHorizontal: Spacing.mdSm,
    paddingVertical: Spacing.mdSm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.surface,
  },
  sourcePickerItemActive: {
    backgroundColor: Colors.foamBlueSubtle,
  },
  sourcePickerItemText: {
    flex: 1,
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  sourcePickerItemTextActive: {
    color: Colors.foamBlue,
    fontFamily: Typography.bodySemiBold,
  },
  sourcePickerItemSub: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    marginTop: 1,
  },
  sourcePickerEmpty: {
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
  },
  sourcePickerEmptyText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    textAlign: "center",
    lineHeight: 18,
  },
});
