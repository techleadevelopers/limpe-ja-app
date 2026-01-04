import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    FlatList,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { formatDate } from '../../../utils/helpers';

import { useAuth } from '../../../hooks/useAuth';
import { ConversationItem, getChatListForUser } from '../../../services/chatService';

const AnimatedConversationItem: React.FC<{
  item: ConversationItem;
  onPress: (item: ConversationItem) => void;
  delay: number;
}> = ({ item, onPress, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  const onPressInCard = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 5,
      tension: 80,
    }).start();
  };

  const onPressOutCard = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const renderMessageStatus = (message: string, type?: string) => {
    if (item.isTyping) {
      return <Text style={styles.typingText}>Digitando...</Text>;
    }
    switch (type) {
      case 'voice':
        return (
          <View style={styles.messageStatusContainer}>
            <Ionicons name="mic-outline" size={14} />
            <Text style={styles.lastMessageText}> Mensagem de voz</Text>
          </View>
        );
      case 'sticker':
        return (
          <View style={styles.messageStatusContainer}>
            <Ionicons name="happy-outline" size={14} />
            <Text style={styles.lastMessageText}> Adesivo</Text>
          </View>
        );
      default:
        return (
          <Text
            style={[styles.lastMessageText, item.unreadCount > 0 && styles.unreadMessageText]}
            numberOfLines={1}
          >
            {message}
          </Text>
        );
    }
  };

  return (
    <Animated.View
      style={[
        styles.conversationCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        onPress={() => onPress(item)}
        onPressIn={onPressInCard}
        onPressOut={onPressOutCard}
        activeOpacity={0.9}
        style={styles.conversationCardInner}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={
              item.otherUserAvatarUrl
                ? { uri: item.otherUserAvatarUrl }
                : require('../../../assets/images/default-avatar.png')
            }
            style={styles.avatar}
          />
          {item.isPinned && (
            <View style={styles.pinIcon}>
              <Ionicons name="pin" size={14} color="#FFF" />
            </View>
          )}
        </View>
        <View style={styles.conversationDetails}>
          <View style={styles.nameTimeRow}>
            <Text style={styles.userNameText}>{item.otherUserName}</Text>
            <Text style={styles.timestampText}>
              {formatDate(item.lastMessageTimestamp, { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.messageBadgeRow}>
            {renderMessageStatus(item.lastMessage, item.messageType)}
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
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    const loadConversations = async () => {
      if (!isAuthenticated || !user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const fetchedConversations = await getChatListForUser();

        // mock opcional mantido
        const mockConversations: ConversationItem[] = [
          { id: 'chat1', otherUserId: 'user1', otherUserName: 'Larry Machigo', otherUserAvatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg', lastMessage: 'Ah. Deixe-me verificar', lastMessageTimestamp: new Date().toISOString(), unreadCount: 0, isPinned: true, isTyping: false, messageType: 'text' },
          { id: 'chat2', otherUserId: 'user2', otherUserName: 'Natalie Nara', otherUserAvatarUrl: 'https://randomuser.me/api/portraits/women/2.jpg', lastMessage: 'Natalie está digitando...', lastMessageTimestamp: new Date().toISOString(), unreadCount: 2, isTyping: true, messageType: 'text' },
          ...fetchedConversations
        ];
        setConversations(mockConversations);
      } catch (error) {
        console.error('Erro ao carregar conversas:', error);
      } finally {
        setIsLoading(false);
        Animated.timing(feedbackAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }
    };

    loadConversations();
  }, [headerAnim, feedbackAnim, isAuthenticated, user?.id]);

  const handleConversationPress = (item: ConversationItem) => {
    router.push({
      pathname: `/client/messages/${item.id}`,
      params: {
        recipientName: item.otherUserName,
        recipientId: item.otherUserId,
        recipientAvatarUrl: item.otherUserAvatarUrl,
      },
    });
  };

  const handleBackPress = () => {
    router.back();
  };

  const loggedInUserName = user?.fullName || 'João';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER BRANCO COMO NA CATEGORY (título premium centralizado, back/icons premium) */}
      <Animated.View
        style={[
          styles.mainHeader,
          {
            opacity: headerAnim,
            transform: [
              { translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) },
            ],
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.headerBackButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#4A5568" />
          </TouchableOpacity>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingSubText}>Olá, {loggedInUserName}</Text>
            <Text style={styles.greetingText}>Mensagens</Text>
          </View>
          <View style={styles.headerIcons}>
            {/* Sem ícones extras para manter simples, mas estrutura para futuro */}
          </View>
        </View>
      </Animated.View>

      {isLoading ? (
        <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Carregando conversas...</Text>
        </Animated.View>
      ) : conversations.length > 0 ? (
        <FlatList
          data={conversations}
          renderItem={({ item, index }) => (
            <AnimatedConversationItem item={item} onPress={handleConversationPress} delay={index * 50 + 200} />
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
  container: { flex: 1, backgroundColor: '#F6F8FB' },

  mainHeader: {
    backgroundColor: '#FFFFFF', // Branco como na category
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomEndRadius: 32,
    borderBottomStartRadius: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 0,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 30 : 0,
  },
  headerBackButton: {
    padding: 8,
    borderRadius: 12,
  },
  greetingContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  greetingText: {
    fontSize: 18, // Aumentado para 18px para um look mais premium e legível
    fontFamily: 'Montserrat-Regular',
    fontWeight: '700', // Bold para ênfase premium
    color: '#4A5568', // Preto mais claro premium (cinza escuro suave)
    textAlign: 'center',
    letterSpacing: 0.8, // Espaçamento refinado para feel premium
    marginTop: 2, // Pequeno espaçamento abaixo do subtítulo
  },
  greetingSubText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    fontWeight: '600',
    color: '#6B7280', // Cinza médio premium para subtítulo (em vez de azul, para harmonia)
    textAlign: 'center',
    marginTop: 2,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  listContentContainer: { paddingTop: 10, paddingBottom: 20 },

  conversationCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.10)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 12,
      },
      android: { elevation: 0 },
    }),
  },
  conversationCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
    backgroundColor: '#E9ECEF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pinIcon: {
    position: 'absolute',
    top: -5,
    right: 8,
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    padding: 3,
    zIndex: 1,
  },
  conversationDetails: { flex: 1 },
  nameTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userNameText: { fontSize: 17, fontWeight: '700', color: '#1E1E1E' },
  timestampText: { fontSize: 12, color: '#8A8F98' },
  messageBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessageText: { fontSize: 14.5, color: '#5E6672', flexShrink: 1, flex: 1 },
  unreadMessageText: { fontWeight: '700', color: '#1E1E1E' },
  typingText: { fontSize: 14.5, color: '#4A90E2', fontStyle: 'italic', flex: 1 },
  messageStatusContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },

  unreadBadge: {
    backgroundColor: '#4A90E2',
    borderRadius: 14,
    minWidth: 26,
    height: 26,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadCountText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F6F8FB',
  },
  loadingText: { marginTop: 12, fontSize: 15, color: '#6C757D' },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#2C2C2C', textAlign: 'center', marginBottom: 8 },
  emptySubText: { fontSize: 14.5, color: '#6C757D', textAlign: 'center', paddingHorizontal: 20 },
});
