import React from 'react';
import { Stack } from 'expo-router';

export default function ExploreStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, headerShadowVisible: false, headerBackTitleVisible: false }}>
      {/* Keep the home screen with its own header/UI */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* Other screens inherit default header with back button */}
    </Stack>
  );
}

