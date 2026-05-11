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
import { LucideIcon } from "@/components/LucideIcon";

const SPECIALTIES = ["Interior", "Exterior", "Paint Correction", "Ceramic Coating", "Window Tint", "Fleet"];

export default function BuildProfileScreen() {
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [years, setYears] = useState(5);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(["Interior", "Exterior"]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  function toggleSpecialty(s: string) {
    setSelectedSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

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
      const path = `detailers/${userId}/logo.${ext}`;
      const response = await fetch(photoUri);
      const blob = await response.blob();
      const { error } = await supabase.storage
        .from("business-assets")
        .upload(path, blob, { upsert: true, contentType: `image/${ext}` });
      if (error) {
        console.warn("Photo upload error:", error.message);
        return null;
      }
      const { data } = supabase.storage.from("business-assets").getPublicUrl(path);
      return data.publicUrl;
    } catch (e) {
      console.warn("Photo upload failed:", e);
      return null;
    }
  }

  async function handleContinue() {
    if (!businessName.trim()) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const avatarUrl = await uploadPhoto(user.id);

      const updatePayload: Record<string, any> = {
        business_name: businessName.trim(),
        bio: bio.trim() || null,
      };
      if (avatarUrl) updatePayload.avatar_url = avatarUrl;

      await supabase
        .from("detailer_profiles")
        .update(updatePayload)
        .eq("user_id", user.id);

      if (avatarUrl) {
        await supabase
          .from("users")
          .update({ avatar_url: avatarUrl })
          .eq("id", user.id);
      }
    }

    router.push("/onboarding/operator/services");
    setLoading(false);
  }

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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.introBlock}>
          <Text style={styles.headline}>Your shop, your brand.</Text>
          <Text style={styles.subheadline}>This is what customers see when they find you.</Text>
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
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your name or business name</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="e.g., Marcus T. Detailing"
              placeholderTextColor={Colors.light.textTertiary}
              autoCapitalize="words"
            />
            <Text style={styles.inputHint}>This appears on your profile and booking cards.</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Bio</Text>
              <Text style={styles.optional}>Optional</Text>
            </View>
            <View style={styles.textAreaWrapper}>
              <TextInput
                style={styles.textArea}
                value={bio}
                onChangeText={(t) => setBio(t.slice(0, 200))}
                placeholder="Tell customers what makes your work different."
                placeholderTextColor={Colors.light.textTertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{bio.length} / 200</Text>
            </View>
          </View>
        </View>

        <View style={styles.experienceSection}>
          <View style={styles.experienceRow}>
            <Text style={styles.experienceLabel}>Years of experience</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setYears((y) => Math.max(0, y - 1))}
                activeOpacity={0.7}
              >
                <LucideIcon name="Minus" size={14} color={Colors.foamBlue} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{years}</Text>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setYears((y) => y + 1)}
                activeOpacity={0.7}
              >
                <LucideIcon name="Plus" size={14} color={Colors.foamBlue} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.specialtiesSection}>
          <Text style={styles.sectionLabel}>SPECIALTIES</Text>
          <View style={styles.pills}>
            {SPECIALTIES.map((s) => {
              const active = selectedSpecialties.includes(s);
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => toggleSpecialty(s)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, (!businessName.trim() || loading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!businessName.trim() || loading}
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
  progressTrackWrap: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.light.borderSubtle,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.foamBlue,
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: 16,
    paddingBottom: 140,
  },
  introBlock: { marginBottom: 32 },
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
  },
  photoButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    overflow: "hidden",
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
  formSection: { gap: Spacing.md, marginBottom: 24 },
  inputGroup: { gap: 6 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  optional: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textTertiary,
  },
  input: {
    height: 48,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    ...Shadows.light.level1,
  },
  inputHint: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
  },
  textAreaWrapper: { position: "relative" },
  textArea: {
    height: 100,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    ...Shadows.light.level1,
  },
  charCount: {
    position: "absolute",
    bottom: 12,
    right: 16,
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 4,
  },
  experienceSection: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    marginBottom: 24,
    ...Shadows.light.level1,
  },
  experienceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  experienceLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    paddingLeft: 4,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 18,
    color: Colors.light.textPrimary,
    minWidth: 20,
    textAlign: "center",
  },
  specialtiesSection: { marginBottom: 8 },
  sectionLabel: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    backgroundColor: Colors.light.surface,
  },
  pillActive: {
    backgroundColor: Colors.foamBlue,
    borderColor: Colors.foamBlue,
  },
  pillText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
  },
  pillTextActive: {
    color: Colors.white,
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
