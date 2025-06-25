// LimpeJaApp/app/(client)/bookings/success.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import * as Calendar from 'expo-calendar';
import Toast from 'react-native-toast-message';
import * as Clipboard from 'expo-clipboard';

// Importar componentes refatorados
import SuccessHeader from './components/success/SuccessHeader';
import SuccessLoadingError from './components/success/SuccessLoadingError';
import BookingSummaryCard from './components/success/BookingSummaryCard';
import ImmediateActionButtons from './components/success/ImmediateActionButtons';
import MainActionButtons from './components/success/MainActionButtons';

// Importar serviços e tipagens
import { getBookingDetails } from '../../services/bookingService';
import { BookingDetails } from '../../types/backend/bookings';
import { getProviderDetails } from '../../services/providerService';
import { ProviderDisplayInfo } from '../../types/backend/providers';

// NOVO: Importar serviços e tipagens para PIX
import { createPixCharge } from '../../services/paymentService';
import { CreatePixChargeDto, PixChargeResponseDto } from '../../types/backend/payments';

// Constantes de estilo
const SCREEN_WIDTH = Dimensions.get('window').width;
const headerPrimaryColor = '#4A90E2';
const headerSecondaryColor = '#A8D8FF';
const iconColor = '#4A90E2';
const successColor = '#28a745';

export default function SuccessScreen() {
  const { bookingId, paymentMethod, totalPrice: totalPriceParam } = useLocalSearchParams<{ bookingId?: string; paymentMethod?: string; totalPrice?: string }>();
  const router = useRouter();

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [providerRating, setProviderRating] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pixChargeDetails, setPixChargeDetails] = useState<PixChargeResponseDto | null>(null);
  const [pixGenerationError, setPixGenerationError] = useState<string | null>(null);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(50)).current;
  const headerTickOpacity = useRef(new Animated.Value(0)).current;
  const headerTickScale = useRef(new Animated.Value(0.5)).current;

  // REMOVIDO: const [showLottie, setShowLottie] = useState(true);

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
    setIsLoading(true);
    setError(null);
    setPixGenerationError(null);
    try {
      const fetchedBooking = await getBookingDetails(bookingId);
      setBooking(fetchedBooking);
      console.log("[SuccessScreen] fetchBookingAndProviderDetails - Booking real carregado:", fetchedBooking);

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

            const pixResponse: PixChargeResponseDto = await createPixCharge(pixChargeData);
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
  }, [bookingId, paymentMethod, totalPriceParam]); // Remover pixChargeDetails do array de dependências


  useEffect(() => {
    // REMOVIDO: if (lottieAnimationRef.current) { lottieAnimationRef.current.play(); }

    // REMOVIDO: const lottieDuration = 2500;
    const revealDelay = 300; // Mantido, pode ser um delay de animação geral
    const pixGenerationDelay = 2000;

    // REMOVIDO: console.log("[SuccessScreen] useEffect - showLottie (initial):", showLottie);
    // REMOVIDO: console.log("[SuccessScreen] Lottie timer set for:", lottieDuration + revealDelay, "ms");

    const timer = setTimeout(() => {
      // REMOVIDO: setShowLottie(false);
      // REMOVIDO: console.log("[SuccessScreen] Lottie timer fired. setShowLottie(false).");
      
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
    }, revealDelay); // ALTERADO: Usando apenas revealDelay

    return () => clearTimeout(timer);
  }, [fetchBookingAndProviderDetails, contentOpacity, contentTranslateY, headerTickOpacity, headerTickScale /* REMOVIDO: showLottie */]);

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

    const startDate = new Date(booking.scheduledTime);
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
  if (isLoading || error || pixGenerationError || !booking) { // REMOVIDA: && !showLottie
    return (
      <SuccessLoadingError
        isLoading={isLoading}
        error={error || pixGenerationError}
        headerPrimaryColor={headerPrimaryColor}
        onRetryPress={fetchBookingAndProviderDetails}
      />
    );
  }

  return (
    <View style={styles.screenContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* REMOVIDO: Bloco de renderização condicional do Lottie */}

      {/* Renderize o conteúdo principal apenas quando booking for válido */}
      {booking && ( // <<<< CORREÇÃO: AGORA booking É A ÚNICA CONDIÇÃO DE RENDERIZAÇÃO DO CONTEÚDO PRINCIPAL >>>>
        <>
          <SuccessHeader
            onBackPress={() => router.back()}
            headerTickOpacity={headerTickOpacity}
            headerTickScale={headerTickScale}
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

          <ImmediateActionButtons
            onAddToCalendar={handleAddToCalendar}
            onContactProvider={handleContactProvider}
            headerPrimaryColor={headerPrimaryColor}
          />

          <MainActionButtons
            onGoToBookings={handleGoToBookings}
            onGoHome={handleGoHome}
            headerPrimaryColor={headerPrimaryColor}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  // REMOVIDO: lottieOverlay
  // REMOVIDO: lottieAnimation
});