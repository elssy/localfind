import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  FlatList,
  SafeAreaView,
  Animated,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, CATEGORIES, formatKm } from "@localfind/shared";
import type { Provider } from "@localfind/shared";
import { useAppStore } from "../../store/useAppStore";
import StarRating from "../../components/StarRating";
import Button from "../../components/Button";

const MOCK_DISTANCES: Record<string, number> = {
  p1: 1.2,
  p2: 3.4,
  p3: 2.1,
  p4: 4.6,
  p5: 2.8,
};

export default function Search() {
  const providers = useAppStore((s) => s.providers);
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastText, setBroadcastText] = useState("Sending your request to nearby providers…");
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!broadcasting) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [broadcasting, pulse]);

  const filtered: Provider[] = query.trim()
    ? providers.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase()) ||
          p.subcategory.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const startBroadcast = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setBroadcastText("Sending your request to nearby providers…");
    setBroadcasting(true);
    setTimeout(() => {
      setBroadcastText("3 providers notified. Bids coming in…");
      setTimeout(() => {
        setBroadcasting(false);
        router.push({ pathname: "/(seeker)/bids", params: { query: searchQuery } });
      }, 900);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchRow}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkText} />
        </Pressable>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="What are you looking for?"
          placeholderTextColor={COLORS.mutedText}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => startBroadcast(query)}
          returnKeyType="search"
        />
      </View>

      {query.trim().length === 0 ? (
        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item.name}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <Pressable style={styles.categoryTile} onPress={() => setQuery(item.name)}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={28} color={COLORS.primaryBlue} />
              <Text style={styles.categoryLabel}>{item.name}</Text>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.resultCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultCategory}>{item.category}</Text>
                <View style={styles.resultMetaRow}>
                  <StarRating rating={item.rating} size={12} />
                  <Text style={styles.resultMeta}>{formatKm(MOCK_DISTANCES[item.id] ?? 1)}</Text>
                </View>
              </View>
              <Button title="Request" onPress={() => startBroadcast(query)} style={styles.requestBtn} />
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No matching providers. Try requesting anyway — we'll broadcast to nearby providers.</Text>
          }
        />
      )}

      <Modal visible={broadcasting} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulse }] }]}>
              <Ionicons name="radio-outline" size={32} color={COLORS.primaryBlue} />
            </Animated.View>
            <Text style={styles.modalText}>{broadcastText}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.darkText,
  },
  grid: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 24,
  },
  categoryTile: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 24,
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.darkText,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 24,
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
  },
  resultName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  resultCategory: {
    fontSize: 12,
    color: COLORS.mutedText,
    marginVertical: 2,
  },
  resultMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  resultMeta: {
    fontSize: 12,
    color: COLORS.mutedText,
  },
  requestBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.mutedText,
    marginTop: 40,
    paddingHorizontal: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    width: "80%",
    gap: 16,
  },
  pulseCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.lightBlueTint,
    alignItems: "center",
    justifyContent: "center",
  },
  modalText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkText,
    textAlign: "center",
  },
});
