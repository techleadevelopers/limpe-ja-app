// LimpeJaApp/components/client/booking/success/BookingSummaryCard.tsx
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, Platform, StyleSheet, View, Text, Dimensions, AccessibilityInfo } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import AdditionalBookingDetails from './AdditionalBookingDetails';
import BookingDetailSection from './BookingDetailSection';
import DateTimeCards from './DateTimeCards';
import ProviderInfoSection from './ProviderInfoSection';
import SuccessPixInfo from './SuccessPixInfo';

// Importar tipos
import { BookingDetails } from '../../../../../types/backend/bookings';
import { PixChargeResponseDto } from '../../../../../types/backend/payments';
import { ProviderDisplayInfo } from '../../../../../types/backend/providers';
// Importar utilitários de formatação e sanitização
import { formatPriceBRL, formatDateTime, sanitizeText } from '../../../../../utils/formatters';
import { AppColors, AppShadows } from '../../../../../constants/appStyles';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SUMMARY_CARD_MAX_WIDTH = 520;

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
  onRegeneratePix?: () => void;
  isRegeneratingPix?: boolean;
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
  onRegeneratePix,
  isRegeneratingPix,
}: BookingSummaryCardProps) {
  const { t } = useTranslation();
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

  // ✅ NOVO: ReduceMotion para A11y no copy
  const reduceMotionRef = React.useRef(false);
  React.useEffect(() => {
      AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
          reduceMotionRef.current = enabled;
      });
  }, []);

  const handleCopyPixQrCode = () => {
    if (pixChargeDetails?.brCode) {
      Clipboard.setString(pixChargeDetails.brCode);
      Toast.show({
      type: 'info',
      text1: t('payments.pix.copy_success_title'),
      text2: t('payments.pix.copy_success_message'),
      visibilityTime: 4000,
    });
      // ✅ Haptics: Feedback tátil no copy (leve, premium)
      Haptics.selectionAsync();
      // ✅ A11y: Se reduceMotion, pula qualquer anim interna (se houver)
      if (!reduceMotionRef.current) {
          // Aqui você pode adicionar uma micro-animação se quiser, mas mantive simples
      }
    } else {
      Toast.show({
      type: 'error',
      text1: t('payments.pix.copy_error_title'),
      text2: t('payments.pix.copy_error_message'),
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
            providerId={provider?.id || booking.providerId}
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
            iconColor={AppColors.primaryInteractive}
          />

          <DateTimeCards
            formattedBookingDate={formattedBookingDate}
            formattedBookingTime={formattedBookingTime}
            iconColor={AppColors.primaryInteractive}
          />

          <AdditionalBookingDetails
            bookingId={bookingIdFromBooking}
            formattedPaymentValue={formattedPaymentValue}
            displayPaymentMethod={displayPaymentMethod}
          />

          {/* ✅ NOVO: Barra de total "tint" (ênfase elegante, hierarquia premium sem poluir) */}
          <View style={styles.totalBar}>
            <Text style={styles.totalLabel}>Total a Pagar</Text>
            <Text style={styles.totalValue}>{formattedPaymentValue}</Text>
          </View>

          {displayPaymentMethod === 'PIX' && (
            <SuccessPixInfo
              bookingId={bookingIdFromBooking}
              fallback={pixChargeDetails ?? null}
              onRegenerate={onRegeneratePix}
              regenerating={isRegeneratingPix}
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
    width: '92%',
    maxWidth: Math.min(SCREEN_WIDTH - 32, SUMMARY_CARD_MAX_WIDTH),
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 12,
    alignSelf: 'center',
    
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
  // ✅ NOVO: Estilos para barra de total tint (ênfase clean, contraste alto)
  totalBar: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16, // Gap consistente (16px)
    borderRadius: 12,
    backgroundColor: 'rgba(42, 114, 231, 0.06)', // Tint azul sutil da marca
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F3A4A', // Body premium (escuro, legível)
    fontFamily: 'Montserrat-SemiBold', // Consistente com tipografia
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.primaryInteractive, // Primário da marca para destaque
    fontFamily: 'Montserrat-Bold',
  },
});




