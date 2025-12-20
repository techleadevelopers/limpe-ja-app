import React from 'react';
import { Stack } from 'expo-router';

export default function ClientMessagesStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[chatId]" options={{ headerShown: false }} />
    </Stack>
  );
}

