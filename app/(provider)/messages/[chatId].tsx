// LimpeJaApp/app/(provider)/messages/[chatId].tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { appConfig } from '../../../config/appConfig';
import { useAuth } from '../../../hooks/useAuth';
import { getBookingDetails } from '../../../services/bookingService'; // Importar o serviço de booking
import { getChatMessages, sendMessage as sendChatMessage } from '../../../services/chatService';
import { BookingStatus } from '../../../types/backend/bookings'; // Importar BookingStatus
import { Message, SendMessageDto } from '../../../types/backend/chat';

const SOCKET_URL = appConfig.apiUrl.replace('http', 'ws');

export default function ProviderChatScreen() { // Renomeado para ProviderChatScreen
  const { chatId, recipientName, recipientId, recipientAvatarUrl, bookingId } = useLocalSearchParams<{ chatId?: string, recipientName?: string, recipientId?: string, recipientAvatarUrl?: string, bookingId?: string }>();
  const { user, token, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [chatBlockedMessage, setChatBlockedMessage] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

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
          } else if (bookingDetails.status === BookingStatus.CANCELLED) { // CORRIGIDO AQUI
            setChatBlockedMessage("Este chat foi encerrado, pois o agendamento foi cancelado.");
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
  }, [isAuthenticated, token, chatId, userId, bookingId]); // Adicionar bookingId como dependência

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
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageContent, isMyMessage ? { color: '#FFFFFF' } : { color: '#212529' }]}>{item.content}</Text>
        <Text style={[styles.messageTime, isMyMessage ? { color: 'rgba(255,255,255,0.7)' } : { color: '#6C757D' }]}>{new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando mensagens...</Text>
      </View>
    );
  }

  const isInputDisabled = !isAuthenticated || !!chatBlockedMessage;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ title: recipientName || 'Chat com Cliente' }} />

      {chatBlockedMessage && (
        <View style={styles.chatBlockedContainer}>
          <Ionicons name="information-circle-outline" size={24} color="#DC3545" />
          <Text style={styles.chatBlockedText}>{chatBlockedMessage}</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesListContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, isInputDisabled && styles.disabledInput]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={isInputDisabled ? "Chat indisponível" : "Digite sua mensagem..."}
          placeholderTextColor="#6C757D"
          multiline
          editable={!isInputDisabled}
        />
        <TouchableOpacity onPress={handleSendMessage} style={[styles.sendButton, isInputDisabled && styles.disabledSendButton]} disabled={isInputDisabled}>
          <Ionicons name="send" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6C757D',
  },
  chatBlockedContainer: {
    backgroundColor: '#FFE0E6',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FFC0CB',
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
    padding: 10,
    borderRadius: 15,
    maxWidth: '80%',
    marginBottom: 8,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 5,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E9ECEF',
    borderBottomLeftRadius: 5,
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
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
    maxHeight: 120,
  },
  disabledInput: {
    backgroundColor: '#E9ECEF',
    color: '#ADB5BD',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    backgroundColor: '#ADB5BD',
  },
});