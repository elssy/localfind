import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, CATEGORY_PIN_COLORS, formatKES, reviews as allReviews } from "@localfind/shared";
import type { Review } from "@localfind/shared";
import { useAppStore } from "../../../store/useAppStore";
import Avatar from "../../../components/Avatar";
import StarRating from "../../../components/StarRating";
import Button from "../../../components/Button";

const FALLBACK_REVIEWS: Omit<Review, "providerId">[] = [
  { id: "fb1", authorName: "Mary K.", rating: 5, text: "Great service, highly recommend.", date: "2025-05-10" },
  { id: "fb2", authorName: "James O.", rating: 4, text: "Good experience overall.", date: "2025-05-02" },
  { id: "fb3", authorName: "Lucy W.", rating: 5, text: "Will use again.", date: "2025-04-22" },
];

export default function ProviderProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const providers = useAppStore((s) => s.providers);
  const provider = providers.find((p) => p.id === id);

  if (!provider) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Provider not found.</Text>
      </SafeAreaView>
    );
  }

  const providerReviews = allReviews.filter((r) => r.providerId === provider.id);
  const reviewsToShow: { id: string; authorName: string; rating: number; text: string; date: string }[] =
    providerReviews.length > 0 ? providerReviews : FALLBACK_REVIEWS.map((r) => ({ ...r }));

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
      </Pressable>

      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.coverStrip,
            { backgroundColor: CATEGORY_PIN_COLORS[provider.category] ?? COLORS.primaryBlue },
          ]}
        >
          <Avatar name={provider.name} size={72} backgroundColor={COLORS.white} />
        </View>

        <View style={styles.headerBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{provider.name}</Text>
            {provider.verified && <Ionicons name="checkmark-circle" size={18} color={COLORS.primaryBlue} />}
          </View>
          <Text style={styles.category}>
            {provider.category} · {provider.subcategory}
          </Text>

          <View style={styles.statsRow}>
            <StarRating rating={provider.rating} reviewCount={provider.reviewCount} size={15} />
            <Text style={styles.responseTime}>Responds {provider.responseTime}</Text>
          </View>
        </View>

        <Text style={styles.bio}>{provider.bio}</Text>

        <Text style={styles.sectionTitle}>Services & prices</Text>
        <View style={styles.servicesList}>
          {provider.services.map((service) => (
            <View key={service.name} style={styles.serviceRow}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.servicePrice}>{formatKES(service.price)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <Pressable onPress={() => router.push(`/(shared)/reviews/${provider.id}`)}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>
        {reviewsToShow.slice(0, 3).map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewTop}>
              <Text style={styles.reviewAuthor}>{review.authorName}</Text>
              <StarRating rating={review.rating} size={12} />
            </View>
            <Text style={styles.reviewText}>{review.text}</Text>
          </View>
        ))}

        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.stickyFooter}>
        <Button
          title="Request this provider"
          onPress={() =>
            router.push({ pathname: "/(seeker)/search", params: { providerId: provider.id } })
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
  coverStrip: {
    height: 130,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBlock: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  category: {
    fontSize: 13,
    color: COLORS.mutedText,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  responseTime: {
    fontSize: 12,
    color: COLORS.mutedText,
  },
  bio: {
    fontSize: 13,
    color: COLORS.midText,
    paddingHorizontal: 16,
    marginTop: 14,
    lineHeight: 19,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkText,
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  servicesList: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  serviceName: {
    fontSize: 13,
    color: COLORS.darkText,
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primaryBlue,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  seeAll: {
    fontSize: 13,
    color: COLORS.primaryBlue,
    fontWeight: "600",
  },
  reviewCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 10,
  },
  reviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  reviewText: {
    fontSize: 13,
    color: COLORS.midText,
  },
  stickyFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  notFound: {
    textAlign: "center",
    marginTop: 60,
    color: COLORS.mutedText,
  },
});
