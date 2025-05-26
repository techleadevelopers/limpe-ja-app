// LimpeJaApp/app/(auth)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register-options" options={{ title: 'Criar Conta' }} />
      <Stack.Screen name="client-register" options={{ title: 'Cadastro de Cliente' }} />
      <Stack.Screen
        name="provider-register" // Este é o grupo/diretório
        options={{ title: 'Cadastro de Profissional', headerShown: false }} // O layout do grupo provider-register pode ter seu próprio header
      />
      {/* Adicione outras telas do fluxo de autenticação aqui */}
    </Stack>
  );
}