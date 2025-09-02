// LimpeJaApp/app/(client)/bookings/[bookingId].tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { formatDate } from '../../../utils/helpers';

// --- IMPORTAÇÕES DE SERVIÇOS E TIPAGENS DO SEU BACKEND REAL ---
import { cancelBooking, getBookingDetails } from '../../../services/bookingService'; // Importa os serviços reais

// >>> IMPORTAR BookingDetails e BookingStatus de forma centralizada <<<
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';
import { PanicBanner } from '../../../components/safety/PanicBanner'; // Importar PanicBanner

// --- ATENÇÃO: A INTERFACE 'Booking' LOCAL FOI REMOVIDA DESTE ARQUIVO ---
// Era a causa do conflito de tipagem. Agora, BookingDetails é a única fonte de verdade.

export default function BookingDetailsScreen() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const router = useRouter();
    
    // Estado para armazenar os detalhes do agendamento
    // >>> AGORA TIPADO COMO BookingDetails IMPORTADO <<<
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Estado de carregamento
    const [error, setError] = useState<string | null>(null); // Estado para erros
    // Mock para o status do pânico
    const [panicStatus, setPanicStatus] = useState<'IDLE'|'RECEIVED'|'ACKED'|'DISPATCHED'|'CLOSED'>('IDLE');

    // Animações para os cards de informação
    const providerSectionAnim = useRef(new Animated.Value(0)).current;
    const detailsCardAnim = useRef(new Animated.Value(0)).current;
    const actionsCardAnim = useRef(new Animated.Value(0)).current;

    // Animações para os botões de ação (efeito de pressionar)
    const cancelButtonScaleAnim = useRef(new Animated.Value(1)).current;
    const contactButtonScaleAnim = useRef(new Animated.Value(1)).current;
    const reviewButtonScaleAnim = useRef(new Animated.Value(1)).current;
    const profileButtonScaleAnim = useRef(new Animated.Value(1)).current;

    // useCallback para a função de buscar detalhes do agendamento
    const fetchBooking = useCallback(async () => {
        if (!bookingId) {
            setError("ID do agendamento não fornecido.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true); // Inicia o carregamento
        setError(null); // Limpa erros anteriores
        try {
            // Chama a função real do serviço de booking para obter os detalhes
            // A função getBookingDetails DEVE retornar um Promise<BookingDetails>
            const data: BookingDetails = await getBookingDetails(bookingId);
            setBooking(data); // Atualiza o estado com os dados recebidos
            
            // Inicia as animações de entrada após os dados serem carregados
            Animated.stagger(200, [
                Animated.timing(providerSectionAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(detailsCardAnim, { toValue: 1, duration: 700, delay: 100, useNativeDriver: true }),
                Animated.timing(actionsCardAnim, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
            ]).start();
        } catch (err: any) {
            console.error("[BookingDetailsScreen] Erro ao buscar detalhes do agendamento:", err);
            setError(err.message || "Não foi possível carregar os detalhes do agendamento.");
        } finally {
            setIsLoading(false); // Finaliza o estado de carregamento
        }
    }, [bookingId, providerSectionAnim, detailsCardAnim, actionsCardAnim]);

    // Efeito para chamar fetchBooking quando o componente monta ou bookingId muda
    useEffect(() => {
        fetchBooking();
    }, [fetchBooking]);

    // Funções para o efeito visual de pressionar os botões
    const onPressInButton = (animValue: Animated.Value) => {
        Animated.spring(animValue, {
            toValue: 0.96, // Efeito de pressionar
            useNativeDriver: true,
        }).start();
    };

    const onPressOutButton = (animValue: Animated.Value) => {
        Animated.spring(animValue, {
            toValue: 1, // Volta ao estado normal
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    // Handler para o botão de cancelar agendamento
    const handleCancelBooking = async () => {
        if (!booking) return; // Sai se não houver dados de booking
        Alert.alert(
            "Cancelar Agendamento",
            "Tem certeza que deseja cancelar este agendamento? Esta ação pode estar sujeita a taxas dependendo da política de cancelamento.",
            [
                { text: "Não", style: "cancel" }, // Botão para cancelar a ação
                {
                    text: "Sim, Cancelar",
                    onPress: async () => {
                        console.log("[BookingDetailsScreen] Cancelando agendamento:", booking.id);
                        setIsLoading(true); // Mostra indicador de carregamento
                        try {
                            // Chama a função real de cancelamento do serviço
                            await cancelBooking(booking.id);
                            Alert.alert("Sucesso", "Agendamento cancelado com sucesso!");
                            // Atualiza o estado local para refletir o cancelamento
                            // >>> Usar BookingStatus.CANCELLED (com dois L) do enum importado <<<
                            setBooking(prev => prev ? { ...prev, status: BookingStatus.CANCELLED } : null); // Corrigido CANCELED para CANCELLED
                        } catch (err: any) {
                            console.error("[BookingDetailsScreen] Erro ao cancelar agendamento:", err);
                            Alert.alert("Erro", err.message || "Não foi possível cancelar o agendamento.");
                        } finally {
                            setIsLoading(false); // Esconde indicador de carregamento
                        }
                    },
                    style: "destructive" // Botão de cancelamento em vermelho
                }
            ]
        );
    };

    // Handler para o botão de contato com o provedor
    const handleContactProvider = () => {
        if (!booking) return;
        // Navega para a tela de mensagens, passando os IDs necessários
        router.push({
            pathname: '/(client)/messages', // Ajuste o caminho da sua tela de mensagens
            params: {
                providerId: booking.providerId, // Usa providerId diretamente
                bookingId: booking.id,
                recipientName: booking.providerFullName, // Usa providerFullName diretamente
            },
        });
    };

    // Handler para o botão de avaliar serviço
    const handleReviewService = () => {
        if (!booking) return;
        // Navega para a tela de feedback, passando os detalhes necessários
        router.push({
            // CORREÇÃO: Usar [targetId] no pathname e passar booking.id como targetId
            pathname: '/(common)/feedback/[targetId]', 
            params: {
                targetId: booking.id, // Passa o ID do agendamento como targetId
                type: 'service', // Indica o tipo de feedback (serviço)
                serviceName: booking.serviceName, // Usa serviceName diretamente
                providerName: booking.providerFullName, // Usa providerFullName diretamente
                providerId: booking.providerId, // Usa providerId diretamente
            },
        });
    };

    // Handler para ver o perfil do provedor
    const handleViewProviderProfile = () => {
        if (!booking) return;
        // Navega para a tela de perfil do provedor
        router.push({
            pathname: '/(client)/explore/[providerId]', // Ajuste o caminho da sua tela de perfil de provedor
            params: {
                providerId: booking.providerId, // Usa providerId diretamente
            },
        });
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

    // Função para obter estilos baseados no status do agendamento
    // >>> AGORA USA BookingStatus IMPORTADO <<<
    const getStatusStyle = (status: BookingStatus) => {
        switch (status) {
            case BookingStatus.CONFIRMED:
                return { color: '#28A745', icon: 'checkmark-circle-outline' as const, badgeBg: '#D4EDDA' }; // Success Green
            case BookingStatus.PENDING:
                return { color: '#FFC107', icon: 'time-outline' as const, badgeBg: '#FFF3CD' }; // Warning Yellow
            case BookingStatus.PENDING_PROVIDER_CONFIRMATION: // Agora reconhecido
                return { color: '#FFC107', icon: 'hourglass-outline' as const, badgeBg: '#FFF3CD' }; // Warning Yellow
            case BookingStatus.IN_PROGRESS:
                return { color: '#007BFF', icon: 'sync-circle-outline' as const, badgeBg: '#CCE5FF' }; // Primary Blue
            case BookingStatus.COMPLETED:
                return { color: '#6C757D', icon: 'flag-outline' as const, badgeBg: '#E2E3E5' }; // Muted Grey
            case BookingStatus.CANCELLED: // Corrigido para CANCELLED (dois L)
                return { color: '#DC3545', icon: 'close-circle-outline' as const, badgeBg: '#F8D7DA' }; // Danger Red
            case BookingStatus.REJECTED:
                return { color: '#6C757D', icon: 'alert-circle-outline' as const, badgeBg: '#E2E3E5' }; // Muted Grey
            case BookingStatus.RESCHEDULED:
                return { color: '#6F42C1', icon: 'sync-outline' as const, badgeBg: '#EAE6F3' }; // Purple
            case BookingStatus.NO_SHOW:
                return { color: '#343A40', icon: 'person-remove-outline' as const, badgeBg: '#D6D8D9' }; // Dark Grey
            default: // Caso para qualquer status não mapeado explicitamente
                return { color: '#888', icon: 'help-circle-outline' as const, badgeBg: '#ECEFF1' };
        }
    };


    // Tela de carregamento inicial
    if (isLoading) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ title: "Carregando..." }} />
                <ActivityIndicator size="large" color="#007BFF" />
                <Text style={styles.loadingText}>Carregando detalhes do agendamento...</Text>
            </View>
        );
    }

    // Tela de erro ou agendamento não encontrado
    if (error || !booking) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ title: "Erro" }} />
                <Ionicons name="alert-circle-outline" size={48} color="#DC3545" />
                <Text style={styles.errorText}>{error || `Agendamento "${bookingId}" não encontrado.`}</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    // Derivação de isReviewed: true se reviewId existir, false caso contrário
    // NOTA: Se o seu backend envia `isReviewed` diretamente, você pode usar `booking.isReviewed`.
    // Mas se ele envia `reviewId` e você deriva, essa linha é a correta.
    const isReviewed = !!booking.reviewId; 

    // Obtém as informações de estilo do status
    const statusInfo = getStatusStyle(booking.status);

    return (
        <ScrollView style={styles.scrollViewContainer}>
            <Stack.Screen options={{ title: `Detalhes do Serviço` }} />
            
            {/* PanicBanner injetado aqui */}
            <View style={styles.panicBannerContainer}>
                <PanicBanner onPanic={handlePanic} status={panicStatus} />
            </View>

            {/* Seção do Provedor e Status */}
            <Animated.View style={[styles.card, styles.providerSectionCard, { opacity: providerSectionAnim, transform: [{ translateY: providerSectionAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <View style={styles.providerSection}>
                    {booking.providerAvatarUrl && 
                        <Image source={{ uri: booking.providerAvatarUrl }} style={styles.providerImage} />
                    }
                    <View style={styles.providerInfo}>
                        <Text style={styles.serviceNameText}>{booking.serviceName}</Text>
                        <Text style={styles.providerNameText}>com {booking.providerFullName}</Text>
                    </View>
                    {/* Badge de Status */}
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.badgeBg }]}>
                        <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>{booking.status}</Text>
                    </View>
                </View>
            </Animated.View>

            {/* Detalhes do Agendamento */}
            <Animated.View style={[styles.card, { opacity: detailsCardAnim, transform: [{ scale: detailsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }] }]}>
                <Text style={styles.sectionTitle}>Detalhes do Agendamento</Text>
                
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={20} color="#6C757D" style={styles.icon} />
                    <Text style={styles.detailLabel}>Data e Hora:</Text>
                    <Text style={styles.detailValue}>
                        {/* CORREÇÃO: Combinar scheduledDate e scheduledTime para criar um objeto Date */}
                        {formatDate(new Date(`${booking.scheduledDate}T${booking.scheduledTime}`), { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={20} color="#6C757D" style={styles.icon} />
                    <Text style={styles.detailLabel}>Endereço:</Text>
                    <Text style={styles.detailValueAddress}>
                        {`${booking.address.street}, ${booking.address.number}`}
                        {booking.address.complement ? `, ${booking.address.complement}` : ''}
                        {`\n${booking.address.neighborhood}, ${booking.address.city}-${booking.address.state}`}
                        {`\nCEP: ${booking.address.cep}`}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={20} color="#6C757D" style={styles.icon} />
                    <Text style={styles.detailLabel}>Valor:</Text>
                    <Text style={[styles.detailValue, styles.priceText]}>{`R$ ${booking.totalPrice.toFixed(2).replace('.', ',')}`}</Text>
                </View>

                {booking.notes && (
                    <View style={styles.detailRow}>
                        <Ionicons name="document-text-outline" size={20} color="#6C757D" style={styles.icon} />
                        <Text style={styles.detailLabel}>Observações:</Text>
                        <Text style={styles.detailValue}>{booking.notes}</Text>
                    </View>
                )}
            </Animated.View>
            
            {/* Ações do Agendamento */}
            <Animated.View style={[styles.actionsCard, { opacity: actionsCardAnim, transform: [{ scale: actionsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }] }]}>
                <Text style={styles.sectionTitle}>Ações</Text>
                
                {/* Botão de Cancelar (visível para PENDING e CONFIRMED) */}
                {(booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.PENDING) && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton, { transform: [{ scale: cancelButtonScaleAnim }] }]}
                        onPress={handleCancelBooking}
                        onPressIn={() => onPressInButton(cancelButtonScaleAnim)}
                        onPressOut={() => onPressOutButton(cancelButtonScaleAnim)}
                    >
                        <Ionicons name="close-circle-outline" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Cancelar Agendamento</Text>
                    </TouchableOpacity>
                )}
                
                {/* Botão de Contatar Provedor */}
                <TouchableOpacity
                    style={[styles.actionButton, { transform: [{ scale: contactButtonScaleAnim }] }]}
                    onPress={handleContactProvider}
                    onPressIn={() => onPressInButton(contactButtonScaleAnim)}
                    onPressOut={() => onPressOutButton(contactButtonScaleAnim)}
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Contatar {booking.providerFullName.split(' ')[0]}</Text>
                </TouchableOpacity>

                {/* Botão de Avaliar Serviço (visível apenas se COMPLETED e não avaliado) */}
                {booking.status === BookingStatus.COMPLETED && !isReviewed && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.reviewButton, { transform: [{ scale: reviewButtonScaleAnim }] }]}
                        onPress={handleReviewService}
                        onPressIn={() => onPressInButton(reviewButtonScaleAnim)}
                        onPressOut={() => onPressOutButton(reviewButtonScaleAnim)}
                    >
                        <Ionicons name="star-outline" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Avaliar Serviço</Text>
                    </TouchableOpacity>
                )}
                
                {/* Botão para Ver Perfil do Provedor */}
                <TouchableOpacity
                    style={[styles.actionButtonOutline, { transform: [{ scale: profileButtonScaleAnim }] }]}
                    onPress={handleViewProviderProfile}
                    onPressIn={() => onPressInButton(profileButtonScaleAnim)}
                    onPressOut={() => onPressOutButton(profileButtonScaleAnim)}
                >
                    <Ionicons name="person-circle-outline" size={20} color="#007BFF" />
                    <Text style={[styles.actionButtonText, styles.actionButtonOutlineText]}>Ver Perfil de {booking.providerFullName.split(' ')[0]}</Text>
                </TouchableOpacity>
            </Animated.View>
        </ScrollView>
    );
}

