// LimpeJaApp/app/(provider)/messages/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Animated, // Importar Animated para animações
    Platform,
    Image, // << Adicionado Image que estava faltando para o Avatar
    Alert, // << CORREÇÃO: Importar Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Para ícones

// Interface para um item de conversa
interface ConversationItem {
  id: string;
  otherUserName: string;
  lastMessage: string;
  timestamp: string; // Adicionado timestamp para ordenação e exibição
  unreadCount: number;
  otherUserId: string; // ID do cliente
  otherUserAvatarUrl?: string; // URL do avatar do cliente
}

// Mock de dados de conversas (simulando clientes conversando com o provedor)
const MOCK_CONVERSATIONS: ConversationItem[] = [
  {
    id: 'chatProv1',
    otherUserName: 'Ana Oliveira',
    lastMessage: 'Podemos confirmar para sexta?',
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min atrás
    unreadCount: 2,
    otherUserId: 'clientAbc123',
    otherUserAvatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg'
  },
  {
    id: 'chatProv2',
    otherUserName: 'Carlos Silva',
    lastMessage: 'Obrigado pelo serviço! Ficou ótimo.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2h atrás
    unreadCount: 0,
    otherUserId: 'clientDef456',
    otherUserAvatarUrl: 'https://randomuser.me/api/portraits/men/45.jpg'
  },
  {
    id: 'chatProv3',
    otherUserName: 'Mariana Souza',
    lastMessage: 'Preciso agendar uma nova limpeza para o mês que vem.',
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), // Ontem
    unreadCount: 1,
    otherUserId: 'clientGhi789',
    otherUserAvatarUrl: 'https://randomuser.me/api/portraits/women/72.jpg'
  },
  {
    id: 'chatProv4',
    otherUserName: 'João Pereira',
    lastMessage: 'Tudo certo para amanhã, 14h.',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 dias atrás
    unreadCount: 0,
    otherUserId: 'clientJkl012',
    otherUserAvatarUrl: 'https://randomuser.me/api/portraits/men/88.jpg'
  },
  {
    id: 'chatProv5',
    otherUserName: 'Fernanda Lima',
    lastMessage: 'Qual a disponibilidade para o próximo sábado?',
    timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 dias atrás
    unreadCount: 0,
    otherUserId: 'clientMno345',
    otherUserAvatarUrl: 'https://randomuser.me/api/portraits/women/1.jpg'
  },
];

// Helper simples para formatar timestamp de forma relativa ou absoluta
const formatTimestamp = (isoTimestamp: string): string => {
    const now = new Date();
    const date = new Date(isoTimestamp);
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 60) return "Agora";
    if (diffMinutes < 60) return `${diffMinutes} min`;
    if (diffHours < 24) return `${diffHours} h`;
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }); // Ex: 26 Mai
};

