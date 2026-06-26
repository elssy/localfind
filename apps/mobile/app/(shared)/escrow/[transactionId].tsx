import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Modal, Animated } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, ESCROW_FEE_RATE, formatKES } from "@localfind/shared";
import type { TransactionStatus } from "@localfind/shared";
import { useAppStore } from "../../../store/useAppStore";
import Button from "../../../components/Button";

const STATUS_CONFIG: Record<
  TransactionStatus,
  { label: string; color: string; bg: string; copy: (amount: string) => string; icon: keyof typeof Ionicons.glyphMap }
> = {
  in_escrow: {
    label: "In Escrow",
    color: COLORS.escrowPurple,
    bg: "#EFEDFB",
    copy: (amount) => `${amount} is held securely until you confirm delivery.`,
    icon: "lock-closed-outline",
  },
  released: {
    label: "Released",
    color: COLORS.successGreen,
    bg: "#E5F6EF",
    copy: (amount) => `${amount} has been released to the provider.`,
    icon: "checkmark-circle-outline",
  },
  disputed: {
    label: "Disputed",
    color: COLORS.dangerRed,
    bg: "#FBEAEA",
    copy: (amount) => `${amount} is on hold while we review your dispute.`,
    icon: "alert-circle-outline",
  },
};

export default function Escrow() {
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
  const transactions = useAppStore((s) => s.transactions);
  const providers = useAppStore((s) => s.providers);
  const confirmDelivery = useAppStore((s) => s.confirmDelivery);
  const raiseDispute = useAppStore((s) => s.raiseDispute);

  const transaction = transactions.find((t) => t.id === transactionId);
  const provider = providers.find((p) => p.id === transaction?.providerId);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const fade = React.useRef(new Animated.Value(1)).current;

  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Transaction not found.</Text>
      </SafeAreaView>
    );
  }

  const config = STATUS_CONFIG[transaction.status];
  const fee = Math.round(transaction.amount * ESCROW_FEE_RATE);
  const providerReceives = transaction.amount - fee;

  const handleConfirmDelivery = () => {
    setShowConfirmModal(false);
    Animated.sequence([
      Animated.timing(fade, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
    confirmDelivery(transaction.id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkText} />
        </Pressable>
        <Text style={styles.headerTitle}>Escrow</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View style={[styles.statusCard, { backgroundColor: config.bg, opacity: fade }]}>
          <Ionicons name={config.icon} size={32} color={config.color} />
          <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
          <Text style={styles.statusCopy}>{config.copy(formatKES(transaction.amount))}</Text>
        </Animated.View>

        <Text style={styles.sectionTitle}>Transaction breakdown</Text>
        <View style={styles.breakdownCard}>
          <Row label="Service" value={transaction.service} />
          <Row label="Provider" value={provider?.name ?? "Provider"} />
          <Row label="Amount paid" value={formatKES(transaction.amount)} />
          <Row label={`Local Find fee (${ESCROW_FEE_RATE * 100}%)`} value={formatKES(fee)} />
          <Row label="Provider receives" value={formatKES(providerReceives)} bold />
        </View>

        {transaction.status === "in_escrow" && (
          <>
            <Button title="Confirm Delivery" variant="success" onPress={() => setShowConfirmModal(true)} style={{ marginTop: 20 }} />
            <Pressable onPress={() => raiseDispute(transaction.id)} style={{ marginTop: 16 }}>
              <Text style={styles.disputeLink}>Raise a Dispute</Text>
            </Pressable>
          </>
        )}

        <Button
          title="Chat with provider"
          variant="ghost"
          onPress={() => router.push(`/(shared)/chat/${transaction.id}`)}
          style={{ marginTop: 20 }}
        />
      </ScrollView>

      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm delivery?</Text>
            <Text style={styles.modalSubtext}>
              This will release {formatKES(transaction.amount)} to {provider?.name ?? "the provider"}.
            </Text>
            <Button title="Yes, Confirm" variant="success" onPress={handleConfirmDelivery} />
            <Pressable onPress={() => setShowConfirmModal(false)} style={{ marginTop: 12 }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowValueBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  content: { padding: 16, paddingBottom: 40 },
  statusCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
  },
  statusCopy: {
    fontSize: 13,
    color: COLORS.midText,
    textAlign: "center",
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkText,
    marginBottom: 10,
  },
  breakdownCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: {
    fontSize: 13,
    color: COLORS.mutedText,
  },
  rowValue: {
    fontSize: 13,
    color: COLORS.darkText,
    fontWeight: "500",
  },
  rowValueBold: {
    fontWeight: "600",
    color: COLORS.primaryBlue,
  },
  disputeLink: {
    textAlign: "center",
    color: COLORS.dangerRed,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: "100%",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.darkText,
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtext: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginBottom: 20,
    textAlign: "center",
  },
  cancelText: {
    textAlign: "center",
    color: COLORS.mutedText,
    fontWeight: "600",
  },
  notFound: {
    textAlign: "center",
    marginTop: 60,
    color: COLORS.mutedText,
  },
});
