import React, { useState } from "react";
import {
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@localfind/shared";
import Button from "../../components/Button";
import { apiRequest, saveToken } from "../../lib/api";

export default function Register() {
  const params = useLocalSearchParams<{ role?: string }>();
  const role = params.role === "provider" ? "provider" : "seeker";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setError("Please fill in every field");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          role,
        }),
      });

      await saveToken(data.token);

      if (data.user.role === "provider") {
        router.replace(
          data.user.hasProfile ? "/(provider)/dashboard" : "/(onboarding)/provider"
        );
      } else {
        router.replace(data.user.hasProfile ? "/(seeker)" : "/(onboarding)/seeker");
      }
    } catch (e: any) {
      setError(e.message || "Could not create account. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        style={styles.back}>
        <Ionicons name="arrow-back" size={24} color={COLORS.darkText} />
      </Pressable>

      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>It only takes a minute</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.label}>Full name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Amina Wanjiru"
        placeholderTextColor={COLORS.mutedText}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor={COLORS.mutedText}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Phone number</Text>
      <TextInput
        style={styles.input}
        placeholder="+254 7XX XXX XXX"
        placeholderTextColor={COLORS.mutedText}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="At least 8 characters"
        placeholderTextColor={COLORS.mutedText}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={COLORS.primaryBlue} />
      ) : (
        <Button title="Create Account" onPress={handleSubmit} style={{ marginTop: 24 }} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  back: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    color: COLORS.darkText,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.mutedText,
    marginBottom: 16,
  },
  error: {
    fontSize: 14,
    color: "#DC2626",
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.midText,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.darkText,
  },
});