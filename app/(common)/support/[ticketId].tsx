import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supportService } from '../../../services/supportService';
import { SupportTicket, SupportMessage } from '../../../types/backend/support';
import { useAuth } from '../../../contexts/AuthContext';
import { showAppAlert } from '../../../utils/alerts';
import { safeFormatDate } from '../../../utils/formatters';

/**
 * TicketDetailsScreen component displays the messages within a specific support ticket.
 * Users can view the conversation history and send new messages.
 */
export default function TicketDetailsScreen() {
    const router = useRouter();
    const { ticketId } = useLocalSearchParams();
    const { user } = useAuth();
    const [ticket, setTicket] = useState<SupportTicket | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    /**
     * Fetches the details of the specific ticket, including its messages.
     */
    const fetchTicketDetails = async () => {
        if (typeof ticketId !== 'string' || !ticketId) {
            setError('ID do ticket inválido.');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const fetchedTicket = await supportService.getTicketDetails(ticketId);
            setTicket(fetchedTicket);
        } catch (err: any) {
            console.error(`Failed to fetch ticket ${ticketId}:`, err);
            setError(err?.message || 'Não foi possível carregar os detalhes do ticket. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTicketDetails();
    }, [ticketId]);

    useEffect(() => {
        if (ticket?.messages?.length) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [ticket?.messages]);

    /**
     * Handles sending a new message to the ticket.
     * Validates input and calls the support service to add the message.
     */
    const handleSendMessage = async () => {
        if (typeof ticketId !== 'string' || !ticketId || !newMessage.trim()) {
            showAppAlert('Mensagem Vazia', 'Por favor, digite sua mensagem.');
            return;
        }
        if (!user?.id) {
            showAppAlert('Erro de Autenticação', 'Usuário não autenticado. Faça login novamente.');
            return;
        }

        setSending(true);
        try {
            const addedMessage = await supportService.addMessageToTicket(ticketId, { content: newMessage.trim() });
            setTicket(prevTicket => {
                if (!prevTicket) return null;
                return {
                    ...prevTicket,
                    messages: [...(prevTicket.messages || []), addedMessage],
                    updatedAt: new Date().toISOString(),
                };
            });
            setNewMessage('');
        } catch (err: any) {
            console.error('Error sending message:', err);
            showAppAlert('Erro', err);
        } finally {
            setSending(false);
        }
    };

    /**
     * Determines the alignment of a message bubble (left for others, right for current user).
     * @param {SupportMessage} message - The message object.
     * @returns {'right' | 'left'} Alignment string.
     */
    const getMessageAlignment = (message: SupportMessage) => {
        return user?.id && message.userId === user.id ? 'right' : 'left';
    };

    /**
     * Determines the style for the message bubble based on sender.
     * @param {SupportMessage} message - The message object.
     * @returns {object} StyleSheet style object.
     */
    const getMessageBubbleStyle = (message: SupportMessage) => {
        return user?.id && message.userId === user.id ? styles.myMessageBubble : styles.otherMessageBubble;
    };

    /**
     * Determines the style for the message text based on sender.
     * @param {SupportMessage} message - The message object.
     * @returns {object} StyleSheet style object.
     */
    const getMessageTextStyle = (message: SupportMessage) => {
        return user?.id && message.userId === user.id ? styles.myMessageText : styles.otherMessageText;
    };

    if (loading) {
        return (
            <View style={styles.centeredContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Carregando ticket...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centeredContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <Ionicons name="alert-circle-outline" size={50} color="#D32F2F" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchTicketDetails}>
                    <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!ticket) {
        return (
            <View style={styles.centeredContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <Text style={styles.errorText}>Ticket não encontrado.</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header with back button and ticket subject */}
            <SafeAreaView style={styles.customHeader}>
                <TouchableOpacity style={styles.headerIconLeft} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#2F4F4F" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{ticket.subject}</Text>
                <View style={styles.headerIconRightPlaceholder} /> {/* Placeholder for alignment */}
            </SafeAreaView>

            {/* Scrollable area for messages */}
            <ScrollView ref={scrollViewRef} contentContainerStyle={styles.messagesContainer}>
                {ticket.messages && ticket.messages.length > 0 ? (
                    ticket.messages.map((msg, index) => (
                        <View 
                            key={msg.id || `msg-${index}`}
                            style={[styles.messageRow, { justifyContent: getMessageAlignment(msg) === 'right' ? 'flex-end' : 'flex-start' }]}
                        >
                            <View style={getMessageBubbleStyle(msg)}>
                                <Text style={[styles.messageSender, getMessageAlignment(msg) === 'right' ? { color: '#FFFFFF' } : { color: '#4A90E2' }]}>
                                    {msg.senderType === 'client' && msg.senderId === user?.id ? 'Você' : (msg.senderType === 'admin' ? 'Suporte' : 'Provedor')}
                                </Text>
                                <Text style={getMessageTextStyle(msg)}>{msg.body}</Text>
                                <Text style={[styles.messageTime, getMessageAlignment(msg) === 'right' ? { color: 'rgba(255,255,255,0.7)' } : { color: '#A0A0A0' }]}>
                                    {safeFormatDate(msg.createdAt, { timeOnly: true })}
                                </Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyChatContainer}>
                        <Ionicons name="chatbubble-ellipses-outline" size={80} color="#C7C7CC" />
                        <Text style={styles.emptyChatText}>Nenhuma mensagem ainda.</Text>
                        <Text style={styles.emptyChatSubText}>Envie a primeira mensagem para iniciar a conversa.</Text>
                    </View>
                )}
            </ScrollView>

            {/* Input area for new messages */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.messageInput}
                    placeholder="Digite sua mensagem..."
                    placeholderTextColor="#A0A0A0"
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                    onPress={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                >
                    {sending ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Ionicons name="send" size={24} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F8FF', // AliceBlue
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F8FF',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#6C757D',
    },
    errorText: {
        marginTop: 15,
        fontSize: 16,
        color: '#D32F2F',
        textAlign: 'center',
        marginHorizontal: 20,
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#4A90E2',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        backgroundColor: 'transparent',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2F4F4F',
        textAlign: 'center',
        flex: 1,
    },
    headerIconLeft: {
        padding: 5,
        zIndex: 1,
    },
    headerIconRightPlaceholder: {
        width: 24 + 10,
        zIndex: 1,
    },
    messagesContainer: {
        flexGrow: 1,
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    myMessageBubble: {
        backgroundColor: '#4A90E2', // Blue for my messages
        borderRadius: 15,
        borderBottomRightRadius: 2, // pointy corner for my messages
        paddingVertical: 10,
        paddingHorizontal: 15,
        maxWidth: '80%',
        alignSelf: 'flex-end',
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.1)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    otherMessageBubble: {
        backgroundColor: '#E9ECEF', // Light gray for other messages
        borderRadius: 15,
        borderBottomLeftRadius: 2, // pointy corner for other messages
        paddingVertical: 10,
        paddingHorizontal: 15,
        maxWidth: '80%',
        alignSelf: 'flex-start',
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.05)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    messageSender: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    myMessageText: {
        fontSize: 15,
        color: '#FFFFFF',
    },
    otherMessageText: {
        fontSize: 15,
        color: '#212529',
    },
    messageTime: {
        fontSize: 10,
        marginTop: 5,
        textAlign: 'right',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        backgroundColor: '#FFFFFF',
    },
    messageInput: {
        flex: 1,
        backgroundColor: '#F8FAFB',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        fontSize: 16,
        color: '#212529',
        marginRight: 10,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: '#4A90E2',
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.1)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    sendButtonDisabled: {
        backgroundColor: '#A0C7F2',
    },
    emptyChatContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 50,
    },
    emptyChatText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6C757D',
        marginTop: 20,
        textAlign: 'center',
    },
    emptyChatSubText: {
        fontSize: 14,
        color: '#A0A0A0',
        marginTop: 10,
        textAlign: 'center',
    },
});
