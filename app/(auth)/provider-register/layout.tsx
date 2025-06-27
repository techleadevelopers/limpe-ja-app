// LimpeJaApp/app/(auth)/provider-register/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
// Certifique-se de que o caminho abaixo esteja correto para o seu ProviderRegistrationContext
import { ProviderRegistrationProvider } from '../../../contexts/ProviderRegistrationContext'; 


export default function ProviderRegisterLayout() {
  console.log('Renderizando ProviderRegisterLayout.'); // Log para verificar se o layout está sendo renderizado
  return (
    // Envolve o Stack navigator com o ProviderRegistrationProvider
    <ProviderRegistrationProvider>
      <Stack screenOptions={{ headerShown: true, headerTitleAlign: 'center' }}>
        <Stack.Screen name="index" options={{ title: 'Cadastro Profissional - Etapa 1' }} />
        <Stack.Screen name="personal-details" options={{ title: 'Dados Pessoais' }} />
        <Stack.Screen name="service-details" options={{ title: 'Detalhes do Serviço' }} />
        {/* Adicione mais telas/etapas se necessário */}
      </Stack>
    </ProviderRegistrationProvider>
  );
}
