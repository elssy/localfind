import React, { useState } from "react";
import { Text, TextInput, StyleSheet, Pressable, ActivityIndicator, Keyboard, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@localfind/shared";
import Button from "../../../components/Button";
import FormScreen from "../../../components/FormScreen";
import { apiRequest } from "../../../lib/api";

export default function SendBid() {
  const params = useLocalSearchParams<{
    jobId: string;
    description?: string;
    category?: string;
    budgetMin?: string;
    budgetMax?: string;
  }>();

  const [amount, setAmount] = useState(params.budgetMin ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);

    const amountKES = Number(amount.replace(/[^0-9]/g, ""));
    if (!amountKES || amountKES < 1) {
      setError("Enter your price in shillings");
      return;
    }

    setLoading(true);
    try {
      await apiRequest(`/api/jobs/${params.jobId}/bids`, {
        method: "POST",
        body: JSON.stringify({ amountKES, message: message.trim() || undefined }),
      });
      router.back();
    } catch (e: any) {
      setError(e.message || "Could not send your bid. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasBudget = params.budgetMin && params.budgetMax;

  return (
    <FormScreen>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/(provider)/alerts"))}
        style={styles.back}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.darkText} />
      </Pressable>

      <Text style={styles.title}>Send your bid</Text>

      <View style={styles.requestCard}>
        <Text style={styles.requestText}>{params.description}</Text>
        {params.category ? <Text style={styles.requestMeta}>{params.category}</Text> : null}
        {hasBudget ? (
          <Text style={styles.requestMeta}>
            Budget: KES {Number(params.budgetMin).toLocaleString()} to {Number(params.budgetMax).toLocaleString()}
          </Text>
        ) : null}
      </View>

      <Text style={styles.label}>Your price (KES)</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={amount}
        onChangeText={setAmount}
        placeholder="e.g. 1500"
        placeholderTextColor={COLORS.mutedText}
      />

      <Text style={styles.label}>Note for the seeker (optional)</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={message}
        onChangeText={setMessage}
        placeholder="When you can come, what is included, and so on"
        placeholderTextColor={COLORS.mutedText}
        multiline
        maxLength={500}
      />

      <Text style={styles.hint}>
        Bids are free for now. Token charges start once online payments are connected.
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={COLORS.primaryBlue} />
      ) : (
        <Button title="Send Bid" onPress={handleSubmit} style={{ marginTop: 24 }} />
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: "flex-start", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "600", color: COLORS.darkText, marginBottom: 16 },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 4,
  },
  requestText: { fontSize: 15, fontWeight: "600", color: COLORS.darkText, lineHeight: 21 },
  requestMeta: { fontSize: 13, color: COLORS.mutedText },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.midText, marginBottom: 6, marginTop: 16 },
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
  multiline: { minHeight: 90, textAlignVertical: "top" },
  hint: { fontSize: 13, color: COLORS.mutedText, marginTop: 14, lineHeight: 18 },
  error: { fontSize: 14, color: "#DC2626", marginTop: 16, lineHeight: 20 },
});
