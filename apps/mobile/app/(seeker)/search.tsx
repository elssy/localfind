import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, CATEGORIES, providerFromPublic } from "@localfind/shared";
import type { Provider, PublicProviderRow } from "@localfind/shared";
import { apiRequest } from "../../lib/api";
import Avatar from "../../components/Avatar";
import Button from "../../components/Button";
import ProviderRating from "../../components/ProviderRating";

const CATEGORY_NAMES: string[] = CATEGORIES.map((c) => c.name);

export default function Search() {
  const params = useLocalSearchParams<{ category?: string }>();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState(
    params.category && CATEGORY_NAMES.includes(params.category) ? params.category : ""
  );
  const [results, setResults] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wait for a short pause in typing before asking the server.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debounced && !category) {
      setResults([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const parts = ["pageSize=50"];
    if (debounced) parts.push(`q=${encodeURIComponent(debounced)}`);
    if (category) parts.push(`category=${encodeURIComponent(category)}`);

    apiRequest(`/api/providers?${parts.join("&")}`)
      .then((data) => {
        if (!cancelled) setResults((data.items as PublicProviderRow[]).map(providerFromPublic));
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message ?? "Could not search. Try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced, category]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(seeker)");
    }
  };

  const showingCategories = query.trim().length === 0 && !category;

  const openRequest = () => {
    const typed = query.trim();
    router.push({
      pathname: "/(shared)/new-request",
      params: { category, description: typed && typed !== category ? typed : "" },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchRow}>
        <Pressable onPress={handleBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={COLORS.darkText} />
        </Pressable>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="What are you looking for?"
          placeholderTextColor={COLORS.mutedText}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
      </View>

      {showingCategories ? (
        <FlatList
          key="categories"
          data={CATEGORIES}
          keyExtractor={(item) => item.name}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 12 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable style={styles.categoryTile} onPress={() => setCategory(item.name)}>
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={28}
                color={COLORS.primaryBlue}
              />
              <Text style={styles.categoryLabel}>{item.name}</Text>
            </Pressable>
          )}
        />
      ) : (
        <>
          {category ? (
            <View style={styles.chipRow}>
              <Pressable style={styles.chip} onPress={() => setCategory("")} accessibilityLabel="Clear category">
                <Text style={styles.chipText}>{category}</Text>
                <Ionicons name="close" size={14} color={COLORS.primaryBlue} />
              </Pressable>
            </View>
          ) : null}

          {error && <Text style={styles.error}>{error}</Text>}

          <FlatList
            key="results"
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              loading ? <ActivityIndicator style={{ marginBottom: 12 }} color={COLORS.primaryBlue} /> : null
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.resultCard}
                onPress={() => router.push(`/(shared)/provider-profile/${item.id}`)}
              >
                <Avatar name={item.name} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultCategory}>
                    {item.category}
                    {item.address ? ` · ${item.address}` : ""}
                  </Text>
                  <View style={styles.resultMetaRow}>
                    <ProviderRating rating={item.rating} reviewCount={item.reviewCount} size={12} />
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.mutedText} />
              </Pressable>
            )}
            ListEmptyComponent={
              loading ? null : (
                <Text style={styles.emptyText}>
                  No approved providers match yet. You can still send a request, and providers in
                  this category will see it.
                </Text>
              )
            }
          />

          <View style={styles.footer}>
            <Button
              title={category ? `Request a quote in ${category}` : "Request a quote"}
              onPress={openRequest}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
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
  grid: { paddingHorizontal: 20, gap: 12, paddingBottom: 24 },
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
  chipRow: { paddingHorizontal: 20, paddingBottom: 8, flexDirection: "row" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.lightBlueTint,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: COLORS.primaryBlue },
  list: { paddingHorizontal: 20, paddingBottom: 12, flexGrow: 1 },
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
  resultName: { fontSize: 15, fontWeight: "600", color: COLORS.darkText },
  resultCategory: { fontSize: 12, color: COLORS.mutedText, marginVertical: 2 },
  resultMetaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  emptyText: {
    textAlign: "center",
    color: COLORS.mutedText,
    marginTop: 40,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  error: { color: "#DC2626", paddingHorizontal: 20, marginBottom: 8, lineHeight: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
});
