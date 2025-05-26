// LimpeJaApp/app/(client)/messages/index.tsx
import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    StyleSheet, 
    ActivityIndicator, 
    TouchableOpacity,
    Image,
    Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router'; // Removido Link se não for usado diretamente aqui
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../../utils/helpers'; // Ajuste o caminho

// Sua interface MockConversation (ou importe a real)
interface MockConversation {
  id: string; // Este é o seu chatId
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
}

export default function ConversationsListScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<MockConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("[ConversationsListScreen] Carregando conversas...");
    setIsLoading(true);
    setTimeout(() => {
      setConversations([
        { id: 'chat1_provider1', otherUserId: 'provider1', otherUserName: 'Ana Oliveira', otherUserAvatarUrl: 'https://via.placeholder.com/80/ADD8E6/000000?text=Ana+O', lastMessage: 'Olá! Confirmado para amanhã às 10h. Ansiosa!', lastMessageTimestamp: new Date(Date.now() - 360000).toISOString() , unreadCount: 1 },
        { id: 'chat2_provider2', otherUserId: 'provider2', otherUserName: 'Carlos Silva', otherUserAvatarUrl: 'https://via.placeholder.com/80/E0F7FA/000000?text=Carlos+S', lastMessage: 'Tudo certo, muito obrigado pelo excelente serviço!', lastMessageTimestamp: new Date(Date.now() - 86400000 * 1).toISOString(), unreadCount: 0 },
        { id: 'chat3_provider3', otherUserId: 'provider3', otherUserName: 'Mariana Costa', otherUserAvatarUrl: 'https://via.placeholder.com/80/B3E5FC/000000?text=Mariana+C', lastMessage: 'Você poderia me passar o orçamento para a limpeza pós-obra?', lastMessageTimestamp: new Date(Date.now() - 86400000 * 2).toISOString(), unreadCount: 3 },
      ]);
      setIsLoading(false);
    }, 1200);
  }, []);

  const handleConversationPress = (item: MockConversation) => {
    console.log(`[ConversationsListScreen] Navegando para chat. ChatID: ${item.id}, Recipient: ${item.otherUserName}`);
    router.push({
      pathname: '/(client)/messages/[chatId]', // <--- CORRIGIDO: Usa o template da rota
      params: { 
        chatId: item.id,                       // <--- CORRIGIDO: Passa o valor do chatId aqui
        recipientName: item.otherUserName,
        recipientId: item.otherUserId,
        // otherUserAvatarUrl: item.otherUserAvatarUrl // Opcional, se ChatScreen usar
      }
    });
  };

  const renderConversationItem = ({ item }: { item: MockConversation }) => (
    <TouchableOpacity 
        style={styles.conversationCard} 
        onPress={() => handleConversationPress(item)}
    >
      <Image 
        source={item.otherUserAvatarUrl ? { uri: item.otherUserAvatarUrl } : require('../../../assets/images/default-avatar.png')} // Tenha um avatar padrão
        style={styles.avatar} 
      />
      <View style={styles.conversationDetails}>
        <View style={styles.nameTimeRow}>
            <Text style={styles.userNameText}>{item.otherUserName}</Text>
            <Text style={styles.timestampText}>
                {formatDate(item.lastMessageTimestamp, { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
        <View style={styles.messageBadgeRow}>
            <Text style={[styles.lastMessageText, item.unreadCount > 0 && styles.unreadMessageText]} numberOfLines={1}>
                {item.lastMessage}
            </Text>
            {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCountText}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
                </View>
            )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Minhas Mensagens' }} />
       {/* ... (resto do seu JSX para isLoading, lista vazia e FlatList continua o mesmo) ... */}
       {isLoading ? (
        <View style={styles.centeredFeedback}>
            <ActivityIndicator size="large" color="#007AFF"/>
            <Text style={styles.loadingText}>Carregando conversas...</Text>
        </View>
      ) : conversations.length > 0 ? (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
        />
      ) : (
        <View style={styles.centeredFeedback}>
            <Ionicons name="chatbubbles-outline" size={64} color="#CED4DA" />
            <Text style={styles.emptyText}>Nenhuma conversa por aqui.</Text>
            <Text style={styles.emptySubText}>Inicie uma conversa com um profissional ao visualizar seu perfil.</Text>
        </View>
      )}
    </View>
  );
}

// Seus estilos (styles) continuam os mesmos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', },
  listContentContainer: { paddingTop: 10, },
  conversationCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0', },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12, backgroundColor: '#E9ECEF', },
  conversationDetails: { flex: 1, },
  nameTimeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3, },
  userNameText: { fontSize: 16, fontWeight: '600', color: '#212529', },
  timestampText: { fontSize: 12, color: '#868E96', },
  messageBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', },
  lastMessageText: { fontSize: 14, color: '#6C757D', flexShrink: 1, },
  unreadMessageText: { fontWeight: 'bold', color: '#212529', },
  unreadBadge: { backgroundColor: '#007AFF', borderRadius: 10, minWidth: 20, height: 20, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center', marginLeft: 8, },
  unreadCountText: { color: 'white', fontSize: 11, fontWeight: 'bold', },
  centeredFeedback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, },
  loadingText: { marginTop: 15, fontSize: 16, color: '#6C757D', },
  emptyText: { fontSize: 19, fontWeight: '600', color: '#343A40', textAlign: 'center', marginBottom: 10, },
  emptySubText: { fontSize: 15, color: '#6C757D', textAlign: 'center', }
});