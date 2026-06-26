import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@localfind/shared";
import Button from "../../components/Button";

export default function Splash() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Ionicons name="location" size={48} color={COLORS.white} />
        </View>
        <Text style={styles.title}>Local Find</Text>
        <Text style={styles.tagline}>Shop it. Book it. Find it near you.</Text>
      </View>

      <View style={styles.buttons}>
        <Button
          title="I'm looking for something"
          variant="secondary"
          onPress={() => router.push({ pathname: "/(auth)/login", params: { role: "seeker" } })}
        />
        <View style={{ height: 12 }} />
        <Button
          title="I'm a provider"
          variant="outline"
          onPress={() => router.push({ pathname: "/(auth)/login", params: { role: "provider" } })}
        />
        <Text style={styles.skip} onPress={() => router.replace("/(seeker)")}>
          Skip
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlue,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: COLORS.white,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  buttons: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  skip: {
    textAlign: "center",
    color: "rgba(255,255,255,0.75)",
    marginTop: 18,
    fontSize: 14,
  },
});
