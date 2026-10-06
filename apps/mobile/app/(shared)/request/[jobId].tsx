import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Modal, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, formatKES } from "@localfind/shared";
import type { JobBidRow, JobBidsResponse } from "@localfind/shared";
import { apiRequest } from "../../../lib/api";
import { refreshOrders } from "../../../lib/refreshOrders";
import { timeAgo } from "../../../utils/format";
import Avatar from "../../../components/Avatar";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import ProviderRating from "../../../components/ProviderRating";

const POLL_MS = 5000;

const JOB_STATUS_LABEL: Record<string, string> = {
  open: "Open",
  awarded: "Provider chosen",
  completed: "Completed",
  cancelled: "Cancelled",
};

function BidCard({
  bid,
  canAccept,
  onAccept,
}: {
  bid: JobBidRow;
  canAccept: boolean;
  onAccept: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Avatar name={bid.provider.businessName} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.providerName}>{bid.provider.businessName}</Text>
          <ProviderRating rating={bid.provider.rating} reviewCount={bid.provider.reviewCount} />
        </View>
        <Text style={styles.amount}>{formatKES(bid.amountKES)}</Text>
      </View>

      {bid.message ? <Text style={styles.note}>{bid.message}</Text> : null}

      {bid.status === "accepted" && (
        <Badge label="Accepted" color={COLORS.successGreen} backgroundColor="#E5F6EF" />
      )}
      {bid.status === "rejected" && (
        <Badge label="Not selected" color={COLORS.mutedText} backgroundColor="#F1F1F1" />
      )}

      <View style={styles.btnRow}>
        <Button
          title="View Profile"
          variant="ghost"
          onPress={() => router.push(`/(shared)/provider-profile/${bid.provider.id}`)}
          style={{ flex: 1 }}
        />
        {canAccept && bid.status === "pending" && (
          <Button title="Accept Bid" onPress={onAccept} style={{ flex: 1 }} />
        )}
      </View>
    </View>
  );
}

export default function RequestDetail() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [data, setData] = useState<JobBidsResponse | null>(null);
  const [notFound, setNotFound] = useState(false);
  // Two kinds of message: a problem loading the bids (cleared when a refresh works),
  // and a problem with something the person just did, such as accepting a bid. The second
  // stays on screen until their next action, so an automatic refresh cannot hide it.
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmBid, setConfirmBid] = useState<JobBidRow | null>(null);
  const [accepting, setAccepting] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = (await apiRequest(`/api/jobs/${jobId}/bids`)) as JobBidsResponse;
      setData(result);
      setError(null);
    } catch (e: any) {
      if (e?.status === 404) setNotFound(true);
      else setError(e?.message ?? "Could not load your bids");
    }
  }, [jobId]);

  // Check for new bids now, then every few seconds while this screen is showing.
  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(load, POLL_MS);
      return () => clearInterval(timer);
    }, [load])
  );

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(seeker)/bids");
  };

  const handleConfirm = async () => {
    if (!confirmBid) return;
    setActionError(null);
    setAccepting(true);
    try {
      await apiRequest(`/api/bids/${confirmBid.id}/accept`, { method: "POST" });
      setConfirmBid(null);
      await refreshOrders().catch(() => {});
      router.replace("/(seeker)/orders");
    } catch (e: any) {
      setConfirmBid(null);
      setActionError(e?.message ?? "Could not accept this bid");
      load();
    } finally {
      setAccepting(false);
    }
  };

  const job = data?.job;
  const bids = data?.bids ?? [];
  const isOpen = job?.status === "open";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={COLORS.darkText} />
        </Pressable>
        <Text style={styles.headerTitle}>Your request</Text>
      </View>

      {notFound ? (
        <Text style={styles.empty}>This request could not be found.</Text>
      ) : !data && !error ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primaryBlue} />
      ) : (
        <FlatList
          data={bids}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View>
              {actionError && <Text style={styles.error}>{actionError}</Text>}
              {error && <Text style={styles.error}>{error}</Text>}
              {job && (
                <View style={styles.jobCard}>
                  <Text style={styles.jobDescription}>{job.description}</Text>
                  <Text style={styles.jobMeta}>
                    {job.category}
                    {job.city ? ` · ${job.city}` : ""} · {timeAgo(job.createdAt)}
                  </Text>
                  <Badge
                    label={JOB_STATUS_LABEL[job.status] ?? job.status}
                    color={isOpen ? COLORS.primaryBlue : COLORS.successGreen}
                    backgroundColor={isOpen ? COLORS.lightBlueTint : "#E5F6EF"}
                  />
                </View>
              )}
              <Text style={styles.status}>
                {bids.length === 0
                  ? "Waiting for bids"
                  : `${bids.length} bid${bids.length > 1 ? "s" : ""} received`}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <BidCard bid={item} canAccept={!!isOpen} onAccept={() => setConfirmBid(item)} />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No bids yet. Providers in this category will see your request and can reply here. This
              page updates by itself.
            </Text>
          }
        />
      )}

      <Modal visible={!!confirmBid} transparent animationType="fade" onRequestClose={() => setConfirmBid(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Accept this bid?</Text>
            <Text style={styles.modalText}>
              {confirmBid?.provider.businessName} for {confirmBid ? formatKES(confirmBid.amountKES) : ""}.
              Other bids on this request will be closed. Online payment is not connected yet, so you
              will not be charged now.
            </Text>
            {accepting ? (
              <ActivityIndicator color={COLORS.primaryBlue} />
            ) : (
              <>
                <Button title="Yes, accept" onPress={handleConfirm} />
                <Pressable onPress={() => setConfirmBid(null)} style={{ marginTop: 12 }}>
                  <Text style={styles.cancel}>Cancel</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: COLORS.darkText },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  error: { fontSize: 14, color: "#DC2626", marginBottom: 12, lineHeight: 20 },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  jobDescription: { fontSize: 16, fontWeight: "600", color: COLORS.darkText, lineHeight: 22 },
  jobMeta: { fontSize: 13, color: COLORS.mutedText },
  status: { fontSize: 14, fontWeight: "600", color: COLORS.midText, marginBottom: 12 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  cardTop: { flexDirection: "row", alignItems: "center" },
  providerName: { fontSize: 15, fontWeight: "600", color: COLORS.darkText, marginBottom: 2 },
  amount: { fontSize: 17, fontWeight: "700", color: COLORS.primaryBlue },
  note: { fontSize: 14, color: COLORS.midText, lineHeight: 20 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  empty: { textAlign: "center", color: COLORS.mutedText, marginTop: 24, paddingHorizontal: 24, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  modalCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, width: "85%", gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: "600", color: COLORS.darkText },
  modalText: { fontSize: 14, color: COLORS.midText, lineHeight: 20 },
  cancel: { textAlign: "center", color: COLORS.mutedText, fontWeight: "600" },
});
