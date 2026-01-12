import React from 'react';
import { Stack } from 'expo-router';

export default function ProviderActiveBookingStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="[bookingId]"
        options={{
          headerShown: true,
          headerTitle: 'Atendimento',
          headerTitleStyle: { color: '#111827', fontSize: 18, fontWeight: '700' },
        }}
      />
    </Stack>
  );
}

