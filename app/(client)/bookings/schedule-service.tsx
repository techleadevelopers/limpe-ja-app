// LimpeJaApp/app/(client)/bookings/schedule-service.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
    Image,
    Dimensions,
    ActivityIndicator,
    FlatList,
    Animated,
    Easing,
    TextInput // Adicionado para demonstração de feedback em input
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// --- IMPORTAÇÕES DE SERVIÇOS E TIPAGENS DO SEU BACKEND REAL ---
import { getProviderAvailability, getProviderDetails } from '../../services/providerService';
import { createBooking } from '../../services/bookingService';
import { useAuth } from '../../../hooks/useAuth';

// Tipagens do seu backend original
import {
    ProviderDisplayInfo,
    ProviderAvailability,
    ProviderServiceOffering,
    ServiceDetailsDto,
    VerificationStatus,
} from '../../types/backend/providers';
import { CreateBookingDto, BookingAddress, BookingDetails } from '../../types/backend/bookings';

// Importar formatDate de utils/helpers
import { formatDate } from '../../../utils/helpers';

// --- Importar novos componentes de UI ---
import CalendarHeader from './components/schedule/CalendarHeader';
import TimeSlotButton from './components/schedule/TimeSlotButton';
import TimeSlotsSection from './components/schedule/TimeSlotsSection';

// --- Constantes para a UI ---
const SCREEN_WIDTH = Dimensions.get('window').width;
const MONTH_NAMES_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DAY_NAMES_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

// Cache para disponibilidade do provedor por data
const availabilityCache = new Map<string, { available: ProviderAvailability[], occupiedTimes: string[] }>();

