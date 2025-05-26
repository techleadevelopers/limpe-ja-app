// LimpeJaApp/app/(provider)/messages/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
// Este pode ser muito similar ao app/(client)/messages/index.tsx
// A lógica de buscar conversas no chatService pode diferenciar pelo tipo de usuário

export default function ProviderConversationsListScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]); // Placeholder
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Chamar chatService para buscar conversas do provedor
    // Simulação
    setTimeout(() => {
      setConversations([
        { id: 'chatProv1', otherUserName: 'Cliente A', lastMessage: 'Podemos confirmar para sexta?', unreadCount: 0, otherUserId: 'clientAbc123' },
        { id: 'chatProv2', otherUserName: 'Cliente B', lastMessage: 'Obrigado pelo serviço!', unreadCount: 0, otherUserId: 'clientDef456' },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const renderConversationItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => router.push(`/(provider)/messages/${item.id}?recipientName=${item.otherUserName}`)} style={styles.itemContainer}>
      <Text style={styles.itemTitle}>{item.otherUserName}</Text>
      <Text numberOfLines={1}>{item.lastMessage}</Text>
      {item.unreadCount > 0 && <View style={styles.unreadBadge}><Text style={styles.unreadText}>{item.unreadCount}</Text></View>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Mensagens (Profissional)' }} />
       {isLoading ? (
        <ActivityIndicator size="large" />
      ) : conversations.length > 0 ? (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
        />
      ) : (
        <Text style={styles.emptyText}>Nenhuma conversa encontrada.</Text>
      )}
    </View>
  );
}
// Use os mesmos estilos do app/(client)/messages/index.tsx ou crie variações
const styles = StyleSheet.create({
  container: { flex: 1 },
  itemContainer: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: 'white', position: 'relative' },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  unreadBadge: { position: 'absolute', right: 15, top: '50%', transform: [{ translateY: -10 }], backgroundColor: 'blue', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  unreadText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
});