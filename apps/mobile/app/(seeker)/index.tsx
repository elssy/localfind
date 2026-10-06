import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  COLORS,
  CATEGORY_PIN_COLORS,
  NAIROBI_CENTER,
  MOCK_USER_LOCATION,
} from "@localfind/shared";
import { useAppStore } from "../../store/useAppStore";
import Avatar from "../../components/Avatar";
import ProviderRating from "../../components/ProviderRating";

const NAIROBI_REGION: Region = {
  latitude: NAIROBI_CENTER.lat,
  longitude: NAIROBI_CENTER.lng,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function SeekerHome() {
  const providers = useAppStore((s) => s.providers);
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(NAIROBI_REGION);

  // Best rated first, then newest. Distance is not shown because a provider's
  // map location and the seeker's real location are not collected yet.
  const featured = [...providers]
    .sort(
      (a, b) =>
        b.rating - a.rating || new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
    )
    .slice(0, 10);

  // Providers who have not set a map location cannot be pinned, so they are left off the map.
  const pinned = providers.filter((p) => p.located !== false);

  const handleUseMyLocation = () => {
    const newRegion: Region = {
      latitude: MOCK_USER_LOCATION.lat,
      longitude: MOCK_USER_LOCATION.lng,
      latitudeDelta: 0.03,
      longitudeDelta: 0.03,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 500);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={NAIROBI_REGION}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {pinned.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            pinColor={CATEGORY_PIN_COLORS[p.category] ?? COLORS.primaryBlue}
            title={p.name}
            description={p.category}
            onPress={() => router.push(`/(shared)/provider-profile/${p.id}`)}
          />
        ))}
      </MapView>

      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <Pressable style={styles.searchBar} onPress={() => router.push("/(seeker)/search")}>
          <Ionicons name="search" size={18} color={COLORS.mutedText} />
          <Text style={styles.searchPlaceholder}>What are you looking for?</Text>
        </Pressable>

        <Pressable style={styles.locationPill} onPress={handleUseMyLocation}>
          <Ionicons name="locate" size={16} color={COLORS.primaryBlue} />
          <Text style={styles.locationPillText}>Use my location</Text>
        </Pressable>
      </SafeAreaView>

      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Providers on Local Find</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow}>
          {featured.map((p) => (
            <Pressable
              key={p.id}
              style={styles.card}
              onPress={() => router.push(`/(shared)/provider-profile/${p.id}`)}
            >
              <View style={styles.cardHeader}>
                <Avatar name={p.name} size={36} />
                <View style={{ marginLeft: 8, flex: 1 }}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.cardCategory}>{p.category}</Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <ProviderRating rating={p.rating} reviewCount={p.reviewCount} size={12} />
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {p.address}
                </Text>
              </View>
            </Pressable>
          ))}
          {featured.length === 0 && (
            <Text style={styles.emptyProviders}>
              No providers have joined yet. Search for a service and send a request, and providers
              will reply as they join.
            </Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  map: { flex: 1 },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 8,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchPlaceholder: {
    color: COLORS.mutedText,
    fontSize: 15,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  locationPillText: {
    color: COLORS.primaryBlue,
    fontSize: 12,
    fontWeight: "600",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "30%",
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 5,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkText,
    marginBottom: 10,
  },
  cardRow: {
    gap: 12,
    paddingBottom: 12,
  },
  card: {
    width: 200,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  cardCategory: {
    fontSize: 11,
    color: COLORS.mutedText,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  emptyProviders: {
    fontSize: 13,
    color: COLORS.mutedText,
    lineHeight: 18,
    width: 300,
  },
  cardMeta: {
    fontSize: 11,
    color: COLORS.mutedText,
  },
});
