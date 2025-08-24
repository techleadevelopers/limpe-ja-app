// LimpeJaApp/app/(client)/messages/[chatId].tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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
  Animated,
  Easing,
  Image,
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import { appConfig } from '../../../config/appConfig';
import { useAuth } from '../../../hooks/useAuth';
import { getBookingDetails } from '../../../services/bookingService';
import { getChatMessages, sendMessage as sendChatMessage } from '../../../services/chatService';
import { BookingStatus } from '../../../types/backend/bookings';
import { Message, SendMessageDto } from '../../../types/backend/chat';
import { PanicBanner } from '../../../components/safety/PanicBanner'; // Importar PanicBanner

const SOCKET_URL = appConfig.apiUrl.replace('http', 'ws');

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

export default function ChatScreen() {
  const router = useRouter();
  const { chatId, recipientName, recipientId, recipientAvatarUrl, bookingId } =
    useLocalSearchParams<{
      chatId?: string;
      recipientName?: string;
      recipientId?: string;
      recipientAvatarUrl?: string;
      bookingId?: string;
    }>();
  const { user, token, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [chatBlockedMessage, setChatBlockedMessage] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  // Mock para o status do pânico
  const [panicStatus, setPanicStatus] = useState<'IDLE'|'RECEIVED'|'ACKED'|'DISPATCHED'|'CLOSED'>('IDLE');


  const userId = user?.id;

  const chatBlockedAnim = useRef(new Animated.Value(0)).current;
  const inputContainerAnim = useRef(new Animated.Value(0)).current;
  const sendButtonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isAuthenticated || !token || !chatId || !userId) {
      setIsLoading(false);
      setChatBlockedMessage('Você precisa estar logado para acessar este chat.');
      return;
    }

    const loadChatData = async () => {
      setIsLoading(true);
      setChatBlockedMessage(null);

      try {
        const fetchedMessages = await getChatMessages(chatId, { limit: 50, offset: 0 });
        setMessages(fetchedMessages.reverse());

        if (bookingId) {
          const bookingDetails = await getBookingDetails(bookingId);
          if (bookingDetails.status === BookingStatus.COMPLETED) {
            setChatBlockedMessage('Este chat foi encerrado, pois o serviço foi concluído.');
          } else if (bookingDetails.status === BookingStatus.CANCELLED) {
            setChatBlockedMessage('Este chat foi encerrado, pois o agendamento foi cancelado.');
          }
        }
      } catch (error: any) {
        console.error('Erro ao carregar mensagens ou verificar agendamento:', error);
        if (
          error.message.includes('Não é possível acessar esta conversa') ||
          error.message.includes('Não é possível enviar mensagens')
        ) {
          setChatBlockedMessage(error.message);
        } else {
          Alert.alert('Erro', 'Não foi possível carregar as mensagens do chat.');
          setChatBlockedMessage('Não foi possível carregar as mensagens.');
        }
      } finally {
        setIsLoading(false);
        Animated.timing(inputContainerAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }
    };
    loadChatData();

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinChat', chatId);
    });

    socket.on('newMessage', (newMessage: Message) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('errorMessage', (data: { event: string; message: string }) => {
      if (data.event === 'joinChat' || data.event === 'sendMessage') {
        setChatBlockedMessage(data.message);
      } else {
        Alert.alert('Erro no Chat', data.message || 'Houve um problema com a conexão do chat.');
      }
    });

    socket.on('disconnect', () => {
      setChatBlockedMessage('Conexão com o chat perdida.');
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, token, chatId, userId, bookingId, inputContainerAnim]);

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
        socketRef.current.emit('sendMessage', newMessageData);
      } else {
        await sendChatMessage(newMessageData);
      }
      setInputText('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error: any) {
      if (error.message.includes('Não é possível enviar mensagens')) {
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
          chatStyles.messageBubble,
          isMyMessage ? chatStyles.myMessage : chatStyles.theirMessage,
          // Removido isMyMessage ? chatStyles.myMessageTail : chatStyles.theirMessageTail,
          chatStyles.messageShadow,
        ]}
      >
        <Text style={[chatStyles.messageContent, isMyMessage ? { color: '#FFFFFF' } : { color: '#212529' }]}>
          {item.content}
        </Text>
        <Text
          style={[
            chatStyles.messageTime,
            isMyMessage ? { color: 'rgba(255,255,255,0.7)' } : { color: '#6C757D' },
          ]}
        >
          {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  // Handler para o botão de pânico
  const handlePanic = useCallback(() => {
    Alert.alert(
        "Acionar Botão de Pânico",
        "Você tem certeza que deseja acionar o botão de pânico? Nossa equipe de segurança será notificada imediatamente.",
        [
            { text: "Cancelar", style: "cancel" },
            { text: "Acionar", onPress: () => {
                setPanicStatus('RECEIVED');
                // Simular uma resposta após alguns segundos
                setTimeout(() => setPanicStatus('ACKED'), 3000);
                setTimeout(() => setPanicStatus('DISPATCHED'), 6000);
                setTimeout(() => setPanicStatus('CLOSED'), 10000);
                // Aqui você faria a chamada real para o serviço de pânico
                console.log("Botão de pânico acionado!");
            }, style: "destructive" }
        ]
    );
  }, []);

  if (isLoading) {
    return (
      <View style={chatStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" /> {/* Cor do ActivityIndicator ajustada */}
        <Text style={chatStyles.loadingText}>Carregando mensagens...</Text>
      </View>
    );
  }

  const isInputDisabled = !isAuthenticated || !!chatBlockedMessage;

  const onPressInSendButton = () => {
    Animated.spring(sendButtonScaleAnim, { toValue: 0.9, useNativeDriver: true }).start();
  };
  const onPressOutSendButton = () => {
    Animated.spring(sendButtonScaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  return (
    <KeyboardAvoidingView
      style={chatStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <CustomChatHeader
        recipientName={recipientName}
        recipientAvatarUrl={recipientAvatarUrl}
        onBackPress={() => router.back()}
      />

      {/* PanicBanner injetado aqui */}
      <View style={chatStyles.panicBannerWrapper}>
        <PanicBanner onPanic={handlePanic} status={panicStatus} />
      </View>

      <Animated.View
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
        style={chatStyles.messagesList}
        contentContainerStyle={chatStyles.messagesListContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <Animated.View style={[chatStyles.inputContainer, { opacity: inputContainerAnim }, chatStyles.inputContainerShadow]}>
        <TouchableOpacity style={chatStyles.inputIcon}>
            <Ionicons name="attach-outline" size={24} color="#868E96" />
        </TouchableOpacity>
        <TextInput
          style={[chatStyles.input, isInputDisabled && chatStyles.disabledInput]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={isInputDisabled ? 'Chat indisponível' : 'Digite sua mensagem...'}
          placeholderTextColor="#6C757D"
          multiline
          editable={!isInputDisabled}
        />
        <TouchableOpacity style={chatStyles.inputIcon}>
            <Ionicons name="happy-outline" size={24} color="#868E96" />
        </TouchableOpacity>
        <TouchableOpacity style={chatStyles.inputIcon}>
            <Ionicons name="mic-outline" size={24} color="#868E96" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSendMessage}
          style={[
            chatStyles.sendButton,
            isInputDisabled && chatStyles.disabledSendButton,
            { transform: [{ scale: sendButtonScaleAnim }] },
          ]}
          onPressIn={onPressInSendButton}
          onPressOut={onPressOutSendButton}
          disabled={isInputDisabled}
        >
          <Ionicons name="send" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

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
  panicBannerWrapper: {
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
  // myMessageTail: { }, // Removido
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },
  // theirMessageTail: { }, // Removido
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