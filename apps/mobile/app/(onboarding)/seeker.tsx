import React, { useState } from "react";
import { Text, TextInput, StyleSheet, ActivityIndicator, Keyboard } from "react-native";
import { router } from "expo-router";
import { COLORS } from "@localfind/shared";
import Button from "../../components/Button";
import FormScreen from "../../components/FormScreen";
import { apiRequest } from "../../lib/api";

export default function SeekerOnboarding() {
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);
    setLoading(true);
    try {
      await apiRequest("/api/profile/seeker", {
        method: "POST",
        body: JSON.stringify({ city: city.trim() || undefined }),
      });
      router.replace("/(seeker)");
    } catch (e: any) {
      setError(e.message || "Could not save your details. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormScreen>
      <Text style={styles.title}>Almost done</Text>
      <Text style={styles.subtitle}>
        Tell us where you are based so we can show you nearby providers.
      </Text>

      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Nairobi"
        placeholderTextColor={COLORS.mutedText}
        value={city}
        onChangeText={setCity}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={COLORS.primaryBlue} />
      ) : (
        <Button title="Continue" onPress={handleSubmit} style={{ marginTop: 24 }} />
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
});
