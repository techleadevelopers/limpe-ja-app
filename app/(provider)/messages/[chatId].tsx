// LimpeJaApp/app/(provider)/messages/[chatId].tsx
// IMPORTANTE: Este pode ser muito similar ou até mesmo reutilizar a lógica
// e UI de app/(client)/messages/[chatId].tsx.
// Considere criar um componente reutilizável se a funcionalidade for idêntica.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
// Reutilize o ChatScreen do cliente ou crie uma cópia/variação
// Para este placeholder, vamos apenas mostrar uma mensagem simples.

export default function ProviderChatScreen() {
  const { chatId, recipientName } = useLocalSearchParams<{ chatId?: string, recipientName?: string }>();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: recipientName || 'Chat com Cliente' }} />
      <Text style={styles.title}>Chat com {recipientName}</Text>
      <Text>ID do Chat: {chatId}</Text>
      <Text style={styles.placeholder}>
        A interface de chat completa (similar à do cliente) seria implementada aqui.
        A lógica para enviar/receber mensagens usaria o ID do provedor autenticado.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  placeholder: {
    textAlign: 'center',
    color: 'gray',
    marginTop: 20,
  },
});