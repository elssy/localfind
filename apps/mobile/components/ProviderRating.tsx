import React from "react";
import { Text, StyleSheet } from "react-native";
import { COLORS } from "@localfind/shared";
import StarRating from "./StarRating";

interface Props {
  rating: number;
  reviewCount: number;
  size?: number;
}

// A provider with no reviews shows "New" instead of a misleading 0.0 star rating.
export default function ProviderRating({ rating, reviewCount, size = 14 }: Props) {
  if (!reviewCount) {
    return <Text style={[styles.new, { fontSize: size }]}>New</Text>;
  }
  return <StarRating rating={rating} reviewCount={reviewCount} size={size} />;
}

const styles = StyleSheet.create({
  new: { color: COLORS.mutedText, fontWeight: "600" },
});
