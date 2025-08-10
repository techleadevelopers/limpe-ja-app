import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ColorValue,
    TextInput
} from 'react-native';

// --- IMPORTAÇÕES DE SERVIÇOS E TIPAGENS DO SEU BACKEND REAL ---
import { useAuth } from '../../../hooks/useAuth';
import { createBooking } from '../../../services/bookingService';
import { getProviderAvailability, getProviderDetails } from '../../../services/providerService';

// Tipagens do seu backend original
import { BookingAddress, BookingDetails, CreateBookingDto } from '../../../types/backend/bookings';
import {
    ProviderAvailability,
    ProviderDisplayInfo,
    ProviderServiceOffering
} from '../../../types/backend/providers';
import { UserProfile } from '../../../types/backend/users';
import { PricingType } from '../../../types/backend/services';
import { formatDate } from '../../../utils/helpers';

// --- Importar COMPONENTES DE UI ---
import AddressSection from '../../../components/client/booking/schedule/AddressSection';
import CalendarHeader from '../../../components/client/booking/schedule/CalendarHeader';
import ProviderBrief from '../../../components/client/booking/schedule/ProviderBrief';
import TimeSlotsSection from '../../../components/client/booking/schedule/TimeSlotsSection';
// Componente de UI para input dinâmico
import ServiceDetailsInput from '../../../components/client/booking/schedule/ServiceDetailsInput';


// --- Constantes para a UI ---
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const MONTH_NAMES_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DAY_NAMES_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const HEADER_HEIGHT_ADJUST = Platform.OS === 'ios' ? 90 : 60;

// Cache para disponibilidade do provedor por data
const availabilityCache = new Map<string, { available: ProviderAvailability[], occupiedTimes: string[] }>();

