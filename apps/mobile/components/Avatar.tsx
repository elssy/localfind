import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@localfind/shared";
import { initials } from "../utils/format";

interface AvatarProps {
  name: string;
  size?: number;
  backgroundColor?: string;
}

export default function Avatar({ name, size = 44, backgroundColor = COLORS.primaryBlue }: AvatarProps) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: COLORS.white,
    fontWeight: "600",
  },
});
