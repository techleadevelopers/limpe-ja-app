// LimpeJaApp/app/(client)/messages/[chatId].tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../../hooks/useAuth';
import { getChatMessages, sendMessage as sendChatMessage } from '../../services/chatService';
import { Message, GetMessagesQuery, SendMessageDto } from '../../types/backend/chat'; // CORREÇÃO: Usar GetMessagesQuery
import { appConfig } from '../../../config/appConfig';

const SOCKET_URL = appConfig.apiUrl.replace('http', 'ws');

export default function ChatScreen() {
  const { chatId, recipientName } = useLocalSearchParams<{ chatId?: string, recipientName?: string }>();
  const { user, token, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!isAuthenticated || !token || !chatId || !userId) {
      console.log('ChatScreen: Usuário não autenticado ou chat/user ID ausente.');
      setIsLoading(false);
      return;
    }

    // 1. Carregar histórico de mensagens
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        // CORREÇÃO: Passar o objeto GetMessagesQuery diretamente
        const fetchedMessages = await getChatMessages(chatId, { limit: 50, offset: 0 }); 
        setMessages(fetchedMessages.reverse());
      } catch (error) {
        console.error('ChatScreen: Erro ao carregar mensagens:', error);
        Alert.alert('Erro', 'Não foi possível carregar as mensagens do chat.');
      } finally {
        setIsLoading(false);
      }
    };
    loadMessages();

    // 2. Conectar WebSocket
    console.log(`ChatScreen: Tentando conectar WebSocket em ${SOCKET_URL}`);
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('ChatScreen: WebSocket conectado!', socket.id);
      socket.emit('joinChat', { chatId, userId });
    });

    socket.on('receiveMessage', (newMessage: Message) => {
      console.log('ChatScreen: Nova mensagem recebida:', newMessage);
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('error', (err: any) => {
      console.error('ChatScreen: Erro no WebSocket:', err);
      Alert.alert('Erro no Chat', 'Houve um problema com a conexão do chat.');
    });

    socket.on('disconnect', () => {
      console.log('ChatScreen: WebSocket desconectado.');
    });

    return () => {
      console.log('ChatScreen: Desmontando componente, desconectando WebSocket.');
      socket.disconnect();
    };
  }, [isAuthenticated, token, chatId, userId]);

  const handleSendMessage = useCallback(async () => {
    if (inputText.trim() === '' || !user?.id || !chatId) return;

    // Assumindo que você tem o receiverId de alguma forma (talvez do chatId ou de um param adicional)
    // Para este exemplo, vou mockar um receiverId. Em um app real, você o obteria.
    // Se o chat é entre dois usuários, o receiverId seria o ID do outro usuário no chat.
    // Você pode precisar passar o receiverId como um param adicional para esta tela.
    const mockReceiverId = 'someOtherUserId'; // <--- SUBSTITUA PELA LÓGICA REAL PARA OBTER O receiverId

    const newMessageData: SendMessageDto = {
      chatId, // CORREÇÃO: chatId está agora no DTO
      senderId: user.id,
      receiverId: mockReceiverId, // <--- Use o receiverId real aqui
      content: inputText.trim(),
    };

    try {
      if (socketRef.current && socketRef.current.connected) {
        console.log('ChatScreen: Enviando mensagem via WebSocket:', newMessageData);
        socketRef.current.emit('sendMessage', newMessageData);
      } else {
        console.warn('ChatScreen: WebSocket não conectado. Enviando mensagem via REST.');
        // CORREÇÃO: Passar o SendMessageDto completo para a função de serviço
        await sendChatMessage(newMessageData); 
      }
      setInputText('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    } catch (error) {
      console.error('ChatScreen: Erro ao enviar mensagem:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
    }
  }, [inputText, user, chatId]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === userId;
    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        <Text style={styles.messageContent}>{item.content}</Text>
        {/* CORREÇÃO: Usar item.createdAt */}
        <Text style={styles.messageTime}>{new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ title: recipientName || 'Chat' }} />
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
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Digite sua mensagem..."
          placeholderTextColor="#6C757D"
          multiline
        />
        <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
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
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
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
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});