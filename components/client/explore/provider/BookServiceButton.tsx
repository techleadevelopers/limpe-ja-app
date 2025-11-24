// components/client/explore/provider/BookServiceButton.tsx
import React from 'react';
import { Animated, Text, TouchableOpacity, Platform, StyleSheet, View, Alert, ToastAndroid } from 'react-native';
import { type Router } from 'expo-router';
import { AppColors, AppShadows } from '../../../../constants/appStyles';
import NotificationUIService from '../../../../services/notificationUIService';

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
}) => {
  const baseBottomPadding = Platform.OS === 'ios' ? 34 : 20;

  const handlePress = () => {
    if (requireAuthOrRedirect && !requireAuthOrRedirect('book_service')) {
      return;
    }

    if (!isAuthenticated) {
      const title = 'Cadastro necessario';
      const message = 'Crie seu cadastro para agendar servicos de limpeza';

      // Android: garantir mensagem nativa visível (toast + overlay leve), mantendo Alert para iOS
      if (Platform.OS === 'android') {
        try {
          ToastAndroid.showWithGravity(message, ToastAndroid.LONG, ToastAndroid.CENTER);
        } catch {}
        NotificationUIService.showInfo(message, title);
      }

      Alert.alert(
        title,
        message,
        [
          {
            text: 'Continuar',
            onPress: () => {
              try {
                router.push('/(auth)/client-register' as any);
              } catch {}
            },
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ],
      );
      return;
    }

    router.push({
      pathname: '/(client)/bookings/schedule-service',
      params: {
        providerId,
        serviceId,
        servicePrice: servicePrice != null ? servicePrice.toString() : undefined,
      },
    });
  };
  const label =
    servicePrice != null && typeof servicePrice === 'number' && Number.isFinite(servicePrice)
      ? `Agendar • R$ ${servicePrice.toFixed(2).replace('.', ',')}/h`
      : 'Agendar serviço';

  const content = (
    <TouchableOpacity style={styles.btn} onPress={handlePress} activeOpacity={0.9}>
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
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
        {content}
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
        {content}
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
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 18,
    marginBottom: -38,
    backgroundColor: AppColors.white,
    ...AppShadows.medium,
  },
  btn: {
    backgroundColor: AppColors.primaryInteractive,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...AppShadows.medium,
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
    elevation: 6,
  },
  text: {
    color: AppColors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default BookServiceButton;
