import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, activityFeed } from "@localfind/shared";
import { useAppStore } from "../../store/useAppStore";

const QUICK_ACTIONS: { label: string; icon: keyof typeof Ionicons.glyphMap; href: "/(provider)/alerts" | "/(provider)/jobs" | "/(provider)/profile" }[] = [
  { label: "View Alerts", icon: "notifications-outline", href: "/(provider)/alerts" },
  { label: "Active Jobs", icon: "briefcase-outline", href: "/(provider)/jobs" },
  { label: "Edit Profile", icon: "person-outline", href: "/(provider)/profile" },
];

export default function Dashboard() {
  const provider = useAppStore((s) => s.currentProvider);
  const recentEvents = activityFeed.slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Hello, {provider.name} 👋</Text>

        <Pressable style={styles.tokenCard} onPress={() => router.push("/(provider)/tokens")}>
          <View>
            <Text style={styles.tokenLabel}>Token balance</Text>
            <Text style={styles.tokenValue}>{provider.tokenBalance} tokens remaining</Text>
          </View>
          <View style={styles.buyMoreBtn}>
            <Text style={styles.buyMoreText}>Buy more</Text>
          </View>
        </Pressable>

        <View style={styles.statsRow}>
          <StatBox label="Alerts received" value="6" />
          <StatBox label="Bids submitted" value="3" />
          <StatBox label="Jobs won today" value="1" />
        </View>

        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actionsRow}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable key={action.label} style={styles.actionTile} onPress={() => router.push(action.href)}>
              <Ionicons name={action.icon} size={22} color={COLORS.primaryBlue} />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent activity</Text>
        <View style={styles.feed}>
          {recentEvents.map((event) => (
            <View key={event.id} style={styles.feedItem}>
              <View style={styles.feedDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.feedText}>{event.description}</Text>
                <Text style={styles.feedTime}>{new Date(event.timestamp).toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  greeting: {
    fontSize: 22,
    fontWeight: "600",
    color: COLORS.darkText,
    marginBottom: 16,
  },
  tokenCard: {
    backgroundColor: COLORS.escrowPurple,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  tokenLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
  },
  tokenValue: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },
  buyMoreBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buyMoreText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.primaryBlue,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginTop: 4,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkText,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  actionTile: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.darkText,
    textAlign: "center",
  },
  feed: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  feedItem: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  feedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryBlue,
    marginTop: 5,
  },
  feedText: {
    fontSize: 13,
    color: COLORS.darkText,
  },
  feedTime: {
    fontSize: 11,
    color: COLORS.mutedText,
    marginTop: 2,
  },
});
