// components/client/explore/provider/BookServiceButton.tsx
import { type Router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Animated,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppColors } from '../../../../constants/appStyles';
import { VerificationStatus } from '../../../../types/backend/auth';
import VerificationNotice from './VerificationNotice';

interface BookServiceButtonProps {
  providerId: string;
  serviceId?: string;
  router: Router;
  bookNowButtonAnim: Animated.Value;
  servicePrice?: number;
  sticky?: boolean;
  safeBottomInset?: number;
  isAuthenticated: boolean;
  requireAuthOrRedirect?: (actionName?: string) => boolean;
  verificationStatus?: VerificationStatus;
}

const BookServiceButton: React.FC<BookServiceButtonProps> = ({
  providerId,
  serviceId,
  router,
  bookNowButtonAnim,
  servicePrice,
  sticky = false,
  safeBottomInset = 0,
  isAuthenticated,
  requireAuthOrRedirect,
  verificationStatus,
}) => {
  const baseBottomPadding = Platform.OS === 'ios' ? 34 : 20;

  const shouldBlockBooking =
    verificationStatus !== undefined && verificationStatus !== VerificationStatus.APPROVED;
  const handleLearnMore = () => {
    try {
      router.push('/client/explore/security' as any);
    } catch {}
  };

  const handlePress = () => {
    if (requireAuthOrRedirect && !requireAuthOrRedirect('book_service')) {
      return;
    }

    if (!isAuthenticated) {
      const title = 'Cadastro necessário';
      const message = 'Crie seu cadastro para continuar.';

      // Android: mostrar toast rápido; iOS vai direto para o Alert nativo
      if (Platform.OS === 'android') {
        try {
          ToastAndroid.showWithGravity(message, ToastAndroid.LONG, ToastAndroid.CENTER);
        } catch {}
      }

      Alert.alert(
        title,
        message,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Continuar',
            onPress: () => {
              try {
                router.push('/auth/client-register' as any);
              } catch {}
            },
          },
        ],
      );
      return;
    }

    if (shouldBlockBooking) {
      return;
    }

    router.push({
      pathname: '/client/bookings/schedule-service',
      params: {
        providerId,
        serviceId,
        servicePrice: servicePrice != null ? servicePrice.toString() : undefined,
      },
    });
  };
  const label =
    servicePrice != null && typeof servicePrice === 'number' && Number.isFinite(servicePrice)
      ? `Agendar à R$ ${servicePrice.toFixed(2).replace('.', ',')}/h`
      : 'Agendar serviço';

  const buttonBlock = (
    <View style={styles.buttonBlock}>
      <TouchableOpacity
        style={[styles.btn, shouldBlockBooking && styles.btnDisabled]}
        onPress={handlePress}
        activeOpacity={0.9}
        disabled={shouldBlockBooking}
        testID="book-service-button"
      >
        <Text style={styles.text}>{label}</Text>
      </TouchableOpacity>
      {shouldBlockBooking && (
        <VerificationNotice status={verificationStatus} onLearnMore={handleLearnMore} />
      )}
    </View>
  );
  if (!sticky) {
    return (
      <Animated.View
        style={[
          styles.inlineContainer,
          {
            opacity: bookNowButtonAnim,
            transform: [
              {
                translateY: bookNowButtonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
            ],
          },
        ]}
      >
        {buttonBlock}
      </Animated.View>
    );
  }

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: baseBottomPadding + (safeBottomInset || 0),
        },
      ]}
    >
      <Animated.View
        style={{
          opacity: bookNowButtonAnim,
          transform: [
            {
              translateY: bookNowButtonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [40, 0],
              }),
            },
          ],
        }}
      >
        {buttonBlock}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  inlineContainer: {
    marginVertical: 20,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 420,
  },
  buttonBlock: {
    alignItems: 'center',
  },
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 18,
    marginBottom: -38,
    backgroundColor: AppColors.white,
    
  },
  btn: {
    backgroundColor: AppColors.primaryInteractive,
    paddingVertical: Platform.OS === 'ios' ? 14 : 13,
    paddingHorizontal: Platform.OS === 'ios' ? 66 : 65,
    bottom: Platform.OS === 'ios' ? 0 : 2,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRightWidth: 0,
    borderRightColor: '#45484b56',
    borderTopStartRadius: 44,
    borderBottomStartRadius: 44,
    borderTopEndRadius: 44,
    borderBottomEndRadius: 44,
    borderBottomColor: '#45484b56',
    borderBottomWidth: 0.1,
    borderLeftColor: '#45484b56',
    borderLeftWidth: 1,
    shadowColor: '#45484b56',
    shadowOffset: { width: -1, height: 1 },
    shadowOpacity: 3.55,
    shadowRadius: 35,
    elevation: 0,
  },
  btnDisabled: {
    backgroundColor: AppColors.primaryInteractive + '88',
  },
  text: {
    color: AppColors.white,
    fontSize: Platform.OS === 'android' ? 16.5 : 15,
    fontWeight: '700',
  },
});

export default BookServiceButton;
