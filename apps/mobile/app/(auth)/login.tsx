import React, { useState } from "react";
import {
  View,
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

export default function Login() {
  const params = useLocalSearchParams<{ role?: string }>();
  const role = params.role === "provider" ? "provider" : "seeker";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password");
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
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
      setError(e.message || "Login failed. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            style={styles.back}
          >
        <Ionicons name="arrow-back" size={24} color={COLORS.darkText} />
      </Pressable>

      <Text style={styles.title}>
        {role === "provider" ? "Provider Sign In" : "Welcome back"}
      </Text>
      <Text style={styles.subtitle}>Sign in with your email and password</Text>

      {error && <Text style={styles.error}>{error}</Text>}

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

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="••••••••"
        placeholderTextColor={COLORS.mutedText}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        onPress={() => router.push("/(auth)/forgot-password")}
        style={{ marginTop: 8 }}
      >
        <Text style={styles.forgotLink}>Forgot password?</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.primaryBlue} />
      ) : (
        <Button title="Sign In" onPress={handleLogin} style={{ marginTop: 20 }} />
      )}

      <Pressable onPress={() => router.push({ pathname: "/(auth)/register", params: { role } })}>
        <Text style={styles.link}>New here? Create an account</Text>
      </Pressable>
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
  forgotLink: {
    fontSize: 13,
    color: COLORS.primaryBlue,
    fontWeight: "600",
  },
  link: {
    textAlign: "center",
    color: COLORS.primaryBlue,
    marginTop: 24,
    fontSize: 14,
    fontWeight: "600",
  },
});