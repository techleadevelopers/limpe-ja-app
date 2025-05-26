// LimpeJaApp/app/(auth)/provider-register/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function ProviderRegisterLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, headerTitleAlign: 'center' }}>
      <Stack.Screen name="index" options={{ title: 'Cadastro Profissional - Etapa 1' }} />
      <Stack.Screen name="personal-details" options={{ title: 'Dados Pessoais' }} />
      <Stack.Screen name="service-details" options={{ title: 'Detalhes do Serviço' }} />
      {/* Adicione mais telas/etapas se necessário */}
    </Stack>
  );
}