# Claude Code Instructions — Google Maps Places Autocomplete

## Context
FOAM is a React Native (Expo) app. Google Maps API is already in the stack for distance
calculations and travel time. This task extends that integration to cover all address
input fields with Places Autocomplete, ensuring clean structured geo data (address,
lat, lng, zip) is captured and stored on every booking.

---

## Step 1 — Install the Required Package

```bash
npx expo install react-native-google-places-autocomplete
```

This is the standard Expo-compatible package for Google Places Autocomplete.
Do NOT use the bare `google-maps-react` or web-only alternatives.

---

## Step 2 — Environment Variable

The Google Maps API key must already be in your environment. Verify it exists:

```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

This key needs the following APIs enabled in Google Cloud Console:
- Places API
- Maps SDK for Android
- Maps SDK for iOS
- Geocoding API (already in use)

If the key isn't scoped for Places API yet, enable it in Google Cloud Console
under APIs & Services → Library → Places API → Enable.

---

## Step 3 — Build the Reusable Component

Create this file at:
`src/components/shared/AddressAutocomplete.tsx`

```tsx
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

export interface AddressResult {
  formattedAddress: string;
  lat: number;
  lng: number;
  zip: string;
}

interface Props {
  onAddressSelect: (result: AddressResult) => void;
  placeholder?: string;
  initialValue?: string;
  restrictToUS?: boolean;
}

export function AddressAutocomplete({
  onAddressSelect,
  placeholder = 'Enter address',
  initialValue = '',
  restrictToUS = true,
}: Props) {
  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        placeholder={placeholder}
        textInputProps={{
          defaultValue: initialValue,
          placeholderTextColor: '#9CA3AF',
        }}
        fetchDetails={true}
        onPress={(data, details = null) => {
          if (!details) return;

          // Extract zip from address_components
          const zipComponent = details.address_components?.find((c) =>
            c.types.includes('postal_code')
          );
          const zip = zipComponent?.short_name ?? '';

          onAddressSelect({
            formattedAddress: details.formatted_address,
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng,
            zip,
          });
        }}
        query={{
          key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
          language: 'en',
          components: restrictToUS ? 'country:us' : undefined,
          types: 'address', // street-level addresses only, no businesses or cities
        }}
        styles={{
          container: { flex: 0 },
          textInput: styles.input,
          listView: styles.listView,
          row: styles.row,
          description: styles.description,
          separator: styles.separator,
        }}
        enablePoweredByContainer={false}
        keyboardShouldPersistTaps="handled"
        listViewDisplayed="auto"
        minLength={3}
        debounce={300}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
    width: '100%',
  },
  input: {
    height: 48,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  listView: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginTop: 4,
    elevation: 5,
    zIndex: 100,
  },
  row: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  description: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: '#2A2A2A',
  },
});
```

IMPORTANT: The colors above match FOAM's dark mode palette from DESIGN_SYSTEM.md.
Adjust if placing in a light mode context (e.g., operator setup screens that use
light backgrounds).

---

## Step 4 — Where to Use This Component

Replace every manual text input that accepts a street address with
`<AddressAutocomplete />`. Here are all the surfaces that need it:

### 4A — Customer Mobile Booking Flow
File: wherever the "Where should they come to you?" step lives.

```tsx
import { AddressAutocomplete, AddressResult } from '@/components/shared/AddressAutocomplete';

// In your booking form state:
const [serviceAddress, setServiceAddress] = useState('');
const [serviceLat, setServiceLat] = useState<number | null>(null);
const [serviceLng, setServiceLng] = useState<number | null>(null);
const [serviceZip, setServiceZip] = useState('');

// Replace the text input with:
<AddressAutocomplete
  placeholder="Where should they come to you?"
  onAddressSelect={(result: AddressResult) => {
    setServiceAddress(result.formattedAddress);
    setServiceLat(result.lat);
    setServiceLng(result.lng);
    setServiceZip(result.zip);
  }}
/>
```

When submitting the booking to Supabase, include all four fields:
```ts
const booking = {
  service_address: serviceAddress,
  service_lat: serviceLat,
  service_lng: serviceLng,
  service_zip: serviceZip,
  // ... rest of booking fields
};
```

### 4B — Operator Onboarding: Home Base (Mobile Operators)
File: wherever the operator sets their service area home base.

```tsx
<AddressAutocomplete
  placeholder="Your home base address"
  onAddressSelect={(result) => {
    updateOperatorProfile({
      home_base_address: result.formattedAddress,
      home_base_lat: result.lat,
      home_base_lng: result.lng,
    });
  }}
/>
```

### 4C — Operator Onboarding: Fixed Location Address
File: wherever the operator sets their shop's physical address.

```tsx
<AddressAutocomplete
  placeholder="Your shop address"
  onAddressSelect={(result) => {
    updateOperatorProfile({
      location_address: result.formattedAddress,
      location_lat: result.lat,
      location_lng: result.lng,
    });
  }}
/>
```

### 4D — Event Creation (Ops Admin)
File: wherever FOAM ops enters a physical event location.

```tsx
<AddressAutocomplete
  placeholder="Event location address"
  onAddressSelect={(result) => {
    setEventFields({
      location_address: result.formattedAddress,
      location_lat: result.lat,
      location_lng: result.lng,
    });
  }}
/>
```

---

## Step 5 — Validation Rule

Before any booking or profile save is allowed, validate that the geo fields are
populated. A `service_address` without `service_lat`, `service_lng`, and `service_zip`
is an incomplete record and must not be written to the database.

```ts
function isAddressComplete(address: string, lat: number | null, lng: number | null, zip: string): boolean {
  return (
    address.length > 0 &&
    lat !== null &&
    lng !== null &&
    zip.length === 5
  );
}
```

If this returns false, block form submission and show:
`"Please select an address from the suggestions to continue."`

This prevents users from typing a partial address and bypassing autocomplete.

---

## Step 6 — iOS Specific Config

In `app.json` or `app.config.js`, confirm the Google Maps API key is set for iOS:

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_KEY_HERE"
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_KEY_HERE"
        }
      }
    }
  }
}
```

Use the env var reference if your config supports it — don't hardcode the key.

---

## Step 7 — Testing Checklist

Before marking this complete, verify:

- [ ] Typing 3+ characters in any address field triggers autocomplete suggestions
- [ ] Selecting a suggestion populates `formattedAddress`, `lat`, `lng`, and `zip`
- [ ] `zip` is a 5-digit string, not null or empty
- [ ] Submitting a booking with a manually typed address (no autocomplete selection) is blocked
- [ ] All four geo fields appear correctly in the Supabase bookings table after a test booking
- [ ] Operator home base and fixed location address fields work the same way
- [ ] Works on both iOS simulator and Android emulator
- [ ] No API key is exposed in client-side bundle (key is loaded from env)

---

## Notes for Claude Code

- Do NOT use `react-native-maps` Places — that package is for rendering map views,
  not address search input.
- Do NOT fall back to manual text entry if Places API fails — show an error instead.
  Silent fallback produces bad data.
- The `fetchDetails={true}` prop is required. Without it, you get the address string
  but not the geometry or address_components (no lat/lng, no zip).
- The `types: 'address'` query param limits results to street-level addresses.
  This prevents users from selecting "Atlanta, GA" as a service address.
- `debounce={300}` keeps API call volume low. Do not reduce this.
- `minLength={3}` prevents autocomplete from firing on single-character input.
  Do not reduce this below 2.
