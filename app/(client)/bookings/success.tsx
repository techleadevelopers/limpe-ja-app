// LimpeJaApp/app/(client)/bookings/success.tsx
import { BlurView } from 'expo-blur';
import * as Calendar from 'expo-calendar';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    ColorValue,
    Dimensions,
    Easing,
    Platform,
    ScrollView,
    StyleSheet
} from 'react-native';
import Toast from 'react-native-toast-message';

// Importar componentes refatorados
import BookingSummaryCard from '../../../components/client/booking/success/BookingSummaryCard';
import MainActionButtons from '../../../components/client/booking/success/MainActionButtons';
import SuccessHeader from '../../../components/client/booking/success/SuccessHeader';
import SuccessLoadingError from '../../../components/client/booking/success/SuccessLoadingError';

// Importar serviços e tipagens
import { getBookingDetails } from '../../../services/bookingService';
import { getProviderDetails } from '../../../services/providerService';
import { BookingDetails } from '../../../types/backend/bookings';
import { ProviderDisplayInfo } from '../../../types/backend/providers';

// NOVO: Importar serviços e tipagens para PIX
import { useAuth } from '../../../hooks/useAuth'; // Importar useAuth para obter userId
import { createPixCharge } from '../../../services/paymentService';
import { CreatePixChargeDto, PixChargeResponseDto } from '../../../types/backend/payments';

// Constantes de estilo
const SCREEN_WIDTH = Dimensions.get('window').width;
const headerPrimaryColor = '#4A90E2'; // Azul Principal
const headerSecondaryColor = '#A8D8FF'; // Azul Secundário
const iconColor = '#4A90E2'; // Azul para Ícones
const successColor = '#28a745'; // Verde de Sucesso

const backgroundGradientColors: readonly [ColorValue, ColorValue, ColorValue, ColorValue] = [
  '#E0F7FA',
  '#B3E0FF',
  '#ADD8E6',
  '#CDE8F7',
];

const abstractBlobColors: readonly [ColorValue, ColorValue, ColorValue] = [
  'rgba(173, 216, 230, 0.4)',
  'rgba(65, 153, 225, 0.15)',
  'rgba(133, 168, 231, 0.05)',
];


