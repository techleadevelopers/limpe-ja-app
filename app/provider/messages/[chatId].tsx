// LimpeJaApp/app/provider/messages/[chatId].tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'; // Adicionado useRouter
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated, // Importado para animações
  Easing, // Importado para easing das animações
  Image, // Importado para exibir avatar no cabeçalho
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import { appConfig } from '../../../config/appConfig';
import { useAuth } from '../../../hooks/useAuth';
import { getBookingDetails } from '../../../services/bookingService';
import { getChatMessages, sendMessage as sendChatMessage } from '../../../services/chatService';
import { BookingStatus } from '../../../types/backend/bookings';
import { Message, SendMessageDto } from '../../../types/backend/chat';

const SOCKET_URL = appConfig.apiUrl.replace('http', 'ws');

// Componente CustomChatHeader copiado do arquivo do cliente
const CustomChatHeader: React.FC<{
  recipientName?: string;
  recipientAvatarUrl?: string;
  onBackPress: () => void;
}> = ({ recipientName, recipientAvatarUrl, onBackPress }) => {
  return (
    <View style={chatStyles.customHeader}>
      <TouchableOpacity onPress={onBackPress} style={chatStyles.headerButton}>
        <Ionicons name="arrow-back" size={24} color="#FFF" />
      </TouchableOpacity>
      <View style={chatStyles.headerRecipientInfo}>
        <Image
          source={recipientAvatarUrl ? { uri: recipientAvatarUrl } : require('../../../assets/images/default-avatar.png')}
          style={chatStyles.headerAvatar}
        />
        <View>
          <Text style={chatStyles.headerRecipientName}>{recipientName || 'Chat'}</Text>
          <Text style={chatStyles.headerRecipientStatus}>Online</Text>
        </View>
      </View>
      <View style={chatStyles.headerActions}>
        <TouchableOpacity style={chatStyles.headerButton}>
          <Ionicons name="videocam-outline" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={chatStyles.headerButton}>
          <Ionicons name="call-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ProviderChatScreen() { // Renomeado para ProviderChatScreen
  const router = useRouter(); // Adicionado useRouter
  const { chatId, recipientName, recipientId, recipientAvatarUrl, bookingId } = useLocalSearchParams<{ chatId?: string, recipientName?: string, recipientId?: string, recipientAvatarUrl?: string, bookingId?: string }>();
  const { user, token, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [chatBlockedMessage, setChatBlockedMessage] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Animações (copiado do cliente)
  const chatBlockedAnim = useRef(new Animated.Value(0)).current;
  const inputContainerAnim = useRef(new Animated.Value(0)).current;
  const sendButtonScaleAnim = useRef(new Animated.Value(1)).current;

  const userId = user?.id;

  useEffect(() => {
    if (!isAuthenticated || !token || !chatId || !userId) {
      console.log('ProviderChatScreen: Usuário não autenticado ou chat/user ID ausente.');
      setIsLoading(false);
      setChatBlockedMessage("Você precisa estar logado para acessar este chat.");
      return;
    }

    const loadChatData = async () => {
      setIsLoading(true);
      setChatBlockedMessage(null); // Limpa qualquer mensagem de bloqueio anterior

      try {
        // 1. Carregar histórico de mensagens
        const fetchedMessages = await getChatMessages(chatId, { limit: 50, offset: 0 });
        setMessages(fetchedMessages.reverse());

        // 2. Verificar status do agendamento se houver um bookingId associado
        if (bookingId) {
          const bookingDetails = await getBookingDetails(bookingId);
          if (bookingDetails.status === BookingStatus.COMPLETED) {
            setChatBlockedMessage("Este chat foi encerrado, pois o serviço foi concluído.");
          } else if (bookingDetails.status === BookingStatus.CANCELLED) {
            setChatBlockedMessage("Este chat foi encerrado, pois o agendamento foi cancelado.");
          } else if (bookingDetails.status === BookingStatus.PENDING) { // Adicionado do cliente
            setChatBlockedMessage(
              `Aguardando pagamento do cliente para liberar o chat com ${recipientName || bookingDetails.clientFullName || 'o cliente'}.` // Mensagem ajustada para o provedor
            );
          }
        }
      } catch (error: any) {
        console.error('ProviderChatScreen: Erro ao carregar mensagens ou verificar agendamento:', error);
        if (error.message.includes("Não é possível acessar esta conversa") || error.message.includes("Não é possível enviar mensagens")) {
          setChatBlockedMessage(error.message);
        } else {
          Alert.alert('Erro', 'Não foi possível carregar as mensagens do chat.');
          setChatBlockedMessage("Não foi possível carregar as mensagens.");
        }
      } finally {
        setIsLoading(false);
        // Animação da entrada de texto (copiado do cliente)
        Animated.timing(inputContainerAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }
    };
    loadChatData();

    // 3. Conectar WebSocket
    console.log(`ProviderChatScreen: Tentando conectar WebSocket em ${SOCKET_URL}`);
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('ProviderChatScreen: WebSocket conectado!', socket.id);
      socket.emit('joinChat', chatId);
    });

    socket.on('newMessage', (newMessage: Message) => {
      console.log('ProviderChatScreen: Nova mensagem recebida:', newMessage);
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('errorMessage', (data: { event: string, message: string }) => {
      console.error(`ProviderChatScreen: Erro no WebSocket para evento ${data.event}:`, data.message);
      if (data.event === 'joinChat' || data.event === 'sendMessage') {
        setChatBlockedMessage(data.message);
      } else {
        Alert.alert('Erro no Chat', data.message || 'Houve um problema com a conexão do chat.');
      }
    });

    socket.on('disconnect', () => {
      console.log('ProviderChatScreen: WebSocket desconectado.');
      setChatBlockedMessage("Conexão com o chat perdida.");
    });

    return () => {
      console.log('ProviderChatScreen: Desmontando componente, desconectando WebSocket.');
      socket.disconnect();
    };
  }, [isAuthenticated, token, chatId, userId, bookingId, recipientName, inputContainerAnim]); // Dependências alinhadas ao uso

  // Efeito para animação da mensagem de chat bloqueado (copiado do cliente)
  useEffect(() => {
    if (chatBlockedMessage) {
      Animated.timing(chatBlockedAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(chatBlockedAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [chatBlockedMessage, chatBlockedAnim]);

  const handleSendMessage = useCallback(async () => {
    if (inputText.trim() === '' || !user?.id || !chatId || !recipientId || chatBlockedMessage) {
      console.log("Não é possível enviar mensagem: input vazio, IDs ausentes ou chat bloqueado.");
      return;
    }

    const newMessageData: SendMessageDto = {
      chatId,
      senderId: user.id,
      receiverId: recipientId,
      content: inputText.trim(),
    };

    try {
      if (socketRef.current && socketRef.current.connected) {
        console.log('ProviderChatScreen: Enviando mensagem via WebSocket:', newMessageData);
        socketRef.current.emit('sendMessage', newMessageData);
      } else {
        console.warn('ProviderChatScreen: WebSocket não conectado. Enviando mensagem via REST.');
        await sendChatMessage(newMessageData);
      }
      setInputText('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    } catch (error: any) {
      console.error('ProviderChatScreen: Erro ao enviar mensagem:', error);
      if (error.message.includes("Não é possível enviar mensagens")) {
        setChatBlockedMessage(error.message);
      } else {
        Alert.alert('Erro', error.message || 'Não foi possível enviar a mensagem.');
      }
    }
  }, [inputText, user, chatId, recipientId, chatBlockedMessage]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === userId;
    return (
      <View
        style={[
          chatStyles.messageBubble, // Usando chatStyles
          isMyMessage ? chatStyles.myMessage : chatStyles.theirMessage, // Usando chatStyles
          chatStyles.messageShadow, // Adicionado do cliente
        ]}
      >
        <Text style={[chatStyles.messageContent, isMyMessage ? { color: '#FFFFFF' } : { color: '#212529' }]}>
          {item.content}
        </Text>
        <Text
          style={[
            chatStyles.messageTime, // Usando chatStyles
            isMyMessage ? { color: 'rgba(255,255,255,0.7)' } : { color: '#6C757D' },
          ]}
        >
          {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={chatStyles.loadingContainer}> {/* Usando chatStyles */}
        <ActivityIndicator size="large" color="#4A90E2" /> {/* Cor do ActivityIndicator ajustada */}
        <Text style={chatStyles.loadingText}>Carregando mensagens...</Text> {/* Usando chatStyles */}
      </View>
    );
  }

  const isInputDisabled = !isAuthenticated || !!chatBlockedMessage;

  // Animações do botão de envio (copiado do cliente)
  const onPressInSendButton = () => {
    Animated.spring(sendButtonScaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 5, // Ajuste para mais "mola"
      tension: 80, // Retorno rápido
    }).start();
  };
  const onPressOutSendButton = () => {
    Animated.spring(sendButtonScaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true
    }).start();
  };

  return (
    <KeyboardAvoidingView
      style={chatStyles.container} // Usando chatStyles
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ headerShown: false }} /> {/* Mantido headerShown: false para usar CustomChatHeader */}
      <CustomChatHeader
        recipientName={recipientName}
        recipientAvatarUrl={recipientAvatarUrl}
        onBackPress={() => router.back()}
      />

      <Animated.View // Animação para mensagem de chat bloqueado (copiado do cliente)
        style={[
          chatStyles.chatBlockedContainer,
          { opacity: chatBlockedAnim, height: chatBlockedAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }) },
        ]}
      >
        {chatBlockedMessage && (
          <>
            <Ionicons name="information-circle-outline" size={24} color="#DC3545" />
            <Text style={chatStyles.chatBlockedText}>{chatBlockedMessage}</Text>
          </>
        )}
      </Animated.View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={chatStyles.messagesList} // Usando chatStyles
        contentContainerStyle={chatStyles.messagesListContent} // Usando chatStyles
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <Animated.View // Animação para o container de input (copiado do cliente)
        style={[
          chatStyles.inputContainer, // Usando chatStyles
          { opacity: inputContainerAnim },
          chatStyles.inputContainerShadow // Adicionado do cliente
        ]}
      >
        <TouchableOpacity style={chatStyles.inputIcon}> {/* Ícone de anexar (copiado do cliente) */}
            <Ionicons name="attach-outline" size={24} color="#868E96" />
        </TouchableOpacity>
        <TextInput
          style={[chatStyles.input, isInputDisabled && chatStyles.disabledInput]} // Usando chatStyles
          value={inputText}
          onChangeText={setInputText}
          placeholder={isInputDisabled ? "Chat indisponível" : "Digite sua mensagem..."}
          placeholderTextColor="#6C757D"
          multiline
          editable={!isInputDisabled}
        />
        <TouchableOpacity style={chatStyles.inputIcon}> {/* Ícone de emoji (copiado do cliente) */}
            <Ionicons name="happy-outline" size={24} color="#868E96" />
        </TouchableOpacity>
        <TouchableOpacity style={chatStyles.inputIcon}> {/* Ícone de microfone (copiado do cliente) */}
            <Ionicons name="mic-outline" size={24} color="#868E96" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSendMessage}
          style={[
            chatStyles.sendButton, // Usando chatStyles
            isInputDisabled && chatStyles.disabledSendButton, // Usando chatStyles
            { transform: [{ scale: sendButtonScaleAnim }] }, // Animação do botão (copiado do cliente)
          ]}
          onPressIn={onPressInSendButton} // Animação do botão (copiado do cliente)
          onPressOut={onPressOutSendButton} // Animação do botão (copiado do cliente)
          disabled={isInputDisabled}
        >
          <Ionicons name="send" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

// Estilos unificados (copiados e ajustados do arquivo do cliente)
const chatStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF', // Alterado para o azul claro do perfil
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F8FF', // Alterado para o azul claro do perfil
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6C757D',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4A90E2', // Alterado para o azul principal do perfil
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  headerButton: {
    padding: 5,
  },
  headerRecipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  headerRecipientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerRecipientStatus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  headerActions: {
    flexDirection: 'row',
  },
  panicBannerWrapper: { // Mantido para consistência, mesmo que não usado diretamente na UI
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
  },
  chatBlockedContainer: {
    backgroundColor: '#FFE0E6',
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FFC0CB',
    overflow: 'hidden',
  },
  chatBlockedText: {
    marginLeft: 8,
    color: '#DC3545',
    fontSize: 14,
    textAlign: 'center',
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messagesListContent: {
    paddingVertical: 10,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '80%',
    marginBottom: 10,
    flexDirection: 'column',
  },
  messageShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4A90E2', // Alterado para o azul principal do perfil
    borderTopRightRadius: 18,
    borderBottomRightRadius: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },
  messageContent: {
    fontSize: 15,
  },
  messageTime: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
  },
  inputContainerShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  inputIcon: {
    padding: 8,
    marginBottom: Platform.OS === 'ios' ? 0 : 5,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    marginHorizontal: 5,
    maxHeight: 120,
    minHeight: 45,
    borderColor: '#E9ECEF',
    borderWidth: 1,
  },
  disabledInput: {
    backgroundColor: '#E9ECEF',
    color: '#ADB5BD',
  },
  sendButton: {
    backgroundColor: '#4A90E2', // Alterado para o azul principal do perfil
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
    marginBottom: Platform.OS === 'ios' ? 0 : 5,
  },
  disabledSendButton: {
    backgroundColor: '#A0CFFF', // Azul mais claro para o botão desabilitado
  },
});
