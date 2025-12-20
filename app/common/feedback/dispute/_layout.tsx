import React from 'react';
import { Stack } from 'expo-router';

export default function DisputeStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, headerShadowVisible: false, headerBackTitleVisible: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

