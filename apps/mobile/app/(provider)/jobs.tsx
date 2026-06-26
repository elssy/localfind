import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable } from "react-native";
import { router } from "expo-router";
import { COLORS, formatKES, reviews, seekers } from "@localfind/shared";
import type { Transaction } from "@localfind/shared";
import { useAppStore } from "../../store/useAppStore";
import StatusChip from "../../components/StatusChip";
import StarRating from "../../components/StarRating";
import Button from "../../components/Button";

type Tab = "Active" | "Completed";

export default function Jobs() {
  const provider = useAppStore((s) => s.currentProvider);
  const transactions = useAppStore((s) => s.transactions);
  const confirmDelivery = useAppStore((s) => s.confirmDelivery);
  const [tab, setTab] = useState<Tab>("Active");

  const myJobs = useMemo(
    () => transactions.filter((t) => t.providerId === provider.id),
    [transactions, provider.id]
  );

  const filtered = myJobs.filter((t) =>
    tab === "Active" ? t.status === "in_escrow" || t.status === "disputed" : t.status === "released"
  );

  const seekerFirstName = (seekerId: string) => {
    const seeker = seekers.find((s) => s.id === seekerId);
    return seeker ? seeker.name.split(" ")[0] : "Seeker";
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Jobs</Text>
      <View style={styles.tabRow}>
        {(["Active", "Completed"] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <JobCard
            transaction={item}
            seekerName={seekerFirstName(item.seekerId)}
            onMarkDelivered={() => confirmDelivery(item.id)}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No {tab.toLowerCase()} jobs.</Text>}
      />
    </SafeAreaView>
  );
}

function JobCard({
  transaction,
  seekerName,
  onMarkDelivered,
}: {
  transaction: Transaction;
  seekerName: string;
  onMarkDelivered: () => void;
}) {
  const review = reviews.find((r) => r.providerId === transaction.providerId);
  const isActive = transaction.status === "in_escrow" || transaction.status === "disputed";

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.seekerName}>{seekerName}</Text>
        <StatusChip status={transaction.status} />
      </View>
      <Text style={styles.service}>{transaction.service}</Text>
      <Text style={styles.amount}>{formatKES(transaction.amount)}</Text>

      {isActive ? (
        <View style={styles.btnRow}>
          <Button
            title="Open Chat"
            variant="ghost"
            onPress={() => router.push(`/(shared)/chat/${transaction.id}`)}
            style={{ flex: 1 }}
          />
          <Button title="Mark as Delivered" onPress={onMarkDelivered} style={{ flex: 1 }} />
        </View>
      ) : (
        review && <StarRating rating={review.rating} />
      )}
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
  seekerName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  service: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginBottom: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primaryBlue,
    marginBottom: 10,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.mutedText,
    marginTop: 40,
  },
});
