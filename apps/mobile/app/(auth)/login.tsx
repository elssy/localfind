import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@localfind/shared";
import Button from "../../components/Button";

export default function Login() {
  const params = useLocalSearchParams<{ role?: string }>();
  const role = params.role === "provider" ? "provider" : "seeker";
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const handleSendOtp = () => {
    if (phone.trim().length < 9) return;
    setStep("otp");
  };

  const handleVerify = () => {
    if (otp.trim().length < 4) return;
    if (role === "provider") {
      router.replace("/(provider)/dashboard");
    } else {
      router.replace("/(seeker)");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={24} color={COLORS.darkText} />
      </Pressable>

      <Text style={styles.title}>
        {role === "provider" ? "Provider Sign In" : "Welcome"}
      </Text>
      <Text style={styles.subtitle}>
        {step === "phone"
          ? "Enter your phone number to continue"
          : `Enter the 4-digit code sent to ${phone}`}
      </Text>

      {step === "phone" ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="+254 7XX XXX XXX"
            placeholderTextColor={COLORS.mutedText}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <Button title="Send Code" onPress={handleSendOtp} style={{ marginTop: 20 }} />
        </>
      ) : (
        <>
          <TextInput
            style={[styles.input, styles.otpInput]}
            placeholder="0000"
            placeholderTextColor={COLORS.mutedText}
            keyboardType="number-pad"
            maxLength={4}
            value={otp}
            onChangeText={setOtp}
          />
          <Button title="Verify & Continue" onPress={handleVerify} style={{ marginTop: 20 }} />
        </>
      )}

      <Pressable onPress={() => router.push("/(auth)/register")}>
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
    marginBottom: 24,
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
  otpInput: {
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 12,
  },
  link: {
    textAlign: "center",
    color: COLORS.primaryBlue,
    marginTop: 24,
    fontSize: 14,
    fontWeight: "600",
  },
});
