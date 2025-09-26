// LimpeJaApp/app/(client)/bookings/index.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Link, Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Image,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Easing,
} from 'react-native';

// Importar utilitários de formatação e normalização
import { formatPriceBRL, formatDateTime, sanitizeText } from '../../../utils/formatters';
import { normalizeBooking } from '../../../utils/normalize'; // Usado para normalizar bookings

import { useAuth } from '../../../hooks/useAuth';
import { getBookingsForUser } from '../../../services/bookingService';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings';
import { AppColors, AppShadows } from '../../../constants/appStyles';

// Assumindo que você tem esses ícones 3D em seus assets
const Icons3D = {
    time: require('../../../assets/images/3d/time.png'),
    check_circle: require('../../../assets/images/3d/check-circle.png'),
    cancel: require('../../../assets/images/3d/cancel.png'),
    trophy: require('../../../assets/images/3d/champions2.png'),
    gear: require('../../../assets/images/3d/time.png'),
    person_default: require('../../../assets/images/default-avatar.png'),
};

// DEFINE O TIPO DE FILTRO GLOBALMENTE PARA CONSISTÊNCIA
type FilterType = 'requests' | 'upcoming' | 'completed' | 'cancelled';

// Helper para traduzir o status do agendamento
const getTranslatedStatus = (status: BookingStatus): string => {
    switch (status) {
        case BookingStatus.CONFIRMED: return 'Confirmado';
        case BookingStatus.PENDING: return 'Pendente';
        case BookingStatus.PENDING_PROVIDER_CONFIRMATION: return 'Aguardando Confirmação';
        case BookingStatus.IN_PROGRESS: return 'Em Andamento';
        case BookingStatus.COMPLETED: return 'Concluído';
        case BookingStatus.CANCELLED: return 'Cancelado';
        case BookingStatus.REJECTED: return 'Rejeitado';
        case BookingStatus.RESCHEDULED: return 'Reagendado';
        case BookingStatus.NO_SHOW: return 'Não Compareceu';
        default: return 'Desconhecido';
    }
};

