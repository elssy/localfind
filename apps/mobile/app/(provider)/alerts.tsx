import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, CATEGORIES } from "@localfind/shared";
import type { AlertRow, AlertsResponse } from "@localfind/shared";
import { apiRequest } from "../../lib/api";
import { timeAgo } from "../../utils/format";
import Badge from "../../components/Badge";
import Button from "../../components/Button";

const POLL_MS = 10000;

function categoryIcon(category: string): keyof typeof Ionicons.glyphMap {
  const match = CATEGORIES.find((c) => c.name === category);
  return (match?.icon as keyof typeof Ionicons.glyphMap) ?? "pricetag-outline";
}

const BID_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Bid sent", color: COLORS.primaryBlue, bg: COLORS.lightBlueTint },
  accepted: { label: "Your bid was accepted", color: COLORS.successGreen, bg: "#E5F6EF" },
  rejected: { label: "Not selected", color: COLORS.mutedText, bg: "#F1F1F1" },
  withdrawn: { label: "Withdrawn", color: COLORS.mutedText, bg: "#F1F1F1" },
};

export default function Alerts() {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // "Ignore" only hides a request on this phone until the app is reopened.
  const [ignored, setIgnored] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      setData((await apiRequest("/api/provider/alerts")) as AlertsResponse);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Could not load requests");
    }
  }, []);

  // Look for new requests now, then every few seconds while this tab is showing.
  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(load, POLL_MS);
      return () => clearInterval(timer);
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openBid = (item: AlertRow) => {
    router.push({
      pathname: `/(shared)/bid/${item.id}`,
      params: {
        description: item.description,
        category: item.category,
        budgetMin: item.budgetMinKES !== null ? String(item.budgetMinKES) : "",
        budgetMax: item.budgetMaxKES !== null ? String(item.budgetMaxKES) : "",
      },
    });
  };

  const items = (data?.items ?? []).filter((a) => !ignored.includes(a.id) || a.myBid);
  const canBid = data?.canBid ?? false;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Requests</Text>
      </View>

      {data && !canBid && (
        <View style={styles.notice}>
          <Ionicons name="time-outline" size={18} color={COLORS.warningAmber} />
          <Text style={styles.noticeText}>
            Your business is waiting for approval. You can see requests, but you cannot send bids
            until an admin approves it.
          </Text>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }) => {
          const badge = item.myBid ? BID_BADGE[item.myBid.status] : null;
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Ionicons name={categoryIcon(item.category)} size={20} color={COLORS.primaryBlue} />
                <Text style={styles.query}>{item.description}</Text>
              </View>
              <Text style={styles.location}>
                {item.category}
                {item.city ? ` · ${item.city}` : ""}
              </Text>
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
              {item.budgetMinKES !== null && item.budgetMaxKES !== null && (
                <Text style={styles.budget}>
                  Budget: KES {item.budgetMinKES.toLocaleString()} to {item.budgetMaxKES.toLocaleString()}
                </Text>
              )}

              {item.myBid && badge ? (
                <View style={styles.bidSentRow}>
                  <Badge label={badge.label} color={badge.color} backgroundColor={badge.bg} />
                  <Text style={styles.myAmount}>KES {item.myBid.amountKES.toLocaleString()}</Text>
                </View>
              ) : (
                <View style={styles.btnRow}>
                  <Button
                    title="Ignore"
                    variant="ghost"
                    onPress={() => setIgnored((prev) => [...prev, item.id])}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Submit Bid"
                    onPress={() => openBid(item)}
                    disabled={!canBid || item.status !== "open"}
                    style={{ flex: 1 }}
                  />
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          data ? (
            <Text style={styles.emptyText}>
              No requests in your category yet. New requests appear here by themselves.
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "600", color: COLORS.darkText },
  notice: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FBF3E7",
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  noticeText: { flex: 1, fontSize: 13, color: COLORS.warningAmber, lineHeight: 18 },
  error: { color: "#DC2626", paddingHorizontal: 20, marginBottom: 8, lineHeight: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
    gap: 4,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  query: { flex: 1, fontSize: 15, fontWeight: "600", color: COLORS.darkText, lineHeight: 21 },
  location: { fontSize: 13, color: COLORS.mutedText },
  time: { fontSize: 12, color: COLORS.mutedText },
  budget: { fontSize: 13, color: COLORS.midText, marginTop: 2 },
  bidSentRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  myAmount: { fontSize: 15, fontWeight: "700", color: COLORS.primaryBlue },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  emptyText: { textAlign: "center", color: COLORS.mutedText, marginTop: 40, paddingHorizontal: 24, lineHeight: 20 },
});
