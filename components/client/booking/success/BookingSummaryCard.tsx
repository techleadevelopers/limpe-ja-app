// LimpeJaApp/components/client/booking/success/BookingSummaryCard.tsx
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, Platform, StyleSheet, View, Text, Dimensions } from 'react-native';
import Toast from 'react-native-toast-message';

import AdditionalBookingDetails from './AdditionalBookingDetails';
import BookingDetailSection from './BookingDetailSection';
import DateTimeCards from './DateTimeCards';
import ProviderInfoSection from './ProviderInfoSection';
import SuccessPixInfo from './SuccessPixInfo';

// Importar tipos
import { BookingDetails } from '../../../../types/backend/bookings';
import { PixChargeResponseDto } from '../../../../types/backend/payments';
import { ProviderDisplayInfo } from '../../../../types/backend/providers';
// Importar utilitários de formatação e sanitização
import { formatPriceBRL, formatDateTime, sanitizeText } from '../../../../utils/formatters';
import { AppColors, AppShadows } from '../../../../constants/appStyles';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface BookingSummaryCardProps {
  booking: BookingDetails;
  provider: ProviderDisplayInfo | null;
  providerRating?: number;
  pixChargeDetails?: PixChargeResponseDto | null;
  paymentMethod?: string;
  contentOpacity: Animated.Value;
  contentTranslateY: Animated.Value;
  iconColor: string; // Não usado diretamente
  successColor: string; // Não usado diretamente
  headerPrimaryColor: string; // Não usado diretamente
  formattedAddressLine1: string;
  formattedAddressLine2: string;
}

export default function BookingSummaryCard({
  booking,
  provider,
  providerRating,
  pixChargeDetails,
  paymentMethod,
  contentOpacity,
  contentTranslateY,
  iconColor,
  successColor,
  headerPrimaryColor,
  formattedAddressLine1,
  formattedAddressLine2,
}: BookingSummaryCardProps) {
  const {
    serviceName,
    scheduledDate,
    scheduledTime,
    totalPrice,
    id: bookingIdFromBooking,
    notes,
  } = booking;

  // Usando formatDateTime do novo utilitário
  const formattedBookingDate = formatDateTime(scheduledDate, scheduledTime, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedBookingTime = formatDateTime(scheduledDate, scheduledTime, {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Usando formatPriceBRL do novo utilitário
  const formattedPaymentValue = formatPriceBRL(totalPrice);
  const displayPaymentMethod = paymentMethod || 'PIX';

  const handleCopyPixQrCode = () => {
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
  };

  return (
    // ✅ FIX: Mudado de Animated.ScrollView para Animated.View (remove aninhado, permite scroll externo fluido)
    <Animated.View
      style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}
    >
      <View style={styles.mainCardContainer}>
        <LinearGradient
          colors={[AppColors.white + '95', AppColors.backgroundLight + '85']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFillObject} />

        <View style={styles.cardContentNew}>
          <ProviderInfoSection
            providerAvatarUrl={provider?.avatarUrl}
            providerFullName={provider?.fullName || booking.providerFullName}
            providerRating={providerRating}
          />

          <View style={styles.dividerContainer}>
            <View style={styles.circle} />
            <View style={styles.dashedLine} />
            <View style={styles.circle} />
          </View>

          <BookingDetailSection
            serviceName={serviceName}
            formattedAddressLine1={formattedAddressLine1}
            formattedAddressLine2={formattedAddressLine2}
            notes={notes}
            iconColor={AppColors.primaryInteractive} // Usando AppColors diretamente
          />

          <DateTimeCards
            formattedBookingDate={formattedBookingDate}
            formattedBookingTime={formattedBookingTime}
            iconColor={AppColors.primaryInteractive} // Usando AppColors diretamente
          />

          <AdditionalBookingDetails
            bookingId={bookingIdFromBooking}
            formattedPaymentValue={formattedPaymentValue}
            displayPaymentMethod={displayPaymentMethod}
          />

          {displayPaymentMethod === 'PIX' && pixChargeDetails && (
            <SuccessPixInfo
              pixChargeDetails={pixChargeDetails}
              handleCopyPixQrCode={handleCopyPixQrCode}
            />
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // ✅ FIX: Removido flexGrow: 1 (evita travar scroll externo); adicionado paddingBottom: 20 para expansão natural e gap confortável
  scrollContent: { // Agora usado como wrapper simples, sem contentContainerStyle
    position: 'relative',
    paddingHorizontal: 16, // Gap lateral premium (16px padrão)
    paddingBottom: 20, // ✅ Adicionado: Expansão natural no final, sem forçar altura
    alignItems: 'center',
    backgroundColor: 'transparent',
    maxWidth: '100%',
  },
  mainCardContainer: {
    width: '100%',
    maxWidth: SCREEN_WIDTH - 32, // Fix: Previne overflow lateral no iOS
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 12, // Gap acima confortável
    marginBottom: 0, // FIX: Zero gap abaixo – cupom/PIX cuida do spacing (cola suavemente)
    ...AppShadows.medium,
  },
  cardContentNew: {
    padding: 25, // Padding interno premium (confortável, 44px+ touch)
    backgroundColor: 'transparent',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12, // Gap vertical simétrico e lógico (era 2, aumentado para conforto)
  },
  circle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.backgroundNeutral,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderColor: AppColors.backgroundNeutral,
    borderWidth: 1,
    marginHorizontal: 8, // ✅ Ajustado: Gap horizontal confortável sem apertar
  },
});