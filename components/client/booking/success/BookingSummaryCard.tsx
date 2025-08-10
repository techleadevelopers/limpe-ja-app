// LimpeJaApp/components/client/booking/success/BookingSummaryCard.tsx
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import AdditionalBookingDetails from './AdditionalBookingDetails';
import BookingDetailSection from './BookingDetailSection';
import DateTimeCards from './DateTimeCards';
import ProviderInfoSection from './ProviderInfoSection';
import SuccessPixInfo from './SuccessPixInfo';

// Importar tipos
import { BookingDetails } from '../../../../types/backend/bookings';
import { PixChargeResponseDto } from '../../../../types/backend/payments';
import { formatCurrency, formatDate } from '../../../../utils/helpers';

interface BookingSummaryCardProps {
  booking: BookingDetails;
  providerRating?: number;
  pixChargeDetails?: PixChargeResponseDto | null;
  paymentMethod?: string;
  contentOpacity: Animated.Value;
  contentTranslateY: Animated.Value;
  iconColor: string;
  successColor: string;
  headerPrimaryColor: string;
  // NOVAS PROPRIEDADES: Endereço já formatado
  formattedAddressLine1: string;
  formattedAddressLine2: string;
}

export default function BookingSummaryCard({
  booking,
  providerRating,
  pixChargeDetails,
  paymentMethod,
  contentOpacity,
  contentTranslateY,
  iconColor,
  successColor,
  headerPrimaryColor,
  // NOVAS PROPRIEDADES: Desestruturadas aqui
  formattedAddressLine1,
  formattedAddressLine2,
}: BookingSummaryCardProps) {
  // --- CORREÇÃO AQUI: DESESTRUTURAR AS PROPRIEDADES DO BOOKING ---
  // Removido `scheduledDateTime` e adicionado `scheduledDate` e `scheduledTime`
  const {
    providerFullName,
    providerAvatarUrl,
    serviceName,
    scheduledDate,
    scheduledTime,
    totalPrice,
    id: bookingIdFromBooking,
    notes,
  } = booking;

  // >>> LOG DE DEPURACAO AQUI <<<
  console.log("[BookingSummaryCard - DEBUG] scheduledDate recebido como prop:", scheduledDate);
  console.log("[BookingSummaryCard - DEBUG] scheduledTime recebido como prop:", scheduledTime);

  // --- CORREÇÃO AQUI: DECLARAR AS VARIÁVEIS FORMATADAS ---
  // A função `formatDate` será chamada com a data e hora separadas.
  const formattedBookingDate = formatDate(new Date(`${scheduledDate}T${scheduledTime}`), { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedBookingTime = formatDate(new Date(`${scheduledDate}T${scheduledTime}`), { hour: '2-digit', minute: '2-digit' });

  // >>> LOG DE DEPURACAO AQUI <<<
  console.log("[BookingSummaryCard - DEBUG] formattedBookingDate após formatDate:", formattedBookingDate);
  console.log("[BookingSummaryCard - DEBUG] formattedBookingTime após formatDate:", formattedBookingTime);

  const formattedPaymentValue = formatCurrency(totalPrice);
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
    <Animated.ScrollView
      contentContainerStyle={styles.scrollContent}
      style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}
    >
      <View style={styles.mainCardContainer}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(240, 255, 255, 0.85)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFillObject} />

        <View style={styles.cardContentNew}>
          <ProviderInfoSection
            providerAvatarUrl={providerAvatarUrl}
            providerFullName={providerFullName}
            providerRating={providerRating}
          />

          <View style={styles.dividerContainer}>
            <View style={styles.circle} />
            <View style={styles.dashedLine} />
            <View style={styles.circle} />
          </View>

          {/* ATUALIZADO: Passando as novas props para o BookingDetailSection */}
          <BookingDetailSection
            serviceName={serviceName}
            formattedAddressLine1={formattedAddressLine1}
            formattedAddressLine2={formattedAddressLine2}
            notes={notes}
            iconColor={iconColor}
          />

          <DateTimeCards
            formattedBookingDate={formattedBookingDate}
            formattedBookingTime={formattedBookingTime}
            iconColor={iconColor}
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
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 40,
    paddingBottom: 30,
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexGrow: 1,
  },
  mainCardContainer: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 25,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardContentNew: {
    padding: 25,
    backgroundColor: 'transparent',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  circle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    marginHorizontal: -5,
  },
});