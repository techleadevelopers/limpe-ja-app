// LimpeJaApp/app/(auth)/provider-register/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { ProviderRegistrationProvider } from '../../../contexts/ProviderRegistrationContext'; 


export default function ProviderRegisterLayout() {
  console.log('DEFENSIVE LOG: ProviderRegisterLayout está sendo renderizado.'); 

  useEffect(() => {
    console.log('DEFENSIVE LOG: ProviderRegistrationProvider está envolvendo o Stack Navigator.');
  }, []); 

  return (
    <ProviderRegistrationProvider>
      <Stack screenOptions={{ headerShown: true, headerTitleAlign: 'center' }}>
        <Stack.Screen name="index" options={{ title: 'Cadastro Profissional - Etapa 1' }} />
        <Stack.Screen name="personal-details" options={{ title: 'Dados Pessoais' }} />
        {/* REVERTIDO: Nome da tela de volta para "service-details" */}
        <Stack.Screen name="service-details" options={{ title: 'Detalhes do Serviço do Provedor' }} />
        <Stack.Screen name="verify-account" options={{ title: 'Verificação de Conta' }} />
      </Stack>
    </ProviderRegistrationProvider>
  );
}