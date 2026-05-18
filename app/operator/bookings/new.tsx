import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { ServiceDrawer } from "@/components/ServiceDrawer";
import { DateTimeDrawer } from "@/components/DateTimeDrawer";
import { AddressAutocomplete, AddressResult } from "@/components/AddressAutocomplete";

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

interface RawVehicleRow {
  id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  vehicle_type: string | null;
  is_default: boolean;
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

interface SavedVehicleOption {
  id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  vehicleType: VehicleSizeKey | null;
  isDefault: boolean;
}

interface VehicleServiceEntry {
  entryId: string;
  selectedVehicleId: string | null;
  useNewVehicle: boolean;
  make: string;
  model: string;
  year: string;
  color: string;
  vehicleType: VehicleSizeKey | null;
  selectedPackageId: string | null;
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

// ─── Module-level helpers ─────────────────────────────────────────────────────

function parsePackages(data: unknown): ServicePackageOption[] {
  const rows: RawServicePackage[] = (data as RawServicePackage[] | null) ?? [];
  return rows.map((p) => ({
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
  }));
}

function getEffectivePrice(pkg: ServicePackageOption, vType: VehicleSizeKey | null): number {
  if (!vType || pkg.vehicleSizePricing.length === 0) return pkg.price;
  const row = pkg.vehicleSizePricing.find((e) => e.vehicleType === vType);
  return row ? row.priceAdjustment : pkg.price;
}

function makeEntry(useNewVehicle = false): VehicleServiceEntry {
  return {
    entryId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    selectedVehicleId: null,
    useNewVehicle,
    make: "",
    model: "",
    year: "",
    color: "",
    vehicleType: null,
    selectedPackageId: null,
  };
}

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

function formatDuration(mins: number): string {
  if (mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `~${h}h`;
  return `~${h}h ${m}m`;
}

function vehicleLabel(v: SavedVehicleOption): string {
  const parts: string[] = [];
  if (v.year) parts.push(String(v.year));
  if (v.make) parts.push(v.make);
  if (v.model) parts.push(v.model);
  const base = parts.length > 0 ? parts.join(" ") : "Vehicle";
  return v.color ? `${base} · ${v.color}` : base;
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

// ─── VehicleServiceCard ───────────────────────────────────────────────────────

interface VehicleServiceCardProps {
  entry: VehicleServiceEntry;
  index: number;
  total: number;
  packages: ServicePackageOption[];
  savedVehicles: SavedVehicleOption[];
  isLoadingVehicles: boolean;
  customerMode: CustomerMode;
  onUpdate: (patch: Partial<VehicleServiceEntry>) => void;
  onRemove: () => void;
  onAddService: () => void;
}

function VehicleServiceCard({
  entry,
  index,
  total,
  packages,
  savedVehicles,
  isLoadingVehicles,
  customerMode,
  onUpdate,
  onRemove,
  onAddService,
}: VehicleServiceCardProps) {
  const isNewCustomer = customerMode === "create";
  const showNewFields = isNewCustomer || entry.useNewVehicle;
  const showSavedPicker = !isNewCustomer && !entry.useNewVehicle && savedVehicles.length > 0;

  const selectedSavedVehicle = savedVehicles.find((v) => v.id === entry.selectedVehicleId) ?? null;
  const effectiveVehicleType: VehicleSizeKey | null = showSavedPicker
    ? (selectedSavedVehicle?.vehicleType ?? null)
    : entry.vehicleType;

  return (
    <SectionCard>
      {/* Header */}
      <View style={styles.entryHeader}>
        <Text style={styles.cardSectionLabel}>
          {total > 1 ? `VEHICLE ${index + 1}` : "VEHICLE"}
        </Text>
        {total > 1 && (
          <TouchableOpacity
            onPress={onRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={20} color={Colors.light.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Saved vehicle picker (existing customer with saved vehicles) */}
      {!isNewCustomer && (
        <>
          {isLoadingVehicles ? (
            <View style={styles.vehicleLoadingRow}>
              <ActivityIndicator size="small" color={Colors.foamBlue} />
              <Text style={styles.vehicleLoadingText}>Loading vehicles…</Text>
            </View>
          ) : showSavedPicker ? (
            <>
              <View style={styles.savedVehicleList}>
                {savedVehicles.map((v) => {
                  const isSelected = entry.selectedVehicleId === v.id;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.savedVehicleRow, isSelected && styles.savedVehicleRowSelected]}
                      onPress={() => onUpdate({ selectedVehicleId: v.id })}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name="car-outline"
                        size={16}
                        color={isSelected ? Colors.foamBlue : Colors.light.textSecondary}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.savedVehicleName, isSelected && { color: Colors.foamBlue }]}>
                          {vehicleLabel(v)}{v.isDefault ? "  ★" : ""}
                        </Text>
                        {v.vehicleType && (
                          <Text style={styles.savedVehicleType}>
                            {v.vehicleType.charAt(0).toUpperCase() + v.vehicleType.slice(1)}
                          </Text>
                        )}
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color={Colors.foamBlue} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={styles.switchModeLink}
                onPress={() => onUpdate({ useNewVehicle: true, selectedVehicleId: null })}
                activeOpacity={0.7}
              >
                <Ionicons name="add-outline" size={14} color={Colors.foamBlue} />
                <Text style={styles.switchModeLinkText}>Add a different vehicle</Text>
              </TouchableOpacity>
            </>
          ) : entry.useNewVehicle && savedVehicles.length > 0 ? (
            <TouchableOpacity
              style={styles.switchModeLink}
              onPress={() =>
                onUpdate({
                  useNewVehicle: false,
                  make: "",
                  model: "",
                  year: "",
                  color: "",
                  vehicleType: null,
                })
              }
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back-outline" size={14} color={Colors.foamBlue} />
              <Text style={styles.switchModeLinkText}>Use a saved vehicle instead</Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}

      {/* New vehicle input fields */}
      {showNewFields && (
        <>
          <FieldLabel>Vehicle type</FieldLabel>
          <View style={styles.vehicleTypeRow}>
            {(["sedan", "suv", "truck", "van"] as VehicleSizeKey[]).map((vt) => (
              <TouchableOpacity
                key={vt}
                style={[styles.vehicleTypeBtn, entry.vehicleType === vt && styles.vehicleTypeBtnActive]}
                onPress={() => onUpdate({ vehicleType: entry.vehicleType === vt ? null : vt })}
                activeOpacity={0.75}
              >
                <Text style={[styles.vehicleTypeBtnText, entry.vehicleType === vt && styles.vehicleTypeBtnTextActive]}>
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
                value={entry.make}
                onChangeText={(v) => onUpdate({ make: v })}
                placeholder="Toyota"
                placeholderTextColor={Colors.light.textTertiary}
              />
            </View>
            <View style={styles.halfField}>
              <FieldLabel>Model</FieldLabel>
              <TextInput
                style={styles.textInput}
                value={entry.model}
                onChangeText={(v) => onUpdate({ model: v })}
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
                value={entry.year}
                onChangeText={(v) => onUpdate({ year: v })}
                placeholder="2022"
                placeholderTextColor={Colors.light.textTertiary}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfField}>
              <FieldLabel>Color</FieldLabel>
              <TextInput
                style={styles.textInput}
                value={entry.color}
                onChangeText={(v) => onUpdate({ color: v })}
                placeholder="Silver"
                placeholderTextColor={Colors.light.textTertiary}
              />
            </View>
          </View>
        </>
      )}

      {/* Service section separator */}
      <View style={styles.serviceSeparator}>
        <Text style={styles.serviceSubLabel}>SERVICE</Text>
      </View>

      {/* Service packages */}
      {packages.length === 0 ? (
        <View style={styles.noServicesBox}>
          <View style={styles.noServicesIconCircle}>
            <Ionicons name="construct-outline" size={28} color={Colors.foamBlue} />
          </View>
          <Text style={styles.noServicesHeading}>No services yet</Text>
          <Text style={styles.noServicesBody}>Add your first service to start booking.</Text>
          <TouchableOpacity style={styles.addServiceBtn} onPress={onAddService} activeOpacity={0.85}>
            <Text style={styles.addServiceBtnText}>Add a Service</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.packageList}>
          {packages.map((pkg) => {
            const isSelected = entry.selectedPackageId === pkg.id;
            const displayPrice = getEffectivePrice(pkg, effectiveVehicleType);
            const hasPriceAdj =
              effectiveVehicleType !== null &&
              pkg.vehicleSizePricing.some((e) => e.vehicleType === effectiveVehicleType) &&
              displayPrice !== pkg.price;
            return (
              <TouchableOpacity
                key={pkg.id}
                style={[styles.packageRow, isSelected && styles.packageRowSelected]}
                onPress={() => onUpdate({ selectedPackageId: pkg.id })}
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
                  {hasPriceAdj && (
                    <Text style={styles.packageBasePrice}>base ${pkg.price.toFixed(0)}</Text>
                  )}
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.foamBlue} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.addPackageLink} onPress={onAddService} activeOpacity={0.7}>
            <Ionicons name="add-outline" size={14} color={Colors.foamBlue} />
            <Text style={styles.addPackageLinkText}>Add new service</Text>
          </TouchableOpacity>
        </View>
      )}
    </SectionCard>
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

  // Booking source
  const [bookingSources, setBookingSources] = useState<BookingSourceOption[]>([]);
  const [selectedSource, setSelectedSource] = useState<BookingSourceOption | null>(null);
  const [showSourcePicker, setShowSourcePicker] = useState(false);

  // Customer
  const [customerMode, setCustomerMode] = useState<CustomerMode>("search");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");

  // Saved vehicles for existing customer
  const [savedVehicles, setSavedVehicles] = useState<SavedVehicleOption[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  // Vehicle+Service entries
  const [entries, setEntries] = useState<VehicleServiceEntry[]>([makeEntry()]);

  // Address (mobile bookings only)
  const [serviceAddress, setServiceAddress] = useState("");
  const [serviceLat, setServiceLat] = useState<number | null>(null);
  const [serviceLng, setServiceLng] = useState<number | null>(null);
  const [serviceZip, setServiceZip] = useState("");

  // Date & time
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [dateTimeDrawerVisible, setDateTimeDrawerVisible] = useState(false);

  // Notes
  const [notes, setNotes] = useState("");

  // Submit
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ServiceDrawer: which entry is adding a new service
  const [addServiceForEntryId, setAddServiceForEntryId] = useState<string | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────

  const isMobile = selectedSource === null || selectedSource.type === "asset";

  const totalDurationMins = entries.reduce((sum, entry) => {
    const pkg = packages.find((p) => p.id === entry.selectedPackageId);
    return sum + (pkg?.durationMins ?? 0);
  }, 0);

  const totalPrice = entries.reduce((sum, entry) => {
    const pkg = packages.find((p) => p.id === entry.selectedPackageId);
    if (!pkg) return sum;
    const vType =
      !entry.useNewVehicle && customerMode === "search"
        ? (savedVehicles.find((v) => v.id === entry.selectedVehicleId)?.vehicleType ?? null)
        : entry.vehicleType;
    return sum + getEffectivePrice(pkg, vType);
  }, 0);

  const effectiveCustomerName =
    customerMode === "search"
      ? (selectedCustomer?.name ?? null)
      : newCustomerName.trim() || null;

  const canSubmit =
    !!effectiveCustomerName &&
    entries.every((e) => !!e.selectedPackageId) &&
    !!scheduledAt;

  // ── Data fetching ──────────────────────────────────────────────────────────

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

      setPackages(parsePackages(pkgRes.data));

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

  async function fetchCustomerVehicles(customerId: string) {
    setIsLoadingVehicles(true);
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const supabase = getSupabase();
      const { data } = await supabase
        .from("vehicles")
        .select("id,make,model,year,color,vehicle_type,is_default")
        .eq("customer_id", customerId)
        .order("is_default", { ascending: false });
      const rows: SavedVehicleOption[] = ((data as RawVehicleRow[] | null) ?? []).map((v) => ({
        id: v.id,
        make: v.make,
        model: v.model,
        year: v.year,
        color: v.color,
        vehicleType: ["sedan", "suv", "truck", "van"].includes(v.vehicle_type ?? "")
          ? (v.vehicle_type as VehicleSizeKey)
          : null,
        isDefault: v.is_default,
      }));
      setSavedVehicles(rows);
      if (rows.length > 0) {
        const defaultV = rows.find((v) => v.isDefault) ?? rows[0];
        setEntries((prev) =>
          prev.map((e, i) =>
            i === 0 ? { ...e, selectedVehicleId: defaultV.id, useNewVehicle: false } : e
          )
        );
      }
    } catch (err) {
      console.warn("[NewBooking] fetchCustomerVehicles error", err);
    } finally {
      setIsLoadingVehicles(false);
    }
  }

  async function reloadPackages(): Promise<ServicePackageOption[]> {
    if (!detailerId) return packages;
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
        console.warn("[NewBooking] reloadPackages error", error.message);
        return packages;
      }
      const updated = parsePackages(data);
      setPackages(updated);
      return updated;
    } catch (err) {
      console.warn("[NewBooking] reloadPackages error", err);
      return packages;
    }
  }

  // ── Auto-select single source ──────────────────────────────────────────────

  useEffect(() => {
    if (bookingSources.length === 1) setSelectedSource(bookingSources[0]);
  }, [bookingSources]);

  // ── Customer search filter ─────────────────────────────────────────────────

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

  // ── Handlers ──────────────────────────────────────────────────────────────

  function selectCustomer(c: CustomerOption) {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setShowCustomerList(false);
    setSavedVehicles([]);
    setEntries([makeEntry()]);
    fetchCustomerVehicles(c.userId);
  }

  function switchToCreate() {
    setCustomerMode("create");
    setSelectedCustomer(null);
    setCustomerSearch("");
    setShowCustomerList(false);
    setSavedVehicles([]);
    setEntries([makeEntry(true)]);
  }

  function switchToSearch() {
    setCustomerMode("search");
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewCustomerEmail("");
    setSavedVehicles([]);
    setEntries([makeEntry()]);
  }

  function selectSource(src: BookingSourceOption) {
    setSelectedSource(src);
    setShowSourcePicker(false);
    if (src.type === "location") setServiceAddress("");
  }

  // ── Entry management ───────────────────────────────────────────────────────

  function addEntry() {
    setEntries((prev) => [...prev, makeEntry(customerMode === "create")]);
  }

  function removeEntry(entryId: string) {
    setEntries((prev) => prev.filter((e) => e.entryId !== entryId));
  }

  function updateEntry(entryId: string, patch: Partial<VehicleServiceEntry>) {
    setEntries((prev) =>
      prev.map((e) => (e.entryId === entryId ? { ...e, ...patch } : e))
    );
  }

  function handleServiceAdded(entryId: string, newPackageId: string) {
    setAddServiceForEntryId(null);
    reloadPackages().then(() => {
      updateEntry(entryId, { selectedPackageId: newPackageId });
    });
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

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
    if (entries.some((e) => !e.selectedPackageId)) {
      setErrorMsg("Please select a service for each vehicle.");
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
        for (const entry of entries) {
          const contactPayload: Record<string, unknown> = {
            detailer_id: detailerId,
            full_name: newCustomerName.trim(),
          };
          if (newCustomerPhone.trim()) contactPayload.phone = newCustomerPhone.trim();
          if (newCustomerEmail.trim()) contactPayload.email = newCustomerEmail.trim();
          if (entry.make.trim()) contactPayload.vehicle_make = entry.make.trim();
          if (entry.model.trim()) contactPayload.vehicle_model = entry.model.trim();
          if (entry.year.trim()) contactPayload.vehicle_year = parseInt(entry.year.trim(), 10);
          if (entry.color.trim()) contactPayload.vehicle_color = entry.color.trim();

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
            package_id: entry.selectedPackageId,
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
        }
      } else {
        const customerId = selectedCustomer!.userId;

        for (const entry of entries) {
          let vehicleId: string | null = null;

          if (entry.useNewVehicle) {
            if (entry.make.trim() || entry.model.trim()) {
              const { data: vehicleData, error: vehicleError } = await supabase
                .from("vehicles")
                .insert({
                  customer_id: customerId,
                  make: entry.make.trim() || null,
                  model: entry.model.trim() || null,
                  year: entry.year.trim() ? parseInt(entry.year.trim(), 10) : null,
                  color: entry.color.trim() || null,
                  vehicle_type: entry.vehicleType ?? null,
                  is_default: false,
                })
                .select("id")
                .single();
              if (!vehicleError && vehicleData) {
                vehicleId = (vehicleData as { id: string }).id;
              }
            }
          } else {
            vehicleId = entry.selectedVehicleId;
          }

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
            setErrorMsg("Please select or enter a vehicle for each booking.");
            setSubmitState("error");
            return;
          }

          const { error: bookingError } = await supabase.from("bookings").insert({
            customer_id: customerId,
            detailer_id: detailerId,
            vehicle_id: vehicleId,
            package_id: entry.selectedPackageId,
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
      }

      setSubmitState("success");
      setTimeout(() => router.back(), 1400);
    } catch (err) {
      console.warn("[NewBooking] submit error", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
      setSubmitState("error");
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

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

  // ── Success ────────────────────────────────────────────────────────────────

  if (submitState === "success") {
    return (
      <SafeAreaView style={styles.container}>
        <NavHeader onBack={() => router.back()} />
        <View style={styles.centerFill}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={36} color={Colors.foamBlue} />
          </View>
          <Text style={styles.successHeadline}>
            {entries.length > 1 ? `${entries.length} Bookings Created` : "Booking Created"}
          </Text>
          <Text style={styles.successBody}>
            {entries.length > 1
              ? "All vehicles have been added to your schedule."
              : "The booking has been added to your schedule."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <NavHeader onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {/* ── 1. BOOKED AT ── */}
        {bookingSources.length > 1 && (
          <SectionCard>
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
                      {selectedSource.type === "asset"
                        ? "Mobile"
                        : selectedSource.address ?? "Physical Location"}
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
                    <Ionicons
                      name="car-outline"
                      size={16}
                      color={selectedSource?.id === src.id ? Colors.foamBlue : Colors.light.textSecondary}
                    />
                    <Text
                      style={[
                        styles.sourcePickerItemText,
                        selectedSource?.id === src.id && styles.sourcePickerItemTextActive,
                      ]}
                    >
                      {src.name}
                    </Text>
                    {selectedSource?.id === src.id && (
                      <Ionicons name="checkmark" size={16} color={Colors.foamBlue} />
                    )}
                  </TouchableOpacity>
                ))}
                {bookingSources.some((s) => s.type === "location") && (
                  <Text style={[styles.sourcePickerGroupLabel, { marginTop: Spacing.sm }]}>
                    SHOP LOCATIONS
                  </Text>
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
                    <Ionicons
                      name="storefront-outline"
                      size={16}
                      color={selectedSource?.id === src.id ? Colors.foamBlue : Colors.light.textSecondary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.sourcePickerItemText,
                          selectedSource?.id === src.id && styles.sourcePickerItemTextActive,
                        ]}
                      >
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
              </View>
            )}
          </SectionCard>
        )}

        {/* ── 2. CUSTOMER ── */}
        <SectionCard>
          <Text style={styles.cardSectionLabel}>CUSTOMER</Text>

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
                  if (selectedCustomer && v !== selectedCustomer.name) {
                    setSelectedCustomer(null);
                    setSavedVehicles([]);
                    setEntries([makeEntry()]);
                  }
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
                  Contact info is saved to this booking only. If they download the FOAM app later, they can connect their account to see booking history.
                </Text>
              </View>
            </>
          )}

          {/* Address — only for mobile bookings */}
          {isMobile && (
            <>
              <View style={styles.sectionDivider} />
              <FieldLabel>Service address</FieldLabel>
              <AddressAutocomplete
                placeholder="123 Main St, Atlanta, GA"
                initialValue={serviceAddress}
                onAddressSelect={(result: AddressResult) => {
                  setServiceAddress(result.formattedAddress);
                  setServiceLat(result.lat);
                  setServiceLng(result.lng);
                  setServiceZip(result.zip);
                }}
              />
            </>
          )}
        </SectionCard>

        {/* ── 3. VEHICLE + SERVICE (per entry) ── */}
        {entries.map((entry, idx) => (
          <VehicleServiceCard
            key={entry.entryId}
            entry={entry}
            index={idx}
            total={entries.length}
            packages={packages}
            savedVehicles={savedVehicles}
            isLoadingVehicles={isLoadingVehicles}
            customerMode={customerMode}
            onUpdate={(patch) => updateEntry(entry.entryId, patch)}
            onRemove={() => removeEntry(entry.entryId)}
            onAddService={() => setAddServiceForEntryId(entry.entryId)}
          />
        ))}

        <TouchableOpacity style={styles.addVehicleBtn} onPress={addEntry} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={18} color={Colors.foamBlue} />
          <Text style={styles.addVehicleBtnText}>Add another vehicle</Text>
        </TouchableOpacity>

        {/* ── 4. DATE & TIME ── */}
        <SectionCard>
          <Text style={styles.cardSectionLabel}>DATE &amp; TIME</Text>
          {totalDurationMins > 0 && (
            <View style={styles.durationHint}>
              <Ionicons name="time-outline" size={14} color={Colors.foamBlue} />
              <Text style={styles.durationHintText}>
                {formatDuration(totalDurationMins)} needed
                {entries.length > 1 ? ` across ${entries.length} vehicles` : ""}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.dateTimeField}
            onPress={() => setDateTimeDrawerVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.dateTimeFieldText, !scheduledAt && styles.dateTimeFieldPlaceholder]}>
              {formatScheduledAt(scheduledAt)}
            </Text>
            <Ionicons name="calendar-outline" size={18} color={Colors.foamBlue} />
          </TouchableOpacity>
        </SectionCard>

        {/* ── 5. NOTES FOR CREW ── */}
        <SectionCard>
          <Text style={styles.cardSectionLabel}>NOTES FOR CREW</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Special instructions, gate codes, preferences…"
            placeholderTextColor={Colors.light.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </SectionCard>

        {/* ── Summary bar ── */}
        {effectiveCustomerName && entries.some((e) => e.selectedPackageId) && scheduledAt && (
          <View style={styles.summaryBar}>
            <View>
              <Text style={styles.summaryLabel}>
                {effectiveCustomerName}
                {entries.length > 1 ? ` · ${entries.length} vehicles` : ""}
              </Text>
              <Text style={styles.summaryDate}>{formatScheduledAt(scheduledAt)}</Text>
            </View>
            <Text style={styles.summaryPrice}>${totalPrice.toFixed(0)}</Text>
          </View>
        )}

        {errorMsg && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.errorLight} />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.ctaBtn, (!canSubmit || submitState === "saving") && { opacity: 0.55 }]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitState === "saving"}
          activeOpacity={0.8}
        >
          {submitState === "saving" ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.ctaBtnText}>
              {entries.length > 1 ? `Create ${entries.length} Bookings` : "Create Booking"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {detailerId !== null && addServiceForEntryId !== null && (
        <ServiceDrawer
          visible
          onRequestClose={() => setAddServiceForEntryId(null)}
          detailerId={detailerId}
          onSaved={(saved) => handleServiceAdded(addServiceForEntryId, saved.id)}
        />
      )}

      <DateTimeDrawer
        visible={dateTimeDrawerVisible}
        onRequestClose={() => setDateTimeDrawerVisible(false)}
        value={scheduledAt}
        onConfirm={(iso) => {
          setScheduledAt(iso);
          setDateTimeDrawerVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

// ─── NavHeader ─────────────────────────────────────────────────────────────────

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

  // Nav header
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

  // Scroll
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Platform.OS === "ios" ? 40 : Spacing.xl,
    gap: Spacing.mdSm,
  },

  // Card
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

  // Mode toggle
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

  // Field label
  fieldLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },

  // Text inputs
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
    height: 88,
    paddingTop: Spacing.mdSm,
    marginBottom: 0,
  },
  twoCol: { flexDirection: "row", gap: Spacing.sm },
  halfField: { flex: 1 },

  // Dropdown
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

  // Selected / hint rows
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

  // Section divider (within card)
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
    marginVertical: Spacing.mdSm,
  },

  // Source picker
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
  sourcePickerItemActive: { backgroundColor: Colors.foamBlueSubtle },
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

  // Vehicle entry card header
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.mdSm,
  },

  // Saved vehicle picker
  vehicleLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.mdSm,
  },
  vehicleLoadingText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
  },
  savedVehicleList: {
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    borderRadius: Radius.md,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  savedVehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.mdSm,
    paddingHorizontal: Spacing.mdSm,
    paddingVertical: Spacing.mdSm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.surface,
  },
  savedVehicleRowSelected: {
    backgroundColor: Colors.foamBlueSubtle,
  },
  savedVehicleName: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  savedVehicleType: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  switchModeLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  switchModeLinkText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.foamBlue,
  },

  // Vehicle type selector
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

  // Service separator within vehicle card
  serviceSeparator: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    marginTop: Spacing.mdSm,
    marginBottom: Spacing.mdSm,
    paddingTop: Spacing.mdSm,
  },
  serviceSubLabel: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
  },

  // No services empty state
  noServicesBox: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  noServicesIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    maxWidth: 240,
    lineHeight: 21,
  },
  addServiceBtn: {
    height: 44,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    alignSelf: "stretch",
  },
  addServiceBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },

  // Package list
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
  addPackageLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  addPackageLinkText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.foamBlue,
  },

  // Add vehicle button
  addVehicleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.mdSm,
    borderWidth: 1.5,
    borderColor: Colors.foamBlue,
    borderRadius: Radius.lg,
    borderStyle: "dashed",
    backgroundColor: Colors.foamBlueSubtle,
  },
  addVehicleBtnText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },

  // Date & time
  dateTimeField: {
    height: 48,
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
  dateTimeFieldPlaceholder: { color: Colors.light.textTertiary },
  durationHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  durationHintText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.foamBlue,
  },

  // Summary bar
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

  // Error
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

  // CTA
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

  // Success
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
