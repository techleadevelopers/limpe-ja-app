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
    TextInput
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

// --- Importar COMPONENTES DE UI ---
import CalendarHeader from './components/schedule/CalendarHeader';
import TimeSlotsSection from './components/schedule/TimeSlotsSection';
import ProviderBrief from './components/schedule/ProviderBrief';
import AddressSection from './components/schedule/AddressSection';

// --- Constantes para a UI ---
const SCREEN_WIDTH = Dimensions.get('window').width;
const MONTH_NAMES_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DAY_NAMES_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
// HEADER_HEIGHT_ADJUST será usado para o padding superior do nosso cabeçalho customizado.
// Inclui a altura da barra de status para iOS.
const HEADER_HEIGHT_ADJUST = Platform.OS === 'ios' ? 90 : 60;

// Cache para disponibilidade do provedor por data
const availabilityCache = new Map<string, { available: ProviderAvailability[], occupiedTimes: string[] }>();

export default function ScheduleServiceScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { providerId: paramProviderId, serviceId: paramServiceId } = useLocalSearchParams<{ providerId?: string; serviceId?: string }>();

    const [provider, setProvider] = useState<ProviderDisplayInfo | null>(null);
    const [selectedProviderService, setSelectedProviderService] = useState<ProviderServiceOffering | null>(null);
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

    const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date());
    const shineAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.3)).current;
    const [calendarDays, setCalendarDays] = useState<Array<{ day: number, month: 'current' | 'prev' | 'next', dateObj: Date }>>([]);

    const [displaySlotsInfo, setDisplaySlotsInfo] = useState<
        Array<{ time: string; isAvailable: boolean }>
    >([]);

    const selectionAnim = useRef(new Animated.Value(1)).current;

    const handlePrevMonth = useCallback(() => {
        setCurrentDisplayMonth(prev => {
            const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
            prefetchAvailability(provider?.id, newDate);
            return newDate;
        });
    }, [provider?.id]);

    const handleNextMonth = useCallback(() => {
        setCurrentDisplayMonth(prev => {
            const newDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
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
        Animated.sequence([
            Animated.timing(selectionAnim, { toValue: 1.1, duration: 100, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
            Animated.spring(selectionAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
        ]).start();
    }, [selectionAnim]);

    const handleTimeSelect = useCallback((time: string) => {
        const selectedSlot = displaySlotsInfo.find(slot => slot.time === time);
        if (selectedSlot?.isAvailable) {
            setSelectedTime(time);
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

    const prefetchAvailability = useCallback(async (provId: string | undefined, date: Date) => {
        if (!provId) return;

        const dateString = date.toISOString().split('T')[0];
        const cacheKey = `${provId}-${dateString}`;

        if (availabilityCache.has(cacheKey)) {
            return;
        }

        try {
            const response = await getProviderAvailability(provId, dateString);
            availabilityCache.set(cacheKey, response);
        } catch (error) {
            console.error(`[Prefetch] Erro ao pré-carregar disponibilidade para ${dateString}:`, error);
        }
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);

            if (!paramProviderId || !paramServiceId || !user?.id) {
                Alert.alert("Erro de Navegação", "Dados essenciais ausentes. Tente novamente.");
                router.replace('/explore');
                setIsLoading(false);
                return;
            }

            try {
                const fetchedProvider = await getProviderDetails(paramProviderId);
                setProvider(fetchedProvider);

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

                setSelectedDate(new Date());

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
            }
        };
        loadInitialData();
    }, [paramProviderId, user?.id, user?.address, paramServiceId, router, prefetchAvailability]);

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
                backendResponse = availabilityCache.get(cacheKey);
            } else {
                try {
                    backendResponse = await getProviderAvailability(provider.id, dateString);
                    availabilityCache.set(cacheKey, backendResponse);
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

            const configuredStartTimesForSelectedDay = new Set(
                providerConfiguredSlots
                    .filter(configSlot => configSlot.dayOfWeek === dayOfWeekSelected)
                    .map(configSlot => configSlot.startTime)
            );

            const allDisplayableTimes: string[] = [];
            const startHour = 8;
            const endHour = 20;

            for (let h = startHour; h < endHour; h++) {
                for (let m = 0; m < 60; m += 30) {
                    allDisplayableTimes.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                }
            }

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
            {/* O Stack.Screen será configurado para não mostrar o cabeçalho nativo. */}
            <Stack.Screen options={{ headerShown: false }} /> {/* <<< CORRIGIDO: Remover todas as opções complexas e apenas ocultar o header */}

            {/* Este View agora age como o cabeçalho CUSTOMIZADO. */}
            {/* Ele terá o padding superior para acomodar a barra de status e o background branco. */}
            {/* O CalendarHeader será renderizado DENTRO dele, incluindo o botão de voltar. */}
            <View style={{ paddingTop: HEADER_HEIGHT_ADJUST, backgroundColor: '#FFFFFF' }}>
                {/* Você pode adicionar um botão de voltar aqui se o CalendarHeader não tiver um */}
                {/* <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 15, zIndex: 10 }}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity> */}
                <CalendarHeader
                    currentDisplayMonth={currentDisplayMonth}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    routerBack={() => router.back()} // Mantenha isso para a lógica de voltar do CalendarHeader
                    MONTH_NAMES_PT={MONTH_NAMES_PT}
                />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                {/* INÍCIO DA INTEGRAÇÃO DOS COMPONENTES ProviderBrief e AddressSection */}
                <ProviderBrief
                    provider={provider}
                    serviceName={selectedProviderService?.service?.name}
                    isLoading={isLoading}
                />
                
                <AddressSection
                    address={address}
                    setAddress={setAddress}
                    shineAnim={shineAnim}
                    isLoading={isLoading}
                    isInputMode={!user?.address?.street || !user?.address?.number || !user?.address?.neighborhood || !user?.address?.city || !user?.address?.state}
                />
                {/* FIM DA INTEGRAÇÃO DOS COMPONENTES */}

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
                                        { transform: [{ scale: isSelected ? selectionAnim : 1 }] }
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
    scrollContentContainer: { paddingBottom: 100 },

    calendarGridContainer: {
        paddingHorizontal: 10,
        marginTop: 25,
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

    addressInputContainer: {
        backgroundColor: '#F7F9FC',
        padding: 15,
        marginHorizontal: 20,
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 10,
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
    },

    providerBriefSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        justifyContent: 'space-between',
        height: 100,
    },
    providerImageSkeleton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginRight: 12,
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
});