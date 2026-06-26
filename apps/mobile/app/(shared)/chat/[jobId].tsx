import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, mockChatMessages } from "@localfind/shared";
import { useAppStore } from "../../../store/useAppStore";
import Badge from "../../../components/Badge";

type ChatMessage = {
  id: string;
  jobId: string;
  sender: "provider" | "seeker";
  text: string;
  timestamp: string;
  type?: "text" | "image";
};

let msgCounter = 1000;

export default function Chat() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const transactions = useAppStore((s) => s.transactions);
  const providers = useAppStore((s) => s.providers);
  const transaction = transactions.find((t) => t.id === jobId);
  const provider = providers.find((p) => p.id === transaction?.providerId);

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    mockChatMessages(jobId ?? "job").map((m) => ({ ...m, type: "text" as const }))
  );
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    msgCounter += 1;
    setMessages((prev) => [
      ...prev,
      {
        id: `m-new-${msgCounter}`,
        jobId: jobId ?? "job",
        sender: "seeker",
        text: text.trim(),
        timestamp: new Date().toISOString(),
        type: "text",
      },
    ]);
    setText("");
  };

  const handleAttachImage = () => {
    msgCounter += 1;
    setMessages((prev) => [
      ...prev,
      {
        id: `m-img-${msgCounter}`,
        jobId: jobId ?? "job",
        sender: "seeker",
        text: "[Photo attached]",
        timestamp: new Date().toISOString(),
        type: "image",
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkText} />
        </Pressable>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.providerName}>{provider?.name ?? "Provider"}</Text>
        </View>
        <Badge label="Job in progress" backgroundColor={COLORS.lightBlueTint} color={COLORS.primaryBlue} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.sender === "seeker" ? styles.bubbleRight : styles.bubbleLeft,
              ]}
            >
              {item.type === "image" ? (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image" size={28} color={COLORS.mutedText} />
                </View>
              ) : (
                <Text
                  style={[
                    styles.bubbleText,
                    item.sender === "seeker" ? styles.bubbleTextRight : styles.bubbleTextLeft,
                  ]}
                >
                  {item.text}
                </Text>
              )}
            </View>
          )}
        />

        <View style={styles.inputBar}>
          <Pressable onPress={handleAttachImage} style={styles.iconBtn}>
            <Ionicons name="camera-outline" size={22} color={COLORS.primaryBlue} />
          </Pressable>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message…"
            placeholderTextColor={COLORS.mutedText}
          />
          <Pressable onPress={handleSend} style={styles.iconBtn}>
            <Ionicons name="send" size={20} color={COLORS.primaryBlue} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  providerName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  messageList: {
    padding: 16,
    gap: 10,
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  bubbleRight: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primaryBlue,
  },
  bubbleLeft: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleText: {
    fontSize: 14,
  },
  bubbleTextRight: {
    color: COLORS.white,
  },
  bubbleTextLeft: {
    color: COLORS.darkText,
  },
  imagePlaceholder: {
    width: 120,
    height: 90,
    borderRadius: 8,
    backgroundColor: COLORS.lightBlueTint,
    alignItems: "center",
    justifyContent: "center",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: 8,
  },
  iconBtn: {
    padding: 6,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.darkText,
  },
});