export default function ScheduleServiceScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const typedUser = user as UserProfile | null;

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
        cep: '',
        latitude: 0,
        longitude: 0,
    });
    const [notes, setNotes] = useState<string>('');
    const [durationInMinutes, setDurationInMinutes] = useState<number | null>(null);
    const [squareMeters, setSquareMeters] = useState<number | null>(null);

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
    
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const backgroundFloatAnim = useRef(new Animated.Value(0)).current;
    const headerGlowAnim = useRef(new Animated.Value(0)).current;
    const calendarBreatheAnim = useRef(new Animated.Value(1)).current;

    // HOOKS MOVIDOS PARA O TOPO DO COMPONENTE
    const finalPrice = useMemo(() => {
        if (!selectedProviderService?.pricingType || !selectedProviderService?.price) {
            return 0;
        }

        if (selectedProviderService.pricingType === PricingType.HOURLY && durationInMinutes) {
            return (durationInMinutes / 60) * selectedProviderService.price;
        }

        if (selectedProviderService.pricingType === PricingType.BY_SIZE && squareMeters) {
            return squareMeters * selectedProviderService.price;
        }
        
        return selectedProviderService.price;

    }, [selectedProviderService, durationInMinutes, squareMeters]);
    
    const addressToDisplay = useMemo(() => {
        const userAddress = typedUser?.clientDetails?.address || typedUser?.providerDetails?.address;
        if (userAddress) {
            return {
                street: userAddress.street || '',
                number: userAddress.number || '',
                complement: userAddress.complement || null,
                neighborhood: userAddress.neighborhood || '',
                city: userAddress.city || '',
                state: userAddress.state || '',
                cep: userAddress.cep || '',
                latitude: userAddress.latitude,
                longitude: userAddress.longitude,
            };
        }
        return null;
    }, [typedUser]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: 800,
                delay: 200,
                easing: Easing.out(Easing.back(1.2)),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 100,
                delay: 400,
                useNativeDriver: true,
            }),
        ]).start();

        const startPulse = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.02,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        const startRotation = () => {
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 20000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        };

        const startFloating = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(backgroundFloatAnim, {
                        toValue: 1,
                        duration: 4000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(backgroundFloatAnim, {
                        toValue: 0,
                        duration: 4000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        const startHeaderGlow = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(headerGlowAnim, {
                        toValue: 1,
                        duration: 3000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                    Animated.timing(headerGlowAnim, {
                        toValue: 0,
                        duration: 3000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                ])
            ).start();
        };

        const startCalendarBreathe = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(calendarBreatheAnim, {
                        toValue: 1.005,
                        duration: 3000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(calendarBreatheAnim, {
                        toValue: 1,
                        duration: 3000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        startPulse();
        startRotation();
        startFloating();
        startHeaderGlow();
        startCalendarBreathe();
    }, []);

    const handlePrevMonth = useCallback(() => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.98, duration: 100, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]).start();

        setCurrentDisplayMonth(prev => {
            const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
            prefetchAvailability(provider?.id, newDate);
            return newDate;
        });
    }, [provider?.id]);

    const handleNextMonth = useCallback(() => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.98, duration: 100, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
        ]).start();

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

        Animated.sequence([
            Animated.timing(selectionAnim, {
                toValue: 1.15,
                duration: 150,
                easing: Easing.out(Easing.back(2)),
                useNativeDriver: true
            }),
            Animated.spring(selectionAnim, {
                toValue: 1,
                friction: 4,
                tension: 100,
                useNativeDriver: true
            }),
        ]).start();

        setSelectedDate(dateObj);
    }, [selectionAnim]);

    const handleTimeSelect = useCallback((time: string) => {
        const selectedSlot = displaySlotsInfo.find(slot => slot.time === time);
        if (selectedSlot?.isAvailable) {
            Animated.sequence([
                Animated.timing(selectionAnim, {
                    toValue: 1.08,
                    duration: 120,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true
                }),
                Animated.spring(selectionAnim, {
                    toValue: 1,
                    friction: 5,
                    tension: 80,
                    useNativeDriver: true
                }),
            ]).start();

            setSelectedTime(time);
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
        if (!typedUser?.id || !provider?.id || !selectedProviderService?.id || !selectedDate || !selectedTime ||
            !address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
            Alert.alert("Erro", "Por favor, preencha todos os campos necessários para o agendamento, incluindo o endereço completo e selecione um horário.");
            return;
        }

        let requestedDurationMinutes = 0;
        let requestedSquareMeters = 0;
        let calculatedPrice = selectedProviderService.price;
        
        // Validação adicional para campos dinâmicos
        if (selectedProviderService.pricingType === PricingType.HOURLY && !durationInMinutes) {
            Alert.alert("Erro", "Por favor, insira a duração do serviço em minutos.");
            return;
        }
        if (selectedProviderService.pricingType === PricingType.BY_SIZE && !squareMeters) {
            Alert.alert("Erro", "Por favor, insira a área do serviço em metros quadrados.");
            return;
        }

        setIsBooking(true);

        try {
            if (selectedProviderService.pricingType === PricingType.HOURLY) {
                requestedDurationMinutes = durationInMinutes!;
                calculatedPrice = (durationInMinutes! / 60) * selectedProviderService.price;
            } else if (selectedProviderService.pricingType === PricingType.BY_SIZE) {
                requestedSquareMeters = squareMeters!;
                calculatedPrice = squareMeters! * selectedProviderService.price;
            }

            const bookingData: CreateBookingDto = {
                providerId: provider.id,
                providerServiceId: selectedProviderService.id,
                scheduledDate: selectedDate.toISOString().split('T')[0],
                scheduledTime: selectedTime,
                totalPrice: calculatedPrice,
                notes: notes,
                address: address,
                ...(selectedProviderService.pricingType === PricingType.HOURLY && { requestedDurationMinutes }),
                ...(selectedProviderService.pricingType === PricingType.BY_SIZE && { requestedSquareMeters }),
            };

            const newBooking: BookingDetails = await createBooking(bookingData);

            router.replace({
                pathname: '/(client)/bookings/success',
                params: {
                    bookingId: newBooking.id,
                    totalPrice: newBooking.totalPrice.toString(),
                    paymentMethod: 'PIX', // Pode ser dinâmico no futuro
                }
            } as any);

        } catch (error: any) {
            console.error("Erro ao agendar serviço:", error.response?.data || error.message);
            Alert.alert("Erro", error.response?.data?.message || "Não foi possível agendar o serviço.");
        } finally {
            setIsBooking(false);
        }
    }, [typedUser, provider, selectedDate, selectedTime, address, selectedProviderService, notes, router, durationInMinutes, squareMeters]);

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

            if (!paramProviderId || !paramServiceId || !typedUser?.id) {
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
                
                // Inicializa os valores com base no tipo de preço
                if(foundService.pricingType === PricingType.HOURLY) {
                    setDurationInMinutes(120); // Valor padrão
                } else if(foundService.pricingType === PricingType.BY_SIZE) {
                    setSquareMeters(50); // Valor padrão
                }

                const userAddress = typedUser?.clientDetails?.address || typedUser?.providerDetails?.address;
                if (userAddress) {
                    setAddress({
                        street: userAddress.street || '',
                        number: userAddress.number || '',
                        complement: userAddress.complement || null,
                        neighborhood: userAddress.neighborhood || '',
                        city: userAddress.city || '',
                        state: userAddress.state || '',
                        cep: userAddress.cep || '',
                        latitude: userAddress.latitude,
                        longitude: userAddress.longitude
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
    }, [paramProviderId, typedUser?.id, paramServiceId, router, prefetchAvailability]);

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

            let backendResponse: { available: ProviderAvailability[], occupiedTimes: string[] } | undefined;
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
        !address.street || !address.number || !address.neighborhood || !address.city || !address.state ||
        (selectedProviderService?.pricingType === PricingType.HOURLY && !durationInMinutes) ||
        (selectedProviderService?.pricingType === PricingType.BY_SIZE && !squareMeters);

    const gradientColors = [
        'rgba(173, 216, 230, 0.15)',
        'rgba(135, 206, 250, 0.25)',
        'rgba(100, 149, 237, 0.35)',
        'rgba(65, 153, 225, 0.25)',
    ] as const;

    const backgroundGradientColors = [
        'rgba(248, 250, 252, 1)',
        'rgba(241, 245, 249, 1)',
        'rgba(248, 250, 252, 0.95)',
    ] as const;

    return (
        <View style={styles.screenContainer}>
            <Stack.Screen options={{ headerShown: false }} />

            <Animated.View style={[
                styles.backgroundDecoration,
                {
                    transform: [
                        {
                            translateY: backgroundFloatAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-20, 20]
                            })
                        },
                        {
                            rotate: rotateAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '360deg']
                            })
                        }
                    ]
                }
            ]}>
                <LinearGradient
                    colors={['rgba(66, 165, 245, 0.08)', 'rgba(144, 202, 249, 0.06)']}
                    style={styles.decorationGradient}
                />
            </Animated.View>

            <Animated.View style={[
                styles.backgroundDecoration2,
                {
                    transform: [
                        {
                            translateX: backgroundFloatAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [10, -10]
                            })
                        },
                        { scale: calendarBreatheAnim }
                    ]
                }
            ]}>
                <LinearGradient
                    colors={['rgba(121, 134, 203, 0.05)', 'rgba(129, 140, 248, 0.08)']}
                    style={styles.decorationGradient}
                />
            </Animated.View>

            <Animated.View style={[
                { paddingTop: HEADER_HEIGHT_ADJUST },
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }]
                }
            ]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#435ee9ff" />
                    </TouchableOpacity>
                <LinearGradient
                    colors={['#4285F4', '#2A72E7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.topHeaderGradient}
                >
                    
                    <Text style={styles.headerTitle}>Agendar</Text>
                </LinearGradient>
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
                    style={styles.headerGradient}
                >
                    <BlurView intensity={20} tint="light" style={styles.headerBlur}>
                        <CalendarHeader
                            currentDisplayMonth={currentDisplayMonth}
                            onPrevMonth={handlePrevMonth}
                            onNextMonth={handleNextMonth}
                            routerBack={() => router.back()}
                            MONTH_NAMES_PT={MONTH_NAMES_PT}
                        />
                    </BlurView>
                </LinearGradient>
            </Animated.View>

            <Animated.ScrollView
                contentContainerStyle={styles.scrollContentContainer}
                style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }]
                }}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <ProviderBrief
                        provider={provider}
                        serviceName={selectedProviderService?.service?.name}
                        isLoading={isLoading}
                    />
                </Animated.View>

                <Animated.View style={{
                    transform: [{ scale: scaleAnim }],
                    opacity: fadeAnim
                }}>
                    <AddressSection
                        address={address}
                        setAddress={setAddress}
                        shineAnim={shineAnim}
                        isLoading={isLoading}
                        isInputMode={!address.street || !address.number || !address.neighborhood || !address.city || !address.state}
                    />
                </Animated.View>

                <Animated.View style={{
                    transform: [
                        { scale: calendarBreatheAnim },
                        { scale: scaleAnim }
                    ]
                }}>
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.calendarGridContainer}
                    >
                        <BlurView intensity={5} tint="light" style={styles.calendarBlur}>
                            <View style={styles.calendarInnerContainer}>
                                <View style={styles.dayNamesRow}>
                                    {DAY_NAMES_PT.map((dayName, index) => (
                                        <Animated.Text
                                            key={dayName}
                                            style={[
                                                styles.dayNameText,
                                                {
                                                    opacity: fadeAnim,
                                                    transform: [{
                                                        translateY: slideUpAnim.interpolate({
                                                            inputRange: [0, 50],
                                                            outputRange: [0, index * 5]
                                                        })
                                                    }]
                                                }
                                            ]}
                                        >
                                            {dayName.slice(0, 3)}
                                        </Animated.Text>
                                    ))}
                                </View>
                                <View style={styles.calendarGrid}>
                                    {calendarDays.map((dayInfo, index) => {
                                        const isSelected = selectedDate.toDateString() === dayInfo.dateObj.toDateString() && dayInfo.month === 'current';
                                        const isPast = dayInfo.dateObj < new Date(new Date().setHours(0, 0, 0, 0)) && dayInfo.dateObj.toDateString() !== new Date().toDateString();
                                        const isWeekend = dayInfo.dateObj.getDay() === 0 || dayInfo.dateObj.getDay() === 6;

                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                style={[
                                                    styles.dayCell,
                                                    isSelected && styles.dayCellSelected,
                                                    {
                                                        transform: [{
                                                            scale: isSelected ? selectionAnim : 1
                                                        }]
                                                    }
                                                ]}
                                                onPress={() => dayInfo.month === 'current' && handleDaySelect(dayInfo.dateObj)}
                                                disabled={dayInfo.month !== 'current' || isPast}
                                            >
                                                {isSelected && (
                                                    <LinearGradient
                                                        colors={['#4285F4', '#2A72E7']}
                                                        style={styles.selectedDayGradient}
                                                    />
                                                )}
                                                <Text style={[
                                                    styles.dayText,
                                                    dayInfo.month !== 'current' && styles.dayTextNotInMonth,
                                                    isSelected && styles.dayTextSelected,
                                                    isPast && dayInfo.month === 'current' && styles.dayTextPast,
                                                    !isSelected && !isPast && dayInfo.month === 'current' && (isWeekend ? styles.dayTextCurrentWeekend : styles.dayTextCurrentWeekday),
                                                ]}>
                                                    {dayInfo.day}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </BlurView>
                    </LinearGradient>
                </Animated.View>

                <Animated.View style={{
                    transform: [{ scale: scaleAnim }],
                    opacity: fadeAnim
                }}>
                    <TimeSlotsSection
                        title={`Horários Disponíveis - ${selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`}
                        displaySlotsInfo={displaySlotsInfo}
                        isLoading={isFetchingSlots}
                        selectedTime={selectedTime}
                        onTimeSelect={handleTimeSelect}
                    />
                </Animated.View>

                {selectedProviderService && (
                    <Animated.View style={{
                        transform: [{ scale: scaleAnim }],
                        opacity: fadeAnim
                    }}>
                        <ServiceDetailsInput
                            pricingType={selectedProviderService.pricingType}
                            durationInMinutes={durationInMinutes}
                            setDurationInMinutes={setDurationInMinutes}
                            squareMeters={squareMeters}
                            setSquareMeters={setSquareMeters}
                            pricePerUnit={selectedProviderService.price}
                            finalPrice={finalPrice}
                        />
                    </Animated.View>
                )}


                <View style={[styles.notesContainer, {opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
                    <Text style={styles.notesTitle}>Observações (Opcional)</Text>
                    <TextInput
                        style={styles.notesInput}
                        placeholder="Ex: 'Procurar por Maria na portaria', 'O apartamento é o 101, cor amarela'."
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={4}
                        placeholderTextColor="#999"
                    />
                </View>

            </Animated.ScrollView>

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
                                `Agendar (R$ ${finalPrice.toFixed(2).replace('.', ',')})` :
                                "Selecione Data, Hora e Endereço"
                            }
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const FIXED_DAY_CELL_SIZE = 40;

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: '#F8FAFB',
    },
    centeredFeedback: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFB'
    },
    scrollContentContainer: {
        paddingBottom: 120,
        paddingTop: 10,
    },
    backgroundDecoration: {
        position: 'absolute',
        top: SCREEN_HEIGHT * 0.1,
        right: -SCREEN_WIDTH * 0.2,
        width: SCREEN_WIDTH * 0.6,
        height: SCREEN_WIDTH * 0.6,
        borderRadius: SCREEN_WIDTH * 0.3,
        overflow: 'hidden',
    },
    backgroundDecoration2: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.3,
        left: -SCREEN_WIDTH * 0.15,
        width: SCREEN_WIDTH * 0.5,
        height: SCREEN_WIDTH * 0.5,
        borderRadius: SCREEN_WIDTH * 0.25,
        overflow: 'hidden',
    },
    decorationGradient: {
        flex: 1,
    },
    headerGradient: {
        borderBottomLeftRadius: 55,
        borderBottomRightRadius: 55,
        overflow: 'hidden',
        marginBottom: 8,
        top: 30,
        
    },
    headerBlur: {
        padding: 0,
    },
    topHeaderGradient: {
        width: '38%',
        paddingTop: Platform.OS === 'ios' ? 25 : 23,
        paddingBottom: 15,
        bottom: 87,
        left: 120,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
        marginBottom: Platform.OS === 'ios' ? 0 : -80,
    },
    backButton: {
        position: 'absolute',
        left: 15,
        bottom: 95,
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 15,
        zIndex: 1,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 15 : 13,
        
    },
    calendarGridContainer: {
        borderRadius: 16,
        marginHorizontal: 30,
        marginVertical: 50,
        marginTop: 25,
        overflow: 'hidden',
        shadowColor: 'rgb(33, 34, 34)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
    },
    calendarBlur: {
        paddingVertical: 25,
        paddingHorizontal: 15,
    },
    calendarInnerContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 10,
    },
    dayNamesRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    dayNameText: {
        width: FIXED_DAY_CELL_SIZE,
        textAlign: 'center',
        fontSize: 10,
        color: 'rgba(23, 23, 24, 0.7)',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 5,
    },
    dayCell: {
        width: FIXED_DAY_CELL_SIZE,
        height: FIXED_DAY_CELL_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 6,
        borderRadius: FIXED_DAY_CELL_SIZE / 2,
        position: 'relative',
    },
    dayCellSelected: {
        shadowColor: '#2A72E7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    selectedDayGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: FIXED_DAY_CELL_SIZE / 2,
    },
    dayText: {
        fontSize: 13,
        fontWeight: '500',
        zIndex: 1,
    },
    dayTextCurrentWeekday: {
        color: '#333333',
        fontWeight: '600',
    },
    dayTextCurrentWeekend: {
        color: '#2A72E7',
        fontWeight: '600',
    },
    dayTextNotInMonth: {
        color: 'rgba(0,0,0,0.2)',
    },
    dayTextSelected: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    dayTextPast: {
        color: '#AAAAAA',
        textDecorationLine: 'line-through',
    },
    confirmButtonWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: 40,
        paddingHorizontal: 25,
        paddingVertical: Platform.OS === 'ios' ? 25 : 42,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 8,
    },
    confirmButton: {
        backgroundColor: '#2A72E7',
        paddingVertical: 7,
        width: '90%',
        borderRadius: 12,
        bottom: 25,
        left: 12,
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: '#A0C7F2',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    notesContainer: {
        marginHorizontal: 15,
        marginTop: 20,
        marginBottom: 10,
    },
    notesTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    notesInput: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        minHeight: 100,
        textAlignVertical: 'top',
        fontSize: 14,
        color: '#333',
    }
});