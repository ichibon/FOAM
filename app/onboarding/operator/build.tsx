import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  Switch,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Colors, Typography, Spacing, Radius, Shadows, Drawer } from "@/constants/design";
import { supabase } from "@/lib/supabase";
import { DrawerModal } from "@/components/DrawerModal";
import { LucideIcon } from "@/components/LucideIcon";

type AssetType = "van" | "trailer" | "truck" | "other";
type StripeDrawerState = "default" | "success" | "error";

interface DayAvailability {
  day: string;
  key: string;
  enabled: boolean;
  open: string;
  close: string;
}

interface AddedVan {
  id: string;
  name: string;
  asset_type: AssetType;
  licensePlate: string;
  homeBase: string;
  radius: number;
  availability: DayAvailability[];
  notes: string;
}

interface AddedLocation {
  id: string;
  name: string;
  address: string;
  bays: number;
  walkIns: boolean;
  hours: DayAvailability[];
  phone: string;
}

const RADIUS_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50];

const DEFAULT_AVAILABILITY: DayAvailability[] = [
  { day: "Mon", key: "mon", enabled: true, open: "9:00 AM", close: "6:00 PM" },
  { day: "Tue", key: "tue", enabled: true, open: "9:00 AM", close: "6:00 PM" },
  { day: "Wed", key: "wed", enabled: true, open: "9:00 AM", close: "6:00 PM" },
  { day: "Thu", key: "thu", enabled: true, open: "9:00 AM", close: "6:00 PM" },
  { day: "Fri", key: "fri", enabled: true, open: "9:00 AM", close: "6:00 PM" },
  { day: "Sat", key: "sat", enabled: false, open: "9:00 AM", close: "6:00 PM" },
  { day: "Sun", key: "sun", enabled: false, open: "9:00 AM", close: "6:00 PM" },
];

async function saveVanMeta(
  detailerId: string,
  vanId: string,
  meta: { licensePlate: string; homeBase: string; radius: number; availability: DayAvailability[]; notes: string }
) {
  try {
    await AsyncStorage.setItem(
      `foam_van_extra_${detailerId}_${vanId}`,
      JSON.stringify(meta)
    );
  } catch {
    // no-op
  }
}

async function loadVanMeta(
  detailerId: string,
  vanId: string
): Promise<{ licensePlate: string; homeBase: string; radius: number; availability: DayAvailability[]; notes: string } | null> {
  try {
    const raw = await AsyncStorage.getItem(`foam_van_extra_${detailerId}_${vanId}`);
    return raw ? (JSON.parse(raw) as { licensePlate: string; homeBase: string; radius: number; availability: DayAvailability[]; notes: string }) : null;
  } catch {
    return null;
  }
}

function hoursJsonbToAvailability(
  hoursJsonb: Record<string, { open: string; close: string } | null> | null
): DayAvailability[] {
  if (!hoursJsonb) return DEFAULT_AVAILABILITY.map((d) => ({ ...d }));
  return DEFAULT_AVAILABILITY.map((d) => {
    const h = hoursJsonb[d.key];
    if (!h) return { ...d, enabled: false };
    const toAMPM = (hhmm: string) => {
      const [hStr, mStr] = hhmm.split(":");
      const h24 = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      const ampm = h24 >= 12 ? "PM" : "AM";
      const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
      return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
    };
    return { ...d, enabled: true, open: toAMPM(h.open), close: toAMPM(h.close) };
  });
}

