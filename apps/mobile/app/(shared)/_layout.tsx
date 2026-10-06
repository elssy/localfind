import React from "react";
import { Stack } from "expo-router";

export default function SharedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="provider-profile/[id]" />
      <Stack.Screen name="new-request" />
      <Stack.Screen name="request/[jobId]" />
      <Stack.Screen name="bid/[jobId]" />
      <Stack.Screen name="chat/[jobId]" />
      <Stack.Screen name="escrow/[transactionId]" />
      <Stack.Screen name="reviews/[providerId]" />
    </Stack>
  );
}
