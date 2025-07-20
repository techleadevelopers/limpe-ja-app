// LimpeJaApp/app/(client)/messages/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { formatDate } from '../../../utils/helpers'; // Ajuste o caminho

import { useAuth } from '../../../hooks/useAuth'; // Para obter o ID do usuário
import { getChatListForUser } from '../../../services/chatService'; // Nova função para listar conversas

// Sua interface MockConversation (ou importe a real)
interface ConversationItem { // Renomeado para ConversationItem para consistência
  id: string; // Este é o seu chatId
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
}

// Componente para cada item da conversa com animações
const AnimatedConversationItem: React.FC<{
    item: ConversationItem;
    onPress: (item: ConversationItem) => void;
    delay: number;
}> = ({ item, onPress, delay }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current; // Opacidade
    const slideAnim = useRef(new Animated.Value(20)).current; // Deslocamento Y
    const scaleAnim = useRef(new Animated.Value(1)).current; // Escala para feedback de toque

    useEffect(() => {
        // Animação de entrada para cada item
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: delay,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, delay]);

    const onPressInCard = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98, // Diminui ligeiramente ao pressionar
            useNativeDriver: true,
        }).start();
    };

    const onPressOutCard = () => {
        Animated.spring(scaleAnim, {
            toValue: 1, // Retorna ao tamanho normal
            friction: 3, // Controla a "elasticidade"
            tension: 40, // Controla a velocidade
            useNativeDriver: true,
        }).start();
    };

    return (
        <Animated.View
            style={[
                styles.conversationCard,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
                }
            ]}
        >
            <TouchableOpacity
                onPress={() => onPress(item)}
                onPressIn={onPressInCard}
                onPressOut={onPressOutCard}
                activeOpacity={1} // Desativa o activeOpacity padrão do TouchableOpacity
                style={styles.conversationCardInner} // Estilo para o conteúdo interno do TouchableOpacity
            >
                <Image
                    source={item.otherUserAvatarUrl ? { uri: item.otherUserAvatarUrl } : require('../../../assets/images/default-avatar.png')}
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
        </Animated.View>
    );
};

export default function ConversationsListScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth(); // Obtém o usuário logado
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animações para o cabeçalho e estado de feedback
  const headerAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animação de entrada do cabeçalho
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    const loadConversations = async () => {
      if (!isAuthenticated || !user?.id) {
        console.log("[ConversationsListScreen] Usuário não autenticado, não carregando conversas.");
        setIsLoading(false);
        return;
      }

      console.log("[ConversationsListScreen] Carregando conversas para o usuário:", user.id);
      setIsLoading(true);
      try {
        // A chamada real ao backend para obter a lista de conversas
        const fetchedConversations = await getChatListForUser(user.id);
        setConversations(fetchedConversations);
      } catch (error) {
        console.error("[ConversationsListScreen] Erro ao carregar conversas:", error);
        // Tratar erro, talvez mostrar uma mensagem para o usuário
      } finally {
        setIsLoading(false);
        // Animação para o feedback (carregando/vazio)
        Animated.timing(feedbackAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    };

    loadConversations();
  }, [headerAnim, feedbackAnim, isAuthenticated, user?.id]); // Dependências para recarregar se o estado de auth mudar

  const handleConversationPress = (item: ConversationItem) => {
    console.log(`[ConversationsListScreen] Navegando para chat. ChatID: ${item.id}, Recipient: ${item.otherUserName}`);
    // A tela de chat (chatId.tsx) será responsável por verificar o status do agendamento e bloquear o input.
    // Assumimos que o item.id (chatId) pode ser usado para buscar o bookingId associado no backend,
    // ou que o bookingId pode ser passado se a conversa for iniciada de um contexto de agendamento.
    // Para este exemplo, não estamos passando o bookingId explicitamente da lista de conversas,
    // o que significa que o chat screen terá que inferir ou buscar o bookingId.
    router.push({
      pathname: '/(client)/messages/[chatId]',
      params: {
        chatId: item.id,
        recipientName: item.otherUserName,
        recipientId: item.otherUserId,
        recipientAvatarUrl: item.otherUserAvatarUrl // Passa o avatar para a tela de chat
      }
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <Text style={styles.headerTitle}>Minhas Mensagens</Text>
          <TouchableOpacity style={styles.headerIconRight} onPress={() => router.push('/(common)/settings')}>
              <Ionicons name="options-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
      </Animated.View>

       {isLoading ? (
        <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
            <ActivityIndicator size="large" color="#007AFF"/>
            <Text style={styles.loadingText}>Carregando conversas...</Text>
        </Animated.View>
      ) : conversations.length > 0 ? (
        <FlatList
          data={conversations}
          renderItem={({ item, index }) => (
            <AnimatedConversationItem
              item={item}
              onPress={handleConversationPress}
              delay={index * 50 + 200} // Atraso escalonado para cada item
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
        />
      ) : (
        <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
            <Ionicons name="chatbubbles-outline" size={64} color="#CED4DA" />
            <Text style={styles.emptyText}>Nenhuma conversa por aqui.</Text>
            <Text style={styles.emptySubText}>Inicie uma conversa com um profissional ao visualizar seu perfil.</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF', // Cor primária do app
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20, // Ajuste para status bar iOS
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerIconRight: {
    padding: 5, // Aumenta a área de toque
  },
  listContentContainer: {
    paddingTop: 10,
    paddingBottom: 20, // Espaçamento extra no final da lista
  },
  conversationCard: {
    marginHorizontal: 15,
    marginVertical: 7,
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // Bordas mais arredondadas
    ...Platform.select({
        ios: {
            shadowColor: 'rgba(0,0,0,0.08)',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
        },
        android: {
            elevation: 4,
        },
    }),
  },
  conversationCardInner: { // Para que o TouchableOpacity preencha o card
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12, // Garante que o toque respeite o borderRadius do card
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginRight: 15,
    backgroundColor: '#E9ECEF',
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  conversationDetails: {
    flex: 1,
  },
  nameTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userNameText: {
    fontSize: 17,
    fontWeight: '700', // Mais negrito
    color: '#212529',
  },
  timestampText: {
    fontSize: 12,
    color: '#868E96',
  },
  messageBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageText: {
    fontSize: 14,
    color: '#6C757D',
    flexShrink: 1,
    flex: 1, // Ocupa o espaço restante
  },
  unreadMessageText: {
    fontWeight: 'bold',
    color: '#212529',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12, // Mais arredondado
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10, // Mais espaçamento
  },
  unreadCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6C757D',
  },
  emptyText: {
    fontSize: 20, // Um pouco maior
    fontWeight: '700',
    color: '#343A40',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 15,
    color: '#6C757D',
    textAlign: 'center',
    paddingHorizontal: 20,
  }
});