function availabilityToHoursJsonb(avail: DayAvailability[]) {
  const result: Record<string, { open: string; close: string } | null> = {};
  for (const d of avail) {
    if (!d.enabled) {
      result[d.key] = null;
    } else {
      const toHHMM = (t: string) => {
        const [time, ampm] = t.split(" ");
        const [h, m] = time.split(":").map(Number);
        const hour24 = ampm === "PM" && h !== 12 ? h + 12 : ampm === "AM" && h === 12 ? 0 : h;
        return `${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      };
      result[d.key] = { open: toHHMM(d.open), close: toHHMM(d.close) };
    }
  }
  return result;
}

export default function BuildOperationScreen() {
  const [vans, setVans] = useState<AddedVan[]>([]);
  const [locations, setLocations] = useState<AddedLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const detailerIdRef = useRef<string | null>(null);

  // Van drawer state
  const [showVanDrawer, setShowVanDrawer] = useState(false);
  const [editingVanId, setEditingVanId] = useState<string | null>(null);
  const [vanName, setVanName] = useState("");
  const [vanType, setVanType] = useState<AssetType>("van");
  const [vanLicensePlate, setVanLicensePlate] = useState("");
  const [vanHomeBase, setVanHomeBase] = useState("");
  const [vanRadius, setVanRadius] = useState(15);
  const [vanAvailability, setVanAvailability] = useState<DayAvailability[]>(
    DEFAULT_AVAILABILITY.map((d) => ({ ...d }))
  );
  const [vanNotes, setVanNotes] = useState("");
  const [vanSaving, setVanSaving] = useState(false);
  const [vanError, setVanError] = useState<string | null>(null);

  // Location drawer state
  const [showLocDrawer, setShowLocDrawer] = useState(false);
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [locName, setLocName] = useState("");
  const [locAddress, setLocAddress] = useState("");
  const [locBays, setLocBays] = useState(2);
  const [locWalkIns, setLocWalkIns] = useState(false);
  const [locHours, setLocHours] = useState<DayAvailability[]>(
    DEFAULT_AVAILABILITY.map((d) => ({ ...d }))
  );
  const [locPhone, setLocPhone] = useState("");
  const [locSaving, setLocSaving] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Stripe drawer state
  const [showStripeDrawer, setShowStripeDrawer] = useState(false);
  const [stripeState, setStripeState] = useState<StripeDrawerState>("default");
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeFetching, setStripeFetching] = useState(false);

  const assetTypes: { id: AssetType; label: string }[] = [
    { id: "van", label: "Van" },
    { id: "trailer", label: "Trailer" },
    { id: "truck", label: "Truck" },
    { id: "other", label: "Other" },
  ];

  async function getDetailerProfileId(): Promise<string | null> {
    if (detailerIdRef.current) return detailerIdRef.current;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("detailer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
    detailerIdRef.current = data?.id ?? null;
    return detailerIdRef.current;
  }

  useEffect(() => {
    void (async () => {
      try {
        const detailerId = await getDetailerProfileId();
        if (!detailerId) return;
        const [{ data: assetsData }, { data: locsData }] = await Promise.all([
          supabase
            .from("business_assets")
            .select("id, name, asset_type")
            .eq("detailer_id", detailerId)
            .eq("is_active", true)
            .order("created_at"),
          supabase
            .from("business_locations")
            .select("id, name, address, bay_count, accepts_walkins, hours")
            .eq("detailer_id", detailerId)
            .eq("is_active", true)
            .order("created_at"),
        ]);
        const loadedVans = await Promise.all(
          (assetsData ?? []).map(async (a) => {
            const meta = await loadVanMeta(detailerId, a.id);
            return {
              id: a.id,
              name: a.name,
              asset_type: a.asset_type as AssetType,
              licensePlate: meta?.licensePlate ?? "",
              homeBase: meta?.homeBase ?? "",
              radius: meta?.radius ?? 15,
              availability: meta?.availability ?? DEFAULT_AVAILABILITY.map((d) => ({ ...d })),
              notes: meta?.notes ?? "",
            };
          })
        );
        const loadedLocs = (locsData ?? []).map((l) => ({
          id: l.id,
          name: l.name,
          address: (l.address as string) ?? "",
          bays: (l.bay_count as number) ?? 2,
          walkIns: (l.accepts_walkins as boolean) ?? false,
          hours: hoursJsonbToAvailability(
            l.hours as Record<string, { open: string; close: string } | null> | null
          ),
          phone: "",
        }));
        setVans(loadedVans);
        setLocations(loadedLocs);
      } catch (err) {
        console.warn("[Build] loadExistingUnits failed", err);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetVanForm() {
    setEditingVanId(null);
    setVanName("");
    setVanType("van");
    setVanLicensePlate("");
    setVanHomeBase("");
    setVanRadius(15);
    setVanAvailability(DEFAULT_AVAILABILITY.map((d) => ({ ...d })));
    setVanNotes("");
    setVanError(null);
  }

  function resetLocForm() {
    setEditingLocId(null);
    setLocName("");
    setLocAddress("");
    setLocBays(2);
    setLocWalkIns(false);
    setLocHours(DEFAULT_AVAILABILITY.map((d) => ({ ...d })));
    setLocPhone("");
    setLocError(null);
  }

  function openAddVan() {
    resetVanForm();
    setShowVanDrawer(true);
  }

  function openEditVan(van: AddedVan) {
    setEditingVanId(van.id);
    setVanName(van.name);
    setVanType(van.asset_type);
    setVanLicensePlate(van.licensePlate);
    setVanHomeBase(van.homeBase);
    setVanRadius(van.radius);
    setVanAvailability(van.availability.map((d) => ({ ...d })));
    setVanNotes(van.notes);
    setVanError(null);
    setShowVanDrawer(true);
  }

  function openAddLoc() {
    resetLocForm();
    setShowLocDrawer(true);
  }

  function openEditLoc(loc: AddedLocation) {
    setEditingLocId(loc.id);
    setLocName(loc.name);
    setLocAddress(loc.address);
    setLocBays(loc.bays);
    setLocWalkIns(loc.walkIns);
    setLocHours(loc.hours.map((d) => ({ ...d })));
    setLocPhone(loc.phone);
    setLocError(null);
    setShowLocDrawer(true);
  }

  async function handleSaveVan() {
    if (!vanName.trim() || !vanHomeBase.trim()) return;
    setVanSaving(true);
    setVanError(null);
    try {
      const detailerId = await getDetailerProfileId();
      if (!detailerId) throw new Error("Profile not found");

      const vanMeta = {
        licensePlate: vanLicensePlate.trim(),
        homeBase: vanHomeBase.trim(),
        radius: vanRadius,
        availability: vanAvailability.map((d) => ({ ...d })),
        notes: vanNotes.trim(),
      };

      if (editingVanId) {
        const { error } = await supabase
          .from("business_assets")
          .update({ name: vanName.trim(), asset_type: vanType })
          .eq("id", editingVanId);
        if (error) throw error;
        await saveVanMeta(detailerId, editingVanId, vanMeta);
        setVans((prev) =>
          prev.map((v) =>
            v.id === editingVanId
              ? { ...v, name: vanName.trim(), asset_type: vanType, ...vanMeta }
              : v
          )
        );
      } else {
        const { data, error } = await supabase
          .from("business_assets")
          .insert({ detailer_id: detailerId, name: vanName.trim(), asset_type: vanType })
          .select("id")
          .single();
        if (error) throw error;
        await saveVanMeta(detailerId, data.id, vanMeta);
        setVans((prev) => [
          ...prev,
          { id: data.id, name: vanName.trim(), asset_type: vanType, ...vanMeta },
        ]);
      }
      setShowVanDrawer(false);
    } catch (err) {
      console.warn("[Build] handleSaveVan failed", err);
      setVanError("Couldn't save vehicle. Please try again.");
    }
    setVanSaving(false);
  }

  async function handleDeleteVan() {
    if (!editingVanId) return;
    if (Platform.OS !== "web") {
      Alert.alert("Delete Van", "Remove this van from your operation?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void confirmDeleteVan(),
        },
      ]);
    } else {
      await confirmDeleteVan();
    }
  }

  async function confirmDeleteVan() {
    setVanSaving(true);
    try {
      await supabase.from("business_assets").delete().eq("id", editingVanId!);
      setVans((prev) => prev.filter((v) => v.id !== editingVanId));
      setShowVanDrawer(false);
    } catch (err) {
      console.warn("[Build] confirmDeleteVan failed", err);
      setVanError("Couldn't delete van. Please try again.");
    }
    setVanSaving(false);
  }

  async function handleSaveLocation() {
    if (!locName.trim() || !locAddress.trim()) return;
    setLocSaving(true);
    setLocError(null);
    try {
      const detailerId = await getDetailerProfileId();
      if (!detailerId) throw new Error("Profile not found");
      const hoursJsonb = availabilityToHoursJsonb(locHours);

      if (editingLocId) {
        const { error } = await supabase
          .from("business_locations")
          .update({
            name: locName.trim(),
            address: locAddress.trim(),
            bay_count: locBays,
            accepts_walkins: locWalkIns,
            hours: hoursJsonb,
          })
          .eq("id", editingLocId);
        if (error) throw error;
        setLocations((prev) =>
          prev.map((l) =>
            l.id === editingLocId
              ? {
                  ...l,
                  name: locName.trim(),
                  address: locAddress.trim(),
                  bays: locBays,
                  walkIns: locWalkIns,
                  hours: locHours.map((d) => ({ ...d })),
                  phone: locPhone.trim(),
                }
              : l
          )
        );
      } else {
        const { data, error } = await supabase
          .from("business_locations")
          .insert({
            detailer_id: detailerId,
            name: locName.trim(),
            address: locAddress.trim(),
            bay_count: locBays,
            accepts_walkins: locWalkIns,
            hours: hoursJsonb,
          })
          .select("id")
          .single();
        if (error) throw error;
        setLocations((prev) => [
          ...prev,
          {
            id: data.id,
            name: locName.trim(),
            address: locAddress.trim(),
            bays: locBays,
            walkIns: locWalkIns,
            hours: locHours.map((d) => ({ ...d })),
            phone: locPhone.trim(),
          },
        ]);
      }
      setShowLocDrawer(false);
    } catch (err) {
      console.warn("[Build] handleSaveLocation failed", err);
      setLocError("Couldn't save location. Please try again.");
    }
    setLocSaving(false);
  }

  async function handleDeleteLocation() {
    if (!editingLocId) return;
    if (Platform.OS !== "web") {
      Alert.alert("Delete Location", "Remove this location from your operation?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void confirmDeleteLocation(),
        },
      ]);
    } else {
      await confirmDeleteLocation();
    }
  }

  async function confirmDeleteLocation() {
    setLocSaving(true);
    try {
      await supabase.from("business_locations").delete().eq("id", editingLocId!);
      setLocations((prev) => prev.filter((l) => l.id !== editingLocId));
      setShowLocDrawer(false);
    } catch (err) {
      console.warn("[Build] confirmDeleteLocation failed", err);
      setLocError("Couldn't delete location. Please try again.");
    }
    setLocSaving(false);
  }

  async function handleStripeConnect() {
    setStripeFetching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");
      const detailerId = await getDetailerProfileId();
      if (!detailerId) throw new Error("No profile");

      const response = await fetch(
        "https://yteffvegixoqvjoykwzx.supabase.co/functions/v1/stripe-connect-onboard",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ detailer_id: detailerId }),
        }
      );
      const json = await response.json();
      if (!json?.url) throw new Error("No URL returned");

      const result = await WebBrowser.openAuthSessionAsync(
        json.url,
        Linking.createURL("stripe-return")
      );

      if (result.type === "success") {
        const { data: profile } = await supabase
          .from("detailer_profiles")
          .select("badge_verified, stripe_account_id")
          .eq("id", detailerId)
          .single();
        setStripeState("success");
        setTimeout(() => {
          setShowStripeDrawer(false);
          setStripeConnected(!!(profile?.stripe_account_id));
        }, 2000);
      } else {
        setStripeState("default");
      }
    } catch (err) {
      console.warn("[Build] handleStripeConnect failed", err);
      setStripeState("error");
    }
    setStripeFetching(false);
  }

  function toggleVanDay(idx: number) {
    setVanAvailability((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, enabled: !d.enabled } : d))
    );
  }

  function toggleLocDay(idx: number) {
    setLocHours((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, enabled: !d.enabled } : d))
    );
  }

  async function handleContinue() {
    if (vans.length === 0 && locations.length === 0) return;
    setLoading(true);
    router.push("/onboarding/operator/assign-crew");
    setLoading(false);
  }

  const hasUnits = vans.length > 0 || locations.length > 0;
  const vanSaveEnabled = vanName.trim().length > 0 && vanHomeBase.trim().length > 0;
  const locSaveEnabled = locName.trim().length > 0 && locAddress.trim().length > 0;

  const activeDaysLabel = (avail: DayAvailability[]) => {
    const on = avail.filter((d) => d.enabled).map((d) => d.day);
    if (on.length === 0) return "Unavailable all week";
    if (on.length === 7) return "Every day";
    return on.join(", ");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.progressHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <LucideIcon name="ChevronLeft" size={20} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Step 2 of 4</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.progressTrackWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "50%" }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introBlock}>
          <Text style={styles.headline}>Build your operation.</Text>
          <Text style={styles.subheadline}>
            Add your vans and locations. You can always add more later.
          </Text>
        </View>

        {!hasUnits ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconRow}>
              <LucideIcon name="Truck" size={40} color={Colors.light.textDisabled} />
              <LucideIcon name="Building2" size={40} color={Colors.light.textDisabled} />
            </View>
            <Text style={styles.emptyTitle}>No units added yet.</Text>
            <Text style={styles.emptyBody}>Add your first van or location below.</Text>
          </View>
        ) : (
          <View style={styles.operationSection}>
            <Text style={styles.sectionLabel}>YOUR OPERATION</Text>
            <View style={styles.unitList}>
              {vans.map((van) => (
                <TouchableOpacity
                  key={van.id}
                  style={styles.unitCard}
                  onPress={() => openEditVan(van)}
                  activeOpacity={0.85}
                >
                  <View style={styles.unitIconCircle}>
                    <LucideIcon name="Truck" size={24} color={Colors.foamBlue} />
                  </View>
                  <View style={styles.unitInfo}>
                    <Text style={styles.unitName}>{van.name}</Text>
                    <Text style={styles.unitMeta}>
                      {van.homeBase ? `${van.homeBase.split(",")[0]} · ` : ""}
                      {van.radius} mi radius
                    </Text>
                    <Text style={styles.unitCrewWarning}>No crew assigned</Text>
                  </View>
                  <LucideIcon name="PencilLine" size={18} color={Colors.light.textTertiary} />
                </TouchableOpacity>
              ))}
              {locations.map((loc) => {
                const onDays = loc.hours.filter((d) => d.enabled);
                const hoursLabel =
                  onDays.length > 0 ? `Open ${onDays[0].open} – ${onDays[0].close}` : "Hours not set";
                return (
                  <TouchableOpacity
                    key={loc.id}
                    style={styles.unitCard}
                    onPress={() => openEditLoc(loc)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.unitIconCircle}>
                      <LucideIcon name="Building2" size={24} color={Colors.foamBlue} />
                    </View>
                    <View style={styles.unitInfo}>
                      <Text style={styles.unitName}>{loc.name}</Text>
                      <Text style={styles.unitMeta}>
                        {loc.address.split(",")[0]} · {loc.bays} {loc.bays === 1 ? "bay" : "bays"}
                      </Text>
                      <Text style={styles.unitMetaSub}>
                        {hoursLabel} · Walk-ins {loc.walkIns ? "on" : "off"}
                      </Text>
                    </View>
                    <LucideIcon name="PencilLine" size={18} color={Colors.light.textTertiary} />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.addMoreRow}>
              <TouchableOpacity
                style={styles.addMoreButton}
                onPress={openAddVan}
                activeOpacity={0.8}
              >
                <LucideIcon name="Truck" size={16} color={Colors.foamBlue} />
                <Text style={styles.addMoreText}>+ Add Another Van</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addMoreButton}
                onPress={openAddLoc}
                activeOpacity={0.8}
              >
                <LucideIcon name="Building2" size={16} color={Colors.foamBlue} />
                <Text style={styles.addMoreText}>+ Add Another Location</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.getPaidSection}>
              <Text style={styles.sectionLabel}>GET PAID</Text>
              <TouchableOpacity
                style={[styles.bankButton, stripeConnected && styles.bankButtonConnected]}
                onPress={() => { setStripeState("default"); setShowStripeDrawer(true); }}
                activeOpacity={0.85}
              >
                <View style={styles.bankButtonLeft}>
                  <View style={[styles.bankIconCircle, stripeConnected && styles.bankIconCircleConnected]}>
                    <LucideIcon
                      name={stripeConnected ? "CheckCircle" : "Landmark"}
                      size={20}
                      color={stripeConnected ? "#16A34A" : Colors.foamBlue}
                    />
                  </View>
                  <View style={styles.bankButtonTextBlock}>
                    <Text style={[styles.bankButtonLabel, stripeConnected && styles.bankButtonLabelConnected]}>
                      {stripeConnected ? "Bank connected" : "Connect your bank — get paid faster"}
                    </Text>
                    {!stripeConnected && (
                      <Text style={styles.bankButtonCaption}>
                        Optional now — required before your first payout.
                      </Text>
                    )}
                  </View>
                </View>
                <LucideIcon name="ChevronRight" size={18} color={stripeConnected ? "#16A34A" : Colors.foamBlue} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!hasUnits && (
          <View style={styles.addButtonsRow}>
            <TouchableOpacity style={styles.addVanButton} onPress={openAddVan} activeOpacity={0.85}>
              <LucideIcon name="Truck" size={20} color={Colors.white} />
              <Text style={styles.addVanButtonText}>Add a Van</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addLocButton} onPress={openAddLoc} activeOpacity={0.85}>
              <LucideIcon name="Building2" size={20} color={Colors.foamBlue} />
              <Text style={styles.addLocButtonText}>Add a Location</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, (!hasUnits || loading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!hasUnits || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
        {!hasUnits && (
          <Text style={styles.footerHint}>Add at least one van or location to continue.</Text>
        )}
      </View>

      {/* Add/Edit Van Drawer */}
      <DrawerModal
        visible={showVanDrawer}
        onRequestClose={() => { setShowVanDrawer(false); resetVanForm(); }}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            onPress={() => { setShowVanDrawer(false); resetVanForm(); }}
          />
          <View style={styles.drawer}>
            <View style={styles.drawerHandle} />

            <View style={styles.drawerHeaderRow}>
              {editingVanId ? (
                <>
                  <Text style={styles.drawerTitle}>Edit Van</Text>
                  <TouchableOpacity onPress={handleDeleteVan} activeOpacity={0.7}>
                    <Text style={styles.deleteText}>Delete Van</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.drawerTitleCenter}>Add a Van</Text>
              )}
            </View>

            <ScrollView
              style={styles.drawerScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.drawerForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Van name</Text>
                  <TextInput
                    style={styles.input}
                    value={vanName}
                    onChangeText={setVanName}
                    placeholder="e.g., Van 1, Marcus's Rig, Team Blue"
                    placeholderTextColor={Colors.light.textTertiary}
                    autoCapitalize="words"
                  />
                  <Text style={styles.inputHint}>Visible to crew and in your dashboard.</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    License plate <Text style={styles.optionalLabel}>(Optional)</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={vanLicensePlate}
                    onChangeText={setVanLicensePlate}
                    placeholder="e.g., GHK-4821"
                    placeholderTextColor={Colors.light.textTertiary}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Type</Text>
                  <View style={styles.typeRow}>
                    {([
                      { id: "van", label: "Van" },
                      { id: "trailer", label: "Trailer" },
                      { id: "truck", label: "Truck" },
                      { id: "other", label: "Other" },
                    ] as { id: AssetType; label: string }[]).map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.typePill, vanType === t.id && styles.typePillActive]}
                        onPress={() => setVanType(t.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.typePillText, vanType === t.id && styles.typePillTextActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.sectionDivider} />
                <Text style={styles.sectionMiniLabel}>SERVICE AREA</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Home base address</Text>
                  <View style={styles.inputWithIcon}>
                    <View style={styles.inputIconLeft}>
                      <LucideIcon name="MapPin" size={18} color={Colors.foamBlue} />
                    </View>
                    <TextInput
                      style={[styles.input, styles.inputPaddingLeft]}
                      value={vanHomeBase}
                      onChangeText={setVanHomeBase}
                      placeholder="Where does this van start each day?"
                      placeholderTextColor={Colors.light.textTertiary}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.radiusCard}>
                  <Text style={styles.sectionMiniLabel}>TRAVEL RADIUS</Text>
                  <View style={styles.radiusGrid}>
                    {RADIUS_OPTIONS.map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.radiusPill, vanRadius === r && styles.radiusPillActive]}
                        onPress={() => setVanRadius(r)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.radiusPillText, vanRadius === r && styles.radiusPillTextActive]}>
                          {r} mi
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.radiusInfoBox}>
                    <Text style={styles.radiusInfoText}>
                      At {vanRadius} miles you'll reach customers across a large service area.
                    </Text>
                  </View>
                </View>

                <View style={styles.sectionDivider} />
                <Text style={styles.sectionMiniLabel}>DEFAULT AVAILABILITY</Text>

                <View style={styles.availabilityList}>
                  {vanAvailability.map((d, idx) => (
                    <View key={d.key} style={styles.dayRow}>
                      <View style={styles.dayRowLeft}>
                        <Text style={styles.dayLabel}>{d.day}</Text>
                        {d.enabled ? (
                          <Text style={styles.dayTimeLabel}>{d.open} – {d.close}</Text>
                        ) : (
                          <Text style={styles.dayUnavailableLabel}>Unavailable</Text>
                        )}
                      </View>
                      <Switch
                        value={d.enabled}
                        onValueChange={() => toggleVanDay(idx)}
                        trackColor={{ false: Colors.light.borderDefault, true: Colors.foamBlue }}
                        thumbColor={Colors.white}
                      />
                    </View>
                  ))}
                </View>

                <View style={styles.sectionDivider} />
                <Text style={styles.sectionMiniLabel}>
                  EQUIPMENT NOTES <Text style={styles.optionalLabel}>(Optional)</Text>
                </Text>

                <View style={styles.inputGroup}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={vanNotes}
                    onChangeText={setVanNotes}
                    placeholder="e.g., Has steam cleaner, no clay bar, carries ceramic coating supplies"
                    placeholderTextColor={Colors.light.textTertiary}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <Text style={styles.inputHint}>Helps crew know what's available on this van.</Text>
                </View>
              </View>
            </ScrollView>

            {vanError && <Text style={styles.drawerError}>{vanError}</Text>}

            <View style={styles.drawerFooter}>
              <TouchableOpacity
                style={[styles.drawerButton, (!vanSaveEnabled || vanSaving) && styles.buttonDisabled]}
                onPress={handleSaveVan}
                disabled={!vanSaveEnabled || vanSaving}
                activeOpacity={0.85}
              >
                {vanSaving ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.drawerButtonText}>
                    {editingVanId ? "Save Changes" : "Save Van"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </DrawerModal>

      {/* Add/Edit Location Drawer */}
      <DrawerModal
        visible={showLocDrawer}
        onRequestClose={() => { setShowLocDrawer(false); resetLocForm(); }}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            onPress={() => { setShowLocDrawer(false); resetLocForm(); }}
          />
          <View style={styles.drawer}>
            <View style={styles.drawerHandle} />

            <View style={styles.drawerHeaderRow}>
              {editingLocId ? (
                <>
                  <Text style={styles.drawerTitle}>Edit Location</Text>
                  <TouchableOpacity onPress={handleDeleteLocation} activeOpacity={0.7}>
                    <Text style={styles.deleteText}>Delete Location</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.drawerTitleCenter}>Add a Location</Text>
              )}
            </View>

            <ScrollView
              style={styles.drawerScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.drawerForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Location name</Text>
                  <TextInput
                    style={styles.input}
                    value={locName}
                    onChangeText={setLocName}
                    placeholder="e.g., Buckhead Shop, Main Street"
                    placeholderTextColor={Colors.light.textTertiary}
                    autoCapitalize="words"
                  />
                  <Text style={styles.inputHint}>Customers see this name when booking.</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address</Text>
                  <View style={styles.inputWithIcon}>
                    <View style={styles.inputIconLeft}>
                      <LucideIcon name="MapPin" size={18} color={Colors.foamBlue} />
                    </View>
                    <TextInput
                      style={[styles.input, styles.inputPaddingLeft]}
                      value={locAddress}
                      onChangeText={setLocAddress}
                      placeholder="Start typing your address..."
                      placeholderTextColor={Colors.light.textTertiary}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.sectionDivider} />
                <Text style={styles.sectionMiniLabel}>CAPACITY</Text>

                <View style={styles.baysCard}>
                  <Text style={styles.sectionMiniLabel}>NUMBER OF BAYS</Text>
                  <Text style={styles.baysSubtext}>How many vehicles can you service at once?</Text>
                  <View style={styles.baysStepper}>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => setLocBays((b) => Math.max(1, b - 1))}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepperButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperCount}>{locBays}</Text>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => setLocBays((b) => Math.min(20, b + 1))}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepperButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.walkInsCard}>
                  <View style={styles.walkInsRow}>
                    <View style={styles.walkInsLeft}>
                      <LucideIcon name="Footprints" size={18} color={Colors.foamBlue} />
                      <Text style={styles.walkInsLabel}>Accept walk-ins</Text>
                    </View>
                    <Switch
                      value={locWalkIns}
                      onValueChange={setLocWalkIns}
                      trackColor={{ false: Colors.light.borderDefault, true: Colors.foamBlue }}
                      thumbColor={Colors.white}
                    />
                  </View>
                  <Text style={styles.walkInsHint}>
                    Customers can arrive without an appointment.
                  </Text>
                </View>

                <View style={styles.sectionDivider} />
                <Text style={styles.sectionMiniLabel}>OPERATING HOURS</Text>

                <View style={styles.availabilityList}>
                  {locHours.map((d, idx) => (
                    <View key={d.key} style={styles.dayRow}>
                      <View style={styles.dayRowLeft}>
                        <Text style={styles.dayLabel}>{d.day}</Text>
                        {d.enabled ? (
                          <Text style={styles.dayTimeLabel}>{d.open} – {d.close}</Text>
                        ) : (
                          <Text style={styles.dayUnavailableLabel}>Unavailable</Text>
                        )}
                      </View>
                      <Switch
                        value={d.enabled}
                        onValueChange={() => toggleLocDay(idx)}
                        trackColor={{ false: Colors.light.borderDefault, true: Colors.foamBlue }}
                        thumbColor={Colors.white}
                      />
                    </View>
                  ))}
                </View>

                <View style={styles.sectionDivider} />

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Location phone <Text style={styles.optionalLabel}>(Optional)</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={locPhone}
                    onChangeText={setLocPhone}
                    placeholder="(404) 555-0123"
                    placeholderTextColor={Colors.light.textTertiary}
                    keyboardType="phone-pad"
                  />
                  <Text style={styles.inputHint}>Displayed to customers on your location profile.</Text>
                </View>
              </View>
            </ScrollView>

            {locError && <Text style={styles.drawerError}>{locError}</Text>}

            <View style={styles.drawerFooter}>
              <TouchableOpacity
                style={[styles.drawerButton, (!locSaveEnabled || locSaving) && styles.buttonDisabled]}
                onPress={handleSaveLocation}
                disabled={!locSaveEnabled || locSaving}
                activeOpacity={0.85}
              >
                {locSaving ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.drawerButtonText}>
                    {editingLocId ? "Save Changes" : "Save Location"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </DrawerModal>

      {/* Stripe Connect Drawer */}
      <DrawerModal
        visible={showStripeDrawer}
        onRequestClose={() => setShowStripeDrawer(false)}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            onPress={() => setShowStripeDrawer(false)}
          />
          <View style={styles.stripeDrawer}>
            <View style={styles.drawerHandle} />

            {stripeState === "success" ? (
              <View style={styles.stripeSuccess}>
                <View style={styles.stripeSuccessIcon}>
                  <LucideIcon name="CheckCircle" size={44} color="#16A34A" />
                </View>
                <Text style={styles.stripeSuccessTitle}>You're connected.</Text>
                <Text style={styles.stripeSuccessBody}>Your bank account is ready to receive payouts.</Text>
              </View>
            ) : stripeState === "error" ? (
              <View style={styles.stripeError}>
                <View style={styles.stripeErrorIcon}>
                  <LucideIcon name="AlertCircle" size={36} color={Colors.warningLight} />
                </View>
                <Text style={styles.stripeErrorTitle}>Something went wrong.</Text>
                <Text style={styles.stripeErrorBody}>Tap to try again.</Text>
                <TouchableOpacity
                  style={styles.stripeRetryButton}
                  onPress={handleStripeConnect}
                  activeOpacity={0.85}
                >
                  <Text style={styles.stripeRetryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.stripeDefaultScroll}>
                <View style={styles.stripeDefaultContent}>
                  <View style={styles.stripeShieldIcon}>
                    <LucideIcon name="Shield" size={24} color={Colors.foamBlue} />
                  </View>
                  <Text style={styles.stripeDrawerTitle}>Get paid with Stripe.</Text>
                  <Text style={styles.stripeDrawerBody}>
                    Stripe is how FOAM sends you money after every job. Free to set up, takes about 3 minutes. Your banking info is always encrypted — FOAM never stores it.
                  </Text>

                  <View style={styles.stripeFeatureList}>
                    {[
                      { icon: "ShieldCheck", title: "Bank-level encryption", body: "Your data is never stored by FOAM", color: Colors.foamBlue, bg: Colors.foamBlueSubtle },
                      { icon: "Zap", title: "Fast payouts", body: "Standard 2 days · Instant transfer available", color: Colors.successLight, bg: "rgba(22,163,74,0.10)" },
                      { icon: "Globe", title: "Trusted by millions", body: "3M+ businesses worldwide use Stripe", color: "#2563EB", bg: "rgba(59,130,246,0.10)" },
                    ].map((f, i) => (
                      <View key={i} style={styles.stripeFeatureRow}>
                        <View style={[styles.stripeFeatureIcon, { backgroundColor: f.bg }]}>
                          <LucideIcon name={f.icon} size={18} color={f.color} />
                        </View>
                        <View style={styles.stripeFeatureText}>
                          <Text style={styles.stripeFeatureTitle}>{f.title}</Text>
                          <Text style={styles.stripeFeatureBody}>{f.body}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.stripeSetupButton, stripeFetching && styles.buttonDisabled]}
                    onPress={handleStripeConnect}
                    disabled={stripeFetching}
                    activeOpacity={0.85}
                  >
                    {stripeFetching ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.stripeSetupButtonText}>Set up Stripe — it's free</Text>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.stripePoweredBy}>Powered by Stripe</Text>

                  <TouchableOpacity
                    style={styles.stripeLaterButton}
                    onPress={() => setShowStripeDrawer(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stripeLaterText}>I'll do this later</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </DrawerModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.xl2,
    paddingBottom: Spacing.sm,
  },
  backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  stepLabel: {
    flex: 1,
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  spacer: { width: 44 },
  progressTrackWrap: { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.light.borderSubtle,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: Colors.foamBlue, borderRadius: 2 },
  content: { paddingHorizontal: Spacing.md, paddingTop: 16, paddingBottom: 160 },
  introBlock: { marginBottom: 24 },
  headline: {
    fontFamily: Typography.display,
    fontSize: 26,
    color: Colors.light.textPrimary,
    lineHeight: 32,
    marginBottom: Spacing.xs,
  },
  subheadline: {
    fontFamily: Typography.body,
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 48,
  },
  emptyIconRow: { flexDirection: "row", gap: 16, marginBottom: 12 },
  emptyTitle: {
    fontFamily: Typography.bodyMedium,
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  emptyBody: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textTertiary,
  },
  addButtonsRow: { gap: 12 },
  addVanButton: {
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Shadows.light.level2,
  },
  addVanButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Colors.white,
  },
  addLocButton: {
    height: 48,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.foamBlue,
  },
  addLocButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Colors.foamBlue,
  },
  operationSection: { gap: 0 },
  sectionLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 16,
    textTransform: "uppercase",
  },
  unitList: { gap: 12, marginBottom: 12 },
  unitCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    ...Shadows.light.level1,
  },
  unitIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  unitInfo: { flex: 1 },
  unitName: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.light.textPrimary,
    lineHeight: 20,
  },
  unitMeta: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  unitMetaSub: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.light.textTertiary,
    lineHeight: 16,
    marginTop: 2,
  },
  unitCrewWarning: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.warningLight,
    marginTop: 2,
  },
  addMoreRow: { gap: 8, marginBottom: 32 },
  addMoreButton: {
    height: 44,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.foamBlue,
  },
  addMoreText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Colors.foamBlue,
  },
  getPaidSection: { marginBottom: 16 },
  bankButton: {
    height: 60,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 6,
    ...Shadows.light.level1,
  },
  bankButtonConnected: {
    borderColor: "rgba(22,163,74,0.3)",
    backgroundColor: "rgba(22,163,74,0.05)",
  },
  bankButtonLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  bankIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  bankIconCircleConnected: { backgroundColor: "rgba(22,163,74,0.10)" },
  bankButtonTextBlock: { flex: 1 },
  bankButtonLabel: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 14,
    color: Colors.foamBlue,
    lineHeight: 18,
  },
  bankButtonLabelConnected: { color: "#16A34A" },
  bankButtonCaption: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Platform.OS === "web" ? 24 : 0,
    paddingTop: Spacing.md,
    alignItems: "center",
    gap: Spacing.sm,
  },
  primaryButton: {
    width: "100%",
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.light.level2,
  },
  buttonDisabled: { opacity: 0.4 },
  primaryButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
  footerHint: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
    textAlign: "center",
  },
  backdrop: { flex: 1, backgroundColor: Drawer.backdropStandard, justifyContent: "flex-end" },
  backdropTouchable: { flex: 1 },
  drawer: {
    backgroundColor: Drawer.background,
    borderTopLeftRadius: Drawer.borderRadius,
    borderTopRightRadius: Drawer.borderRadius,
    maxHeight: "90%",
    ...Shadows.light.level3,
  },
  drawerHandle: {
    width: Drawer.dragHandleWidth,
    height: Drawer.dragHandleHeight,
    borderRadius: 2,
    backgroundColor: Drawer.dragHandleColor,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  drawerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  drawerTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 17,
    color: Colors.light.textPrimary,
  },
  drawerTitleCenter: {
    flex: 1,
    fontFamily: Typography.bodySemiBold,
    fontSize: 17,
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  deleteText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.errorLight,
  },
  drawerScroll: { maxHeight: 500 },
  drawerForm: { padding: Spacing.md, gap: 20, paddingBottom: 100 },
  inputGroup: { gap: 6 },
  inputLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
    color: Colors.light.textSecondary,
  },
  optionalLabel: {
    fontFamily: Typography.body,
    color: Colors.light.textTertiary,
  },
  input: {
    height: 52,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontFamily: Typography.body,
    fontSize: 15,
    color: Colors.light.textPrimary,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  inputHint: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
  },
  inputWithIcon: { position: "relative" },
  inputIconLeft: {
    position: "absolute",
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 1,
  },
  inputPaddingLeft: { paddingLeft: 44 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  typePill: {
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    backgroundColor: Colors.light.surface,
  },
  typePillActive: { backgroundColor: Colors.foamBlue, borderColor: Colors.foamBlue },
  typePillText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  typePillTextActive: { color: Colors.white },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
    marginVertical: 4,
  },
  sectionMiniLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  radiusCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    gap: 12,
  },
  radiusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  radiusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    backgroundColor: Colors.light.surface,
  },
  radiusPillActive: { backgroundColor: Colors.foamBlue, borderColor: Colors.foamBlue },
  radiusPillText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  radiusPillTextActive: { color: Colors.white },
  radiusInfoBox: {
    backgroundColor: Colors.foamBlueSubtle,
    borderRadius: Radius.sm,
    padding: 8,
  },
  radiusInfoText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  availabilityList: { gap: 4 },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  dayRowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  dayLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: 15,
    color: Colors.light.textPrimary,
    width: 40,
  },
  dayTimeLabel: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.foamBlue,
  },
  dayUnavailableLabel: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.light.textTertiary,
  },
  baysCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    gap: 8,
  },
  baysSubtext: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  baysStepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 4,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    backgroundColor: Colors.light.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 20,
    color: Colors.foamBlue,
    lineHeight: 24,
  },
  stepperCount: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 24,
    color: Colors.light.textPrimary,
    minWidth: 40,
    textAlign: "center",
  },
  walkInsCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
  },
  walkInsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  walkInsLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  walkInsLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  walkInsHint: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    marginTop: 8,
    marginLeft: 30,
  },
  drawerFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    paddingBottom: Platform.OS === "web" ? 16 : 32,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
  drawerButton: {
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.light.level2,
  },
  drawerButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
  drawerError: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.error,
    textAlign: "center",
    paddingHorizontal: Spacing.md,
    marginBottom: 4,
  },
  stripeDrawer: {
    backgroundColor: Drawer.background,
    borderTopLeftRadius: Drawer.borderRadius,
    borderTopRightRadius: Drawer.borderRadius,
    maxHeight: "70%",
    ...Shadows.light.level3,
  },
  stripeDefaultScroll: { maxHeight: 500 },
  stripeDefaultContent: {
    padding: 20,
    alignItems: "center",
    paddingBottom: 32,
  },
  stripeShieldIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.foamBlueSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  stripeDrawerTitle: {
    fontFamily: Typography.display,
    fontSize: 22,
    color: Colors.light.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  stripeDrawerBody: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  stripeFeatureList: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    marginBottom: 20,
  },
  stripeFeatureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  stripeFeatureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stripeFeatureText: { flex: 1 },
  stripeFeatureTitle: {
    fontFamily: Typography.bodyMedium,
    fontSize: 13,
    color: Colors.light.textPrimary,
  },
  stripeFeatureBody: {
    fontFamily: Typography.body,
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  stripeSetupButton: {
    width: "100%",
    height: 52,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.light.level2,
    marginBottom: 6,
  },
  stripeSetupButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.white,
  },
  stripePoweredBy: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    alignSelf: "flex-end",
    marginBottom: 12,
  },
  stripeLaterButton: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  stripeLaterText: {
    fontFamily: Typography.body,
    fontSize: 13,
    color: Colors.light.textTertiary,
  },
  stripeSuccess: { padding: 32, alignItems: "center", gap: 12 },
  stripeSuccessIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(22,163,74,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stripeSuccessTitle: {
    fontFamily: Typography.display,
    fontSize: 22,
    color: Colors.light.textPrimary,
  },
  stripeSuccessBody: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  stripeError: { padding: 32, alignItems: "center", gap: 12 },
  stripeErrorIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(217,119,6,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stripeErrorTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 17,
    color: Colors.light.textPrimary,
  },
  stripeErrorBody: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  stripeRetryButton: {
    height: 48,
    paddingHorizontal: 32,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  stripeRetryText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 15,
    color: Colors.white,
  },
});
