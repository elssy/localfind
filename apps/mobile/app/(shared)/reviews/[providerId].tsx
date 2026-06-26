import React from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, reviews } from "@localfind/shared";
import StarRating from "../../../components/StarRating";

export default function Reviews() {
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const providerReviews = reviews.filter((r) => r.providerId === providerId);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkText} />
        </Pressable>
        <Text style={styles.headerTitle}>Reviews</Text>
      </View>

      <FlatList
        data={providerReviews}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.author}>{item.authorName}</Text>
              <StarRating rating={item.rating} />
            </View>
            <Text style={styles.text}>{item.text}</Text>
            <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No reviews yet.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  author: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  text: {
    fontSize: 13,
    color: COLORS.midText,
    marginBottom: 6,
  },
  date: {
    fontSize: 11,
    color: COLORS.mutedText,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.mutedText,
    marginTop: 40,
  },
});
