import React, { useRef, useState } from "react";
import {
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@localfind/shared";
import Button from "../../components/Button";
import FormScreen from "../../components/FormScreen";
import { apiRequest, saveToken } from "../../lib/api";

export default function Register() {
  const params = useLocalSearchParams<{ role?: string }>();
  const role = params.role === "provider" ? "provider" : "seeker";

  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    Keyboard.dismiss();
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
    <FormScreen>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        style={styles.back}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.darkText} />
      </Pressable>

      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>It only takes a minute</Text>

      <Text style={styles.label}>Full name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Amina Wanjiru"
        placeholderTextColor={COLORS.mutedText}
        value={name}
        onChangeText={setName}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        blurOnSubmit={false}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        ref={emailRef}
        style={styles.input}
        placeholder="you@example.com"
        placeholderTextColor={COLORS.mutedText}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
        blurOnSubmit={false}
      />

      <Text style={styles.label}>Phone number</Text>
      <TextInput
        ref={phoneRef}
        style={styles.input}
        placeholder="+254 7XX XXX XXX"
        placeholderTextColor={COLORS.mutedText}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        ref={passwordRef}
        style={styles.input}
        placeholder="At least 8 characters"
        placeholderTextColor={COLORS.mutedText}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={COLORS.primaryBlue} />
      ) : (
        <Button title="Create Account" onPress={handleSubmit} style={{ marginTop: 24 }} />
      )}

      <Pressable
        onPress={() => router.replace({ pathname: "/(auth)/login", params: { role } })}
        hitSlop={8}
      >
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </Pressable>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: "flex-start", marginBottom: 24 },
  title: { fontSize: 26, fontWeight: "600", color: COLORS.darkText, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.mutedText, marginBottom: 16 },
  error: { fontSize: 14, color: "#DC2626", marginTop: 16, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.midText, marginBottom: 6, marginTop: 12 },
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
  link: {
    textAlign: "center",
    color: COLORS.primaryBlue,
    marginTop: 28,
    fontSize: 14,
    fontWeight: "600",
  },
});
