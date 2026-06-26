import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  FlatList,
  Modal,
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, formatKES } from "@localfind/shared";
import type { Bid } from "@localfind/shared";
import { useAppStore } from "../../store/useAppStore";
import { formatMMSS } from "../../utils/format";
import Avatar from "../../components/Avatar";
import StarRating from "../../components/StarRating";
import Button from "../../components/Button";

const EXTRA_BID: Bid = {
  id: "bid-extra-1",
  providerId: "p5",
  requestId: "r1",
  amount: 1800,
  note: "I can offer a consultation slot within the hour.",
  eta: "1 hr",
  submittedAt: new Date().toISOString(),
};

function BidCard({
  bid,
  providerName,
  verified,
  rating,
  reviewCount,
  onAccept,
}: {
  bid: Bid;
  providerName: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  onAccept: () => void;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  return (
    <Animated.View style={[styles.card, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <View style={styles.cardTop}>
        <Avatar name={providerName} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={styles.nameRow}>
            <Text style={styles.providerName}>{providerName}</Text>
            {verified && <Ionicons name="checkmark-circle" size={16} color={COLORS.primaryBlue} />}
          </View>
          <StarRating rating={rating} reviewCount={reviewCount} />
        </View>
        <Text style={styles.amount}>{formatKES(bid.amount)}</Text>
      </View>
      <Text style={styles.note}>{bid.note}</Text>
      <Text style={styles.eta}>ETA: {bid.eta}</Text>
      <View style={styles.btnRow}>
        <Button
          title="View Profile"
          variant="ghost"
          onPress={() => router.push(`/(shared)/provider-profile/${bid.providerId}`)}
          style={{ flex: 1 }}
        />
        <Button title="Accept Bid" onPress={onAccept} style={{ flex: 1 }} />
      </View>
    </Animated.View>
  );
}

export default function Bids() {
  const params = useLocalSearchParams<{ query?: string }>();
  const query = params.query ?? "your request";
  const providers = useAppStore((s) => s.providers);
  const storeBids = useAppStore((s) => s.bids);
  const acceptBid = useAppStore((s) => s.acceptBid);

  const [secondsLeft, setSecondsLeft] = useState(300);
  const [visibleBids, setVisibleBids] = useState<Bid[]>([]);
  const [confirmBid, setConfirmBid] = useState<Bid | null>(null);

  const requestBids = storeBids.filter((b) => b.requestId === "r1").concat(EXTRA_BID);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timers = requestBids.map((bid, idx) =>
      setTimeout(() => {
        setVisibleBids((prev) => (prev.find((b) => b.id === bid.id) ? prev : [...prev, bid]));
      }, idx * 2000)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusText =
    visibleBids.length === 0
      ? "Waiting for bids…"
      : `${visibleBids.length} bid${visibleBids.length > 1 ? "s" : ""} received`;

  const handleConfirm = () => {
    if (!confirmBid) return;
    const tx = acceptBid(confirmBid, query);
    setConfirmBid(null);
    router.replace(`/(shared)/escrow/${tx.id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bids for: {query}</Text>
        <View style={styles.timerRow}>
          <Ionicons name="time-outline" size={16} color={COLORS.warningAmber} />
          <Text style={styles.timer}>{formatMMSS(secondsLeft)}</Text>
        </View>
        <Text style={styles.status}>{statusText}</Text>
      </View>

      <FlatList
        data={visibleBids}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const provider = providers.find((p) => p.id === item.providerId);
          return (
            <BidCard
              bid={item}
              providerName={provider?.name ?? "Provider"}
              verified={provider?.verified ?? false}
              rating={provider?.rating ?? 4.5}
              reviewCount={provider?.reviewCount ?? 0}
              onAccept={() => setConfirmBid(item)}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="hourglass-outline" size={32} color={COLORS.mutedText} />
            <Text style={styles.emptyText}>Hang tight, providers nearby are reviewing your request.</Text>
          </View>
        }
      />

      <Modal visible={!!confirmBid} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {confirmBid && (
              <>
                <Text style={styles.modalTitle}>
                  Accept{" "}
                  {providers.find((p) => p.id === confirmBid.providerId)?.name ?? "this provider"}'s bid of{" "}
                  {formatKES(confirmBid.amount)}?
                </Text>
                <Text style={styles.modalSubtext}>
                  Your payment will be held securely in escrow and only released to the provider once you
                  confirm the job is done.
                </Text>
                <Button title="Confirm & Pay" onPress={handleConfirm} />
                <Pressable onPress={() => setConfirmBid(null)} style={{ marginTop: 10 }}>
                  <Text style={styles.cancelText}>Cancel</Text>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.darkText,
    marginBottom: 6,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timer: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.warningAmber,
  },
  status: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginTop: 4,
  },
  list: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  providerName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  amount: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.primaryBlue,
  },
  note: {
    fontSize: 13,
    color: COLORS.midText,
    marginBottom: 6,
  },
  eta: {
    fontSize: 12,
    color: COLORS.mutedText,
    marginBottom: 10,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  emptyWrap: {
    alignItems: "center",
    marginTop: 60,
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.mutedText,
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
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkText,
    marginBottom: 10,
  },
  modalSubtext: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginBottom: 20,
  },
  cancelText: {
    textAlign: "center",
    color: COLORS.mutedText,
    fontWeight: "600",
  },
});
