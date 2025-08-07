// LimpeJaApp/app/(client)/bookings/components/success/BookingSummaryCard.tsx
import { BlurView } from 'expo-blur';
import Clipboard from '@react-native-clipboard/clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';

import AdditionalBookingDetails from '../success/AdditionalBookingDetails';
import BookingDetailSection from '../success/BookingDetailSection';
import DateTimeCards from '../success/DateTimeCards';
import ProviderInfoSection from '../success/ProviderInfoSection';
// NOVO: Importar SuccessPixInfo sem o "pixQrCode" direto, mas com "pixChargeDetails"
import LoyaltyTeaserSection from '../success/LoyaltyTeaserSection';
import SecurityInfoSection from '../success/SecurityInfoSection';
import SuccessPixInfo from '../success/SuccessPixInfo';

// Importar tipos
import { BookingDetails } from '../../../../types/backend/bookings';
// NOVO: Importar PixChargeResponseDto
import Toast from 'react-native-toast-message';
import { PixChargeResponseDto } from '../../../../types/backend/payments';
import { formatCurrency, formatDate } from '../../../../utils/helpers';

interface BookingSummaryCardProps {
  booking: BookingDetails;
  providerRating?: number;
  // NOVO: Recebe o objeto completo pixChargeDetails
  pixChargeDetails?: PixChargeResponseDto | null;
  paymentMethod?: string;
  contentOpacity: Animated.Value;
  contentTranslateY: Animated.Value;
  iconColor: string;
  successColor: string;
  headerPrimaryColor: string;
}

export default function BookingSummaryCard({
  booking,
  providerRating,
  // NOVO: Desestrutura pixChargeDetails
  pixChargeDetails,
  paymentMethod,
  contentOpacity,
  contentTranslateY,
  iconColor,
  successColor,
  headerPrimaryColor,
}: BookingSummaryCardProps) {
  // Desestruturar as propriedades diretamente do booking para facilitar o uso
  const {
    providerId, // Não usado diretamente aqui, mas pode ser útil para subcomponentes
    providerFullName,
    providerAvatarUrl,
    serviceName,
    scheduledTime,
    address,
    totalPrice,
    id: bookingIdFromBooking,
    notes,
  } = booking;

  const formattedBookingDate = formatDate(scheduledTime, { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedBookingTime = formatDate(scheduledTime, { hour: '2-digit', minute: '2-digit' });

  const formattedClientAddress = address ?
    `${address.street}, ${address.number}` +
    `${address.complement ? ` - ${address.complement}` : ''}` +
    `, ${address.neighborhood}, ${address.city} - ${address.state}`
    : 'Endereço não disponível';

  const formattedPaymentValue = formatCurrency(totalPrice);
  const displayPaymentMethod = paymentMethod || 'PIX';

  const handleCopyPixQrCode = () => {
    // NOVO: Acessa o brCode do pixChargeDetails
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

          <BookingDetailSection
            serviceName={serviceName}
            formattedClientAddress={formattedClientAddress}
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

          {/* NOVO: Passa o pixChargeDetails completo para SuccessPixInfo */}
          {displayPaymentMethod === 'PIX' && pixChargeDetails && (
            <SuccessPixInfo
              pixChargeDetails={pixChargeDetails} // Passa o objeto completo
              handleCopyPixQrCode={handleCopyPixQrCode}
            />
          )}

          <SecurityInfoSection successColor={successColor} />
          <LoyaltyTeaserSection headerPrimaryColor={headerPrimaryColor} />
        </View>
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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