// Componente para um item da lista de agendamentos com animação de entrada e feedback de toque
const AnimatedBookingItem: React.FC<{ item: BookingDetails; index: number }> = ({ item, index }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;
    const pressScaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const entryAnimation = Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 80,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: index * 80,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]);

        entryAnimation.start(() => {
            const floatLoop = Animated.loop(
                Animated.sequence([
                    Animated.timing(floatAnim, {
                        toValue: 1,
                        duration: 3000 + (index % 3) * 100,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(floatAnim, {
                        toValue: 0,
                        duration: 3000 + (index % 3) * 100,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                { iterations: -1 }
            );
            floatLoop.start();
            return () => floatLoop.stop(); // Cleanup para a animação de flutuação
        });

        return () => entryAnimation.stop(); // Cleanup para a animação de entrada
    }, [fadeAnim, slideAnim, floatAnim, index]);

    const onPressInHandler = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(pressScaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
            friction: 4,
            tension: 80,
        }).start();
    }, [pressScaleAnim]);

    const onPressOutHandler = useCallback(() => {
        Animated.spring(pressScaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 4,
            tension: 80,
        }).start();
    }, [pressScaleAnim]);

    const getStatusStyle = (status: BookingStatus) => {
        switch (status) {
            case BookingStatus.CONFIRMED: return { text: AppColors.successStandard, background: AppColors.successStandard + '20', icon: 'checkmark-circle-outline' as const, iconColor: AppColors.successStandard, badgeIcon: 'checkmark-circle' as const };
            case BookingStatus.PENDING: return { text: AppColors.warningYellow, background: AppColors.warningYellow + '20', icon: 'time-outline' as const, iconColor: AppColors.warningYellow, badgeIcon: 'time' as const };
            case BookingStatus.PENDING_PROVIDER_CONFIRMATION: return { text: AppColors.warningYellow, background: AppColors.warningYellow + '20', icon: 'hourglass-outline' as const, iconColor: AppColors.warningYellow, badgeIcon: 'hourglass' as const };
            case BookingStatus.IN_PROGRESS: return { text: AppColors.primaryInteractive, background: AppColors.primaryInteractive + '20', icon: 'sync-circle-outline' as const, iconColor: AppColors.primaryInteractive, badgeIcon: 'sync' as const };
            case BookingStatus.COMPLETED: return { text: AppColors.textAuxiliary, background: AppColors.textAuxiliary + '20', icon: 'flag-outline' as const, iconColor: AppColors.textAuxiliary, badgeIcon: 'flag' as const };
            case BookingStatus.CANCELLED: return { text: AppColors.errorRed, background: AppColors.errorRed + '20', icon: 'close-circle-outline' as const, iconColor: AppColors.errorRed, badgeIcon: 'close-circle' as const };
            case BookingStatus.REJECTED: return { text: AppColors.textAuxiliary, background: AppColors.textAuxiliary + '20', icon: 'alert-circle-outline' as const, iconColor: AppColors.textAuxiliary, badgeIcon: 'alert-circle' as const };
            case BookingStatus.RESCHEDULED: return { text: '#6F42C1', background: '#EAE6F3', icon: 'sync-outline' as const, iconColor: '#6F42C1', badgeIcon: 'sync' as const };
            case BookingStatus.NO_SHOW: return { text: AppColors.textBody, background: AppColors.textBody + '20', icon: 'person-remove-outline' as const, iconColor: AppColors.textBody, badgeIcon: 'person-remove' as const };
            default: return { text: AppColors.textAuxiliary, background: AppColors.textAuxiliary + '20', icon: 'help-circle-outline' as const, iconColor: AppColors.textAuxiliary, badgeIcon: 'help-circle' as const };
        }
    };

    const statusInfo = getStatusStyle(item.status);

    const getBookingItemMainIcon = (status: BookingStatus, providerAvatarUrl: string | undefined | null) => {
        if (providerAvatarUrl) {
            return <Image source={{ uri: providerAvatarUrl }} style={styles.itemProviderImage} />;
        }

        switch (status) {
            case BookingStatus.PENDING:
            case BookingStatus.PENDING_PROVIDER_CONFIRMATION:
                return <Image source={Icons3D.time} style={styles.itemStatus3DIcon} />;
            case BookingStatus.CONFIRMED:
                return <Image source={Icons3D.check_circle} style={styles.itemStatus3DIcon} />;
            case BookingStatus.CANCELLED:
            case BookingStatus.REJECTED:
                return <Image source={Icons3D.cancel} style={styles.itemStatus3DIcon} />;
            case BookingStatus.COMPLETED:
                return <Image source={Icons3D.trophy} style={styles.itemStatus3DIcon} />;
            case BookingStatus.IN_PROGRESS:
                return <Image source={Icons3D.gear} style={styles.itemStatus3DIcon} />;
            default:
                return <Image source={Icons3D.person_default} style={styles.itemStatus3DIcon} />;
        }
    };

    // Usando sanitizeText para o endereço
    const formattedAddress = item.address ?
        sanitizeText(`${item.address.street}, ${item.address.number}` +
        `${item.address.complement ? ` - ${item.address.complement}` : ''}` +
        `, ${item.address.neighborhood}, ${item.address.city} - ${item.address.state}`)
        : 'Endereço não disponível';

    return (
        <Animated.View style={[
            styles.itemCard,
            {
                opacity: fadeAnim,
                transform: [
                    { translateY: slideAnim },
                    { translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
                    { scale: pressScaleAnim }
                ]
            }
        ]}>
            <Link href={`/(client)/bookings/${item.id}`} asChild>
                <TouchableOpacity
                    style={styles.itemCardContent}
                    onPressIn={onPressInHandler}
                    onPressOut={onPressOutHandler}
                >
                    <View style={styles.itemIconWrapper}>
                        {getBookingItemMainIcon(item.status, item.providerAvatarUrl)}
                    </View>

                    <View style={styles.itemDetails}>
                        <Text style={styles.itemServiceName} numberOfLines={2} maxFontSizeMultiplier={1.2}>{sanitizeText(item.serviceName)}</Text>
                        <Text style={styles.itemProviderName} numberOfLines={2} maxFontSizeMultiplier={1.2}>Com: {sanitizeText(item.providerFullName)}</Text>
                        <Text style={styles.itemDate} maxFontSizeMultiplier={1.2}>
                            <Ionicons name="calendar-outline" size={14} color={AppColors.textAuxiliary} />{' '}
                            {formatDateTime(item.scheduledDate, item.scheduledTime, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {item.address && (
                            <Text style={styles.itemAddressText} numberOfLines={2} maxFontSizeMultiplier={1.2}>
                                <Ionicons name="location-outline" size={14} color={AppColors.textAuxiliary} /> {formattedAddress}
                            </Text>
                        )}
                        <Text style={styles.itemPriceText} maxFontSizeMultiplier={1.2}>
                            <MaterialCommunityIcons name="currency-usd" size={14} color={AppColors.primaryInteractive} />
                            {' '}{formatPriceBRL(item.totalPrice)}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.background }]}>
                        <Ionicons name={statusInfo.badgeIcon} size={12} color={statusInfo.text} style={styles.statusBadgeIcon} />
                        <Text style={[styles.statusText, { color: statusInfo.text }]} maxFontSizeMultiplier={1.2}>{getTranslatedStatus(item.status)}</Text>
                    </View>
                    <Ionicons name="chevron-forward-outline" size={22} color={AppColors.mediumGray} style={styles.itemChevron} />
                </TouchableOpacity>
            </Link>
        </Animated.View>
    );
};