export default function SuccessScreen() {
  const { bookingId, paymentMethod, totalPrice: totalPriceParam } = useLocalSearchParams<{ bookingId?: string; paymentMethod?: string; totalPrice?: string }>();
  const router = useRouter();
  const { user } = useAuth(); // Obter o usuário logado para pegar o userId

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [providerRating, setProviderRating] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pixChargeDetails, setPixChargeDetails] = useState<PixChargeResponseDto | null>(null);
  const [pixGenerationError, setPixGenerationError] = useState<string | null>(null);

  // Animação para o conteúdo principal aparecer suavemente
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(50)).current;

  // Animações para o "tick" no cabeçalho
  const headerTickOpacity = useRef(new Animated.Value(0)).current;
  const headerTickScale = useRef(new Animated.Value(0.5)).current;

  // Animação para a "bolha" de fundo
  const blobTranslateY = useRef(new Animated.Value(0)).current;
  const blobScale = useRef(new Animated.Value(1)).current;
  const blobRotate = useRef(new Animated.Value(0)).current;

  const animateBlob = useCallback(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(blobTranslateY, {
          toValue: -20,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(blobScale, {
          toValue: 1.1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(blobRotate, {
          toValue: 1,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [blobTranslateY, blobScale, blobRotate]);

  useEffect(() => {
    animateBlob();
  }, [animateBlob]);


  const fetchBookingAndProviderDetails = useCallback(async () => {
    console.log("[SuccessScreen] fetchBookingAndProviderDetails - Iniciando fetch.");
    console.log("[SuccessScreen] fetchBookingAndProviderDetails - bookingId:", bookingId);
    console.log("[SuccessScreen] fetchBookingAndProviderDetails - paymentMethod:", paymentMethod);
    console.log("[SuccessScreen] fetchBookingAndProviderDetails - totalPriceParam:", totalPriceParam);

    if (!bookingId) {
      setError("ID do agendamento não fornecido.");
      setIsLoading(false);
      return;
    }
    if (!user?.id) { // Verificar se o userId está disponível
      setError("Usuário não autenticado ou ID de usuário ausente.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setPixGenerationError(null);
    try {
      const fetchedBooking = await getBookingDetails(bookingId);
      setBooking(fetchedBooking);
      console.log("[SuccessScreen] fetchBookingAndProviderDetails - Booking real carregado:", fetchedBooking);
      console.log("[SuccessScreen - DEBUG] Valor de scheduledDateTime vindo do backend:", fetchedBooking?.scheduledDateTime);


      if (fetchedBooking?.providerId) {
        const providerDetails: ProviderDisplayInfo = await getProviderDetails(fetchedBooking.providerId);
        setProviderRating(providerDetails.averageRating);
        console.log("[SuccessScreen] fetchBookingAndProviderDetails - Detalhes do provedor carregados para rating.");
      }

      if (paymentMethod === 'PIX' && totalPriceParam && !pixChargeDetails) {
        const amount = parseFloat(totalPriceParam);
        console.log("[SuccessScreen] fetchBookingAndProviderDetails - Tentando gerar PIX. Amount:", amount);

        if (isNaN(amount)) {
          setPixGenerationError("Valor total inválido para gerar o PIX.");
          console.error("[SuccessScreen] fetchBookingAndProviderDetails - Erro: Valor total é NaN.");
          return;
        }

        try {
            const pixChargeData: CreatePixChargeDto = {
              amount: amount,
              description: `Agendamento ${fetchedBooking.serviceName || 'Serviço'} com ${fetchedBooking.providerFullName}`,
              bookingId: fetchedBooking.id,
              providerId: fetchedBooking.providerId,
            };
            console.log("[SuccessScreen] fetchBookingAndProviderDetails - PixChargeData para backend:", pixChargeData);

            // CORREÇÃO AQUI: Passar o userId para createPixCharge
            const pixResponse: PixChargeResponseDto = await createPixCharge(user.id, pixChargeData);
            setPixChargeDetails(pixResponse);
            console.log("[SuccessScreen] fetchBookingAndProviderDetails - Resposta PIX recebida:", pixResponse);
            Toast.show({
                type: 'success',
                text1: 'PIX Gerado com Sucesso!',
                text2: 'Use o código para finalizar o pagamento.',
                visibilityTime: 4000,
            });
        } catch (pixErr: any) {
            console.error("[SuccessScreen] fetchBookingAndProviderDetails - Erro ao gerar PIX (API):", pixErr.response?.data?.message || pixErr.message, pixErr);
            setPixGenerationError(pixErr.response?.data?.message || "Não foi possível gerar a cobrança PIX.");
        }
      } else {
        console.log("[SuccessScreen] fetchBookingAndProviderDetails - PIX Generation SKIPPED. paymentMethod:", paymentMethod, "totalPriceParam:", totalPriceParam, "pixChargeDetails exists:", !!pixChargeDetails);
      }

    } catch (err: any) {
      console.error("[SuccessScreen] Erro ao buscar detalhes do agendamento (API):", err.response?.data?.message || err.message, err);
      setError(err.response?.data?.message || "Não foi possível carregar os detalhes do agendamento.");
      setBooking(null);
    } finally {
      setIsLoading(false);
      console.log("[SuccessScreen] fetchBookingAndProviderDetails - Finalizado.");
    }
  }, [bookingId, paymentMethod, totalPriceParam, pixChargeDetails, user?.id]);


  useEffect(() => {
    const revealDelay = 300;
    const pixGenerationDelay = 2000;

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(headerTickOpacity, {
            toValue: 1,
            duration: 500,
            delay: 300,
            useNativeDriver: true,
          }),
          Animated.spring(headerTickScale, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setTimeout(() => {
            fetchBookingAndProviderDetails();
        }, pixGenerationDelay);
      });
    }, revealDelay);

    return () => clearTimeout(timer);
  }, [fetchBookingAndProviderDetails, contentOpacity, contentTranslateY, headerTickOpacity, headerTickScale]);

  const handleGoToBookings = useCallback(() => {
    router.replace({ pathname: '/(client)/bookings', params: { highlightNew: true } } as any);
  }, [router]);

  const handleGoHome = useCallback(() => {
    router.replace('/(client)/explore' as any);
  }, [router]);

  const handleAddToCalendar = useCallback(async () => {
    if (!booking) {
      Alert.alert("Erro", "Informações do agendamento não carregadas para adicionar ao calendário.");
      return;
    }
    if (!booking.address) {
      Alert.alert("Erro", "Endereço do agendamento não disponível para adicionar ao calendário.");
      return;
    }

    // Alterado para usar scheduledDateTime
    const startDate = new Date(booking.scheduledDateTime);
    const durationMinutes = booking.serviceDurationMinutes || 60;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        const defaultCalendar = await Calendar.getDefaultCalendarAsync();
        const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
          title: `${booking.serviceName} com ${booking.providerFullName}`,
          location: `${booking.address.street}, ${booking.address.number}, ${booking.address.city}`,
          notes: `Agendamento ID: ${booking.id} - ${booking.notes || 'Nenhuma observação.'}`,
          startDate: startDate,
          endDate: endDate,
          alarms: [{ relativeOffset: -60 }],
        });
        Toast.show({
          type: 'success',
          text1: 'Sucesso!',
          text2: 'Agendamento adicionado ao seu calendário.',
          visibilityTime: 4000,
        });
      } else {
        Alert.alert("Permissão Negada", "Não foi possível adicionar ao calendário sem permissão. Por favor, conceda acesso nas configurações do seu dispositivo.");
      }
    } catch (error) {
      console.error("Erro ao adicionar ao calendário:", error);
      Toast.show({
        type: 'error',
        text1: 'Erro ao adicionar ao calendário',
        text2: 'Por favor, tente novamente mais tarde.',
        visibilityTime: 4000,
      });
    }
  }, [booking]);

  const handleContactProvider = useCallback(() => {
    if (booking?.providerId && booking?.providerFullName) {
      router.push({ pathname: '/(client)/messages/[chatId]', params: { chatId: booking.providerId, recipientName: booking.providerFullName } } as any);
    } else {
      Alert.alert("Erro", "ID ou nome do prestador não disponível para iniciar o chat.");
    }
  }, [booking, router]);

  const handleCopyPixQrCode = useCallback(() => {
    if (pixChargeDetails?.brCode) {
      Clipboard.setString(pixChargeDetails.brCode);
      Toast.show({
        type: 'info',
        text1: 'Código PIX copiado!',
        text2: 'Cole no seu aplicativo bancário para finalizar o pagamento.',
        visibilityTime: 4000,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Nenhum código PIX disponível para copiar.',
        visibilityTime: 4000,
      });
    }
  }, [pixChargeDetails]);


  // O componente SuccessLoadingError já lida com isLoading e error.
  // Se booking for null, ele também exibirá o erro.
  // NOVO: Incluir pixGenerationError no check de erro
  // A tela só deve mostrar erro se o booking não carregou (já que não tem mais Lottie para esperar)
  if (isLoading || error || pixGenerationError || !booking) {
    return (
      <SuccessLoadingError
        isLoading={isLoading}
        error={error || pixGenerationError}
        headerPrimaryColor={headerPrimaryColor}
        onRetryPress={fetchBookingAndProviderDetails}
      />
    );
  }

  // Define um valor para o ZIndex da bolha
  const blobZIndex = -1;

  return (
    <LinearGradient // <<< Gradiente de fundo geral para a tela
      colors={backgroundGradientColors}
      start={{ x: 0.1, y: 0.1 }}
      end={{ x: 0.9, y: 0.9 }}
      style={styles.screenGradientBackground} // Novo estilo para o gradiente de tela
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- Elemento de fundo abstrato animado (Bolha) --- */}
      <Animated.View
        style={[
          styles.animatedBlob,
          {
            transform: [
              { translateY: blobTranslateY },
              { scale: blobScale },
              { rotate: blobRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
            ],
            zIndex: blobZIndex, // Garante que a bolha fique no fundo
          },
        ]}
      >
        <LinearGradient
          colors={abstractBlobColors}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.8, y: 0.8 }}
          style={StyleSheet.absoluteFillObject}
        />
        <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFillObject} />
      </Animated.View>
      {/* --- FIM do Elemento de fundo abstrato animado (Bolha) --- */}


      {booking && (
        <ScrollView // << ENVOLVE O CONTEÚDO PRINCIPAL COM SCROLLVIEW
          contentContainerStyle={styles.scrollContentContainer} // Estilo para o conteúdo do ScrollView
        >
          <Animated.View // Conteúdo principal animado
            style={[
              styles.mainContentAnimatedWrapper, // NOVO ESTILO: Envolve o conteúdo principal
              { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] },
            ]}
          >
            <SuccessHeader
              headerPrimaryColor={headerPrimaryColor}
              headerSecondaryColor={headerSecondaryColor}
              successColor={successColor}
            />

            <BookingSummaryCard
              booking={booking}
              providerRating={providerRating}
              pixChargeDetails={pixChargeDetails}
              paymentMethod={paymentMethod}
              contentOpacity={contentOpacity}
              contentTranslateY={contentTranslateY}
              iconColor={iconColor}
              successColor={successColor}
              headerPrimaryColor={headerPrimaryColor}
            />

            <MainActionButtons
              onGoToBookings={handleGoToBookings}
              onGoHome={handleGoHome}
              headerPrimaryColor={headerPrimaryColor}
            />
          </Animated.View>
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Este será sobreposto pelo gradiente
  },
  screenGradientBackground: {
    flex: 1,
    paddingTop: 50, // Adicionado padding no topo
  },
  scrollContentContainer: { // Estilo para o contentContainerStyle do ScrollView
    flexGrow: 1, // Permite que o ScrollView cresça e centralize conteúdo se houver espaço
    justifyContent: 'center', // Centraliza o conteúdo verticalmente
    alignItems: 'center', // Centraliza o conteúdo horizontalmente
    paddingBottom: 20, // Garante espaço na parte inferior ao rolar
  },
  mainContentAnimatedWrapper: { // NOVO ESTILO: Wrapper para o conteúdo principal animado
    width: '100%', // Ocupa a largura total do ScrollView
    alignItems: 'center', // Centraliza os cards e botões dentro dele
    backgroundColor: 'transparent', // Garante que o fundo do gradiente seja visível
  },
  animatedBlob: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.7, // Reduzido um pouco o tamanho
    height: SCREEN_WIDTH * 0.7,
    borderRadius: (SCREEN_WIDTH * 0.7) / 2, // Para ser circular
    alignSelf: 'center', // Centraliza horizontalmente
    top: SCREEN_WIDTH * 0.1, // Movido um pouco para baixo
    opacity: 0.4, // Reduzida a opacidade
    overflow: 'hidden',
    // Sombras para a bolha
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
