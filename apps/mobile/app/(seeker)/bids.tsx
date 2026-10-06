import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@localfind/shared";
import type { JobRow } from "@localfind/shared";
import { apiRequest } from "../../lib/api";
import { timeAgo } from "../../utils/format";
import Badge from "../../components/Badge";
import Button from "../../components/Button";

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: "Open", color: COLORS.primaryBlue, bg: COLORS.lightBlueTint },
  awarded: { label: "Provider chosen", color: COLORS.successGreen, bg: "#E5F6EF" },
  completed: { label: "Completed", color: COLORS.successGreen, bg: "#E5F6EF" },
  cancelled: { label: "Cancelled", color: COLORS.mutedText, bg: "#F1F1F1" },
};

export default function Bids() {
  const [jobs, setJobs] = useState<JobRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiRequest("/api/jobs");
      setJobs(data.items as JobRow[]);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Could not load your requests");
    }
  }, []);

  // Refresh every time the person opens this tab, so new bids show up.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Requests</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={jobs ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }) => {
          const status = STATUS[item.status] ?? STATUS.open;
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/(shared)/request/${item.id}`)}>
              <View style={styles.cardTop}>
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.mutedText} />
              </View>
              <Text style={styles.meta}>
                {item.category} · {timeAgo(item.createdAt)}
              </Text>
              <View style={styles.cardBottom}>
                <Badge label={status.label} color={status.color} backgroundColor={status.bg} />
                <Text style={styles.bidCount}>
                  {item.bidCount} bid{item.bidCount === 1 ? "" : "s"}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          jobs === null ? null : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                You have no requests yet. Find a service and send a request to get bids from
                providers.
              </Text>
              <Button
                title="Find a service"
                onPress={() => router.push("/(seeker)/search")}
                style={{ marginTop: 16 }}
              />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    fontSize: 22,
    fontWeight: "600",
    color: COLORS.darkText,
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 12,
  },
  error: { color: "#DC2626", paddingHorizontal: 20, marginBottom: 8, lineHeight: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
    gap: 6,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  description: { flex: 1, fontSize: 15, fontWeight: "600", color: COLORS.darkText, lineHeight: 21 },
  meta: { fontSize: 12, color: COLORS.mutedText },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  bidCount: { fontSize: 13, fontWeight: "600", color: COLORS.midText },
  emptyWrap: { alignItems: "center", marginTop: 40, paddingHorizontal: 24 },
  emptyText: { textAlign: "center", color: COLORS.mutedText, lineHeight: 20 },
});
