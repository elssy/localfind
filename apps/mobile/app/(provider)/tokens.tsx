import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
} from "react-native";
import { COLORS, formatKES, tokenBundles } from "@localfind/shared";
import type { TokenBundle } from "@localfind/shared";
import { useAppStore } from "../../store/useAppStore";
import Badge from "../../components/Badge";
import Button from "../../components/Button";

type FlowStep = "pin" | "processing" | "done";

export default function Tokens() {
  const provider = useAppStore((s) => s.currentProvider);
  const purchases = useAppStore((s) => s.tokenPurchases);
  const purchaseTokenBundle = useAppStore((s) => s.purchaseTokenBundle);

  const [activeBundle, setActiveBundle] = useState<TokenBundle | null>(null);
  const [step, setStep] = useState<FlowStep>("pin");

  const myPurchases = useMemo(
    () =>
      purchases
        .filter((p) => p.providerId === provider.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [purchases, provider.id]
  );

  const openBundle = (bundle: TokenBundle) => {
    setActiveBundle(bundle);
    setStep("pin");
  };

  const handlePay = () => {
    setStep("processing");
    setTimeout(() => {
      if (activeBundle) purchaseTokenBundle(activeBundle.id);
      setStep("done");
    }, 1700);
  };

  const closeModal = () => setActiveBundle(null);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Buy Tokens</Text>
        <Text style={styles.subtext}>
          Tokens let you bid on nearby search alerts. Each bid costs 1 token.
        </Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current balance</Text>
          <Text style={styles.balanceValue}>{provider.tokenBalance} tokens</Text>
        </View>

        <View style={styles.grid}>
          {tokenBundles.map((bundle) => (
            <View key={bundle.id} style={styles.bundleCard}>
              {bundle.tag && (
                <View style={styles.tagWrap}>
                  <Badge label={bundle.tag} backgroundColor={COLORS.lightBlueTint} color={COLORS.primaryBlue} />
                </View>
              )}
              <Text style={styles.bundleName}>{bundle.name}</Text>
              <Text style={styles.bundleAlerts}>{bundle.alerts} alerts</Text>
              <Text style={styles.bundlePrice}>{formatKES(bundle.price)}</Text>
              <Text style={styles.bundlePerAlert}>{formatKES(bundle.pricePerAlert)}/alert</Text>
              <Button title="Buy" onPress={() => openBundle(bundle)} style={{ marginTop: 10 }} />
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Transaction history</Text>
        <View style={styles.historyList}>
          {myPurchases.length === 0 && <Text style={styles.emptyText}>No purchases yet.</Text>}
          {myPurchases.map((purchase) => (
            <View key={purchase.id} style={styles.historyItem}>
              <View>
                <Text style={styles.historyName}>{purchase.tokens} tokens</Text>
                <Text style={styles.historyDate}>{new Date(purchase.date).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.historyAmount}>{formatKES(purchase.amountPaid)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!activeBundle} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {activeBundle && step === "pin" && (
              <>
                <Text style={styles.modalTitle}>Enter your M-Pesa PIN to pay {formatKES(activeBundle.price)}</Text>
                <View style={styles.dotsRow}>
                  {[0, 1, 2, 3].map((i) => (
                    <View key={i} style={styles.pinDot} />
                  ))}
                </View>
                <Button title="Pay" onPress={handlePay} />
                <Pressable onPress={closeModal} style={{ marginTop: 12 }}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </>
            )}
            {step === "processing" && (
              <>
                <ActivityIndicator size="large" color={COLORS.primaryBlue} />
                <Text style={[styles.modalTitle, { marginTop: 16 }]}>Processing…</Text>
              </>
            )}
            {activeBundle && step === "done" && (
              <>
                <Text style={styles.modalTitle}>
                  Payment confirmed. {activeBundle.alerts} tokens added to your account.
                </Text>
                <Button title="Done" onPress={closeModal} style={{ marginTop: 8 }} />
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
  content: { padding: 16, paddingBottom: 32 },
  header: {
    fontSize: 22,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  subtext: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginTop: 4,
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: COLORS.escrowPurple,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
  },
  balanceValue: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "600",
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  bundleCard: {
    width: "47%",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  tagWrap: {
    marginBottom: 6,
  },
  bundleName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  bundleAlerts: {
    fontSize: 12,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  bundlePrice: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.primaryBlue,
    marginTop: 8,
  },
  bundlePerAlert: {
    fontSize: 11,
    color: COLORS.mutedText,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkText,
    marginBottom: 10,
  },
  historyList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  historyDate: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primaryBlue,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.mutedText,
    textAlign: "center",
    paddingVertical: 8,
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
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkText,
    textAlign: "center",
    marginBottom: 20,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 24,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.lightBlueTint,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBlue,
  },
  cancelText: {
    color: COLORS.mutedText,
    fontWeight: "600",
  },
});
