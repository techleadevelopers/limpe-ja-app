import { Ionicons } from '@expo/vector-icons';
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
    TextInput, // Adicionado para o campo de cupom
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
import { UserProfile } from '../../../types/backend/users'; // Verifique o caminho correto para UserProfile
import { PricingType } from '../../../types/backend/services';
import { formatDate } from '../../../utils/helpers';

// --- Importar COMPONENTES DE UI ---
import AddressSection from '../../../components/client/booking/schedule/AddressSection';
import ProviderBrief from '../../../components/client/booking/schedule/ProviderBrief';
import TimeSlotsSection from '../../../components/client/booking/schedule/TimeSlotsSection';
import ServiceDetailsInput from '../../../components/client/booking/schedule/ServiceDetailsInput';

// NOVOS COMPONENTES IMPORTADOS
import ScheduleHeader from '../../../components/client/booking/schedule/ScheduleHeader';
import ScheduleCalendar from '../../../components/client/booking/schedule/ScheduleCalendar';
import NotesInputSection from '../../../components/client/booking/schedule/NotesInputSection';
import ConfirmBookingButton from '../../../components/client/booking/schedule/ConfirmBookingButton';

// --- NOVAS INTERFACES PARA AS PROPS DOS COMPONENTES ---
interface BookingSummaryPreviewProps {
    provider: ProviderDisplayInfo | null;
    selectedProviderService: ProviderServiceOffering | null;
    selectedDate: Date;
    selectedTime: string | null;
    address: BookingAddress;
    durationInMinutes: number | null;
    squareMeters: number | null;
    subtotal: number;
    discountAmount: number;
    finalPrice: number;
    onShowCancellationPolicy: () => void;
}

interface CouponInputSectionProps {
    couponCode: string;
    setCouponCode: React.Dispatch<React.SetStateAction<string>>;
    onApplyCoupon: () => Promise<void>;
    isApplyingCoupon: boolean;
    discountAmount: number;
}
// --- FIM NOVAS INTERFACES ---

