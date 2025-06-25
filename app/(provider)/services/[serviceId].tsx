// LimpeJaApp/app/(provider)/services/[serviceId].tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    TouchableOpacity,
    Platform, // <--- ADICIONADO: Importar Platform
    Animated,
    Image,
    Linking,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message'; // npm install react-native-toast-message

// <--- ADICIONADO: Importar useAuth para obter o ID do provedor logado
import { useAuth } from '../../../hooks/useAuth';

// <--- ADICIONADO: Importar serviços e tipagens reais
import { getBookingDetails, updateBookingStatus } from '../../services/bookingService';
import { Booking, UpdateBookingStatusDto } from '../../types/backend/bookings';
import { formatPhoneNumber, formatDate } from '../../../utils/helpers'; // Importar formatPhoneNumber e formatDate

// REMOVIDO: Mock de dados de serviço (ServiceDetails e MOCK_SERVICE_DETAILS)

export default function ProviderServiceDetailsScreen() {
    const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
    const router = useRouter();
    const { user } = useAuth(); // Obtém o usuário logado (provedor)

    const [serviceDetails, setServiceDetails] = useState<Booking | null>(null); // <--- CORREÇÃO: Tipo para Booking
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessingAction, setIsProcessingAction] = useState(false);

    // Animações
    const headerAnim = useRef(new Animated.Value(0)).current;
    const clientInfoAnim = useRef(new Animated.Value(0)).current;
    const serviceDetailsAnim = useRef(new Animated.Value(0)).current;
    const notesAnim = useRef(new Animated.Value(0)).current;
    const statusAnim = useRef(new Animated.Value(0)).current;
    const actionsAnim = useRef(new Animated.Value(0)).current;
    // Animações de feedback de toque para os botões de ação
    const acceptButtonScale = useRef(new Animated.Value(1)).current;
    const declineButtonScale = useRef(new Animated.Value(1)).current;
    const completeButtonScale = useRef(new Animated.Value(1)).current;
    const contactButtonScale = useRef(new Animated.Value(1)).current;

    // Criar um componente TouchableOpacity animável
    const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

    const fetchData = useCallback(async () => {
        if (!serviceId || !user?.id) { // Certifica que o ID do serviço e do provedor estão disponíveis
            console.warn("ProviderServiceDetailsScreen: Service ID ou User ID ausente.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        console.log(`Carregando detalhes do serviço/solicitação: ${serviceId} para provedor ${user.id}`);
        try {
            const details = await getBookingDetails(serviceId); // <--- CHAMA A API REAL
            // ATENÇÃO: Se o backend retornar o bookingDetails filtrado por provedor logado,
            // não precisamos de verificação extra aqui.
            // Se o backend permite que qualquer um veja, adicione `if (details.provider.id !== user.id)` para segurança.
            setServiceDetails(details);
            // Animações de entrada do conteúdo (em cascata, conforme documentação)
            Animated.stagger(100, [
                Animated.timing(clientInfoAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(serviceDetailsAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(notesAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(statusAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(actionsAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]).start();
        } catch (error: any) {
            console.error("Erro ao carregar detalhes do serviço:", error.response?.data || error.message);
            Alert.alert("Erro", error.response?.data?.message || "Não foi possível carregar os detalhes do serviço.");
            setServiceDetails(null); // Define como nulo em caso de erro
        } finally {
            setIsLoading(false);
        }
    }, [serviceId, user?.id, clientInfoAnim, serviceDetailsAnim, notesAnim, statusAnim, actionsAnim]); // Adiciona user.id às dependências

    useEffect(() => {
        Animated.timing(headerAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
        fetchData(); // Chama a busca de dados na montagem
    }, [fetchData, headerAnim]);

    // Funções para feedback de toque nos botões de ação
    const createButtonAnimation = (animatedValue: Animated.Value) => ({
        onPressIn: () => Animated.spring(animatedValue, { toValue: 0.95, useNativeDriver: true }).start(),
        onPressOut: () => Animated.spring(animatedValue, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start(),
    });

    const handleAction = async (actionType: 'accept' | 'decline' | 'complete' | 'contact') => {
        if (!serviceDetails || isProcessingAction) return;
        setIsProcessingAction(true);

        let newStatus: UpdateBookingStatusDto['status'] | undefined; // Tipo do status para o DTO
        let successMessage = "";
        let errorMessage = "";

        switch (actionType) {
            case 'accept':
                newStatus = 'CONFIRMED'; // <--- Mapeando para o status real do backend
                successMessage = "Solicitação aceita com sucesso!";
                errorMessage = "Falha ao aceitar a solicitação.";
                break;
            case 'decline':
                newStatus = 'REJECTED'; // <--- Mapeando para o status real do backend
                successMessage = "Solicitação recusada.";
                errorMessage = "Falha ao recusar a solicitação.";
                break;
            case 'complete':
                newStatus = 'COMPLETED'; // <--- Mapeando para o status real do backend
                successMessage = "Serviço marcado como concluído!";
                errorMessage = "Falha ao marcar como concluído.";
                break;
            case 'contact':
                // Ação de contato é tratada localmente sem mudança de status no backend diretamente
                Alert.alert(
                    "Contatar Cliente",
                    "Como você gostaria de contatar o cliente?",
                    [
                        {
                            text: "Ligar",
                            onPress: () => {
                                if (serviceDetails.client.phone) { // <--- ACESSANDO serviceDetails.client.phone
                                    Linking.openURL(`tel:${serviceDetails.client.phone}`).catch(() => {
                                        Toast.show({
                                            type: 'error',
                                            text1: 'Erro ao ligar',
                                            text2: 'Não foi possível realizar a chamada.',
                                        });
                                    });
                                } else {
                                    Toast.show({
                                        type: 'info',
                                        text1: 'Número de telefone não disponível.',
                                        text2: 'O cliente não informou um telefone.',
                                    });
                                }
                            }
                        },
                        {
                            text: "Chat",
                            onPress: () => {
                                // Navega para a tela de chat do provedor
                                router.push(`/(provider)/messages/${serviceDetails.client.id}?recipientName=${encodeURIComponent(serviceDetails.client.name)}` as any); // <--- ACESSANDO serviceDetails.client.id e .client.name
                            }
                        },
                        {
                            text: "Cancelar",
                            style: "cancel"
                        }
                    ]
                );
                setIsProcessingAction(false); // Não há chamada de API para 'contact', então finaliza a ação
                return; // Sai da função para não tentar chamar updateBookingStatus
        }

        try {
            // Chama a API real para atualizar o status do agendamento
            if (newStatus) { // Apenas se houver um novo status para enviar
                await updateBookingStatus(serviceDetails.id, { status: newStatus }); // <--- CHAMA A API REAL
                Toast.show({
                    type: 'success',
                    text1: 'Sucesso!',
                    text2: successMessage,
                });
                fetchData(); // Recarrega os dados para refletir a mudança de status
            }
        } catch (error: any) {
            console.error(`Erro ao ${actionType} serviço:`, error.response?.data || error.message);
            Toast.show({
                type: 'error',
                text1: 'Erro!',
                text2: errorMessage,
            });
        } finally {
            setIsProcessingAction(false);
        }
    };

    // Mapeia os status do backend para estilos de exibição no frontend
    const getStatusStyle = (status: Booking['status']) => { // <--- CORREÇÃO: Tipo de status para Booking['status']
        switch (status) {
            case 'PENDING_PROVIDER_CONFIRMATION': return { text: '#FF6F00', background: '#FFF3E0', icon: 'hourglass-outline' as const }; // Amarelo/Laranja para pendente (confirmação do provedor)
            case 'PENDING': return { text: '#FF6F00', background: '#FFF3E0', icon: 'hourglass-outline' as const }; // Amarelo/Laranja para pendente (geral)
            case 'CONFIRMED': return { text: '#2E7D32', background: '#E8F5E9', icon: 'checkmark-circle-outline' as const }; // Verde para confirmado
            case 'IN_PROGRESS': return { text: '#007AFF', background: '#E3F2FD', icon: 'sync-circle-outline' as const }; // Azul para em andamento
            case 'COMPLETED': return { text: '#546E7A', background: '#ECEFF1', icon: 'archive-outline' as const }; // Cinza para concluído
            case 'CANCELLED': return { text: '#D32F2F', background: '#FFEBEE', icon: 'close-circle-outline' as const }; // Vermelho para cancelado
            case 'REJECTED': return { text: '#757575', background: '#F5F5F5', icon: 'alert-circle-outline' as const }; // Cinza escuro para recusado
            default: return { text: '#546E7A', background: '#ECEFF1', icon: 'information-circle-outline' as const };
        }
    };

    if (isLoading) {
        return (
            <View style={styles.outerContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Detalhes do Serviço</Text>
                    <View style={styles.headerActionIconPlaceholder} />
                </Animated.View>
                <View style={styles.centeredFeedback}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Carregando detalhes do serviço...</Text>
                </View>
            </View>
        );
    }

    if (!serviceDetails) {
        return (
            <View style={styles.outerContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Detalhes do Serviço</Text>
                    <View style={styles.headerActionIconPlaceholder} />
                </Animated.View>
                <View style={styles.centeredFeedback}>
                    <Ionicons name="alert-circle-outline" size={64} color="#CED4DA" />
                    <Text style={styles.emptyText}>Serviço não encontrado ou inacessível.</Text>
                    <TouchableOpacity style={styles.simpleButton} onPress={() => router.back()}>
                        <Text style={styles.simpleButtonText}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const statusStyle = getStatusStyle(serviceDetails.status);

    // Formatar endereço completo para exibição
    const fullAddress = `${serviceDetails.address.street}, ${serviceDetails.address.number}` +
                        `${serviceDetails.address.complement ? ` - ${serviceDetails.address.complement}` : ''}` +
                        `, ${serviceDetails.address.neighborhood}, ${serviceDetails.address.city} - ${serviceDetails.address.state}`;

    return (
        <View style={styles.outerContainer}>
            <Stack.Screen options={{ headerShown: false }} />

            <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalhes do Serviço</Text>
                <View style={styles.headerActionIconPlaceholder} />
            </Animated.View>

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {/* Seção de Informações do Cliente */}
                <Animated.View style={[styles.card, { opacity: clientInfoAnim, transform: [{ translateY: clientInfoAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    <View style={styles.clientHeader}>
                        {serviceDetails.client.avatarUrl ? ( // <--- ACESSANDO serviceDetails.client.avatarUrl
                            <Image source={{ uri: serviceDetails.client.avatarUrl }} style={styles.clientAvatar} />
                        ) : (
                            <View style={styles.clientAvatarPlaceholder}>
                                <Ionicons name="person-outline" size={30} color="#FFFFFF" />
                            </View>
                        )}
                        <View style={styles.clientHeaderText}>
                            <Text style={styles.cardTitle}>Cliente</Text>
                            <Text style={styles.clientName}>{serviceDetails.client.name}</Text> {/* <--- ACESSANDO serviceDetails.client.name */}
                        </View>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="call-outline" size={20} color="#6C757D" style={styles.detailIcon} />
                        <Text style={styles.detailText}>{formatPhoneNumber(serviceDetails.client.phone || '') || 'Não disponível'}</Text> {/* <--- ACESSANDO serviceDetails.client.phone e formatando */}
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={20} color="#6C757D" style={styles.detailIcon} />
                        <Text style={styles.detailText}>{fullAddress}</Text> {/* <--- Usando endereço formatado */}
                    </View>
                </Animated.View>

                {/* Seção de Detalhes do Serviço */}
                <Animated.View style={[styles.card, { opacity: serviceDetailsAnim, transform: [{ translateY: serviceDetailsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    <Text style={styles.cardTitle}>Detalhes do Serviço</Text>
                    <View style={styles.detailRow}>
                        <Ionicons name="briefcase-outline" size={20} color="#6C757D" style={styles.detailIcon} />
                        <Text style={styles.detailText}>{serviceDetails.service.name}</Text> {/* <--- ACESSANDO serviceDetails.service.name */}
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={20} color="#6C757D" style={styles.detailIcon} />
                        <Text style={styles.detailText}>{formatDate(serviceDetails.scheduledTime, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text> {/* <--- ACESSANDO serviceDetails.scheduledTime */}
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={20} color="#6C757D" style={styles.detailIcon} />
                        <Text style={styles.detailText}>{formatDate(serviceDetails.scheduledTime, { hour: '2-digit', minute: '2-digit' })}</Text> {/* <--- ACESSANDO serviceDetails.scheduledTime para a hora */}
                    </View>
                    {/* Exibir o valor do serviço */}
                    {serviceDetails.totalAmount !== undefined && ( // <--- ACESSANDO serviceDetails.totalAmount
                        <View style={styles.detailRow}>
                            <Ionicons name="wallet-outline" size={20} color="#6C757D" style={styles.detailIcon} />
                            <Text style={styles.detailText}>R$ {serviceDetails.totalAmount.toFixed(2).replace('.', ',')}</Text>
                        </View>
                    )}
                </Animated.View>

                {/* Seção de Observações */}
                <Animated.View style={[styles.card, { opacity: notesAnim, transform: [{ translateY: notesAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    <Text style={styles.cardTitle}>Observações do Cliente</Text>
                    <Text style={styles.notesText}>{serviceDetails.notes || 'Nenhuma observação adicional.'}</Text> {/* <--- ACESSANDO serviceDetails.notes */}
                </Animated.View>

                {/* Seção de Status */}
                <Animated.View style={[styles.card, { opacity: statusAnim, transform: [{ translateY: statusAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    <Text style={styles.cardTitle}>Status do Serviço</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.background }]}>
                        <Ionicons name={statusStyle.icon} size={20} color={statusStyle.text} style={{ marginRight: 8 }} />
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>{serviceDetails.status}</Text>
                    </View>
                </Animated.View>

                {/* Seção de Ações */}
                <Animated.View style={[styles.actionsContainer, { opacity: actionsAnim, transform: [{ translateY: actionsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    {/* Ações para status Pendente/Pendente de Confirmação do Provedor */}
                    {(serviceDetails.status === 'PENDING' || serviceDetails.status === 'PENDING_PROVIDER_CONFIRMATION') && (
                        <>
                            <AnimatedTouchable
                                style={[styles.actionButton, styles.actionButtonAccept, isProcessingAction && styles.actionButtonDisabled, { transform: [{ scale: acceptButtonScale }] }]}
                                onPress={() => handleAction('accept')}
                                disabled={isProcessingAction}
                                {...createButtonAnimation(acceptButtonScale)}
                            >
                                {isProcessingAction ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Aceitar Solicitação</Text>}
                            </AnimatedTouchable>
                            <AnimatedTouchable
                                style={[styles.actionButton, styles.actionButtonDecline, isProcessingAction && styles.actionButtonDisabled, { transform: [{ scale: declineButtonScale }] }]}
                                onPress={() => handleAction('decline')}
                                disabled={isProcessingAction}
                                {...createButtonAnimation(declineButtonScale)}
                            >
                                {isProcessingAction ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Recusar Solicitação</Text>}
                            </AnimatedTouchable>
                        </>
                    )}
                    {/* Ações para status Confirmado */}
                    {serviceDetails.status === 'CONFIRMED' && (
                        <AnimatedTouchable
                            style={[styles.actionButton, styles.actionButtonComplete, isProcessingAction && styles.actionButtonDisabled, { transform: [{ scale: completeButtonScale }] }]}
                            onPress={() => handleAction('complete')}
                            disabled={isProcessingAction}
                            {...createButtonAnimation(completeButtonScale)}
                        >
                            {isProcessingAction ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Marcar como Concluído</Text>}
                        </AnimatedTouchable>
                    )}
                    {/* Botão de Contato para Pendente e Confirmado */}
                    {(serviceDetails.status === 'CONFIRMED' || serviceDetails.status === 'PENDING' || serviceDetails.status === 'PENDING_PROVIDER_CONFIRMATION') && (
                        <AnimatedTouchable
                            style={[styles.actionButton, styles.actionButtonContact, isProcessingAction && styles.actionButtonDisabled, { transform: [{ scale: contactButtonScale }] }]}
                            onPress={() => handleAction('contact')}
                            disabled={isProcessingAction}
                            {...createButtonAnimation(contactButtonScale)}
                        >
                            {isProcessingAction ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Contatar Cliente</Text>}
                        </AnimatedTouchable>
                    )}
                    {/* Ações para status Concluído, Cancelado, Recusado (apenas visualização) */}
                    {(serviceDetails.status === 'COMPLETED' || serviceDetails.status === 'CANCELLED' || serviceDetails.status === 'REJECTED') && (
                        <TouchableOpacity // Este TouchableOpacity não precisa ser animado, pois não tem animação de escala
                            style={[styles.actionButton, styles.actionButtonViewOnly]}
                            onPress={() => Alert.alert("Detalhes", "Esta é uma ação de visualização para serviços finalizados/cancelados.")}
                            disabled={isProcessingAction}
                        >
                            <Text style={styles.actionButtonText}>Ver Detalhes Completos</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </ScrollView>
            <Toast />
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: '#F0F2F5',
    },
    scrollViewContent: {
        padding: 15,
        paddingBottom: 40,
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#007AFF',
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 50 : 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    headerBackButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1,
        textAlign: 'center',
    },
    headerActionIconPlaceholder: {
        width: 24,
        marginLeft: 15,
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
        fontSize: 18,
        color: '#6C757D',
        marginTop: 15,
        textAlign: 'center',
    },
    simpleButton: {
        marginTop: 20,
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    simpleButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        ...Platform.select({
            ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
            android: { elevation: 4 },
        }),
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1C3A5F',
        marginBottom: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E9ECEF',
        paddingBottom: 10,
    },
    clientHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    clientAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#007AFF',
    },
    clientAvatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    clientHeaderText: {
        flex: 1,
    },
    clientName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#212529',
        marginTop: 5,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    detailIcon: {
        marginRight: 10,
        width: 24,
        textAlign: 'center',
    },
    detailText: {
        fontSize: 16,
        color: '#495057',
        flex: 1,
        lineHeight: 22,
    },
    notesText: {
        fontSize: 15,
        color: '#495057',
        lineHeight: 22,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginTop: 5,
    },
    statusText: {
        fontSize: 15,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    actionsContainer: {
        marginTop: 10,
    },
    actionButton: {
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        ...Platform.select({
            ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
            android: { elevation: 3 },
        }),
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    actionButtonAccept: {
        backgroundColor: '#28A745', // Verde
    },
    actionButtonDecline: {
        backgroundColor: '#DC3545', // Vermelho
    },
    actionButtonComplete: {
        backgroundColor: '#007AFF', // Azul
    },
    actionButtonContact: {
        backgroundColor: '#6C757D', // Cinza
    },
    actionButtonViewOnly: {
        backgroundColor: '#6C757D', // Cinza
    },
    actionButtonDisabled: {
        opacity: 0.6,
        elevation: 0,
        shadowOpacity: 0,
    },
});