import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, CATEGORY_PIN_COLORS } from "@localfind/shared";
import type { PublicProviderRow } from "@localfind/shared";
import { apiRequest } from "../../../lib/api";
import Avatar from "../../../components/Avatar";
import Button from "../../../components/Button";
import ProviderRating from "../../../components/ProviderRating";
import StarRating from "../../../components/StarRating";

type Loaded =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; provider: PublicProviderRow };

export default function ProviderProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [state, setState] = useState<Loaded>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    apiRequest(`/api/providers/${id}`)
      .then((provider) => {
        if (!cancelled) setState({ status: "ready", provider });
      })
      .catch((e: any) => {
        if (cancelled) return;
        if (e?.status === 404) setState({ status: "missing" });
        else setState({ status: "error", message: e?.message ?? "Could not load this provider" });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const back = (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/(seeker)"))}
      style={styles.back}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Back"
    >
      <Ionicons name="arrow-back" size={24} color={COLORS.white} />
    </Pressable>
  );

  if (state.status !== "ready") {
    return (
      <SafeAreaView style={styles.container}>
        {back}
        {state.status === "loading" ? (
          <ActivityIndicator style={{ marginTop: 100 }} color={COLORS.primaryBlue} />
        ) : (
          <Text style={styles.notFound}>
            {state.status === "missing"
              ? "This provider is not available right now. A business only appears once an admin has approved it."
              : state.message}
          </Text>
        )}
      </SafeAreaView>
    );
  }

  const provider = state.provider;
  const reviews = provider.reviews ?? [];

  return (
    <SafeAreaView style={styles.container}>
      {back}

      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.coverStrip,
            { backgroundColor: CATEGORY_PIN_COLORS[provider.category] ?? COLORS.primaryBlue },
          ]}
        >
          <Avatar name={provider.businessName} size={72} backgroundColor={COLORS.white} />
        </View>

        <View style={styles.headerBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{provider.businessName}</Text>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.primaryBlue} />
          </View>
          <Text style={styles.category}>
            {provider.category}
            {provider.city ? ` · ${provider.city}` : ""}
          </Text>
          <View style={styles.statsRow}>
            <ProviderRating rating={provider.rating} reviewCount={provider.reviewCount} size={15} />
          </View>
        </View>

        {provider.bio ? <Text style={styles.bio}>{provider.bio}</Text> : null}

        <Text style={styles.sectionTitle}>Reviews</Text>
        {reviews.length === 0 ? (
          <Text style={styles.noReviews}>No reviews yet.</Text>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <Text style={styles.reviewAuthor}>{review.authorName}</Text>
                <StarRating rating={review.rating} size={12} />
              </View>
              {review.comment ? <Text style={styles.reviewText}>{review.comment}</Text> : null}
            </View>
          ))
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.stickyFooter}>
        <Button
          title={`Request a quote in ${provider.category}`}
          onPress={() =>
            router.push({ pathname: "/(shared)/new-request", params: { category: provider.category } })
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  back: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 20,
    padding: 6,
  },
  content: { paddingBottom: 16 },
  coverStrip: { height: 130, alignItems: "center", justifyContent: "center" },
  headerBlock: { paddingHorizontal: 20, paddingTop: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 20, fontWeight: "600", color: COLORS.darkText },
  category: { fontSize: 13, color: COLORS.mutedText, marginTop: 2 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  bio: { fontSize: 14, color: COLORS.midText, paddingHorizontal: 20, marginTop: 14, lineHeight: 20 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkText,
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 8,
  },
  noReviews: { fontSize: 14, color: COLORS.mutedText, paddingHorizontal: 20 },
  reviewCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 10,
  },
  reviewTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  reviewAuthor: { fontSize: 13, fontWeight: "600", color: COLORS.darkText },
  reviewText: { fontSize: 13, color: COLORS.midText, lineHeight: 18 },
  stickyFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  notFound: {
    textAlign: "center",
    marginTop: 120,
    color: COLORS.mutedText,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});