// --- NOVOS COMPONENTES PERSONALIZADOS PARA ESTA TELA ---
// Componente para o resumo de confirmação final
const BookingSummaryPreview = ({
    provider,
    selectedProviderService,
    selectedDate,
    selectedTime,
    address,
    durationInMinutes,
    squareMeters,
    subtotal,
    discountAmount,
    finalPrice,
    onShowCancellationPolicy
}: BookingSummaryPreviewProps) => { // Aplicando a interface aqui
    if (!selectedProviderService || !selectedTime) return null;

    const formattedDate = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    const serviceDetailsText = useMemo(() => {
        if (selectedProviderService.pricingType === PricingType.HOURLY && durationInMinutes) {
            return `${durationInMinutes} minutos`;
        }
        if (selectedProviderService.pricingType === PricingType.BY_SIZE && squareMeters) {
            return `${squareMeters} m²`;
        }
        return 'N/A';
    }, [selectedProviderService, durationInMinutes, squareMeters]);

    return (
        <Animated.View style={[styles.card, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Revise seu Agendamento</Text>
            <View style={styles.summaryItem}>
                <Ionicons name="briefcase-outline" size={18} color="#4A90E2" style={styles.summaryIcon} />
                <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>Serviço:</Text> {selectedProviderService.service?.name}
                </Text>
            </View>
            <View style={styles.summaryItem}>
                <Ionicons name="person-outline" size={18} color="#4A90E2" style={styles.summaryIcon} />
                <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>Provedor:</Text> {provider?.fullName}
                </Text>
            </View>
            <View style={styles.summaryItem}>
                <Ionicons name="calendar-outline" size={18} color="#4A90E2" style={styles.summaryIcon} />
                <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>Data e Hora:</Text> {formattedDate}, às {selectedTime}
                </Text>
            </View>
            <View style={styles.summaryItem}>
                <Ionicons name="location-outline" size={18} color="#4A90E2" style={styles.summaryIcon} />
                <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>Endereço:</Text> {address.street}, {address.number} - {address.neighborhood}, {address.city}/{address.state}
                </Text>
            </View>
            {(selectedProviderService.pricingType === PricingType.HOURLY || selectedProviderService.pricingType === PricingType.BY_SIZE) && (
                <View style={styles.summaryItem}>
                    <Ionicons name="timer-outline" size={18} color="#4A90E2" style={styles.summaryIcon} />
                    <Text style={styles.summaryText}>
                        <Text style={styles.summaryLabel}>Detalhes do Serviço:</Text> {serviceDetailsText}
                    </Text>
                </View>
            )}
            <View style={styles.priceSummary}>
                <Text style={styles.priceLabel}>Subtotal:</Text>
                <Text style={styles.priceValue}>R$ {subtotal.toFixed(2).replace('.', ',')}</Text>
            </View>
            {discountAmount > 0 && (
                <View style={styles.priceSummary}>
                    <Text style={styles.priceLabel}>Desconto:</Text>
                    <Text style={[styles.priceValue, styles.discountValue]}>- R$ {discountAmount.toFixed(2).replace('.', ',')}</Text>
                </View>
            )}
            <View style={styles.totalPriceSummary}>
                <Text style={styles.totalPriceLabel}>Total a Pagar:</Text>
                <Text style={styles.totalPriceValue}>R$ {finalPrice.toFixed(2).replace('.', ',')}</Text>
            </View>
            <TouchableOpacity onPress={onShowCancellationPolicy} style={styles.cancellationPolicyLink}>
                <Text style={styles.cancellationPolicyText}>Política de Cancelamento</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

// Componente para o campo de cupom
const CouponInputSection = ({ couponCode, setCouponCode, onApplyCoupon, isApplyingCoupon, discountAmount }: CouponInputSectionProps) => { // Aplicando a interface aqui
    return (
        <Animated.View style={[styles.card, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Cupom de Desconto</Text>
            <View style={styles.couponInputContainer}>
                <TextInput
                    style={styles.couponInput}
                    placeholder="Insira seu código de cupom"
                    value={couponCode}
                    onChangeText={setCouponCode}
                    autoCapitalize="characters"
                    editable={!isApplyingCoupon}
                />
                <TouchableOpacity
                    style={styles.applyCouponButton}
                    onPress={onApplyCoupon}
                    disabled={isApplyingCoupon || !couponCode}
                >
                    {isApplyingCoupon ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Text style={styles.applyCouponButtonText}>Aplicar</Text>
                    )}
                </TouchableOpacity>
            </View>
            {discountAmount > 0 && (
                <Text style={styles.couponAppliedText}>Cupom aplicado! Você economizou R$ {discountAmount.toFixed(2).replace('.', ',')}.</Text>
            )}
        </Animated.View>
    );
};


// --- Constantes para a UI ---
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Cache para disponibilidade do provedor por data
const availabilityCache = new Map<string, { available: ProviderAvailability[], occupiedTimes: string[] }>();

export default function ScheduleServiceScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const typedUser = user as UserProfile | null;

    // CAPTURA DOS PARÂMETROS DA URL
    const { providerId, serviceId, servicePrice } = useLocalSearchParams();

    // NARROWING DOS TIPOS: Garante que os IDs e o preço sejam strings simples, não arrays.
    const paramProviderId = Array.isArray(providerId) ? providerId[0] : providerId;
    const paramServiceId = Array.isArray(serviceId) ? serviceId[0] : serviceId;
    const paramServicePrice = Array.isArray(servicePrice) ? servicePrice[0] : servicePrice;


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

    // --- NOVOS ESTADOS PARA CUPOM E DESCONTO ---
    const [couponCode, setCouponCode] = useState<string>('');
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false);
    // --- FIM NOVOS ESTADOS ---

    const [isLoading, setIsLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);
    const [isFetchingSlots, setIsFetchingSlots] = useState(false);

    const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date());
    const shineAnim = useRef(new Animated.Value(-SCREEN_WIDTH * 0.3)).current;

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

    // --- Lógica de cálculo de preço usando useMemo ---
    const calculatedSubtotal = useMemo(() => {
        if (!selectedProviderService || selectedProviderService.price == null) {
            return 0;
        }

        switch (selectedProviderService.pricingType) {
            case PricingType.HOURLY:
                if (durationInMinutes != null && durationInMinutes > 0) {
                    return (durationInMinutes / 60) * selectedProviderService.price;
                }
                break;
            case PricingType.BY_SIZE:
                if (squareMeters != null && squareMeters > 0) {
                    return squareMeters * selectedProviderService.price;
                }
                break;
            default:
                return selectedProviderService.price;
        }
        return 0;
    }, [selectedProviderService, durationInMinutes, squareMeters]);

    // Preço final após aplicar o desconto
    const finalCalculatedPrice = useMemo(() => {
        const priceAfterDiscount = calculatedSubtotal - discountAmount;
        return priceAfterDiscount > 0 ? priceAfterDiscount : 0;
    }, [calculatedSubtotal, discountAmount]);
    // --- Fim da lógica de cálculo de preço ---
    
    // --- NOVO: Lógica para o indicador de progresso ---
    const currentStep = useMemo(() => {
        if (!selectedTime) return 1; // Seleção de data/hora
        if (!selectedProviderService || (selectedProviderService.pricingType === PricingType.HOURLY && (durationInMinutes == null || durationInMinutes <= 0)) || (selectedProviderService.pricingType === PricingType.BY_SIZE && (squareMeters == null || squareMeters <= 0))) return 2; // Detalhes do serviço
        return 3; // Confirmação
    }, [selectedTime, selectedProviderService, durationInMinutes, squareMeters]);

    const stepTitles = ["Data e Hora", "Detalhes do Serviço", "Confirmação"];
    // --- FIM NOVO: Lógica para o indicador de progresso ---

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
        setSelectedDate(dateObj);
    }, []);

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

    // --- NOVO: Função para aplicar cupom ---
    const handleApplyCoupon = useCallback(async () => {
        if (!couponCode) {
            Alert.alert("Erro", "Por favor, insira um código de cupom.");
            return;
        }
        setIsApplyingCoupon(true);
        try {
            // Simulação de chamada de API para aplicar cupom
            // Em um cenário real, você chamaria seu couponService aqui:
            // const response = await applyCoupon(couponCode, bookingData);
            // setDiscountAmount(response.discountValue);

            // Simulação:
            if (couponCode.toUpperCase() === 'LIMPEJA10') {
                setDiscountAmount(10); // Simula um desconto de R$10
                Alert.alert("Sucesso", "Cupom LIMPEJA10 aplicado! Você ganhou R$ 10 de desconto.");
            } else if (couponCode.toUpperCase() === 'PRIMEIRA20') {
                setDiscountAmount(20); // Simula um desconto de R$20
                Alert.alert("Sucesso", "Cupom PRIMEIRA20 aplicado! Você ganhou R$ 20 de desconto.");
            }
            else {
                setDiscountAmount(0);
                Alert.alert("Erro", "Cupom inválido ou expirado.");
            }
        } catch (error: any) {
            console.error("Erro ao aplicar cupom:", error.response?.data || error.message);
            Alert.alert("Erro", error.response?.data?.message || "Não foi possível aplicar o cupom.");
            setDiscountAmount(0);
        } finally {
            setIsApplyingCoupon(false);
        }
    }, [couponCode]);
    // --- FIM NOVO: Função para aplicar cupom ---

    // --- NOVO: Função para exibir política de cancelamento ---
    const showCancellationPolicy = useCallback(() => {
        Alert.alert(
            "Política de Cancelamento",
            "Você pode cancelar seu agendamento gratuitamente até 24 horas antes do horário programado. Após esse período, uma taxa de cancelamento pode ser aplicada. Para mais detalhes, consulte nossos Termos de Serviço."
        );
    }, []);
    // --- FIM NOVO: Função para exibir política de cancelamento ---

    const handleConfirmBooking = useCallback(async () => {
        // Validações iniciais
        if (!typedUser?.id || !provider?.id || !selectedProviderService?.id || !selectedDate || !selectedTime ||
            !address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
            Alert.alert("Erro", "Por favor, preencha todos os campos necessários para o agendamento, incluindo o endereço completo e selecione um horário.");
            return;
        }

        let requestedDurationMinutes = 0;
        let requestedSquareMeters = 0;
        
        // Validação adicional para campos dinâmicos
        if (selectedProviderService.pricingType === PricingType.HOURLY && (durationInMinutes == null || durationInMinutes <= 0)) {
            Alert.alert("Erro", "Por favor, insira a duração do serviço em minutos.");
            return;
        }
        if (selectedProviderService.pricingType === PricingType.BY_SIZE && (squareMeters == null || squareMeters <= 0)) {
            Alert.alert("Erro", "Por favor, insira a área do serviço em metros quadrados.");
            return;
        }

        setIsBooking(true);

        try {
            if (selectedProviderService.pricingType === PricingType.HOURLY) {
                requestedDurationMinutes = durationInMinutes!;
            } else if (selectedProviderService.pricingType === PricingType.BY_SIZE) {
                requestedSquareMeters = squareMeters!;
            }

            const bookingData: CreateBookingDto = {
                providerId: provider.id,
                providerServiceId: selectedProviderService.id,
                scheduledDate: selectedDate.toISOString().split('T')[0],
                scheduledTime: selectedTime,
                totalPrice: finalCalculatedPrice, // Usa o preço final calculado
                notes: notes,
                address: {
                    ...address,
                    latitude: address.latitude ?? 0,
                    longitude: address.longitude ?? 0,
                },
                ...(selectedProviderService.pricingType === PricingType.HOURLY && { requestedDurationMinutes }),
                ...(selectedProviderService.pricingType === PricingType.BY_SIZE && { requestedSquareMeters }),
                couponCode: discountAmount > 0 ? couponCode : undefined, // Envia o cupom se houver desconto
            };

            const newBooking: BookingDetails = await createBooking(bookingData);

            router.replace({
                pathname: '/(client)/bookings/success',
                params: {
                    bookingId: newBooking.id,
                    totalPrice: newBooking.totalPrice.toString(),
                    paymentMethod: 'PIX', // Pode ser dinâmico no futuro
                }
            });

        } catch (error: any) {
            console.error("Erro ao agendar serviço:", error.response?.data || error.message);
            Alert.alert("Erro", error.response?.data?.message || "Não foi possível agendar o serviço.");
        } finally {
            setIsBooking(false);
        }
    }, [typedUser, provider, selectedDate, selectedTime, address, selectedProviderService, notes, router, durationInMinutes, squareMeters, finalCalculatedPrice, couponCode, discountAmount]);

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
                console.log("Serviço carregado:", foundService);
                
                if(foundService.pricingType === PricingType.HOURLY) {
                    setDurationInMinutes(120);
                } else if(foundService.pricingType === PricingType.BY_SIZE) {
                    setSquareMeters(50);
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
                        latitude: userAddress.latitude ?? 0,
                        longitude: userAddress.longitude ?? 0
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

    const isButtonDisabled = !selectedTime || !selectedProviderService || isBooking ||
        !address.street || !address.number || !address.neighborhood || !address.city || !address.state ||
        (selectedProviderService?.pricingType === PricingType.HOURLY && (durationInMinutes == null || durationInMinutes <= 0)) ||
        (selectedProviderService?.pricingType === PricingType.BY_SIZE && (squareMeters == null || squareMeters <= 0));
    
    // --- Lógica do texto do botão de confirmação usando useMemo ---
    const confirmButtonText = useMemo(() => {
        if (finalCalculatedPrice > 0) {
            return `R$ ${finalCalculatedPrice.toFixed(2).replace('.', ',')}`;
        } else {
            return "Selecione Data, Hora e Endereço";
        }
    }, [finalCalculatedPrice]);
    // --- Fim da lógica do texto do botão de confirmação ---

    // Mova o retorno condicional para *depois* de todas as declarações de Hooks
    if (isLoading) {
        return (
            <View style={styles.centeredFeedback}>
                <Stack.Screen options={{ title: "Carregando..." }} />
                <ActivityIndicator size="large" color="#2A72E7" />
                <Text style={{ marginTop: 10, color: '#555' }}>Carregando dados...</Text>
            </View>
        );
    }

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

            <ScheduleHeader
                onBackPress={() => router.back()}
                headerTitle="Agendar"
                fadeAnim={fadeAnim}
                slideUpAnim={slideUpAnim}
            />
            {/* NOVO: Indicador de Progresso Multi-Etapas */}
            <View style={styles.progressBarContainer}>
                {stepTitles.map((title, index) => (
                    <View key={index} style={styles.progressStep}>
                        <View style={[
                            styles.progressDot,
                            currentStep >= index + 1 ? styles.progressDotActive : null
                        ]} />
                        <Text style={[
                            styles.progressText,
                            currentStep >= index + 1 ? styles.progressTextActive : null
                        ]}>
                            {title}
                        </Text>
                    </View>
                ))}
            </View>
            {/* FIM NOVO: Indicador de Progresso Multi-Etapas */}

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

                <ScheduleCalendar
                    currentDisplayMonth={currentDisplayMonth}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    selectedDate={selectedDate}
                    onDaySelect={handleDaySelect}
                    fadeAnim={fadeAnim}
                    slideUpAnim={slideUpAnim}
                    selectionAnim={selectionAnim}
                    calendarBreatheAnim={calendarBreatheAnim}
                />

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
                            finalPrice={calculatedSubtotal} // Usa o subtotal aqui
                        />
                    </Animated.View>
                )}

                <NotesInputSection
                    notes={notes}
                    setNotes={setNotes}
                    fadeAnim={fadeAnim}
                    slideUpAnim={slideUpAnim}
                />

                {/* NOVO: Seção de Cupom de Desconto */}
                <CouponInputSection
                    couponCode={couponCode}
                    setCouponCode={setCouponCode}
                    onApplyCoupon={handleApplyCoupon}
                    isApplyingCoupon={isApplyingCoupon}
                    discountAmount={discountAmount}
                />
                {/* FIM NOVO: Seção de Cupom de Desconto */}

                {/* NOVO: Resumo de Confirmação Final */}
                <BookingSummaryPreview
                    provider={provider}
                    selectedProviderService={selectedProviderService}
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    address={address}
                    durationInMinutes={durationInMinutes}
                    squareMeters={squareMeters}
                    subtotal={calculatedSubtotal}
                    discountAmount={discountAmount}
                    finalPrice={finalCalculatedPrice}
                    onShowCancellationPolicy={showCancellationPolicy}
                />
                {/* FIM NOVO: Resumo de Confirmação Final */}

            </Animated.ScrollView>

            {/* NOVO: Resumo Flutuante do Agendamento (Sticky Bottom Bar) */}
            {selectedTime && finalCalculatedPrice > 0 && (
                <View style={styles.floatingSummaryContainer}>
                    <View style={styles.floatingSummaryContent}>
                        <Text style={styles.floatingSummaryText}>
                            {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} às {selectedTime}
                        </Text>
                        <Text style={styles.floatingSummaryPrice}>
                            R$ {finalCalculatedPrice.toFixed(2).replace('.', ',')}
                        </Text>
                    </View>
                </View>
            )}
            {/* FIM NOVO: Resumo Flutuante do Agendamento */}

            <ConfirmBookingButton
                isButtonDisabled={isButtonDisabled}
                onConfirmBooking={handleConfirmBooking}
                isBooking={isBooking}
                confirmButtonText={confirmButtonText}
                selectedTime={selectedTime}
                hasSelectedServicePrice={selectedProviderService?.price != null}
            />
        </View>
    );
}

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
    // --- NOVOS ESTILOS ---
    progressBarContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    progressStep: {
        alignItems: 'center',
        flex: 1,
    },
    progressDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#D0D0D0',
        marginBottom: 5,
    },
    progressDotActive: {
        backgroundColor: '#4A90E2',
    },
    progressText: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
    },
    progressTextActive: {
        fontWeight: 'bold',
        color: '#4A90E2',
    },
    floatingSummaryContainer: {
        position: 'absolute',
        bottom: 80, // Acima do ConfirmBookingButton
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
    },
    floatingSummaryContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    floatingSummaryText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    floatingSummaryPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4A90E2',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    couponInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        overflow: 'hidden',
    },
    couponInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333',
    },
    applyCouponButton: {
        backgroundColor: '#4A90E2',
        paddingVertical: 12,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
    },
    applyCouponButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    couponAppliedText: {
        marginTop: 10,
        fontSize: 14,
        color: '#28A745',
        fontWeight: 'bold',
    },
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    summaryIcon: {
        marginRight: 10,
    },
    summaryText: {
        fontSize: 16,
        color: '#555',
    },
    summaryLabel: {
        fontWeight: 'bold',
        color: '#333',
    },
    priceSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
        paddingVertical: 5,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    priceLabel: {
        fontSize: 16,
        color: '#555',
    },
    priceValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    discountValue: {
        color: '#28A745',
    },
    totalPriceSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 2,
        borderTopColor: '#4A90E2',
    },
    totalPriceLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    totalPriceValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4A90E2',
    },
    cancellationPolicyLink: {
        marginTop: 15,
        alignSelf: 'flex-start',
    },
    cancellationPolicyText: {
        fontSize: 14,
        color: '#4A90E2',
        textDecorationLine: 'underline',
    },
    // --- FIM NOVOS ESTILOS ---
});