// Componente para cada item da conversa com animações
const AnimatedConversationItem: React.FC<{
    item: ConversationItem;
    onPress: (item: ConversationItem) => void;
    delay: number; // Para animação escalonada
}> = ({ item, onPress, delay }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current; // Para feedback de toque

    useEffect(() => {
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

    const onPressInItem = () => {
        Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
    };

    const onPressOutItem = () => {
        Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    };

    return (
        <Animated.View
            style={[
                styles.itemWrapper,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
            ]}
        >
            <TouchableOpacity
                onPress={() => onPress(item)}
                onPressIn={onPressInItem}
                onPressOut={onPressOutItem}
                activeOpacity={1} // Desativa o activeOpacity padrão
                style={styles.itemContainer}
            >
                {item.otherUserAvatarUrl ? (
                    <Image source={{ uri: item.otherUserAvatarUrl }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{item.otherUserName.charAt(0).toUpperCase()}</Text>
                    </View>
                )}
                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.itemTitle, item.unreadCount > 0 && styles.unreadTitle]} numberOfLines={1}>{item.otherUserName}</Text>
                        <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
                    </View>
                    <Text
                        style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadLastMessage]}
                        numberOfLines={1}
                    >
                        {item.lastMessage}
                    </Text>
                </View>
                {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{item.unreadCount}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};


export default function ProviderConversationsListScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current; // Para loading/empty states

  useEffect(() => {
    // Animação de entrada do cabeçalho
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    console.log("[ProviderConversationsListScreen] Carregando conversas...");
    setIsLoading(true);
    // TODO: Substituir pela chamada real ao seu chatService.getProviderConversations();
    setTimeout(() => {
      // Ordena por timestamp, mais recente primeiro
      const sortedConversations = MOCK_CONVERSATIONS.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setConversations(sortedConversations);
      setIsLoading(false);
      // Animação para o feedback (carregando/vazio/lista)
      Animated.timing(feedbackAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 1000);
  }, [headerAnim, feedbackAnim]);

  const handleConversationPress = (item: ConversationItem) => {
    // Navega para a tela de chat, passando o ID da conversa e o nome do cliente
    router.push(`/(provider)/messages/${item.id}?recipientName=${encodeURIComponent(item.otherUserName)}` as any); // Adicionado as any para o tipo de rota
    // Opcional: Marcar conversa como lida ao entrar nela
    setConversations(prev => prev.map(conv =>
        conv.id === item.id ? { ...conv, unreadCount: 0 } : conv
    ));
  };

  if (isLoading) {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Custom Header para o estado de loading */}
            <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                <Text style={styles.headerTitle}>Mensagens</Text>
                <View style={styles.headerActionIconPlaceholder} /> {/* Placeholder para alinhar */}
            </Animated.View>
            <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Carregando suas conversas...</Text>
            </Animated.View>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <Text style={styles.headerTitle}>Mensagens</Text>
          {/* Exemplo de botão de ação no cabeçalho (ex: iniciar nova conversa) */}
          <TouchableOpacity style={styles.headerActionIcon} onPress={() => Alert.alert("Nova Conversa", "Funcionalidade de iniciar nova conversa.")}>
              <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
      </Animated.View>

      {conversations.length === 0 ? (
        <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
            <Ionicons name="chatbubbles-outline" size={64} color="#CED4DA" />
            <Text style={styles.emptyText}>Nenhuma conversa encontrada.</Text>
            <Text style={styles.emptySubText}>Comece a interagir com seus clientes!</Text>
        </Animated.View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={({ item, index }) => (
            <AnimatedConversationItem
                item={item}
                onPress={handleConversationPress}
                delay={index * 50} // Staggered delay
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Fundo geral mais suave
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
    flex: 1, // Para o título ocupar o espaço e centralizar melhor
    textAlign: 'center',
  },
  headerActionIcon: {
    position: 'absolute', // Para sobrepor se necessário ou alinhar precisamente
    right: 15,
    padding: 5, // Aumenta a área de toque
    top: Platform.OS === 'ios' ? 47 : 17, // Ajuste de acordo com paddingTop
  },
  headerActionIconPlaceholder: { // Para alinhar o título no centro quando não há ícone
    width: 28 + 10, // Largura do ícone + padding
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
    fontSize: 19,
    fontWeight: '600',
    color: '#343A40',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubText: {
      fontSize: 15,
      color: '#6C757D',
      textAlign: 'center',
  },
  listContentContainer: {
    paddingVertical: 8, // Um pouco de espaço no topo e final da lista
  },
  itemWrapper: { // Wrapper para a animação de cada item
    marginHorizontal: 10, // Margem para dar um efeito de card
    marginVertical: 4,    // Espaço entre os cards
    borderRadius: 10,     // Bordas arredondadas para o card
    backgroundColor: '#FFFFFF', // Cor de fundo do card, essencial para sombra funcionar bem
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden', // 'visible' para sombra no iOS, 'hidden' para borderRadius no Android
    ...Platform.select({
        ios: {
            shadowColor: 'rgba(0,0,0,0.1)',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.8, // Aumentado para visibilidade
            shadowRadius: 3,
        },
        android: {
            elevation: 3, // Aumentado para visibilidade
        },
    }),
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    // backgroundColor: '#FFFFFF', // Movido para itemWrapper
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#E9ECEF', // Fallback background
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: '#007AFF', // Cor primária para placeholder
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#212529',
    flexShrink: 1, // Para o título não empurrar o timestamp
  },
  unreadTitle: {
    fontWeight: 'bold', // Título mais negrito se houver mensagens não lidas
  },
  timestamp: {
    fontSize: 12,
    color: '#868E96',
    marginLeft: 10,
  },
  lastMessage: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  unreadLastMessage: {
    color: '#343A40', // Mensagem mais escura se não lida
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#007AFF', // Cor primária para o badge
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 10,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  separator: {
    // O espaçamento agora é dado pelo marginVertical em itemWrapper
    // Se precisar de uma linha visual, pode adicionar aqui:
    // height: StyleSheet.hairlineWidth,
    // backgroundColor: '#E0E0E0',
    // marginLeft: 80, // Alinha a linha com o conteúdo (após avatar e margem)
    // marginRight: 10,
  },
});