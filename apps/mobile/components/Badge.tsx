import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@localfind/shared";

interface BadgeProps {
  label: string;
  color?: string;
  backgroundColor?: string;
}

export default function Badge({
  label,
  color = COLORS.primaryBlue,
  backgroundColor = COLORS.lightBlueTint,
}: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
