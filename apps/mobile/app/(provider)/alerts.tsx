import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, CATEGORIES, formatKm } from "@localfind/shared";
import type { SearchAlert } from "@localfind/shared";
import { useAppStore } from "../../store/useAppStore";
import { timeAgo } from "../../utils/format";
import Badge from "../../components/Badge";
import Button from "../../components/Button";

function categoryIcon(category: string): keyof typeof Ionicons.glyphMap {
  const match = CATEGORIES.find((c) => c.name === category);
  return (match?.icon as keyof typeof Ionicons.glyphMap) ?? "pricetag-outline";
}

export default function Alerts() {
  const provider = useAppStore((s) => s.currentProvider);
  const searchAlerts = useAppStore((s) => s.searchAlerts);
  const submitBid = useAppStore((s) => s.submitBid);
  const ignoreAlert = useAppStore((s) => s.ignoreAlert);

  const [activeAlert, setActiveAlert] = useState<SearchAlert | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const myAlerts = useMemo(
    () =>
      searchAlerts
        .filter((a) => a.providerId === provider.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [searchAlerts, provider.id]
  );

  const unhandled = myAlerts.filter((a) => a.status !== "ignored");

  const openBidSheet = (alert: SearchAlert) => {
    setActiveAlert(alert);
    setAmount(alert.budgetMin ? String(alert.budgetMin) : "");
    setNotes("");
  };

  const handleSendBid = () => {
    if (!activeAlert) return;
    const parsedAmount = Number(amount) || 0;
    submitBid(activeAlert.id, parsedAmount, notes);
    setActiveAlert(null);
    setConfirmation(`Bid sent! 1 token deducted. Balance: ${provider.tokenBalance - 1} tokens.`);
    setTimeout(() => setConfirmation(null), 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Alerts</Text>
        <Badge label={`${provider.tokenBalance} tokens`} backgroundColor={COLORS.lightBlueTint} color={COLORS.primaryBlue} />
      </View>

      {confirmation && (
        <View style={styles.confirmationBanner}>
          <Text style={styles.confirmationText}>{confirmation}</Text>
        </View>
      )}

      <FlatList
        data={unhandled}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Ionicons name={categoryIcon(item.category)} size={20} color={COLORS.primaryBlue} />
              <Text style={styles.query}>Looking for: {item.query}</Text>
            </View>
            <Text style={styles.location}>
              {item.location} · {formatKm(item.distanceKm)}
            </Text>
            <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            {item.budgetMin !== undefined && item.budgetMax !== undefined && (
              <Text style={styles.budget}>
                Budget: KES {item.budgetMin.toLocaleString()} - {item.budgetMax.toLocaleString()}
              </Text>
            )}

            {item.status === "bid_sent" ? (
              <View style={styles.bidSentRow}>
                <Badge label="Bid sent" backgroundColor="#E5F6EF" color={COLORS.successGreen} />
              </View>
            ) : (
              <View style={styles.btnRow}>
                <Button title="Ignore" variant="ghost" onPress={() => ignoreAlert(item.id)} style={{ flex: 1 }} />
                <Button title="Submit Bid" onPress={() => openBidSheet(item)} style={{ flex: 1 }} />
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No alerts yet. Make sure your profile is complete and your token balance is topped up.
          </Text>
        }
      />

      <Modal visible={!!activeAlert} transparent animationType="slide" onRequestClose={() => setActiveAlert(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetOverlay}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Submit your bid</Text>
            <Text style={styles.label}>Amount (KES)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 1500"
              placeholderTextColor={COLORS.mutedText}
            />
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add a note for the seeker"
              placeholderTextColor={COLORS.mutedText}
              multiline
            />
            <Button title="Send Bid" onPress={handleSendBid} style={{ marginTop: 12 }} />
            <Pressable onPress={() => setActiveAlert(null)} style={{ marginTop: 12 }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  confirmationBanner: {
    backgroundColor: "#E5F6EF",
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  confirmationText: {
    color: COLORS.successGreen,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  query: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  location: {
    fontSize: 12,
    color: COLORS.mutedText,
  },
  time: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  budget: {
    fontSize: 12,
    color: COLORS.midText,
    marginTop: 6,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  bidSentRow: {
    marginTop: 12,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.mutedText,
    marginTop: 60,
    paddingHorizontal: 24,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.darkText,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.midText,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.darkText,
    marginBottom: 14,
  },
  textarea: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  cancelText: {
    textAlign: "center",
    color: COLORS.mutedText,
    fontWeight: "600",
  },
});
