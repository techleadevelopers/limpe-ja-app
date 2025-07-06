// LimpeJaApp/app/(client)/schedule-service.tsx
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
// IMPORTANTE: Substitua os mocks pelas importações reais dos seus serviços
import { getProviderAvailability, getProviderDetails } from '../../services/providerService';
import { createBooking } from '../../services/bookingService';
import { getUserProfile } from '../../services/clientService'; // Para obter o endereço do cliente
import { useAuth } from '../../../hooks/useAuth'; // Para obter dados do usuário logado

// Tipagens do seu backend original
import {
    ProviderDisplayInfo,
    ProviderAvailability,
    ProviderServiceOffering,
    ServiceDetailsDto,
    VerificationStatus,
} from '../../types/backend/providers';
import { CreateBookingDto, BookingAddress, BookingDetails } from '../../types/backend/bookings';
import { UserProfile } from '../../types/backend/users'; // Importa UserProfile

// Importar formatDate de utils/helpers
import { formatDate } from '../../../utils/helpers';

// --- Importar COMPONENTES DE UI ---
import CalendarHeader from './components/schedule/CalendarHeader';
import TimeSlotsSection from './components/schedule/TimeSlotsSection';
import ProviderBrief from './components/schedule/ProviderBrief';
import AddressSection from './components/schedule/AddressSection';

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
    const { user } = useAuth(); // Obtém os dados do usuário logado
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
    
    // NOVAS ANIMAÇÕES PARA RIQUEZA VISUAL
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const backgroundFloatAnim = useRef(new Animated.Value(0)).current;
    const headerGlowAnim = useRef(new Animated.Value(0)).current;
    const calendarBreatheAnim = useRef(new Animated.Value(1)).current;

    // INICIALIZAR ANIMAÇÕES MODERNAS
    useEffect(() => {
        // Animação de entrada suave
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

        // Animação de pulso contínua para elementos ativos
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

        // Animação de rotação suave para elementos de fundo
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

        // Animação flutuante para elementos de fundo
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

        // Animação de brilho do header
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

        // Respiração suave do calendário
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
        // Animação de feedback ao navegar
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
        // Animação de feedback ao navegar
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

        // Animação rica para seleção
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
            // Animação de feedback mais elaborada
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
        // Validação dos campos necessários
        if (
            !user?.id || // Verifica se o usuário está logado
            !provider?.id || // Verifica se os dados do provedor foram carregados
            !selectedProviderService?.id || // Verifica se um serviço do provedor foi selecionado
            !selectedDate || // Verifica se uma data foi selecionada
            !selectedTime || // Verifica se um horário foi selecionado
            !address.street || !address.number || !address.neighborhood || !address.city || !address.state // Verifica campos essenciais do endereço
        ) {
            Alert.alert("Erro", "Por favor, preencha todos os campos necessários para o agendamento, incluindo o endereço completo e selecione um horário.");
            return;
        }

        setIsBooking(true); // Ativa o estado de carregamento para o botão

        try {
            // Monta o DTO para a criação do agendamento
            const bookingData: CreateBookingDto = {
                providerId: provider.id,
                providerServiceId: selectedProviderService.id,
                scheduledDate: selectedDate.toISOString().split('T')[0], // Formata a data para YYYY-MM-DD
                scheduledTime: selectedTime,
                totalPrice: selectedProviderService.price,
                notes: notes,
                address: address,
            };

            // Chama o serviço real para criar o agendamento
            const newBooking: BookingDetails = await createBooking(bookingData);

            // Navega para a tela de sucesso, passando os detalhes do agendamento
            router.replace({
                pathname: '/(client)/bookings/success', // Caminho para a tela de sucesso
                params: {
                    bookingId: newBooking.id,
                    totalPrice: newBooking.totalPrice.toString(),
                    paymentMethod: 'PIX', // Define o método de pagamento
                }
            } as any);

        } catch (error: any) {
            console.error("Erro ao agendar serviço:", error.response?.data || error.message);
            Alert.alert("Erro", error.response?.data?.message || "Não foi possível agendar o serviço.");
        } finally {
            setIsBooking(false); // Desativa o estado de carregamento
        }
    }, [user, provider, selectedDate, selectedTime, address, selectedProviderService, notes, router]);

    // Função para pré-carregar a disponibilidade de horários para os meses vizinhos
    const prefetchAvailability = useCallback(async (provId: string | undefined, date: Date) => {
        if (!provId) return; // Sai se o ID do provedor não estiver disponível

        const dateString = date.toISOString().split('T')[0]; // Formata a data para YYYY-MM-DD
        const cacheKey = `${provId}-${dateString}`; // Cria uma chave única para o cache

        // Verifica se a disponibilidade para esta data já está no cache
        if (availabilityCache.has(cacheKey)) {
            return; // Retorna se os dados já foram cacheados
        }

        try {
            // Chama o serviço para obter a disponibilidade do provedor
            const response = await getProviderAvailability(provId, dateString);
            availabilityCache.set(cacheKey, response); // Armazena a resposta no cache
        } catch (error) {
            console.error(`[Prefetch] Erro ao pré-carregar disponibilidade para ${dateString}:`, error);
        }
    }, []);

    // Efeito para carregar os dados iniciais da tela (provedor, serviço, endereço do usuário)
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true); // Inicia o estado de carregamento

            // Validações iniciais para garantir que os parâmetros necessários estão presentes
            if (!paramProviderId || !paramServiceId || !user?.id) {
                Alert.alert("Erro de Navegação", "Dados essenciais ausentes. Tente novamente.");
                router.replace('/explore'); // Retorna para a tela de exploração se os dados estiverem incompletos
                setIsLoading(false);
                return;
            }

            try {
                // Busca os detalhes do provedor
                const fetchedProvider = await getProviderDetails(paramProviderId);
                setProvider(fetchedProvider);

                // Busca o serviço específico selecionado pelo usuário
                const foundService = fetchedProvider.providerServices?.find(
                    ps => ps.id === paramServiceId && ps.service && ps.service.id && ps.service.name
                );

                // Verifica se o serviço foi encontrado
                if (!foundService) {
                    Alert.alert("Erro", "O serviço selecionado não está disponível para este provedor.");
                    router.replace('/explore'); // Retorna para a tela de exploração
                    setIsLoading(false);
                    return;
                }
                setSelectedProviderService(foundService); // Define o serviço selecionado

                // Preenche o endereço do cliente se ele estiver disponível no perfil do usuário
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
                    // Alerta o usuário se o endereço não estiver completo
                    Alert.alert(
                        "Endereço Necessário",
                        "Seu endereço não está completo. Por favor, preencha para prosseguir."
                    );
                }

                // Define a data selecionada como a data atual inicialmente
                setSelectedDate(new Date());

                // Pré-carrega a disponibilidade para o mês atual e os meses adjacentes
                const today = new Date();
                const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                await prefetchAvailability(paramProviderId, today);
                await prefetchAvailability(paramProviderId, nextMonth);
                await prefetchAvailability(paramProviderId, prevMonth);

            } catch (error: any) {
                console.error("Erro ao carregar dados iniciais:", error.response?.data || error.message);
                Alert.alert("Erro", error.response?.data?.message || "Não foi possível carregar os dados para agendamento.");
                router.replace('/explore'); // Retorna para a tela de exploração em caso de erro
            } finally {
                setIsLoading(false); // Finaliza o estado de carregamento
            }
        };
        loadInitialData(); // Chama a função de carregamento de dados
    }, [paramProviderId, user?.id, user?.address, paramServiceId, router, prefetchAvailability]);

    // Animação para o brilho do calendário (shine)
    const animateShine = useCallback(() => {
        shineAnim.setValue(-SCREEN_WIDTH * 0.3); // Posição inicial fora da tela
        Animated.timing(shineAnim, {
            toValue: SCREEN_WIDTH + (SCREEN_WIDTH * 0.3), // Move para fora da tela no lado oposto
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(() => animateShine()); // Loop contínuo
    }, [shineAnim]);

    useEffect(() => {
        animateShine(); // Inicia a animação do brilho quando o componente monta
    }, [animateShine]);

    // Função para gerar os dias do calendário para o mês exibido
    const generateCalendarDays = useCallback((dateInMonth: Date) => {
        const year = dateInMonth.getFullYear();
        const month = dateInMonth.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 para Domingo, 1 para Segunda, etc.

        const days: Array<{ day: number, month: 'current' | 'prev' | 'next', dateObj: Date }> = [];
        const prevMonthLastDay = new Date(year, month, 0).getDate(); // Último dia do mês anterior

        // Adiciona os dias do mês anterior que caem no início da semana
        for (let i = 0; i < startDayOfWeek; i++) {
            const day = prevMonthLastDay - startDayOfWeek + 1 + i;
            days.push({ day, month: 'prev', dateObj: new Date(year, month - 1, day) });
        }
        // Adiciona os dias do mês atual
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, month: 'current', dateObj: new Date(year, month, i) });
        }
        // Calcula o total de células necessárias (até 42 para cobrir todos os casos)
        const totalCells = days.length > 35 ? 42 : 35;
        const remainingCells = totalCells - days.length;
        // Adiciona os dias do próximo mês para preencher o calendário
        for (let i = 1; i <= remainingCells; i++) {
            days.push({ day: i, month: 'next', dateObj: new Date(year, month + 1, i) });
        }
        setCalendarDays(days); // Atualiza o estado com os dias calculados
    }, []);

    // Efeito para gerar os dias do calendário quando o mês exibido muda
    useEffect(() => {
        generateCalendarDays(currentDisplayMonth);
    }, [currentDisplayMonth, generateCalendarDays]);

    // Efeito para buscar e processar os slots de horário para a data selecionada
    useEffect(() => {
        const fetchAndProcessSlotsForDate = async () => {
            // Só executa se tivermos os dados necessários
            if (!provider?.id || !selectedDate) {
                setDisplaySlotsInfo([]); // Limpa os slots se os dados não estiverem prontos
                setSelectedTime(null); // Limpa o horário selecionado
                return;
            }

            setIsFetchingSlots(true); // Ativa o indicador de carregamento para os slots
            const dateString = selectedDate.toISOString().split('T')[0]; // Pega a data no formato YYYY-MM-DD
            const cacheKey = `${provider.id}-${dateString}`; // Chave para o cache

            let backendResponse;
            if (availabilityCache.has(cacheKey)) {
                // Usa dados do cache se disponíveis
                backendResponse = availabilityCache.get(cacheKey);
            } else {
                try {
                    // Chama o serviço para obter a disponibilidade do provedor para a data selecionada
                    backendResponse = await getProviderAvailability(provider.id, dateString);
                    availabilityCache.set(cacheKey, backendResponse); // Armazena no cache
                } catch (err: any) {
                    console.error("Erro ao carregar horários para data:", err.response?.data || err.message);
                    Alert.alert("Erro", err.response?.data?.message || "Não foi possível carregar os horários disponíveis.");
                    setDisplaySlotsInfo([]); // Limpa os slots em caso de erro
                    setIsFetchingSlots(false);
                    return;
                }
            }

            // Processa a resposta do backend para exibir os slots
            const providerConfiguredSlots: ProviderAvailability[] = backendResponse?.available || [];
            const occupiedTimesFromBackend: string[] = backendResponse?.occupiedTimes || [];
            const dayOfWeekSelected = selectedDate.getDay(); // Dia da semana da data selecionada (0=Domingo)

            // Cria um Set com os horários configurados pelo provedor para o dia da semana selecionado
            const configuredStartTimesForSelectedDay = new Set(
                providerConfiguredSlots
                    .filter(configSlot => configSlot.dayOfWeek === dayOfWeekSelected)
                    .map(configSlot => configSlot.startTime)
            );

            // Define o intervalo de horários a serem exibidos (ex: 8h às 20h, a cada 30 minutos)
            const allDisplayableTimes: string[] = [];
            const startHour = 8;
            const endHour = 20;

            for (let h = startHour; h < endHour; h++) {
                for (let m = 0; m < 60; m += 30) {
                    allDisplayableTimes.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                }
            }

            // Mapeia os horários para o formato de exibição, verificando disponibilidade
            const finalDisplaySlots: Array<{ time: string; isAvailable: boolean }> = allDisplayableTimes.map(time => {
                const [hours, minutes] = time.split(':').map(Number);
                const slotDateTime = new Date(selectedDate); // Cria um objeto Date com a data selecionada
                slotDateTime.setHours(hours, minutes, 0, 0); // Define o horário do slot

                const isPast = slotDateTime.getTime() < new Date().getTime(); // Verifica se o horário já passou
                const isConfiguredByProvider = configuredStartTimesForSelectedDay.has(time); // Verifica se o provedor configurou este horário
                const isSlotOccupied = occupiedTimesFromBackend.includes(time); // Verifica se o horário está ocupado

                // O slot está disponível se foi configurado pelo provedor, não está ocupado e não é um horário passado
                return {
                    time: time,
                    isAvailable: isConfiguredByProvider && !isSlotOccupied && !isPast,
                };
            });

            setDisplaySlotsInfo(finalDisplaySlots); // Atualiza o estado com os slots de horário
            setIsFetchingSlots(false); // Finaliza o carregamento dos slots
        };
        fetchAndProcessSlotsForDate(); // Executa a função de busca e processamento
    }, [selectedDate, provider?.id]); // Dependências do efeito: data selecionada e ID do provedor

    // Tela de carregamento inicial
    if (isLoading) {
        return (
            <View style={styles.centeredFeedback}>
                <Stack.Screen options={{ title: "Carregando..." }} />
                <ActivityIndicator size="large" color="#2A72E7" />
                <Text style={{ marginTop: 10, color: '#555' }}>Carregando dados...</Text>
            </View>
        );
    }

    // Verifica se o botão de confirmação deve estar desabilitado
    const isButtonDisabled = !selectedTime || !selectedProviderService || isBooking ||
        !address.street || !address.number || !address.neighborhood || !address.city || !address.state;

    // Gradientes modernos para elementos visuais
    const gradientColors = [
        'rgba(173, 216, 230, 0.15)',
        'rgba(135, 206, 250, 0.25)',
        'rgba(100, 149, 237, 0.35)',
        'rgba(65, 153, 225, 0.25)',
    ];

    const backgroundGradientColors = [
        'rgba(248, 250, 252, 1)',
        'rgba(241, 245, 249, 1)',
        'rgba(248, 250, 252, 0.95)',
    ];

    return (
        <View style={styles.screenContainer}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Elementos de fundo animados para riqueza visual */}
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

            {/* Header personalizado com gradiente e animação */}
            <Animated.View style={[
                { paddingTop: HEADER_HEIGHT_ADJUST },
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }]
                }
            ]}>
                {/* NOVO HEADER SUPERIOR */}
                <LinearGradient
                    colors={['#4285F4', '#2A72E7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.topHeaderGradient}
                >
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Agendar</Text>
                </LinearGradient>
                {/* FIM DO NOVO HEADER SUPERIOR */}

                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
                    style={styles.headerGradient}
                >
                    <BlurView intensity={20} tint="light" style={styles.headerBlur}>
                        <CalendarHeader
                            currentDisplayMonth={currentDisplayMonth}
                            onPrevMonth={handlePrevMonth}
                            onNextMonth={handleNextMonth}
                            routerBack={() => router.back()} // Botão de voltar no header
                            MONTH_NAMES_PT={MONTH_NAMES_PT}
                        />
                    </BlurView>
                </LinearGradient>
            </Animated.View>

            {/* ScrollView principal com os conteúdos da tela */}
            <Animated.ScrollView 
                contentContainerStyle={styles.scrollContentContainer}
                style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }]
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Seção do Provedor */}
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <ProviderBrief
                        provider={provider}
                        serviceName={selectedProviderService?.service?.name}
                        isLoading={isLoading}
                    />
                </Animated.View>

                {/* Seção do Endereço */}
                <Animated.View style={{ 
                    transform: [{ scale: scaleAnim }],
                    opacity: fadeAnim 
                }}>
                    <AddressSection
                        address={address}
                        setAddress={setAddress}
                        shineAnim={shineAnim} // Passa a animação para o componente de endereço
                        isLoading={isLoading}
                        isInputMode={!user?.address?.street || !user?.address?.number || !user?.address?.neighborhood || !user?.address?.city || !user?.address?.state} // Indica se o endereço precisa ser preenchido
                    />
                </Animated.View>

                {/* Calendário com visual ainda mais rico */}
                <Animated.View style={{
                    transform: [
                        { scale: calendarBreatheAnim }, // Animação de respiração do calendário
                        { scale: scaleAnim } // Animação de escala geral
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
                                {/* Nomes dos dias da semana */}
                                <View style={styles.dayNamesRow}>
                                    {DAY_NAMES_PT.map((dayName, index) => (
                                        <Animated.Text 
                                            key={dayName} 
                                            style={[
                                                styles.dayNameText,
                                                {
                                                    opacity: fadeAnim, // Animação de fade
                                                    transform: [{ // Animação de slide sutil para os nomes dos dias
                                                        translateY: slideUpAnim.interpolate({
                                                            inputRange: [0, 50],
                                                            outputRange: [0, index * 5] // Efeito cascata
                                                        })
                                                    }]
                                                }
                                            ]}
                                        >
                                            {dayName.slice(0, 3)} {/* Exibe apenas as 3 primeiras letras */}
                                        </Animated.Text>
                                    ))}
                                </View>
                                {/* Grade de dias do calendário */}
                                <View style={styles.calendarGrid}>
                                    {calendarDays.map((dayInfo, index) => {
                                        const isSelected = selectedDate.toDateString() === dayInfo.dateObj.toDateString() && dayInfo.month === 'current';
                                        const isPast = dayInfo.dateObj < new Date(new Date().setHours(0, 0, 0, 0)) && dayInfo.dateObj.toDateString() !== new Date().toDateString(); // Verifica se é um dia passado (mas não o dia atual)
                                        const isWeekend = dayInfo.dateObj.getDay() === 0 || dayInfo.dateObj.getDay() === 6; // Verifica se é fim de semana

                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                style={[
                                                    styles.dayCell,
                                                    isSelected && styles.dayCellSelected, // Estilo para dia selecionado
                                                    { 
                                                        transform: [{ 
                                                            scale: isSelected ? selectionAnim : 1 // Aplica animação de escala ao dia selecionado
                                                        }] 
                                                    }
                                                ]}
                                                onPress={() => dayInfo.month === 'current' && handleDaySelect(dayInfo.dateObj)} // Apenas permite selecionar dias do mês atual
                                                disabled={dayInfo.month !== 'current' || isPast} // Desabilita dias de meses anteriores/futuros ou dias passados
                                            >
                                                {/* Gradiente para o dia selecionado */}
                                                {isSelected && (
                                                    <LinearGradient
                                                        colors={['#4285F4', '#2A72E7']}
                                                        style={styles.selectedDayGradient}
                                                    />
                                                )}
                                                {/* Texto do dia */}
                                                <Text style={[
                                                    styles.dayText,
                                                    dayInfo.month !== 'current' && styles.dayTextNotInMonth, // Estilo para dias fora do mês
                                                    isSelected && styles.dayTextSelected, // Estilo para dia selecionado
                                                    isPast && dayInfo.month === 'current' && styles.dayTextPast, // Estilo para dias passados
                                                    !isSelected && !isPast && dayInfo.month === 'current' && (isWeekend ? styles.dayTextCurrentWeekend : styles.dayTextCurrentWeekday), // Estilo para dias atuais (weekday/weekend)
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

                {/* Seção de Horários Disponíveis */}
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

            </Animated.ScrollView>

            {/* Botão de Confirmação de Agendamento */}
            <View style={styles.confirmButtonWrapper}>
                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        isButtonDisabled && styles.confirmButtonDisabled // Estilo para botão desabilitado
                    ]}
                    onPress={handleConfirmBooking}
                    disabled={isButtonDisabled} // Desabilita o botão se os dados não estiverem completos
                >
                    {isBooking ? (
                        <ActivityIndicator color="#FFFFFF" /> // Indicador de carregamento enquanto agenda
                    ) : (
                        <Text style={styles.confirmButtonText}>
                            {selectedTime && selectedProviderService?.price ?
                                `Agendar (R$ ${selectedProviderService.price.toFixed(2).replace('.', ',')})` : // Mostra o preço se horário e serviço estiverem selecionados
                                "Selecione Data, Hora e Endereço" // Texto padrão se algo estiver faltando
                            }
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

// Estilos fixos para as células do dia do calendário
const FIXED_DAY_CELL_SIZE = 40;

// Estilos gerais da tela
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
        paddingBottom: 120, // Espaço para o botão fixo no final
        paddingTop: 10,
    },

    // Estilos para as decorações de fundo animadas
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

    // Estilos para o header com gradiente e blur
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

    // NOVO: Estilos para o header superior azul gradiente
    topHeaderGradient: {
        width: '100%',
        paddingTop: Platform.OS === 'ios' ? 25 : 23, // Adjust for notch
        paddingBottom: 15,
        bottom: 80,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
        borderBottomLeftRadius: 50, // No border radius for this header
        borderBottomRightRadius: 50, // No border radius for this header
        marginBottom: Platform.OS === 'ios' ? 0 : -80, // Ajuste para evitar sobreposição com a barra de status
    },
    backButton: {
        position: 'absolute',
        left: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 15,
        zIndex: 1,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1, // Allow title to take up available space
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 15,
    },
    // FIM DO NOVO HEADER SUPERIOR

    // Estilos para o container do calendário
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

    // Estilos do botão de confirmação
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

    // Estilos para os inputs de endereço (mantidos para compatibilidade)
    addressInputContainer: {
        backgroundColor: '#FFFFFF',
        padding: 0,
        marginHorizontal: 15,
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    addressInputTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#333',
        paddingLeft: 10,
        backgroundColor: '#F7F7F7',
        borderRadius: 8,
        borderColor: '#E0E0E0',
        borderWidth: 1,
        paddingHorizontal: 15,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderColor: '#E0E0E0',
        borderWidth: 1,
    },
    inputIcon: {
        marginRight: 10,
    },
    inputRow: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    inputSmall: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#333',
        paddingLeft: 10,
        backgroundColor: '#F7F7F7',
        borderRadius: 8,
        borderColor: '#E0E0E0',
        borderWidth: 1,
        paddingHorizontal: 15,
    },
    // Estilos de esqueleto (mockados, para quando os dados ainda estão carregando)
    providerBriefSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 15,
        marginTop: 20,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
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