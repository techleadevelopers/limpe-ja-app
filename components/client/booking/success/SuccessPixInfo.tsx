
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { usePaymentIntent, usePixActions } from '../../../../app/(client)/bookings/paymentIntentHooks';
import { AppColors, AppShadows } from '../../../../constants/appStyles';
import { sanitizeText } from '../../../../utils/formatters';
import { PixChargeResponseDto } from '../../../../types/backend/payments';

interface SuccessPixInfoProps {
  bookingId: string;
  fallback?: Pick<PixChargeResponseDto, 'brCode' | 'qrCodeImage'> | null;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SuccessPixInfo({ bookingId, fallback }: SuccessPixInfoProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  const { intent, loading } = usePaymentIntent(bookingId);
  const { copy } = usePixActions({ qrCodeText: intent?.qrCodeText ?? fallback?.brCode });

  useEffect(() => {
    const entryAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 500,
        delay: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);
    entryAnimation.start();
    return () => entryAnimation.stop();
  }, [fadeAnim, scaleAnim, translateYAnim]);

  const onPressInButton = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOutButton = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const pixCode = intent?.qrCodeText ?? fallback?.brCode ?? '';
  const qrCodeImage = intent?.qrCodeUrl ?? fallback?.qrCodeImage ?? '';

  if (loading && !pixCode) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={AppColors.primaryInteractive} />
      </View>
    );
  }

  if (!pixCode && !qrCodeImage) {
    return null;
  }

  const qrCodeSource = qrCodeImage
    ? { uri: qrCodeImage.startsWith('data:') ? qrCodeImage : `data:image/png;base64,${qrCodeImage}` }
    : require('../../../../assets/images/pix.png');

  return (
    <Animated.View
      style={[
        styles.pixInfoSection,
        {
          width: SCREEN_WIDTH * 0.85,
          alignSelf: 'center',
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
          marginTop: 15,
          marginBottom: Platform.OS === 'ios' ? 5 : 4,
        },
      ]}
    >
      <View style={styles.qrCodeContainer}>
        <Image source={qrCodeSource} style={styles.qrCodeImage} />
      </View>
      <TouchableOpacity
        style={[styles.copyPixButton, { transform: [{ scale: buttonScaleAnim }] }]}
        onPress={copy}
        onPressIn={onPressInButton}
        onPressOut={onPressOutButton}
        activeOpacity={0.7}
      >
        <Ionicons name="copy-outline" size={15} color={AppColors.white} />
        <Text style={styles.copyPixButtonText} maxFontSizeMultiplier={1.2}>
          Copiar Código PIX
        </Text>
      </TouchableOpacity>
      {pixCode ? (
        <Text style={styles.pixBrCodeText} numberOfLines={1} ellipsizeMode="middle" maxFontSizeMultiplier={1.2}>
          {sanitizeText(pixCode)}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  pixInfoSection: {
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#ffffff',
    ...AppShadows.small,
  },
  qrCodeContainer: {
    marginBottom: 10,
    borderWidth: 1,
    marginTop: -10,
    borderColor: `${AppColors.primaryInteractive}10`,
    borderRadius: 8,
    padding: 5,
    backgroundColor: `${AppColors.primaryInteractive}10`,
    alignSelf: 'center',
  },
  qrCodeImage: {
    width: 240,
    height: 220,
    resizeMode: 'contain',
    elevation: 3,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderRadius: 8,
  },
  copyPixButton: {
    flexDirection: 'row',
    backgroundColor: AppColors.primaryInteractive,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 44,
  },
  copyPixButtonText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  pixBrCodeText: {
    marginTop: 8,
    fontSize: 12,
    color: AppColors.mediumGray,
    textAlign: 'center',
    fontStyle: 'italic',
    maxWidth: '98%',
  },
});
