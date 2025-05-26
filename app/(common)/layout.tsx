// LimpeJaApp/app/(common)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function CommonLayout() {
  return (
    <Stack>
      <Stack.Screen name="settings" options={{ title: 'Configurações' }} />
      <Stack.Screen name="help" options={{ title: 'Ajuda e Suporte' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notificações' }} />
      <Stack.Screen name="feedback/[targetId]" options={{ title: 'Enviar Feedback' }} />
      {/* Adicione outras telas comuns aqui */}
    </Stack>
  );
}