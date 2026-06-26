import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@localfind/shared";
import { useAppStore } from "../../store/useAppStore";
import Avatar from "../../components/Avatar";

const MENU_ITEMS: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Saved providers", icon: "heart-outline" },
  { label: "Payment methods", icon: "card-outline" },
  { label: "Notifications", icon: "notifications-outline" },
  { label: "Help & support", icon: "help-circle-outline" },
];

export default function SeekerProfile() {
  const currentSeeker = useAppStore((s) => s.currentSeeker);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <Avatar name={currentSeeker.name} size={64} />
          <Text style={styles.name}>{currentSeeker.name}</Text>
          <Text style={styles.phone}>{currentSeeker.phone}</Text>
        </View>

        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            <Pressable key={item.label} style={styles.menuItem}>
              <Ionicons name={item.icon} size={20} color={COLORS.primaryBlue} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.mutedText} />
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.menuItem} onPress={() => router.replace("/(auth)/splash")}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.dangerRed} />
          <Text style={[styles.menuLabel, { color: COLORS.dangerRed }]}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 24,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.darkText,
    marginTop: 12,
  },
  phone: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  menu: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkText,
    fontWeight: "500",
  },
});
