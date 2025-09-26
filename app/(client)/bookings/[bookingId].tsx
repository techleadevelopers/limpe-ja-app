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
    View,
    Easing
} from 'react-native';

// Importar utilitários de formatação e normalização
import { formatPriceBRL, formatDateTime, sanitizeText } from '../../../utils/formatters';
import { normalizeBooking } from '../../../utils/normalize';

// --- IMPORTAÇÕES DE SERVIÇOS E TIPAGENS DO SEU BACKEND REAL ---
import { cancelBooking, getBookingDetails } from '../../../services/bookingService';

import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';
import { AppColors, AppShadows } from '../../../constants/appStyles';

export default function BookingDetailsScreen() {
    const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
    const router = useRouter();

    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [panicStatus, setPanicStatus] = useState<'IDLE'|'RECEIVED'|'ACKED'|'DISPATCHED'|'CLOSED'>('IDLE');

    const providerSectionAnim = useRef(new Animated.Value(0)).current;
    const detailsCardAnim = useRef(new Animated.Value(0)).current;
    const actionsCardAnim = useRef(new Animated.Value(0)).current;

    const cancelButtonScaleAnim = useRef(new Animated.Value(1)).current;
    const contactButtonScaleAnim = useRef(new Animated.Value(1)).current;
    const reviewButtonScaleAnim = useRef(new Animated.Value(1)).current;
    const profileButtonScaleAnim = useRef(new Animated.Value(1)).current;

    const providerFloatAnim = useRef(new Animated.Value(0)).current;
    const detailsFloatAnim = useRef(new Animated.Value(0)).current;
    const actionsFloatAnim = useRef(new Animated.Value(0)).current;

    // Função para criar e iniciar uma animação de flutuação em loop
    const createAndStartFloatAnimation = useCallback((animValue: Animated.Value) => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(animValue, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(animValue, {
                    toValue: 0,
                    duration: 3000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
            { iterations: -1 }
        );
        loop.start();
        return loop; // Retorna a instância da animação para que possa ser parada
    }, []);

    // useCallback para a função de buscar detalhes do agendamento
    const fetchBooking = useCallback(async () => {
        if (!bookingId) {
            setError("ID do agendamento não fornecido.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const rawData = await getBookingDetails(bookingId);
            const data = normalizeBooking(rawData); // Normaliza os dados
            setBooking(data);

            // Inicia as animações de entrada após os dados serem carregados
            // Não retorna o cleanup das flutuações aqui, será feito no useEffect principal
            Animated.stagger(150, [
                Animated.parallel([
                    Animated.timing(providerSectionAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                    Animated.timing(providerSectionAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(detailsCardAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                    Animated.timing(detailsCardAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(actionsCardAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                    Animated.timing(actionsCardAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                ]),
            ]).start();

        } catch (err: any) {
            console.error("[BookingDetailsScreen] Erro ao buscar detalhes do agendamento:", err);
            setError(sanitizeText(err.message || "Não foi possível carregar os detalhes do agendamento."));
        } finally {
            setIsLoading(false);
        }
    }, [bookingId, providerSectionAnim, detailsCardAnim, actionsCardAnim]);

    // Efeito para chamar fetchBooking quando o componente monta ou bookingId muda
    useEffect(() => {
        // Chama a função assíncrona, mas não usa seu retorno como cleanup
        fetchBooking();

        // Inicia as animações de flutuação e retorna suas funções de stop para cleanup
        const providerLoop = createAndStartFloatAnimation(providerFloatAnim);
        const detailsTimeout = setTimeout(() => {
            const detailsLoop = createAndStartFloatAnimation(detailsFloatAnim);
            return () => detailsLoop.stop();
        }, 100);
        const actionsTimeout = setTimeout(() => {
            const actionsLoop = createAndStartFloatAnimation(actionsFloatAnim);
            return () => actionsLoop.stop();
        }, 200);

        return () => {
            providerLoop.stop();
            clearTimeout(detailsTimeout);
            clearTimeout(actionsTimeout);
            // As animações de entrada (providerSectionAnim, etc.) não precisam de stop explícito aqui
            // pois elas são de "one-shot" e já terminaram ou estão terminando.
        };
    }, [fetchBooking, createAndStartFloatAnimation, providerFloatAnim, detailsFloatAnim, actionsFloatAnim]); // Adicionadas dependências

    const onPressInButton = (animValue: Animated.Value) => {
        Animated.spring(animValue, {
            toValue: 0.96,
            useNativeDriver: true,
            friction: 3,
            tension: 100,
        }).start();
    };

    const onPressOutButton = (animValue: Animated.Value) => {
        Animated.spring(animValue, {
            toValue: 1,
            friction: 3,
            tension: 100,
            useNativeDriver: true,
        }).start();
    };

    const handleCancelBooking = async () => {
        if (!booking) return;
        Alert.alert(
            "Cancelar Agendamento",
            "Tem certeza que deseja cancelar este agendamento? Esta ação pode estar sujeita a taxas dependendo da política de cancelamento.",
            [
                { text: "Não", style: "cancel" },
                {
                    text: "Sim, Cancelar",
                    onPress: async () => {
                        console.log("[BookingDetailsScreen] Cancelando agendamento:", booking.id);
                        setIsLoading(true);
                        try {
                            await cancelBooking(booking.id);
                            Alert.alert("Sucesso", "Agendamento cancelado com sucesso!");
                            setBooking(prev => prev ? { ...prev, status: BookingStatus.CANCELLED } : null);
                        } catch (err: any) {
                            console.error("[BookingDetailsScreen] Erro ao cancelar agendamento:", err);
                            Alert.alert("Erro", sanitizeText(err.message || "Não foi possível cancelar o agendamento."));
                        } finally {
                            setIsLoading(false);
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const handleContactProvider = () => {
        if (!booking) return;
        router.push({
            pathname: '/(client)/messages',
            params: {
                providerId: booking.providerId,
                bookingId: booking.id,
                recipientName: sanitizeText(booking.providerFullName),
            },
        });
    };

    const handleReviewService = () => {
        if (!booking) return;
        router.push({
            pathname: '/(common)/feedback/[targetId]',
            params: {
                targetId: booking.id,
                type: 'service',
                serviceName: sanitizeText(booking.serviceName),
                providerName: sanitizeText(booking.providerFullName),
                providerId: booking.providerId,
            },
        });
    };

    const handleViewProviderProfile = () => {
        if (!booking) return;
        router.push({
            pathname: '/(client)/explore/[providerId]',
            params: {
                providerId: booking.providerId,
            },
        });
    };

    const handlePanic = useCallback(() => {
        Alert.alert(
            "Acionar Botão de Pânico",
            "Você tem certeza que deseja acionar o botão de pânico? Nossa equipe de segurança será notificada imediatamente.",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Acionar", onPress: () => {
                    setPanicStatus('RECEIVED');
                    setTimeout(() => setPanicStatus('ACKED'), 3000);
                    setTimeout(() => setPanicStatus('DISPATCHED'), 6000);
                    setTimeout(() => setPanicStatus('CLOSED'), 10000);
                    console.log("Botão de pânico acionado!");
                }, style: "destructive" }
            ]
        );
    }, []);

    const getStatusStyle = (status: BookingStatus) => {
        switch (status) {
            case BookingStatus.CONFIRMED:
                return { text: "CONFIRMADO", color: AppColors.successStandard, icon: 'checkmark-circle-outline' as const, badgeBg: AppColors.successStandard + '20' };
            case BookingStatus.PENDING:
                return { text: "PENDENTE", color: AppColors.warningYellow, icon: 'time-outline' as const, badgeBg: AppColors.warningYellow + '20' };
            case BookingStatus.PENDING_PROVIDER_CONFIRMATION:
                return { text: "AGUARDANDO PROVEDOR", color: AppColors.warningYellow, icon: 'hourglass-outline' as const, badgeBg: AppColors.warningYellow + '20' };
            case BookingStatus.IN_PROGRESS:
                return { text: "EM ANDAMENTO", color: AppColors.primaryInteractive, icon: 'sync-circle-outline' as const, badgeBg: AppColors.primaryInteractive + '20' };
            case BookingStatus.COMPLETED:
                return { text: "CONCLUÍDO", color: AppColors.textAuxiliary, icon: 'flag-outline' as const, badgeBg: AppColors.textAuxiliary + '20' };
            case BookingStatus.CANCELLED:
                return { text: "CANCELADO", color: AppColors.errorRed, icon: 'close-circle-outline' as const, badgeBg: AppColors.errorRed + '20' };
            case BookingStatus.REJECTED:
                return { text: "REJEITADO", color: AppColors.textAuxiliary, icon: 'alert-circle-outline' as const, badgeBg: AppColors.textAuxiliary + '20' };
            case BookingStatus.RESCHEDULED:
                return { text: "REAGENDADO", color: '#6F42C1', icon: 'sync-outline' as const, badgeBg: '#EAE6F3' };
            case BookingStatus.NO_SHOW:
                return { text: "NÃO COMPARECEU", color: AppColors.textBody, icon: 'person-remove-outline' as const, badgeBg: AppColors.textBody + '20' };
            default:
                return { text: "DESCONHECIDO", color: AppColors.mediumGray, icon: 'help-circle-outline' as const, badgeBg: AppColors.backgroundNeutral };
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ title: "Carregando..." }} />
                <ActivityIndicator size="large" color={AppColors.primaryInteractive} />
                <Text style={styles.loadingText} maxFontSizeMultiplier={1.2}>Carregando detalhes do agendamento...</Text>
            </View>
        );
    }

    if (error || !booking) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ title: "Erro" }} />
                <Ionicons name="alert-circle-outline" size={48} color={AppColors.errorRed} />
                <Text style={styles.errorText} maxFontSizeMultiplier={1.2}>{error || `Agendamento "${bookingId}" não encontrado.`}</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.actionButton}>
                    <Text style={styles.actionButtonText} maxFontSizeMultiplier={1.2}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isReviewed = !!booking.reviewId;
    const statusInfo = getStatusStyle(booking.status);

    return (
        <ScrollView style={styles.scrollViewContainer}>
            <Stack.Screen options={{ title: `Detalhes do Serviço` }} />

            <Animated.View style={[
                styles.card,
                styles.providerSectionCard,
                {
                    opacity: providerSectionAnim,
                    transform: [
                        { translateY: providerSectionAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                        { scale: providerSectionAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
                        { translateY: providerFloatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }
                    ]
                }
            ]}>
                <View style={styles.providerSection}>
                    {booking.providerAvatarUrl &&
                        <Image source={{ uri: booking.providerAvatarUrl }} style={styles.providerImage} />
                    }
                    <View style={styles.providerInfo}>
                        <Text style={styles.serviceNameText} numberOfLines={2} maxFontSizeMultiplier={1.2}>{sanitizeText(booking.serviceName)}</Text>
                        <Text style={styles.providerNameText} numberOfLines={2} maxFontSizeMultiplier={1.2}>com {sanitizeText(booking.providerFullName)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.badgeBg }]}>
                        <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
                        <Text style={[styles.statusText, { color: statusInfo.color }]} maxFontSizeMultiplier={1.2}>{statusInfo.text}</Text>
                    </View>
                </View>
            </Animated.View>

            <Animated.View style={[
                styles.card,
                {
                    opacity: detailsCardAnim,
                    transform: [
                        { scale: detailsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
                        { translateY: detailsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                        { translateY: detailsFloatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }
                    ]
                }
            ]}>
                <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>Detalhes do Agendamento</Text>

                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={20} color={AppColors.textAuxiliary} style={styles.icon} />
                    <Text style={styles.detailLabel} maxFontSizeMultiplier={1.2}>Data e Hora:</Text>
                    <Text style={styles.detailValue} maxFontSizeMultiplier={1.2}>
                        {formatDateTime(booking.scheduledDate, booking.scheduledTime, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={20} color={AppColors.textAuxiliary} style={styles.icon} />
                    <Text style={styles.detailLabel} maxFontSizeMultiplier={1.2}>Endereço:</Text>
                    <Text style={styles.detailValueAddress} maxFontSizeMultiplier={1.2}>
                        {sanitizeText(`${booking.address.street}, ${booking.address.number}`)}
                        {booking.address.complement ? sanitizeText(`, ${booking.address.complement}`) : ''}
                        {sanitizeText(`\n${booking.address.neighborhood}, ${booking.address.city}-${booking.address.state}`)}
                        {sanitizeText(`\nCEP: ${booking.address.cep}`)}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={20} color={AppColors.textAuxiliary} style={styles.icon} />
                    <Text style={styles.detailLabel} maxFontSizeMultiplier={1.2}>Valor:</Text>
                    <Text style={[styles.detailValue, styles.priceText]} maxFontSizeMultiplier={1.2}>{formatPriceBRL(booking.totalPrice)}</Text>
                </View>

                {booking.notes && (
                    <View style={styles.detailRow}>
                        <Ionicons name="document-text-outline" size={20} color={AppColors.textAuxiliary} style={styles.icon} />
                        <Text style={styles.detailLabel} maxFontSizeMultiplier={1.2}>Observações:</Text>
                        <Text style={styles.detailValue} maxFontSizeMultiplier={1.2}>{sanitizeText(booking.notes)}</Text>
                    </View>
                )}
            </Animated.View>

            <Animated.View style={[
                styles.actionsCard,
                {
                    opacity: actionsCardAnim,
                    transform: [
                        { scale: actionsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
                        { translateY: actionsCardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                        { translateY: actionsFloatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }) }
                    ]
                }
            ]}>
                <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>Ações</Text>

                {(booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.PENDING) && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton, { transform: [{ scale: cancelButtonScaleAnim }] }]}
                        onPress={handleCancelBooking}
                        onPressIn={() => onPressInButton(cancelButtonScaleAnim)}
                        onPressOut={() => onPressOutButton(cancelButtonScaleAnim)}
                    >
                        <Ionicons name="close-circle-outline" size={20} color={AppColors.white} />
                        <Text style={styles.actionButtonText} maxFontSizeMultiplier={1.2}>Cancelar Agendamento</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.actionButton, { transform: [{ scale: contactButtonScaleAnim }] }]}
                    onPress={handleContactProvider}
                    onPressIn={() => onPressInButton(contactButtonScaleAnim)}
                    onPressOut={() => onPressOutButton(contactButtonScaleAnim)}
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color={AppColors.white} />
                    <Text style={styles.actionButtonText} maxFontSizeMultiplier={1.2}>Contatar {sanitizeText(booking.providerFullName.split(' ')[0])}</Text>
                </TouchableOpacity>

                {booking.status === BookingStatus.COMPLETED && !isReviewed && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.reviewButton, { transform: [{ scale: reviewButtonScaleAnim }] }]}
                        onPress={handleReviewService}
                        onPressIn={() => onPressInButton(reviewButtonScaleAnim)}
                        onPressOut={() => onPressOutButton(reviewButtonScaleAnim)}
                    >
                        <Ionicons name="star-outline" size={20} color={AppColors.white} />
                        <Text style={styles.actionButtonText} maxFontSizeMultiplier={1.2}>Avaliar Serviço</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.actionButtonOutline, { transform: [{ scale: profileButtonScaleAnim }] }]}
                    onPress={handleViewProviderProfile}
                    onPressIn={() => onPressInButton(profileButtonScaleAnim)}
                    onPressOut={() => onPressOutButton(profileButtonScaleAnim)}
                >
                    <Ionicons name="person-circle-outline" size={20} color={AppColors.primaryInteractive} />
                    <Text style={[styles.actionButtonText, styles.actionButtonOutlineText]} maxFontSizeMultiplier={1.2}>Ver Perfil de {sanitizeText(booking.providerFullName.split(' ')[0])}</Text>
                </TouchableOpacity>
            </Animated.View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollViewContainer: {
        flex: 1,
        backgroundColor: AppColors.backgroundLight,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: AppColors.backgroundLight,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: AppColors.textAuxiliary,
        fontFamily: 'Montserrat-Regular',
    },
    errorText: {
        fontSize: 16,
        color: AppColors.errorRed,
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: 'Montserrat-Regular',
    },
    panicBannerContainer: {
        marginHorizontal: 15,
        marginTop: 15,
    },
    card: {
        backgroundColor: AppColors.white,
        borderRadius: 15,
        padding: 20,
        marginHorizontal: 15,
        marginTop: 15,
        ...AppShadows.large,
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
        width: 65,
        height: 65,
        borderRadius: 32.5,
        marginRight: 18,
        borderWidth: 3,
        borderColor: AppColors.primaryInteractive,
    },
    providerInfo: {
        flex: 1,
    },
    serviceNameText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: AppColors.textBody,
        marginBottom: 4,
        fontFamily: 'Montserrat-Regular',
    },
    providerNameText: {
        fontSize: 16,
        color: AppColors.textAuxiliary,
        fontFamily: 'Montserrat-Regular',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginLeft: 10,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 13,
        fontWeight: 'bold',
        marginLeft: 5,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontFamily: 'Montserrat-Regular',
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: 'bold',
        color: AppColors.textBody,
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.backgroundNeutral,
        paddingBottom: 8,
        fontFamily: 'Montserrat-Regular',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    icon: {
        marginRight: 12,
        marginTop: 2,
    },
    detailLabel: {
        fontSize: 15,
        color: AppColors.textAuxiliary,
        fontWeight: '600',
        marginRight: 5,
        width: 100,
        fontFamily: 'Montserrat-Regular',
    },
    detailValue: {
        fontSize: 15,
        color: AppColors.textBody,
        flex: 1,
        fontFamily: 'Montserrat-Regular',
    },
    detailValueAddress: {
        fontSize: 15,
        color: AppColors.textBody,
        flex: 1,
        lineHeight: 22,
        fontFamily: 'Montserrat-Regular',
    },
    priceText: {
        fontWeight: 'bold',
        color: AppColors.primaryInteractive,
        fontFamily: 'Montserrat-Regular',
    },
    actionsCard: {
        backgroundColor: AppColors.white,
        borderRadius: 15,
        padding: 20,
        marginHorizontal: 15,
        marginTop: 15,
        marginBottom: 30,
        ...AppShadows.large,
    },
    actionButton: {
        flexDirection: 'row',
        backgroundColor: AppColors.primaryInteractive,
        paddingVertical: 15,
        paddingHorizontal: 18,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        ...AppShadows.medium,
    },
    actionButtonText: {
        color: AppColors.white,
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 10,
        fontFamily: 'Montserrat-Regular',
    },
    cancelButton: {
        backgroundColor: AppColors.errorRed,
        ...Platform.select({
            ios: {
                shadowColor: AppColors.errorRed + '40',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.6,
                shadowRadius: 8
            },
            android: { elevation: 6 },
        }),
    },
    reviewButton: {
        backgroundColor: AppColors.warningYellow,
        ...Platform.select({
            ios: {
                shadowColor: AppColors.warningYellow + '40',
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
        paddingVertical: 15,
        paddingHorizontal: 18,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: AppColors.primaryInteractive,
        ...AppShadows.small,
    },
    actionButtonOutlineText: {
        color: AppColors.primaryInteractive,
        marginLeft: 10,
        fontFamily: 'Montserrat-Regular',
    },
    iconCircleBackground: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: AppColors.accentLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    iconImage: {
        width: 24,
        height: 24,
        resizeMode: 'contain',
    },
});