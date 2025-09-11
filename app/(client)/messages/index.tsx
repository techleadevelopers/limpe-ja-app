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
    Easing,
    TextInput
} from 'react-native';
import { formatDate } from '../../../utils/helpers';

import { useAuth } from '../../../hooks/useAuth';
// CORRECTED: Import ConversationItem from chatService.ts to ensure type consistency
import { getChatListForUser, ConversationItem } from '../../../services/chatService';

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
                duration: 400, // Duração ajustada para fluidez
                delay: delay,
                easing: Easing.out(Easing.ease), // Easing para entrada suave
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400, // Duração ajustada
                delay: delay,
                easing: Easing.out(Easing.ease), // Easing para entrada suave
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, delay]);

    const onPressInCard = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.98, // Escala sutil
            useNativeDriver: true,
            friction: 5, // Mais "mola"
            tension: 80, // Retorno rápido
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
        // Ensure item.isTyping exists before accessing it
        if (item.isTyping) {
            return <Text style={styles.typingText}>Digitando...</Text>;
        }
        switch (type) {
            case 'voice':
                return (
                    <View style={styles.messageStatusContainer}>
                        <Ionicons name="mic-outline" size={14} color="#6C757D" />
                        <Text style={styles.lastMessageText}> Mensagem de voz</Text>
                    </View>
                );
            case 'sticker':
                return (
                    <View style={styles.messageStatusContainer}>
                        <Ionicons name="happy-outline" size={14} color="#6C757D" />
                        <Text style={styles.lastMessageText}> Adesivo</Text>
                    </View>
                );
            default:
                return (
                    <Text style={[styles.lastMessageText, item.unreadCount > 0 && styles.unreadMessageText]} numberOfLines={1}>
                        {message}
                    </Text>
                );
        }
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
                activeOpacity={1}
                style={styles.conversationCardInner}
            >
                <View style={styles.avatarContainer}>
                    <Image
                        source={item.otherUserAvatarUrl ? { uri: item.otherUserAvatarUrl } : require('../../../assets/images/default-avatar.png')}
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
                            {/* Ensure lastMessageTimestamp is a string or Date object */}
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
  const [activeTab, setActiveTab] = useState('Todas');

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
        // CORRECTED: Call getChatListForUser without arguments
        const fetchedConversations = await getChatListForUser();

        // Ensure mock data also conforms to the ConversationItem interface
        const mockConversations: ConversationItem[] = [
            { id: 'chat1', otherUserId: 'user1', otherUserName: 'Larry Machigo', otherUserAvatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg', lastMessage: 'Ah. Deixe-me verificar', lastMessageTimestamp: new Date().toISOString(), unreadCount: 0, isPinned: true, isTyping: false, messageType: 'text' },
            { id: 'chat2', otherUserId: 'user2', otherUserName: 'Natalie Nara', otherUserAvatarUrl: 'https://randomuser.me/api/portraits/women/2.jpg', lastMessage: 'Natalie está digitando...', lastMessageTimestamp: new Date().toISOString(), unreadCount: 2, isTyping: true, messageType: 'text' },
            { id: 'chat3', otherUserId: 'user3', otherUserName: 'Jennifer Jones', otherUserAvatarUrl: 'https://randomuser.me/api/portraits/women/3.jpg', lastMessage: 'Mensagem de voz', lastMessageTimestamp: new Date(Date.now() - 3600000).toISOString(), unreadCount: 0, messageType: 'voice', isTyping: false },
            { id: 'chat4', otherUserId: 'user4', otherUserName: 'Larry Machigo', otherUserAvatarUrl: 'https://randomuser.me/api/portraits/men/4.jpg', lastMessage: 'Te vejo amanhã, levo...', lastMessageTimestamp: new Date(Date.now() - 86400000).toISOString(), unreadCount: 0, isTyping: false, messageType: 'text' },
            { id: 'chat5', otherUserId: 'user5', otherUserName: 'Sofia', otherUserAvatarUrl: 'https://randomuser.me/api/portraits/women/5.jpg', lastMessage: 'Oh... muito obrigada...', lastMessageTimestamp: new Date(Date.now() - 2592000000).toISOString(), unreadCount: 0, isTyping: false, messageType: 'text' },
            { id: 'chat6', otherUserId: 'user6', otherUserName: 'Haider Lve', otherUserAvatarUrl: 'https://randomuser.me/api/portraits/men/6.jpg', lastMessage: 'Adesivo', lastMessageTimestamp: new Date(Date.now() - 5184000000).toISOString(), unreadCount: 0, messageType: 'sticker', isTyping: false },
            { id: 'chat7', otherUserId: 'user7', otherUserName: 'Sr. Elon', otherUserAvatarUrl: 'https://randomuser.me/api/portraits/men/7.jpg', lastMessage: 'Legal -- :)', lastMessageTimestamp: new Date(Date.now() - 7776000000).toISOString(), unreadCount: 0, isTyping: false, messageType: 'text' },
            ...fetchedConversations
        ];
        setConversations(mockConversations);
      } catch (error) {
        console.error("Erro ao carregar conversas:", error);
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
      pathname: '/(client)/messages/[chatId]',
      params: {
        chatId: item.id,
        recipientName: item.otherUserName,
        recipientId: item.otherUserId,
        recipientAvatarUrl: item.otherUserAvatarUrl
      }
    });
  };

  const tabs = ['Todas', 'Grupos', 'Contatos'];
  const loggedInUserName = user?.fullName || 'João'; // Usar o nome real do usuário logado

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View style={[styles.mainHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
        <View style={styles.topRow}>
          <Text style={styles.greetingText}>Olá, {loggedInUserName}</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="search-outline" size={18} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="ellipsis-vertical" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.segmentedControl}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

       {isLoading ? (
        <Animated.View style={[styles.centeredFeedback, { opacity: feedbackAnim }]}>
            <ActivityIndicator size="large" color="#4A90E2"/> {/* Cor do ActivityIndicator ajustada */}
            <Text style={styles.loadingText}>Carregando conversas...</Text>
        </Animated.View>
      ) : conversations.length > 0 ? (
        <FlatList
          data={conversations}
          renderItem={({ item, index }) => (
            <AnimatedConversationItem
              item={item}
              onPress={handleConversationPress}
              delay={index * 50 + 200} // Atraso sequencial para cada item
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
    backgroundColor: '#F0F8FF', // Alterado para o azul claro do perfil
  },
  mainHeader: {
    backgroundColor: '#4A90E2', // Alterado para o azul principal do perfil
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 15,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  greetingText: {
     fontSize: 15 * 0.95,
        fontFamily: 'Montserrat-Thin', 
        fontWeight: 'bold',
        color: '#FFFFFF',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 10,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    padding: 3,
    width: '60%',
    right: 5,
    marginTop: -11,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 5,
    
    borderRadius: 25,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
  },
  tabButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 10,
  },
  activeTabButtonText: {
    color: '#4A90E2', // Alterado para o azul principal do perfil
  },
  listContentContainer: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  conversationCard: {
    marginHorizontal: 15,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    ...Platform.select({
        ios: {
            shadowColor: 'rgba(0,0,0,0.08)',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
        },
        android: {
            elevation: 6,
        },
    }),
  },
  conversationCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    backgroundColor: '#E9ECEF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pinIcon: {
    position: 'absolute',
    top: -5,
    right: 10,
    backgroundColor: '#4A90E2', // Alterado para o azul principal do perfil
    borderRadius: 10,
    padding: 3,
    zIndex: 1,
  },
  conversationDetails: {
    flex: 1,
  },
  nameTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
  },
  timestampText: {
    fontSize: 13,
    color: '#868E96',
  },
  messageBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageText: {
    fontSize: 15,
    color: '#6C757D',
    flexShrink: 1,
    flex: 1,
  },
  unreadMessageText: {
    fontWeight: 'bold',
    color: '#212529',
  },
  typingText: {
    fontSize: 15,
    color: '#4A90E2', // Alterado para o azul principal do perfil
    fontStyle: 'italic',
    flex: 1,
  },
  messageStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#4A90E2', // Alterado para o azul principal do perfil
    borderRadius: 15,
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  unreadCountText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0F8FF', // Alterado para o azul claro do perfil
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6C757D',
  },
  emptyText: {
    fontSize: 20,
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
  },
});