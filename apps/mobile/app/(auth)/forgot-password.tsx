import React, { useState } from "react";
import {
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@localfind/shared";
import Button from "../../components/Button";
import { apiRequest } from "../../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;

    setLoading(true);
    try {
      await apiRequest("/api/auth/request-password-reset", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch {
      // Deliberately ignored — the API always returns the same response
      // whether or not the email exists, so there's nothing useful to
      // show differently here even on failure.
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={styles.back} >
        <Ionicons name="arrow-back" size={24} color={COLORS.darkText} />
      </Pressable>

      <Text style={styles.title}>Reset your password</Text>

      {submitted ? (
        <>
          <Text style={styles.subtitle}>
            If an account exists for {email.trim()}, we've sent a link to reset your
            password. Open it from your phone's email app to continue.
          </Text>
          <Button
            title="Back to Sign In"
            onPress={() => router.replace("/(auth)/login")}
            style={{ marginTop: 24 }}
          />
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>
            Enter the email on your account and we'll send you a reset link.
          </Text>

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

          {loading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.primaryBlue} />
          ) : (
            <Button title="Send Reset Link" onPress={handleSubmit} style={{ marginTop: 20 }} />
          )}
        </>
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
    marginBottom: 24,
    lineHeight: 20,
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