export default function MyBookingsScreen() {
    const router = useRouter();
    const { user } = useAuth(); // user já é normalizado pelo useAuth
    const [bookings, setBookings] = useState<BookingDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('upcoming');

    const filters: Array<{ label: string; value: FilterType; icon: keyof typeof Ionicons.glyphMap }> = [
        { label: 'Solicitações', value: 'requests', icon: 'hourglass-outline' },
        { label: 'Próximos', value: 'upcoming', icon: 'calendar-outline' },
        { label: 'Histórico', value: 'completed', icon: 'checkmark-done-outline' },
        { label: 'Cancelados', value: 'cancelled', icon: 'close-circle-outline' },
    ];

    const filterButtonAnims = useRef(filters.map(() => new Animated.Value(1))).current;
    const contentAnim = useRef(new Animated.Value(0)).current;

    const onPressInFilterButton = useCallback((index: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(filterButtonAnims[index], {
            toValue: 0.9,
            useNativeDriver: true,
            friction: 3,
            tension: 80,
        }).start();
    }, [filterButtonAnims]);

    const onPressOutFilterButton = useCallback(() => {
        filterButtonAnims.forEach((anim) => {
            Animated.spring(anim, {
                toValue: 1,
                useNativeDriver: true,
                friction: 3,
                tension: 80,
            }).start();
        });
    }, [filterButtonAnims]);


    const loadBookings = useCallback(async (currentFilter: FilterType, refreshing: boolean = false) => {
        if (!refreshing) setIsLoading(true);
        setBookings([]);

        Animated.timing(contentAnim, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start(async () => {
            if (!user?.id) {
                console.warn("[MyBookingsScreen] User ID ausente, não foi possível carregar agendamentos.");
                setIsLoading(false);
                setIsRefreshing(false);
                return;
            }

            try {
                let fetchedBookings: BookingDetails[] = [];
                let rawBookings: any[] = [];

                // Centralizando chamadas para evitar duplicação e normalizar
                const getAndNormalize = async (status: BookingStatus) => {
                    const bookings = await getBookingsForUser(status);
                    return bookings.map(normalizeBooking); // Normaliza cada booking
                };

                if (currentFilter === 'requests') {
                    const pendingProvider = await getAndNormalize(BookingStatus.PENDING_PROVIDER_CONFIRMATION);
                    const pendingClient = await getAndNormalize(BookingStatus.PENDING);
                    rawBookings = [...pendingProvider, ...pendingClient];
                } else if (currentFilter === 'upcoming') {
                    const confirmed = await getAndNormalize(BookingStatus.CONFIRMED);
                    const inProgress = await getAndNormalize(BookingStatus.IN_PROGRESS);
                    rawBookings = [...confirmed, ...inProgress];
                } else if (currentFilter === 'completed') {
                    rawBookings = await getAndNormalize(BookingStatus.COMPLETED);
                } else if (currentFilter === 'cancelled') {
                    const canceled = await getAndNormalize(BookingStatus.CANCELLED);
                    const rejected = await getAndNormalize(BookingStatus.REJECTED);
                    rawBookings = [...canceled, ...rejected];
                }

                // Filtragem de data/hora após normalização
                const now = new Date();
                const filteredAndSortedBookings = rawBookings
                    .filter(b => {
                        const bookingDateTime = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
                        if (currentFilter === 'requests' || currentFilter === 'upcoming') {
                            return bookingDateTime >= now;
                        }
                        if (currentFilter === 'completed') {
                            return bookingDateTime < now;
                        }
                        return true; // Para 'cancelled', não filtra por data
                    })
                    .sort((a, b) => {
                        const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`).getTime();
                        const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`).getTime();
                        return dateA - dateB;
                    });

                setBookings(filteredAndSortedBookings);
                if (refreshing) Alert.alert("Sucesso", "Agendamentos atualizados!");

            } catch (err: any) {
                console.error("Erro ao buscar agendamentos:", err.response?.data || err.message);
                Alert.alert("Erro", sanitizeText(err.response?.data?.message || "Não foi possível carregar seus agendamentos."));
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
                Animated.timing(contentAnim, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }).start();
            }
        });
    }, [user?.id, contentAnim]);

    useEffect(() => {
        loadBookings(activeFilter);
    }, [activeFilter, loadBookings]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadBookings(activeFilter, true);
    }, [activeFilter, loadBookings]);

    const handleFilterChange = (newFilter: FilterType) => {
        if (newFilter === activeFilter) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setActiveFilter(newFilter);
    };

    const EmptyListFeedback = () => {
        const iconAnim = useRef(new Animated.Value(0)).current;
        const textAnim = useRef(new Animated.Value(0)).current;
        const subTextAnim = useRef(new Animated.Value(0)).current;
        const buttonAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            const entryAnimation = Animated.stagger(150, [
                Animated.parallel([
                    Animated.timing(iconAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                    Animated.timing(iconAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(textAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                    Animated.timing(textAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(subTextAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                    Animated.timing(subTextAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(buttonAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                    Animated.timing(buttonAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                ]),
            ]);
            entryAnimation.start();
            return () => entryAnimation.stop(); // Cleanup da animação
        }, []);

        let title = "Nenhum agendamento encontrado.";
        let subText = "Ajuste o filtro ou verifique mais tarde.";
        let ctaButton = null;
        let iconName: keyof typeof Ionicons.glyphMap = 'help-circle-outline';

        if (activeFilter === 'requests') {
            title = "Nenhuma solicitação de agendamento.";
            subText = "Parece que você não fez nenhum pedido pendente ainda.";
            iconName = 'hourglass-outline';
            ctaButton = (
                <Animated.View style={{ opacity: buttonAnim, transform: [{ scale: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }}>
                    <TouchableOpacity style={styles.emptyStateButton} onPress={() => router.push('/(client)/explore/todas-categorias' as any)}>
                        <Ionicons name="search-outline" size={20} color={AppColors.white} />
                        <Text style={styles.emptyStateButtonText} maxFontSizeMultiplier={1.2}>Explorar Categorias</Text>
                    </TouchableOpacity>
                </Animated.View>
            );
        } else if (activeFilter === 'upcoming') {
            title = "Você não tem serviços futuros agendados.";
            subText = "Explore e agende novos serviços para vê-los aqui!";
            iconName = 'calendar-outline';
            ctaButton = (
                <Animated.View style={{ opacity: buttonAnim, transform: [{ scale: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }}>
                    <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(client)/explore' as any)}>
                        <Text style={styles.exploreButtonText} maxFontSizeMultiplier={1.2}>Explorar Serviços</Text>
                    </TouchableOpacity>
                </Animated.View>
            );
        } else if (activeFilter === 'completed') {
            title = "Seu histórico de serviços está vazio.";
            subText = "Comece a agendar e concluir serviços para vê-los aqui!";
            iconName = 'archive-outline';
        } else if (activeFilter === 'cancelled') {
            title = "Nenhum serviço cancelado.";
            subText = "Serviços cancelados ou recusados aparecerão aqui.";
            iconName = 'close-circle-outline';
        }

        return (
            <View style={styles.centeredFeedback}>
                <Animated.View style={{ opacity: iconAnim, transform: [{ scale: iconAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }}>
                    <Ionicons name={iconName} size={64} color={AppColors.backgroundNeutral} />
                </Animated.View>
                <Animated.Text style={[styles.emptyText, { opacity: textAnim, transform: [{ translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]} maxFontSizeMultiplier={1.2}>
                    {title}
                </Animated.Text>
                <Animated.Text style={[styles.emptySubText, { opacity: subTextAnim, transform: [{ translateY: subTextAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]} maxFontSizeMultiplier={1.2}>
                    {subText}
                </Animated.Text>
                {ctaButton}
            </View>
        );
    };


    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Meus Agendamentos' }} />

            <View style={styles.filterContainer}>
                {filters.map((filterItem, index) => (
                    <Animated.View key={filterItem.value} style={{ transform: [{ scale: filterButtonAnims[index] }] }}>
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                activeFilter === filterItem.value && styles.filterButtonActive
                            ]}
                            onPress={() => handleFilterChange(filterItem.value)}
                            onPressIn={() => onPressInFilterButton(index)}
                            onPressOut={onPressOutFilterButton}
                        >
                            <Ionicons
                                name={filterItem.icon}
                                size={18}
                                color={activeFilter === filterItem.value ? AppColors.white : AppColors.textAuxiliary}
                                style={styles.filterIcon}
                            />
                            <Text style={[
                                styles.filterButtonText,
                                activeFilter === filterItem.value && styles.filterButtonTextActive
                            ]} maxFontSizeMultiplier={1.2}>
                                {filterItem.label}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>

            {isLoading && bookings.length === 0 ? (
                <View style={styles.centeredFeedback}>
                    <ActivityIndicator size="large" color={AppColors.primaryInteractive} />
                    <Text style={styles.loadingText} maxFontSizeMultiplier={1.2}>Carregando agendamentos...</Text>
                </View>
            ) : bookings.length > 0 ? (
                <Animated.FlatList
                    data={bookings}
                    renderItem={({ item, index }) => <AnimatedBookingItem item={item} index={index} />}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContentContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={AppColors.primaryInteractive}
                            title="Atualizando agendamentos..."
                            titleColor={AppColors.primaryInteractive}
                        />
                    }
                    style={{ opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}
                />
            ) : (
                <EmptyListFeedback />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppColors.backgroundLight,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 10,
        backgroundColor: AppColors.white,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.backgroundNeutral,
        ...AppShadows.medium,
    },
    filterButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 25,
        marginHorizontal: 5,
        backgroundColor: AppColors.backgroundNeutral,
        borderWidth: 1,
        borderColor: AppColors.borderNeutral
    },
    filterButtonActive: {
        backgroundColor: AppColors.primaryInteractive,
        borderColor: AppColors.primaryInteractive,
        ...Platform.select({
            ios: {
                shadowColor: AppColors.primaryInteractive + '40',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.6,
                shadowRadius: 4
            },
            android: { elevation: 6 },
        }),
    },
    filterIcon: {
        marginRight: 6,
    },
    filterButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: AppColors.textAuxiliary,
        fontFamily: 'Montserrat-Regular',
    },
    filterButtonTextActive: {
        color: AppColors.white,
        fontFamily: 'Montserrat-Regular',
    },
    listContentContainer: {
        paddingVertical: 15,
        paddingHorizontal: 15,
    },
    itemCard: {
        backgroundColor: AppColors.white,
        borderRadius: 12,
        marginBottom: 15,
        overflow: 'hidden',
        ...AppShadows.large,
    },
    itemCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    itemIconWrapper: {
        width: 55,
        height: 55,
        borderRadius: 27.5,
        marginRight: 15,
        backgroundColor: AppColors.backgroundLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: AppColors.backgroundNeutral,
        overflow: 'hidden',
    },
    itemProviderImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    itemStatus3DIcon: {
        width: 55,
        height: 55,
        resizeMode: 'contain',
    },
    itemDetails: {
        flex: 1,
    },
    itemServiceName: {
        fontSize: 16,
        fontWeight: '700',
        color: AppColors.textBody,
        marginBottom: 6,
        fontFamily: 'Montserrat-Regular',
    },
    itemProviderName: {
        fontSize: 14,
        color: AppColors.textAuxiliary,
        marginBottom: 8,
        fontFamily: 'Montserrat-Regular',
    },
    itemDate: {
        fontSize: 14,
        color: AppColors.textAuxiliary,
        marginBottom: 4,
        fontFamily: 'Montserrat-Regular',
    },
    itemAddressText: {
        fontSize: 14,
        color: AppColors.textAuxiliary,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        fontFamily: 'Montserrat-Regular',
    },
    itemPriceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AppColors.primaryInteractive,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        fontFamily: 'Montserrat-Regular',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginLeft: 10,
        alignSelf: 'flex-start',
    },
    statusBadgeIcon: {
        marginRight: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
        fontFamily: 'Montserrat-Regular',
    },
    itemChevron: {
        marginLeft: 8,
    },
    centeredFeedback: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: AppColors.backgroundLight,
    },
    loadingText: {
        fontSize: 16,
        color: AppColors.textAuxiliary,
        fontFamily: 'Montserrat-Regular',
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '700',
        color: AppColors.textBody,
        textAlign: 'center',
        marginBottom: 10,
        fontFamily: 'Montserrat-Regular',
    },
    emptySubText: {
        fontSize: 15,
        color: AppColors.textAuxiliary,
        textAlign: 'center',
        marginBottom: 25,
        fontFamily: 'Montserrat-Regular',
    },
    emptyStateButton: {
        backgroundColor: AppColors.primaryInteractive,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        ...AppShadows.medium,
    },
    emptyStateButtonText: {
        color: AppColors.white,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
        fontFamily: 'Montserrat-Regular',
    },
    exploreButton: {
        backgroundColor: AppColors.successStandard,
        paddingVertical: 14,
        paddingHorizontal: 35,
        borderRadius: 30,
        marginTop: 15,
        ...AppShadows.medium,
    },
    exploreButtonText: {
        color: AppColors.white,
        fontSize: 17,
        fontWeight: '700',
        fontFamily: 'Montserrat-Regular',
    }
});