// LimpeJaApp/app/common/support/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supportService } from '../../../services/supportService';
import { SupportTicket } from '../../../types/backend/support'; // <<-- Este é o arquivo onde TicketStatus é definido

/**
 * SupportTicketsScreen component displays a list of support tickets for the current user.
 * It allows users to view existing tickets and navigate to create a new one.
 */
export default function SupportTicketsScreen() {
    const router = useRouter();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTickets(); // Fetch tickets on component mount
    }, []);

    /**
     * Fetches the list of support tickets from the backend.
     */
    const fetchTickets = async () => {
        try {
            setLoading(true);
            const fetchedTickets = await supportService.getTickets();
            setTickets(fetchedTickets);
        } catch (err) {
            console.error('Failed to fetch tickets:', err);
            setError('Não foi possível carregar seus tickets de suporte. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Determines the color for the ticket status badge.
     * @param {SupportTicket['status']} status - The status of the ticket.
     * @returns {string} The hexadecimal color code.
     */
    const getStatusColor = (status: SupportTicket['status']) => {
        switch (status) {
            case 'OPEN': return '#4CAF50'; // Green for open tickets (AGORA EM MAIÚSCULAS)
            case 'IN_PROGRESS': return '#FFC107'; // Yellow for in-progress tickets (ASSUMINDO QUE 'pending' É 'IN_PROGRESS')
            case 'CLOSED': return '#6C757D'; // Gray for closed tickets (AGORA EM MAIÚSCULAS)
            case 'RESOLVED': return '#28A745'; // Adicionado para RESOLVED (cor verde diferente)
            case 'CANCELLED': return '#DC3545'; // Adicionado para CANCELLED (cor vermelha)
            default: return '#6C757D'; // Default para outros estados, como RESOLVED ou CANCELLED se não forem tratados acima
        }
    };

    if (loading) {
        return (
            <View style={styles.centeredContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Carregando tickets...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centeredContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <Ionicons name="alert-circle-outline" size={50} color="#D32F2F" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchTickets}>
                    <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header with back button */}
            <View style={styles.customHeader}>
                <TouchableOpacity style={styles.headerIconLeft} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#2F4F4F" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Meus Tickets de Suporte</Text>
                <View style={styles.headerIconRightPlaceholder} /> {/* Placeholder for alignment */}
            </View>

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {/* Button to create a new ticket */}
                <TouchableOpacity
                    style={styles.createTicketButton}
                    onPress={() => router.push('/common/support/create-ticket' as any)}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.createTicketButtonText}>Abrir Novo Ticket</Text>
                </TouchableOpacity>

                {/* Display empty state if no tickets, otherwise list tickets */}
                {tickets.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                        <Ionicons name="ticket-outline" size={80} color="#C7C7CC" />
                        <Text style={styles.emptyStateText}>Você não tem tickets de suporte abertos.</Text>
                        <Text style={styles.emptyStateSubText}>Abra um novo ticket para obter ajuda.</Text>
                    </View>
                ) : (
                    tickets.map((ticket) => (
                        <TouchableOpacity
                            key={ticket.id}
                            style={styles.ticketCard}
                            onPress={() => router.push(`/common/support/${ticket.id}` as any)} // Navigate to ticket details
                        >
                            <View style={styles.ticketHeader}>
                                <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
                                    <Text style={styles.statusText}>{ticket.status.toUpperCase()}</Text>
                                </View>
                            </View>
                            {/* ticket.lastMessagePreview não está definido em SupportTicket que você forneceu,
                                mas se existir no seu tipo real, descomente. */}
                            {/* {ticket.lastMessagePreview && (
                                <Text style={styles.ticketLastMessage}>{ticket.lastMessagePreview}</Text>
                            )} */}
                            <Text style={styles.ticketDate}>
                                Última atualização: {new Date(ticket.updatedAt).toLocaleDateString('pt-BR')}
                            </Text>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
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
    scrollViewContent: {
        paddingVertical: 20,
        paddingHorizontal: 15,
    },
    createTicketButton: {
        backgroundColor: '#4A90E2', // Blue button
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 12,
        marginBottom: 20,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.1)',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 5,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    createTicketButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    ticketCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
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
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    ticketSubject: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212529',
        flex: 1,
        marginRight: 10,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    ticketLastMessage: {
        fontSize: 14,
        color: '#6C757D',
        marginBottom: 8,
    },
    ticketDate: {
        fontSize: 12,
        color: '#A0A0A0',
        textAlign: 'right',
    },
    emptyStateContainer: {
        alignItems: 'center',
        marginTop: 50,
        paddingHorizontal: 20,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6C757D',
        marginTop: 20,
        textAlign: 'center',
    },
    emptyStateSubText: {
        fontSize: 14,
        color: '#A0A0A0',
        marginTop: 10,
        textAlign: 'center',
    },
});
