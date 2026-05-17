import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { Colors, Typography, Radius } from "@/constants/design";

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

const GOOGLE_MAPS_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS,
  android: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID,
  default: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_DEV,
}) ?? "";

export function AddressAutocomplete({
  onAddressSelect,
  placeholder = "Enter address",
  initialValue = "",
  restrictToUS = true,
}: AddressAutocompleteProps) {
  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        placeholder={placeholder}
        textInputProps={{
          defaultValue: initialValue,
          placeholderTextColor: Colors.light.textTertiary,
          style: styles.input,
        }}
        fetchDetails
        onPress={(data, details = null) => {
          if (!details) return;
          const zipComp = details.address_components?.find((c) =>
            c.types.includes("postal_code")
          );
          onAddressSelect({
            formattedAddress: details.formatted_address,
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng,
            zip: zipComp?.short_name ?? "",
          });
        }}
        query={{
          key: GOOGLE_MAPS_KEY,
          language: "en",
          components: restrictToUS ? "country:us" : undefined,
          types: "address",
        }}
        styles={{
          container: { flex: 0, zIndex: 10 },
          textInputContainer: { backgroundColor: "transparent" },
          textInput: styles.input,
          listView: styles.listView,
          row: styles.row,
          description: styles.description,
          separator: styles.separator,
          poweredContainer: { display: "none" },
        }}
        enablePoweredByContainer={false}
        keyboardShouldPersistTaps="handled"
        listViewDisplayed="auto"
        minLength={3}
        debounce={300}
        renderDescription={(row) => row.description}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
    width: "100%",
  },
  input: {
    height: 48,
    backgroundColor: Colors.light.bgPrimary,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: Typography.body,
    color: Colors.light.textPrimary,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    marginBottom: 0,
  },
  listView: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    marginTop: 4,
    elevation: 5,
    zIndex: 100,
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
  },
  row: {
    backgroundColor: Colors.light.surface,
    paddingVertical: 12,
    paddingHorizontal: 14,
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