export default function ScheduleServiceScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { providerId: paramProviderId, serviceId: paramServiceId } = useLocalSearchParams<{ providerId?: string; serviceId?: string }>();

    // --- ESTADOS ---
    const [provider, setProvider] = useState<ProviderDisplayInfo | null>(null);
    const [selectedProviderService, setSelectedProviderService] = useState<ProviderServiceOffering | null>(null);
    const [availableSlots, setAvailableSlots] = useState<ProviderAvailability[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [address, setAddress] = useState<BookingAddress>({
        street: '',
        number: '',
        complement: null,
        neighborhood: '',
        city: '',
        state: '',
        cep: ''
    });
    const [notes, setNotes] = useState<string>('');

    const [isLoading, setIsLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);
    const [isFetchingSlots, setIsFetchingSlots] = useState(false);

    // --- ESTADOS DA NOVA UI (para calendário, animações etc.) ---
    const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date());
    const shineAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.3)).current;
    const [calendarDays, setCalendarDays] = useState<Array<{ day: number, month: 'current' | 'prev' | 'next', dateObj: Date }>>([]);

    const [displaySlotsInfo, setDisplaySlotsInfo] = useState<
        Array<{ time: string; isAvailable: boolean }>
    >([]);

    // Animação para feedback ao selecionar data/hora
    const selectionAnim = useRef(new Animated.Value(1)).current;

    // Estado para controlar o skeleton do provedor
    const [isProviderLoading, setIsProviderLoading] = useState(true);
    // Estado para controlar o skeleton do endereço
    const [isAddressLoading, setIsAddressLoading] = useState(true);

    const renderStars = useCallback((rating: number | undefined) => {
        const stars = [];
        const actualRating = rating ?? 0;
        const fullStars = Math.floor(actualRating);
        const hasHalfStar = (actualRating * 2) % 2 !== 0;

        for (let i = 0; i < 5; i++) {
            let iconName: keyof typeof Ionicons.glyphMap = 'star-outline';
            if (i < fullStars) iconName = 'star';
            else if (hasHalfStar && i === fullStars) iconName = 'star-half-sharp';

            stars.push(
                <Ionicons
                    key={i}
                    name={iconName}
                    size={16}
                    color="#4A90E2"
                    style={styles.ratingStarIcon}
                />
            );
        }
        return <View style={styles.ratingStarContainer}>{stars}</View>;
    }, []);

    const renderInfoChip = useCallback((iconName: keyof typeof Ionicons.glyphMap, text: string, isVerified?: boolean) => {
        return (
            <View style={[styles.infoChip, isVerified && styles.infoChipVerified]}>
                <Ionicons name={iconName} size={16} color={isVerified ? '#2A72E7' : '#555'} />
                <Text style={[styles.infoChipText, isVerified && styles.infoChipTextVerified]}>{text}</Text>
            </View>
        );
    }, []);

    // --- FUNÇÕES DE CALENDÁRIO (MOVidas para cima) ---
    const handlePrevMonth = useCallback(() => {
        setCurrentDisplayMonth(prev => {
            const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
            // Pré-carrega o mês anterior no cache
            prefetchAvailability(provider?.id, newDate);
            return newDate;
        });
    }, [provider?.id]);

    const handleNextMonth = useCallback(() => {
        setCurrentDisplayMonth(prev => {
            const newDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
            // Pré-carrega o mês seguinte no cache
            prefetchAvailability(provider?.id, newDate);
            return newDate;
        });
    }, [provider?.id]);

    const handleDaySelect = useCallback((dateObj: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dateObj < today) {
            Alert.alert("Data Inválida", "Não é possível selecionar uma data passada.");
            return;
        }
        setSelectedDate(dateObj);
        // Animação ao selecionar o dia
        Animated.sequence([
            Animated.timing(selectionAnim, { toValue: 1.1, duration: 100, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
            Animated.spring(selectionAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
        ]).start();
    }, [selectionAnim]);

    const handleTimeSelect = useCallback((time: string) => {
        const selectedSlot = displaySlotsInfo.find(slot => slot.time === time);
        if (selectedSlot?.isAvailable) {
            setSelectedTime(time);
            // Animação ao selecionar o horário
            Animated.sequence([
                Animated.timing(selectionAnim, { toValue: 1.05, duration: 80, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
                Animated.spring(selectionAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
            ]).start();
        } else {
            Alert.alert("Horário Indisponível", "Este horário já está agendado ou não disponível. Por favor, selecione outro.");
        }
    }, [displaySlotsInfo, selectionAnim]);

    const copyToClipboard = useCallback(async (text: string) => {
        if (!text) return;
        await Clipboard.setStringAsync(text);
        Alert.alert("Copiado!", "Chave PIX copiada para a área de transferência.");
    }, []);

    const handleConfirmBooking = useCallback(async () => {
        if (
            !user?.id ||
            !provider?.id ||
            !selectedProviderService?.id ||
            !selectedDate ||
            !selectedTime ||
            !address.street ||
            !address.number ||
            !address.neighborhood || !address.city || !address.state ||
            !selectedProviderService
        ) {
            Alert.alert("Erro", "Por favor, preencha todos os campos necessários para o agendamento, incluindo o endereço completo e selecione um horário.");
            return;
        }

        setIsBooking(true);
        try {
            const bookingData: CreateBookingDto = {
                providerId: provider.id,
                providerServiceId: selectedProviderService.id,
                scheduledDate: selectedDate.toISOString().split('T')[0],
                scheduledTime: selectedTime,
                totalPrice: selectedProviderService.price,
                notes: notes,
                address: address,
            };

            const newBooking: BookingDetails = await createBooking(bookingData);

            router.replace({
                pathname: '/(client)/bookings/success',
                params: {
                    bookingId: newBooking.id,
                    totalPrice: newBooking.totalPrice.toString(),
                    paymentMethod: 'PIX',
                }
            } as any);

        } catch (error: any) {
            console.error("Erro ao agendar serviço:", error.response?.data || error.message);
            Alert.alert("Erro", error.response?.data?.message || "Não foi possível agendar o serviço.");
        } finally {
            setIsBooking(false);
        }
    }, [user, provider, selectedDate, selectedTime, address, selectedProviderService, notes, router]);

    // Função para pré-carregar a disponibilidade
    const prefetchAvailability = useCallback(async (provId: string | undefined, date: Date) => {
        if (!provId) return;

        const dateString = date.toISOString().split('T')[0];
        const cacheKey = `${provId}-${dateString}`;

        if (availabilityCache.has(cacheKey)) {
            return; // Já está no cache
        }

        try {
            // console.log(`[Prefetch] Carregando disponibilidade para ${dateString}`);
            const response = await getProviderAvailability(provId, dateString);
            availabilityCache.set(cacheKey, response);
            // console.log(`[Prefetch] Disponibilidade para ${dateString} armazenada em cache.`);
        } catch (error) {
            console.error(`[Prefetch] Erro ao pré-carregar disponibilidade para ${dateString}:`, error);
        }
    }, []);

    // --- EFEITOS DE CARREGAMENTO INICIAL E SKELETONS ---
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            setIsProviderLoading(true); // Ativa skeleton do provedor
            setIsAddressLoading(true); // Ativa skeleton do endereço

            if (!paramProviderId || !paramServiceId || !user?.id) {
                Alert.alert("Erro de Navegação", "Dados essenciais ausentes. Tente novamente.");
                router.replace('/explore');
                setIsLoading(false);
                setIsProviderLoading(false);
                setIsAddressLoading(false);
                return;
            }

            try {
                const fetchedProvider = await getProviderDetails(paramProviderId);
                setProvider(fetchedProvider);
                setIsProviderLoading(false); // Desativa skeleton do provedor

                const foundService = fetchedProvider.providerServices?.find(
                    ps => ps.id === paramServiceId && ps.service && ps.service.id && ps.service.name
                );

                if (!foundService) {
                    Alert.alert("Erro", "O serviço selecionado não está disponível para este provedor.");
                    router.replace('/explore');
                    setIsLoading(false);
                    return;
                }
                setSelectedProviderService(foundService);

                if (user.address) {
                    setAddress({
                        street: user.address.street || '',
                        number: user.address.number || '',
                        complement: user.address.complement || null,
                        neighborhood: user.address.neighborhood || '',
                        city: user.address.city || '',
                        state: user.address.state || '',
                        cep: user.address.cep || ''
                    });
                } else {
                    Alert.alert(
                        "Endereço Necessário",
                        "Seu endereço não está completo. Por favor, preencha para prosseguir."
                    );
                }
                setIsAddressLoading(false); // Desativa skeleton do endereço

                setSelectedDate(new Date());

                // Pré-carregar disponibilidade para o mês atual e próximo/anterior
                const today = new Date();
                const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                await prefetchAvailability(paramProviderId, today);
                await prefetchAvailability(paramProviderId, nextMonth);
                await prefetchAvailability(paramProviderId, prevMonth);

            } catch (error: any) {
                console.error("Erro ao carregar dados iniciais:", error.response?.data || error.message);
                Alert.alert("Erro", error.response?.data?.message || "Não foi possível carregar os dados para agendamento.");
                router.replace('/explore');
            } finally {
                setIsLoading(false);
                setIsProviderLoading(false);
                setIsAddressLoading(false);
            }
        };
        loadInitialData();
    }, [paramProviderId, user?.id, user?.address, paramServiceId, router, prefetchAvailability]);

    // --- EFEITO DE ANIMAÇÃO DO SHINE (EXISTENTE) ---
    const animateShine = useCallback(() => {
        shineAnim.setValue(-SCREEN_WIDTH * 0.3);
        Animated.timing(shineAnim, {
            toValue: SCREEN_WIDTH + (SCREEN_WIDTH * 0.3),
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(() => animateShine());
    }, [shineAnim]);

    useEffect(() => {
        animateShine();
    }, [animateShine]);

    // --- FUNÇÕES DE CALENDÁRIO (EXISTENTE) ---
    const generateCalendarDays = useCallback((dateInMonth: Date) => {
        const year = dateInMonth.getFullYear();
        const month = dateInMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay();

        const days: Array<{ day: number, month: 'current' | 'prev' | 'next', dateObj: Date }> = [];
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        for (let i = 0; i < startDayOfWeek; i++) {
            const day = prevMonthLastDay - startDayOfWeek + 1 + i;
            days.push({ day, month: 'prev', dateObj: new Date(year, month - 1, day) });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, month: 'current', dateObj: new Date(year, month, i) });
        }
        const totalCells = days.length > 35 ? 42 : 35;
        const remainingCells = totalCells - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({ day: i, month: 'next', dateObj: new Date(year, month + 1, i) });
        }
        setCalendarDays(days);
    }, []);

    useEffect(() => {
        generateCalendarDays(currentDisplayMonth);
    }, [currentDisplayMonth, generateCalendarDays]);

    // --- EFEITO DE CARREGAMENTO E PROCESSAMENTO DE SLOTS ---
    useEffect(() => {
        const fetchAndProcessSlotsForDate = async () => {
            if (!provider?.id || !selectedDate) {
                setDisplaySlotsInfo([]);
                setSelectedTime(null);
                return;
            }

            setIsFetchingSlots(true);
            const dateString = selectedDate.toISOString().split('T')[0];
            const cacheKey = `${provider.id}-${dateString}`;

            let backendResponse;
            if (availabilityCache.has(cacheKey)) {
                backendResponse = availabilityCache.get(cacheKey); // Usa o cache se disponível
                // console.log(`[Cache Hit] Usando dados do cache para ${dateString}`);
            } else {
                try {
                    backendResponse = await getProviderAvailability(provider.id, dateString);
                    availabilityCache.set(cacheKey, backendResponse); // Armazena no cache
                    // console.log(`[Cache Miss] Dados para ${dateString} buscados e armazenados em cache.`);
                } catch (err: any) {
                    console.error("Erro ao carregar horários para data:", err.response?.data || err.message);
                    Alert.alert("Erro", err.response?.data?.message || "Não foi possível carregar os horários disponíveis.");
                    setDisplaySlotsInfo([]);
                    setIsFetchingSlots(false);
                    return;
                }
            }

            const providerConfiguredSlots: ProviderAvailability[] = backendResponse?.available || [];
            const occupiedTimesFromBackend: string[] = backendResponse?.occupiedTimes || [];
            const dayOfWeekSelected = selectedDate.getDay();

            const allDisplayableTimes: string[] = [];
            const startHour = 8;
            const endHour = 20;

            for (let h = startHour; h < endHour; h++) {
                for (let m = 0; m < 60; m += 30) {
                    allDisplayableTimes.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                }
            }

            const configuredStartTimesForSelectedDay = new Set(
                providerConfiguredSlots
                    .filter(configSlot => configSlot.dayOfWeek === dayOfWeekSelected)
                    .map(configSlot => configSlot.startTime)
            );

            const finalDisplaySlots: Array<{ time: string; isAvailable: boolean }> = allDisplayableTimes.map(time => {
                const [hours, minutes] = time.split(':').map(Number);
                const slotDateTime = new Date(selectedDate);
                slotDateTime.setHours(hours, minutes, 0, 0);

                const isPast = slotDateTime.getTime() < new Date().getTime();
                const isConfiguredByProvider = configuredStartTimesForSelectedDay.has(time);
                const isSlotOccupied = occupiedTimesFromBackend.includes(time);

                return {
                    time: time,
                    isAvailable: isConfiguredByProvider && !isSlotOccupied && !isPast,
                };
            });

            setDisplaySlotsInfo(finalDisplaySlots);
            setIsFetchingSlots(false);
        };
        fetchAndProcessSlotsForDate();
    }, [selectedDate, provider?.id]);

    // Renderiza Skeletons para o Provedor e Endereço
    const renderProviderSkeleton = () => (
        <View style={styles.providerBriefSkeleton}>
            <View style={styles.providerImageSkeleton} />
            <View style={styles.providerTextInfoSkeleton}>
                <View style={styles.skeletonLineLarge} />
                <View style={styles.skeletonLineSmall} />
                <View style={styles.skeletonChipsContainer}>
                    <View style={styles.skeletonChip} />
                    <View style={styles.skeletonChip} />
                </View>
            </View>
        </View>
    );

    const renderAddressSkeleton = () => (
        <View style={styles.gradientAddressSectionSkeleton}>
            <View style={styles.addressContentSkeleton}>
                <View style={styles.mapIconSkeleton} />
                <View style={styles.skeletonLineAddress} />
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.centeredFeedback}>
                <Stack.Screen options={{ title: "Carregando..." }} />
                <ActivityIndicator size="large" color="#2A72E7" />
                <Text style={{ marginTop: 10, color: '#555' }}>Carregando dados...</Text>
            </View>
        );
    }

    const isButtonDisabled = !selectedTime || !selectedProviderService || isBooking ||
        !address.street || !address.number || !address.neighborhood || !address.city || !address.state;

    return (
        <View style={styles.screenContainer}>
            <Stack.Screen options={{ headerShown: false }} />

            <CalendarHeader
                currentDisplayMonth={currentDisplayMonth}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                routerBack={() => router.back()}
                MONTH_NAMES_PT={MONTH_NAMES_PT}
            />

            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                {/* INÍCIO DO COMPONENTE PROVIDER BRIEF */}
                {isProviderLoading ? (
                    renderProviderSkeleton()
                ) : (
                    <View style={styles.providerBrief}>
                        <Image
                            source={{ uri: provider?.avatarUrl || 'https://via.placeholder.com/50' }}
                            style={styles.providerImageSmall}
                        />
                        <View style={styles.providerTextInfo}>
                            <View style={styles.providerNameAndRatingRow}>
                                <Text style={styles.providerNameSmall}>{provider?.fullName}</Text>
                                {typeof provider?.averageRating === 'number' && provider.averageRating > 0 ? (
                                    <View style={styles.ratingContainer}>
                                        {renderStars(provider.averageRating)}
                                    </View>
                                ) : (
                                    <Text style={styles.noRatingText}>Sem avaliação</Text>
                                )}
                            </View>
                            <Text style={styles.providerServiceSmall}>
                                {selectedProviderService?.service?.name}
                            </Text>
                            <View style={styles.infoChipsRow}>
                                {provider?.verificationStatus === VerificationStatus.APPROVED && (
                                    renderInfoChip("shield-checkmark-outline", "Verificado", true)
                                )}
                                {typeof provider?.yearsOfExperience === 'number' && provider.yearsOfExperience > 0 && (
                                    renderInfoChip("hourglass-outline", `${provider.yearsOfExperience}+ anos`)
                                )}
                            </View>
                        </View>
                    </View>
                )}
                {/* FIM DO COMPONENTE PROVIDER BRIEF */}

                {/* INÍCIO DO AddressSection */}
                {isAddressLoading ? (
                    renderAddressSkeleton()
                ) : (
                    <LinearGradient
                        colors={['#FFFFFF', '#F0F0F0']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientAddressSection}
                    >
                        <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
                        <View style={styles.addressContent}>
                            <Image
                                source={require('../../../assets/images/icons/map.png')}
                                style={styles.mapIcon}
                            />
                            <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">
                                {`${address.street || ''}, ${address.number || ''}` +
                                `${address.complement ? ` - ${address.complement}` : ''}` +
                                `, ${address.neighborhood || ''}, ${address.city || ''}/${address.state || ''}`}
                            </Text>
                        </View>
                        <Animated.View style={[styles.shineEffectContainer, { transform: [{ translateX: shineAnim }] }]}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.shineGradient}
                            />
                        </Animated.View>
                    </LinearGradient>
                )}
                {/* FIM DO AddressSection */}

                {/* Seção de preenchimento de endereço se não carregado do perfil */}
                {!isAddressLoading && !user?.address?.street && (
                    <View style={styles.addressInputContainer}>
                        <Text style={styles.addressInputTitle}>Preencha seu Endereço</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Rua"
                            value={address.street}
                            onChangeText={(text) => setAddress({ ...address, street: text })}
                            placeholderTextColor="#888"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Número"
                            value={address.number}
                            onChangeText={(text) => setAddress({ ...address, number: text })}
                            keyboardType="numeric"
                            placeholderTextColor="#888"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Complemento (Opcional)"
                            value={address.complement || ''}
                            onChangeText={(text) => setAddress({ ...address, complement: text })}
                            placeholderTextColor="#888"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Bairro"
                            value={address.neighborhood}
                            onChangeText={(text) => setAddress({ ...address, neighborhood: text })}
                            placeholderTextColor="#888"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Cidade"
                            value={address.city}
                            onChangeText={(text) => setAddress({ ...address, city: text })}
                            placeholderTextColor="#888"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Estado (Ex: SP)"
                            value={address.state}
                            onChangeText={(text) => setAddress({ ...address, state: text })}
                            maxLength={2}
                            autoCapitalize="characters"
                            placeholderTextColor="#888"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="CEP"
                            value={address.cep}
                            onChangeText={(text) => setAddress({ ...address, cep: text })}
                            keyboardType="numeric"
                            maxLength={9} // Ex: 12345-678
                            placeholderTextColor="#888"
                        />
                    </View>
                )}


                <View style={styles.calendarGridContainer}>
                    <View style={styles.dayNamesRow}>
                        {DAY_NAMES_PT.map(dayName => (
                            <Text key={dayName} style={styles.dayNameText}>{dayName}</Text>
                        ))}
                    </View>
                    <View style={styles.calendarGrid}>
                        {calendarDays.map((dayInfo, index) => {
                            const isSelected = selectedDate.toDateString() === dayInfo.dateObj.toDateString() && dayInfo.month === 'current';
                            const isPast = dayInfo.dateObj < new Date(new Date().setHours(0, 0, 0, 0)) && dayInfo.dateObj.toDateString() !== new Date().toDateString();
                            const isToday = dayInfo.dateObj.toDateString() === new Date().toDateString();

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.dayCell,
                                        dayInfo.month !== 'current' && styles.dayCellNotInMonth,
                                        isSelected && styles.dayCellSelected,
                                        isToday && !isSelected && styles.dayCellToday,
                                        { transform: [{ scale: isSelected ? selectionAnim : 1 }] } // Animação de escala
                                    ]}
                                    onPress={() => dayInfo.month === 'current' && handleDaySelect(dayInfo.dateObj)}
                                    disabled={dayInfo.month !== 'current' || isPast}
                                >
                                    <Text style={[
                                        styles.dayText,
                                        dayInfo.month !== 'current' && styles.dayTextNotInMonth,
                                        isSelected && styles.dayTextSelected,
                                        isPast && dayInfo.month === 'current' && styles.dayTextPast,
                                        isToday && !isSelected && styles.dayTextToday,
                                    ]}>
                                        {dayInfo.day}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <TimeSlotsSection
                    title={`Horários Disponíveis - ${selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`}
                    displaySlotsInfo={displaySlotsInfo}
                    isLoading={isFetchingSlots}
                    selectedTime={selectedTime}
                    onTimeSelect={handleTimeSelect}
                />

            </ScrollView>

            <View style={styles.confirmButtonWrapper}>
                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        isButtonDisabled && styles.confirmButtonDisabled
                    ]}
                    onPress={handleConfirmBooking}
                    disabled={isButtonDisabled}
                >
                    {isBooking ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.confirmButtonText}>
                            {selectedTime && selectedProviderService?.price ?
                                `Agendar (R$ ${selectedProviderService.price.toFixed(2).replace('.', ',')})` :
                                "Selecione Data, Hora e Endereço"
                            }
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screenContainer: { flex: 1, backgroundColor: '#FFFFFF' },
    centeredFeedback: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
    scrollContentContainer: { paddingBottom: 120 },

    providerBrief: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F7F9FC',
        borderBottomWidth: 1,
        borderBottomColor: '#E9EDF0',
        justifyContent: 'space-between',
    },
    providerImageSmall: {
        width: 70,
        height: 70,
        borderRadius: 25,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#DDEEFF',
        marginLeft: 8,
        marginTop: 10,
    },
    providerNameAndRatingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 0,
    },
    providerTextInfo: {
        flex: 1,
        marginRight: 10,
        justifyContent: 'center',
    },
    providerNameSmall: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        paddingTop: 22,
        marginRight: 4,
    },
    providerServiceSmall: {
        fontSize: 14,
        color: '#555',
    },
    ratingContainer: {
        flexDirection: 'row',
        marginRight: 5,
        alignSelf: 'center',
        paddingTop: 22,
        backgroundColor: 'transparent',
        minWidth: 60,
        minHeight: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 5,
    },
    noRatingText: {
        fontSize: 12,
        color: '#888',
        fontWeight: 'normal',
    },
    ratingStarContainer: {
        flexDirection: 'row',
        marginRight: 5,
    },
    ratingStarIcon: {
        marginRight: 1,
    },
    infoChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 5,
    },
    infoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0E0E0',
        borderRadius: 16,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginLeft: -3,
    },
    infoChipText: {
        fontSize: 12,
        color: '#555',
        marginLeft: 4,
        fontWeight: '500',
    },
    infoChipVerified: {
        backgroundColor: '#D1ECF1',
    },
    infoChipTextVerified: {
        color: '#007BFF',
    },
    gradientAddressSection: {
        borderRadius: 12,
        overflow: 'hidden',
        marginHorizontal: 15,
        marginTop: 8,
        marginBottom: 15,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    addressContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingVertical: 10,
        backgroundColor: 'transparent',
        zIndex: 1,
    },
    mapIcon: {
        width: 18,
        height: 18,
        marginRight: 8,
        marginLeft: 0,
    },
    addressText: {
        fontSize: 14,
        color: '#333333',
        fontWeight: '400',
        flexShrink: 1,
    },
    shineEffectContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: SCREEN_WIDTH * 0.3,
        transform: [{ skewX: '-20deg' }],
        overflow: 'hidden',
        zIndex: 0,
    },
    shineGradient: {
        height: '100%',
        width: '100%',
    },
    calendarGridContainer: {
        paddingHorizontal: 10,
        marginTop: 15,
    },
    dayNamesRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
        paddingHorizontal: (SCREEN_WIDTH - 20 - (7 * 40)) / 14,
    },
    dayNameText: {
        width: 40,
        textAlign: 'center',
        fontSize: 12,
        color: '#888888',
        fontWeight: '500',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    dayCell: {
        width: (SCREEN_WIDTH - 20) / 7 - 6,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 3,
        borderRadius: 20,
    },
    dayCellNotInMonth: {},
    dayCellSelected: {
        backgroundColor: '#2A72E7',
    },
    dayCellToday: {
        borderColor: '#2A72E7',
        borderWidth: 1,
    },
    dayText: {
        fontSize: 15,
        color: '#333333',
    },
    dayTextNotInMonth: {
        color: '#CCCCCC',
    },
    dayTextSelected: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    dayTextPast: {
        color: '#AAAAAA',
        textDecorationLine: 'line-through',
    },
    dayTextToday: {
        color: '#2A72E7',
        fontWeight: 'bold',
    },
    timeSlotsSection: {
        marginTop: 20,
        paddingHorizontal: 15,
    },
    timeSlotsTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#111',
        marginBottom: 15,
    },
    slotsLoader: {
        marginVertical: 20,
    },
    timeSlotsListContainer: {},
    timeSlotsRow: {
        justifyContent: 'space-between',
    },
    noSlotsText: {
        textAlign: 'center',
        color: '#777777',
        fontSize: 15,
        fontStyle: 'italic',
    },
    confirmButtonWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingVertical: Platform.OS === 'ios' ? 25 : 15,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    confirmButton: {
        backgroundColor: '#2A72E7',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: '#A0C7F2',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    // --- Novos estilos para Skeletons ---
    skeletonPulse: {
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
    },
    providerBriefSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F7F9FC',
        borderBottomWidth: 1,
        borderBottomColor: '#E9EDF0',
        justifyContent: 'space-between',
    },
    providerImageSkeleton: {
        width: 70,
        height: 70,
        borderRadius: 25,
        marginRight: 12,
        marginLeft: 8,
        marginTop: 10,
        backgroundColor: '#E0E0E0',
    },
    providerTextInfoSkeleton: {
        flex: 1,
        marginRight: 10,
        justifyContent: 'center',
    },
    skeletonLineLarge: {
        height: 18,
        width: '80%',
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        marginBottom: 8,
    },
    skeletonLineSmall: {
        height: 14,
        width: '60%',
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        marginBottom: 5,
    },
    skeletonChipsContainer: {
        flexDirection: 'row',
        marginTop: 5,
        gap: 8,
    },
    skeletonChip: {
        height: 24,
        width: 70,
        backgroundColor: '#E0E0E0',
        borderRadius: 16,
    },
    gradientAddressSectionSkeleton: {
        borderRadius: 12,
        marginHorizontal: 15,
        marginTop: 8,
        marginBottom: 15,
        height: 50, // Altura fixa para o skeleton
        backgroundColor: '#E0E0E0',
    },
    addressContentSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingVertical: 10,
        height: '100%',
    },
    mapIconSkeleton: {
        width: 18,
        height: 18,
        marginRight: 8,
        backgroundColor: '#CCCCCC',
        borderRadius: 9,
    },
    skeletonLineAddress: {
        height: 16,
        width: '70%',
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
    },
    addressInputContainer: {
        backgroundColor: '#F7F9FC',
        padding: 15,
        marginHorizontal: 15,
        borderRadius: 12,
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    addressInputTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    input: {
        height: 45,
        borderColor: '#E0E0E0',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 10,
        fontSize: 15,
        color: '#333',
        backgroundColor: '#FFFFFF',
    }
});