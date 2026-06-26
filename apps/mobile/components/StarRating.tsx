import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@localfind/shared";

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: number;
}

export default function StarRating({ rating, reviewCount, size = 14 }: StarRatingProps) {
  return (
    <View style={styles.row}>
      <Ionicons name="star" size={size} color={COLORS.warningAmber} />
      <Text style={[styles.text, { fontSize: size }]}>{rating.toFixed(1)}</Text>
      {reviewCount !== undefined && (
        <Text style={[styles.muted, { fontSize: size - 1 }]}>({reviewCount})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  text: {
    color: COLORS.darkText,
    fontWeight: "600",
  },
  muted: {
    color: COLORS.mutedText,
  },
});
