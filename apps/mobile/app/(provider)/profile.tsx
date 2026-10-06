import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, Keyboard } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, CATEGORIES, providerFromProfile } from "@localfind/shared";
import type { ProviderProfileRow } from "@localfind/shared";
import { useAppStore } from "../../store/useAppStore";
import Button from "../../components/Button";
import FormScreen from "../../components/FormScreen";
import SelectField from "../../components/SelectField";
import { apiRequest, signOut } from "../../lib/api";

const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

export default function ProviderProfile() {
  const provider = useAppStore((s) => s.currentProvider);

  const [name, setName] = useState(provider.name);
  const [category, setCategory] = useState(provider.category);
  const [city, setCity] = useState(provider.address);
  const [bio, setBio] = useState(provider.bio);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    Keyboard.dismiss();
    setError(null);
    setSaved(false);

    if (name.trim().length < 2) {
      setError("Enter your business name");
      return;
    }
    if (!category) {
      setError("Choose a category");
      return;
    }

    setSaving(true);
    try {
      const data = await apiRequest("/api/profile/provider", {
        method: "PATCH",
        body: JSON.stringify({
          businessName: name.trim(),
          category,
          city: city.trim(),
          bio: bio.trim(),
        }),
      });
      // Show what was really saved on the server.
      const updated = providerFromProfile(data.profile as ProviderProfileRow);
      useAppStore.setState({ currentProvider: updated, providers: [updated] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message || "Could not save your profile. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  return (
    <FormScreen>
      <Text style={styles.header}>Business Profile</Text>

      <View
        style={[styles.banner, { backgroundColor: provider.verified ? "#E5F6EF" : "#FBF3E7" }]}
      >
        <Ionicons
          name={provider.verified ? "checkmark-circle" : "time-outline"}
          size={18}
          color={provider.verified ? COLORS.successGreen : COLORS.warningAmber}
        />
        <Text
          style={[
            styles.bannerText,
            { color: provider.verified ? COLORS.successGreen : COLORS.warningAmber },
          ]}
        >
          {provider.verified
            ? "Verified business. Seekers can find you in search."
            : "Verification pending. You will appear in search once an admin approves your business."}
        </Text>
      </View>

      <Text style={styles.label}>Business name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Kariuki Auto Garage"
        placeholderTextColor={COLORS.mutedText}
      />

      <SelectField
        label="Category"
        value={category}
        options={CATEGORY_NAMES}
        onChange={setCategory}
        placeholder="Choose a category"
      />

      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        value={city}
        onChangeText={setCity}
        placeholder="e.g. Nairobi"
        placeholderTextColor={COLORS.mutedText}
      />

      <Text style={styles.label}>About your business</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={bio}
        onChangeText={setBio}
        placeholder="Tell seekers what you do and why they should pick you"
        placeholderTextColor={COLORS.mutedText}
        multiline
        maxLength={1000}
      />

      <Text style={styles.soon}>
        Services and prices, photos and your map location are coming in a future update.
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}
      {saved && <Text style={styles.savedText}>Profile saved</Text>}

      {saving ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={COLORS.primaryBlue} />
      ) : (
        <Button title="Save" onPress={handleSave} style={{ marginTop: 24 }} />
      )}

      <Pressable
        onPress={() => router.push(`/(shared)/provider-profile/${provider.id}`)}
        style={{ marginTop: 20 }}
        hitSlop={8}
      >
        <Text style={styles.previewLink}>Preview my public profile</Text>
      </Pressable>

      <Button title="Log out" variant="outline" onPress={handleLogout} style={{ marginTop: 28 }} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 22, fontWeight: "600", color: COLORS.darkText, marginBottom: 16 },
  banner: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, padding: 12, marginBottom: 8 },
  bannerText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.midText, marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.darkText,
  },
  multiline: { minHeight: 100, textAlignVertical: "top" },
  soon: { fontSize: 13, color: COLORS.mutedText, marginTop: 16, lineHeight: 18 },
  error: { fontSize: 14, color: "#DC2626", marginTop: 16, lineHeight: 20 },
  savedText: { fontSize: 14, color: COLORS.successGreen, fontWeight: "600", marginTop: 16 },
  previewLink: { textAlign: "center", color: COLORS.primaryBlue, fontSize: 14, fontWeight: "600" },
});
