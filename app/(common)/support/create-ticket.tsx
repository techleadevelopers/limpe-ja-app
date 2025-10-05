import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform, SafeAreaView, KeyboardAvoidingView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supportService } from '../../../services/supportService';
import { showAppAlert } from '../../../utils/alerts';
// CORREÇÃO: Importar tipos do arquivo centralizado
import { CreateTicketPayload, TicketCategory, TicketSeverity } from '../../../types/backend/support';

/**
 * CreateTicketScreen component allows users to open a new support ticket
 * by providing a subject and an initial message.
 */
export default function CreateTicketScreen() {
    const router = useRouter();
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState(''); // Mantido como 'message' para o input do usuário
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState<TicketCategory>('OTHER'); // Adicionado estado para categoria
    const [severity, setSeverity] = useState<TicketSeverity>('LOW'); // Mantido apenas para UI; não enviado ao backend

    /**
     * Handles the submission of the new ticket form.
     * Validates input and calls the support service to create the ticket.
     */
    const handleCreateTicket = async () => {
        if (!subject.trim() || !message.trim()) {
            showAppAlert('Campos Vazios', 'Por favor, preencha o assunto e a mensagem.');
            return;
        }

        setLoading(true);
        try {
            // CORREÇÃO: Mapear 'message' do frontend para 'description' do backend DTO
            const payload: CreateTicketPayload = {
                subject: subject.trim(),
                description: message.trim(), // CORREÇÃO AQUI
                category: category, // Usar o estado da categoria
                // severity é apenas UI; não enviar ao backend para evitar erro de whitelist
            };
            await supportService.createTicket(payload);
            showAppAlert('Sucesso', 'Seu ticket de suporte foi criado com sucesso!');
            router.replace('/(common)/support');
        } catch (error: any) {
            console.error('Error creating ticket:', error);
            showAppAlert('Erro', error); // Passar o erro diretamente para showAppAlert
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header with back button */}
            <SafeAreaView style={styles.customHeader}>
                <TouchableOpacity style={styles.headerIconLeft} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#2F4F4F" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Abrir Novo Ticket</Text>
                <View style={styles.headerIconRightPlaceholder} /> {/* Placeholder for alignment */}
            </SafeAreaView>

            <KeyboardAvoidingView
                style={styles.formContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <Text style={styles.label}>Assunto</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: Problema com agendamento, Dúvida sobre pagamento"
                    placeholderTextColor="#A0A0A0"
                    value={subject}
                    onChangeText={setSubject}
                    maxLength={100}
                />

                <Text style={styles.label}>Mensagem</Text>
                <TextInput
                    style={[styles.input, styles.messageInput]}
                    placeholder="Descreva seu problema ou dúvida em detalhes..."
                    placeholderTextColor="#A0A0A0"
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    textAlignVertical="top"
                    maxLength={1000}
                />

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleCreateTicket}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>Enviar Ticket</Text>
                    )}
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F8FF', // AliceBlue
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
    formContainer: {
        flex: 1,
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#212529',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E9ECEF', // Light gray border
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.05)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    messageInput: {
        height: 120, // Fixed height for message input
        paddingTop: 12, // Ensure text starts from the top
    },
    submitButton: {
        backgroundColor: '#4A90E2', // Blue button
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
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
    submitButtonDisabled: {
        backgroundColor: '#A0C7F2', // Lighter blue when disabled
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
