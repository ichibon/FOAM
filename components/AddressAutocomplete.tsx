import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Colors, Typography, Radius, Spacing } from "@/constants/design";

export interface AddressResult {
  formattedAddress: string;
  lat: number;
  lng: number;
  zip: string;
}

interface AddressAutocompleteProps {
  onAddressSelect: (result: AddressResult) => void;
  placeholder?: string;
  initialValue?: string;
  restrictToUS?: boolean;
}

interface Prediction {
  place_id: string;
  description: string;
}

const GOOGLE_MAPS_KEY = __DEV__
  ? (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_DEV ?? "")
  : (Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS
      : Platform.OS === "android"
      ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID
      : process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_DEV) ?? "";

const AUTOCOMPLETE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
const DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";

export function AddressAutocomplete({
  onAddressSelect,
  placeholder = "Enter address",
  initialValue = "",
  restrictToUS = true,
}: AddressAutocompleteProps) {
  const [text, setText] = useState(initialValue);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPredictions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setPredictions([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        input,
        key: GOOGLE_MAPS_KEY,
        language: "en",
        types: "address",
        ...(restrictToUS ? { components: "country:us" } : {}),
      });
      const res = await fetch(`${AUTOCOMPLETE_URL}?${params}`);
      const json = await res.json();
      if (json.status === "OK") {
        setPredictions(json.predictions ?? []);
      } else {
        console.warn("[AddressAutocomplete] status:", json.status, json.error_message);
        setPredictions([]);
      }
    } catch (err) {
      console.warn("[AddressAutocomplete] fetch error:", err);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, [restrictToUS]);

  function handleChangeText(value: string) {
    setText(value);
    setSelected(false);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchPredictions(value), 300);
  }

  async function handleSelect(prediction: Prediction) {
    setText(prediction.description);
    setPredictions([]);
    setSelected(true);
    try {
      const params = new URLSearchParams({
        place_id: prediction.place_id,
        key: GOOGLE_MAPS_KEY,
        fields: "formatted_address,geometry,address_components",
      });
      const res = await fetch(`${DETAILS_URL}?${params}`);
      const json = await res.json();
      if (json.status === "OK" && json.result) {
        const r = json.result;
        const zipComp = r.address_components?.find(
          (c: { types: string[]; short_name: string }) => c.types.includes("postal_code")
        );
        onAddressSelect({
          formattedAddress: r.formatted_address,
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,
          zip: zipComp?.short_name ?? "",
        });
      }
    } catch (err) {
      console.warn("[AddressAutocomplete] details error:", err);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.textTertiary}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {loading && (
          <ActivityIndicator size="small" color={Colors.foamBlue} style={styles.spinner} />
        )}
      </View>
      {predictions.length > 0 && !selected && (
        <FlatList
          data={predictions}
          keyExtractor={(item) => item.place_id}
          style={styles.listView}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    zIndex: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.light.bgPrimary,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: Typography.body,
    color: Colors.light.textPrimary,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
  },
  spinner: {
    position: "absolute",
    right: 12,
  },
  listView: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    marginTop: 4,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
  },
  description: {
    fontFamily: Typography.body,
    fontSize: 14,
    color: Colors.light.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
  },
});

