import React, { useState } from "react";
import { Text, TextInput, StyleSheet, Pressable, ActivityIndicator, Keyboard } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, CATEGORIES } from "@localfind/shared";
import Button from "../../components/Button";
import FormScreen from "../../components/FormScreen";
import SelectField from "../../components/SelectField";
import { apiRequest } from "../../lib/api";

const CATEGORY_NAMES: string[] = CATEGORIES.map((c) => c.name);

export default function NewRequest() {
  const params = useLocalSearchParams<{ category?: string; description?: string }>();

  const [category, setCategory] = useState(
    params.category && CATEGORY_NAMES.includes(params.category) ? params.category : ""
  );
  const [description, setDescription] = useState(params.description ?? "");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);

    if (!category) {
      setError("Choose a category");
      return;
    }
    if (description.trim().length < 3) {
      setError("Tell providers what you need");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          category,
          description: description.trim(),
          city: city.trim() || undefined,
        }),
      });
      router.replace(`/(shared)/request/${data.job.id}`);
    } catch (e: any) {
      setError(e.message || "Could not send your request. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormScreen>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/(seeker)"))}
        style={styles.back}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.darkText} />
      </Pressable>

      <Text style={styles.title}>Request a quote</Text>
      <Text style={styles.subtitle}>
        Providers in this category will see your request and can reply with a price.
      </Text>

      <SelectField
        label="Category"
        value={category}
        options={CATEGORY_NAMES}
        onChange={setCategory}
        placeholder="Choose a category"
      />

      <Text style={styles.label}>What do you need?</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="e.g. Gel nails for Saturday, around Westlands"
        placeholderTextColor={COLORS.mutedText}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        maxLength={500}
      />

      <Text style={styles.label}>Area (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Westlands, Nairobi"
        placeholderTextColor={COLORS.mutedText}
        value={city}
        onChangeText={setCity}
        returnKeyType="done"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={COLORS.primaryBlue} />
      ) : (
        <Button title="Send Request" onPress={handleSubmit} style={{ marginTop: 24 }} />
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: "flex-start", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "600", color: COLORS.darkText, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.mutedText, marginBottom: 12, lineHeight: 20 },
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
