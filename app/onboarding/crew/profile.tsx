import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { LucideIcon } from "@/components/LucideIcon";

export default function CrewProfileScreen() {
  const { refreshAuth } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePickPhoto() {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function uploadPhoto(userId: string): Promise<string | null> {
    if (!photoUri) return null;
    try {
      const ext = photoUri.split(".").pop() ?? "jpg";
      const path = `crew/${userId}/avatar.${ext}`;
      const response = await fetch(photoUri);
      const blob = await response.blob();
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: `image/${ext}` });
      if (error) {
        console.warn("Avatar upload error:", error.message);
        return null;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      return data.publicUrl;
    } catch (e) {
      console.warn("Avatar upload failed:", e);
      return null;
    }
  }

  async function handleContinue() {
    if (!displayName.trim()) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const avatarUrl = await uploadPhoto(user.id);

        await supabase
          .from("team_members")
          .update({ display_name: displayName.trim() })
          .eq("user_id", user.id);

        const userFields: { phone?: string; avatar_url?: string } = {};
        if (phone.trim()) userFields.phone = phone.trim();
        if (avatarUrl) userFields.avatar_url = avatarUrl;

        if (Object.keys(userFields).length > 0) {
          await supabase.from("users").update(userFields).eq("id", user.id);
        }

        await supabase
          .from("users")
          .update({ onboarding_complete: true })
          .eq("id", user.id);
      }
    } catch (err) {
      console.warn("[CrewProfile] continue failed", err);
    }

    await refreshAuth();
    router.replace("/team_member/pending");
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.progressBar} />
      </View>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <LucideIcon name="ChevronLeft" size={20} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Step 1 of 1</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.introBlock}>
          <Text style={styles.headline}>Let's put a face to the name.</Text>
          <Text style={styles.subheadline}>Your manager will see this when assigning jobs.</Text>
        </View>

        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto} activeOpacity={0.8}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <LucideIcon name="Camera" size={28} color={Colors.foamBlue} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.7}>
            <Text style={styles.addPhotoText}>{photoUri ? "Change photo" : "Add photo"}</Text>
          </TouchableOpacity>
          <Text style={styles.optional}>Optional</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="How should your manager and team know you?"
              placeholderTextColor={Colors.light.textTertiary}
              autoCapitalize="words"
            />
            <Text style={styles.inputHint}>This appears on job assignments and the team roster.</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Phone number</Text>
              <Text style={styles.optional}>(Optional)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="(404) 555-0123"
              placeholderTextColor={Colors.light.textTertiary}
              keyboardType="phone-pad"
            />
            <Text style={styles.inputHint}>Your manager may use this to reach you about jobs.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, (!displayName.trim() || loading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!displayName.trim() || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: 0,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.foamBlue,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  stepLabel: {
    flex: 1,
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.caption,
    color: Colors.foamBlue,
    textAlign: "center",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  spacer: { width: 44 },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: 16,
    paddingBottom: 140,
  },
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
  photoSection: {
    alignItems: "center",
    marginBottom: 32,
    gap: Spacing.sm,
  },
  photoButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...Shadows.light.level1,
  },
  photoPreview: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  addPhotoText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.foamBlue,
  },
  optional: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
  },
  form: { gap: 24 },
  inputGroup: { gap: 6 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  label: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  input: {
    height: 52,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    ...Shadows.light.level1,
  },
  inputHint: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Platform.OS === "web" ? 24 : 0,
    paddingTop: Spacing.md,
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
  buttonDisabled: { opacity: 0.5 },
  primaryButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyL,
    color: Colors.white,
  },
});
