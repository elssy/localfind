import React, { useRef, useState } from "react";
import { Text, TextInput, StyleSheet, ActivityIndicator, Keyboard } from "react-native";
import { router } from "expo-router";
import { COLORS, CATEGORIES } from "@localfind/shared";
import Button from "../../components/Button";
import FormScreen from "../../components/FormScreen";
import SelectField from "../../components/SelectField";
import { apiRequest } from "../../lib/api";

const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

export default function ProviderOnboarding() {
  const cityRef = useRef<TextInput>(null);
  const bioRef = useRef<TextInput>(null);

  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);

    if (!businessName.trim()) {
      setError("Enter your business name");
      return;
    }
    if (!category) {
      setError("Choose a category");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/api/profile/provider", {
        method: "POST",
        body: JSON.stringify({
          businessName: businessName.trim(),
          category,
          bio: bio.trim() || undefined,
          city: city.trim() || undefined,
        }),
      });
      router.replace("/(provider)/dashboard");
    } catch (e: any) {
      setError(e.message || "Could not save your profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormScreen>
      <Text style={styles.title}>Set up your business profile</Text>
      <Text style={styles.subtitle}>Seekers will see this when they find you in a search.</Text>

      <Text style={styles.label}>Business name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Kariuki Auto Garage"
        placeholderTextColor={COLORS.mutedText}
        value={businessName}
        onChangeText={setBusinessName}
        returnKeyType="next"
        onSubmitEditing={() => cityRef.current?.focus()}
        blurOnSubmit={false}
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
        ref={cityRef}
        style={styles.input}
        placeholder="e.g. Nairobi"
        placeholderTextColor={COLORS.mutedText}
        value={city}
        onChangeText={setCity}
        returnKeyType="next"
        onSubmitEditing={() => bioRef.current?.focus()}
        blurOnSubmit={false}
      />

      <Text style={styles.label}>About your business (optional)</Text>
      <TextInput
        ref={bioRef}
        style={[styles.input, styles.multiline]}
        placeholder="Tell seekers what you do and why they should pick you"
        placeholderTextColor={COLORS.mutedText}
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={4}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={COLORS.primaryBlue} />
      ) : (
        <Button title="Finish Setup" onPress={handleSubmit} style={{ marginTop: 24 }} />
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "600", color: COLORS.darkText, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.mutedText, marginBottom: 20, lineHeight: 20 },
  error: { fontSize: 14, color: "#DC2626", marginTop: 16, lineHeight: 20 },
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
});
