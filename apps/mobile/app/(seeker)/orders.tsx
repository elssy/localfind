import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { COLORS, formatKES } from "@localfind/shared";
import type { Transaction, TransactionStatus } from "@localfind/shared";
import { useAppStore } from "../../store/useAppStore";
import { refreshOrders } from "../../lib/refreshOrders";
import StatusChip from "../../components/StatusChip";
import Button from "../../components/Button";

type Tab = "Active" | "Completed" | "Disputed";

// An order that has been accepted but not yet paid counts as active.
const TAB_STATUSES: Record<Tab, TransactionStatus[]> = {
  Active: ["pending", "in_escrow"],
  Completed: ["released", "refunded"],
  Disputed: ["disputed"],
};

export default function Orders() {
  const transactions = useAppStore((s) => s.transactions);
  const providers = useAppStore((s) => s.providers);
  const currentSeeker = useAppStore((s) => s.currentSeeker);
  const [tab, setTab] = useState<Tab>("Active");

  // Pick up new orders (for example a bid just accepted) every time this tab opens.
  useFocusEffect(
    useCallback(() => {
      refreshOrders().catch(() => {});
    }, [])
  );

  const mine = useMemo(
    () => transactions.filter((t) => t.seekerId === currentSeeker.id),
    [transactions, currentSeeker.id]
  );

  const filtered = mine.filter((t) => TAB_STATUSES[tab].includes(t.status));

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Orders</Text>
      <View style={styles.tabRow}>
        {(["Active", "Completed", "Disputed"] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const provider = providers.find((p) => p.id === item.providerId);
          return (
            <OrderCard
              transaction={item}
              providerName={item.counterpartyName ?? provider?.name ?? "Provider"}
              onView={() => router.push(`/(shared)/escrow/${item.id}`)}
            />
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No {tab.toLowerCase()} orders.</Text>}
      />
    </SafeAreaView>
  );
}

function OrderCard({
  transaction,
  providerName,
  onView,
}: {
  transaction: Transaction;
  providerName: string;
  onView: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.providerName}>{providerName}</Text>
        <StatusChip status={transaction.status} />
      </View>
      <Text style={styles.service}>{transaction.service}</Text>
      {transaction.status === "pending" && (
        <Text style={styles.pendingNote}>
          Awaiting payment. Online payment is not connected yet, so you have not been charged.
        </Text>
      )}
      <View style={styles.cardBottom}>
        <Text style={styles.amount}>{formatKES(transaction.amount)}</Text>
        <Text style={styles.date}>{new Date(transaction.createdAt).toLocaleDateString()}</Text>
      </View>
      <Button title="View Details" variant="ghost" onPress={onView} style={{ marginTop: 10 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    fontSize: 22,
    fontWeight: "600",
    color: COLORS.darkText,
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 12,
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primaryBlue,
    borderColor: COLORS.primaryBlue,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.mutedText,
  },
  tabTextActive: {
    color: COLORS.white,
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  providerName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  service: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginBottom: 10,
  },
  pendingNote: {
    fontSize: 12,
    color: COLORS.warningAmber,
    marginBottom: 10,
    lineHeight: 17,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  amount: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primaryBlue,
  },
  date: {
    fontSize: 12,
    color: COLORS.mutedText,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.mutedText,
    marginTop: 40,
  },
});