// Estilos gerais da tela
const styles = StyleSheet.create({
    scrollViewContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA', // Light background
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F8F9FA',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6C757D',
    },
    errorText: {
        fontSize: 16,
        color: '#DC3545', // Danger Red
        textAlign: 'center',
        marginBottom: 20,
    },
    panicBannerContainer: {
        marginHorizontal: 15,
        marginTop: 15,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15, // Increased border radius
        padding: 20, // Increased padding
        marginHorizontal: 15,
        marginTop: 15,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.15)', // Darker shadow
                shadowOffset: { width: 0, height: 8 }, // More pronounced shadow
                shadowOpacity: 0.25, // Increased opacity
                shadowRadius: 15, // Larger blur radius
            },
            android: {
                elevation: 10, // Higher elevation
            },
        }),
    },
    providerSectionCard: {
        paddingVertical: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    providerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    providerImage: {
        width: 65, // Larger image
        height: 65, // Larger image
        borderRadius: 32.5, // Perfect circle
        marginRight: 18, // More space
        borderWidth: 3, // More prominent border
        borderColor: '#007BFF', // Primary blue border
    },
    providerInfo: {
        flex: 1,
    },
    serviceNameText: {
        fontSize: 22, // Larger font size
        fontWeight: 'bold',
        color: '#212529', // Darker text
        marginBottom: 4,
    },
    providerNameText: {
        fontSize: 16,
        color: '#495057', // Slightly darker text
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12, // More padding
        paddingVertical: 6, // More padding
        borderRadius: 20, // Pill shape
        marginLeft: 10,
    },
    statusText: {
        fontSize: 13, // Slightly larger
        fontWeight: 'bold',
        marginLeft: 5,
        textTransform: 'uppercase', // Uppercase text
        letterSpacing: 0.5, // Letter spacing
    },
    sectionTitle: {
        fontSize: 19, // Larger font size
        fontWeight: 'bold',
        color: '#343A40', // Darker text
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF', // Lighter border
        paddingBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 14, // More space between rows
    },
    icon: {
        marginRight: 12, // More space
        marginTop: 2,
    },
    detailLabel: {
        fontSize: 15,
        color: '#495057', // Darker text
        fontWeight: '600', // Bolder
        marginRight: 5,
        width: 100,
    },
    detailValue: {
        fontSize: 15,
        color: '#343A40', // Darker text
        flex: 1,
    },
    detailValueAddress: {
        fontSize: 15,
        color: '#343A40',
        flex: 1,
        lineHeight: 22,
    },
    priceText: {
        fontWeight: 'bold',
        color: '#007BFF' // Primary blue for price
    },
    actionsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15, // Consistent border radius
        padding: 20, // Consistent padding
        marginHorizontal: 15,
        marginTop: 15,
        marginBottom: 30,
        ...Platform.select({
            ios: { 
                shadowColor: 'rgba(0,0,0,0.15)', 
                shadowOffset: { width: 0, height: 8 }, 
                shadowOpacity: 0.25, 
                shadowRadius: 15 
            },
            android: { elevation: 10 },
        }),
    },
    actionButton: {
        flexDirection: 'row',
        backgroundColor: '#007BFF', // Primary blue
        paddingVertical: 15, // More padding
        paddingHorizontal: 18, // More padding
        borderRadius: 10, // Softer corners
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12, // More space between buttons
        ...Platform.select({
            ios: { 
                shadowColor: 'rgba(0,123,255,0.4)', // Blue shadow
                shadowOffset: { width: 0, height: 4 }, 
                shadowOpacity: 0.6, 
                shadowRadius: 8 
            },
            android: { elevation: 6 },
        }),
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 17, // Larger font size
        fontWeight: '600',
        marginLeft: 10, // More space
    },
    cancelButton: {
        backgroundColor: '#DC3545', // Danger red
        ...Platform.select({
            ios: { 
                shadowColor: 'rgba(220,53,69,0.4)', 
                shadowOffset: { width: 0, height: 4 }, 
                shadowOpacity: 0.6, 
                shadowRadius: 8 
            },
            android: { elevation: 6 },
        }),
    },
    reviewButton: {
        backgroundColor: '#FFC107', // Warning yellow
        ...Platform.select({
            ios: { 
                shadowColor: 'rgba(255,193,7,0.4)', 
                shadowOffset: { width: 0, height: 4 }, 
                shadowOpacity: 0.6, 
                shadowRadius: 8 
            },
            android: { elevation: 6 },
        }),
    },
    actionButtonOutline: {
        flexDirection: 'row',
        backgroundColor: 'transparent',
        paddingVertical: 15, // Consistent padding
        paddingHorizontal: 18, // Consistent padding
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 2, // More prominent border
        borderColor: '#007BFF', // Primary blue border
        ...Platform.select({
            ios: { 
                shadowColor: 'rgba(0,123,255,0.2)', 
                shadowOffset: { width: 0, height: 2 }, 
                shadowOpacity: 0.4, 
                shadowRadius: 4 
            },
            android: { elevation: 3 },
        }),
    },
    actionButtonOutlineText: {
        color: '#007BFF', // Text color matches border
        marginLeft: 10,
    }
});