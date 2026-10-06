import React from "react";
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { COLORS } from "@localfind/shared";
import Button from "./Button";
import { signOut } from "../lib/api";

interface Props {
  status: "loading" | "error";
  message?: string;
  onRetry: () => void;
}

export default function ProfileLoadStatus({ status, message, onRetry }: Props) {
  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  if (status === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>We could not load your profile</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Button title="Try again" onPress={onRetry} style={styles.retry} />
      <Pressable onPress={handleLogout} accessibilityRole="button">
        <Text style={styles.logout}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: 32,
  },
  title: { fontSize: 18, fontWeight: "600", color: COLORS.darkText, textAlign: "center" },
  message: { fontSize: 14, color: COLORS.mutedText, textAlign: "center", marginTop: 8 },
  retry: { marginTop: 24, alignSelf: "stretch" },
  logout: { marginTop: 20, fontSize: 14, fontWeight: "600", color: COLORS.primaryBlue },
});
