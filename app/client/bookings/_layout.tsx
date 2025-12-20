import React from 'react';
import { Stack } from 'expo-router';

export default function BookingsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, headerShadowVisible: false, headerBackTitleVisible: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[bookingId]" options={{ headerShown: false }} />
      <Stack.Screen name="schedule-service" options={{ headerShown: false }} />
      <Stack.Screen name="success" options={{ headerShown: false }} />
    </Stack>
  );
}

