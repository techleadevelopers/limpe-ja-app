import React from 'react';
import { Stack } from 'expo-router';

export default function ProviderActiveBookingStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, headerShadowVisible: false, headerBackTitleVisible: false }}>
      <Stack.Screen name="[bookingId]" options={{ headerShown: false }} />
    </Stack>
  );
}

