// LimpeJaApp/app/(client)/bookings/components/success/SuccessPixInfo.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View, Animated, Easing } from 'react-native';

import { PixChargeResponseDto } from '../../../../types/backend/payments';
import { AppColors, AppShadows } from '../../../../constants/appStyles'; // Importe AppColors e AppShadows

interface SuccessPixInfoProps {
  pixChargeDetails?: PixChargeResponseDto | null;
  handleCopyPixQrCode: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SuccessPixInfo({ pixChargeDetails, handleCopyPixQrCode }: SuccessPixInfoProps) {
  // Animações de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Animação para o botão de copiar PIX
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 500, // Atraso para aparecer depois dos detalhes adicionais
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
    ]).start();
  }, []);

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

  if (!pixChargeDetails || !pixChargeDetails.brCode) {
    return null;
  }

  const qrCodeSource = pixChargeDetails.qrCodeImage
    ? { uri: pixChargeDetails.qrCodeImage }
    : require('../../../../assets/images/pix.png');

  return (
    <Animated.View
      style={[
        styles.pixInfoSection,
        {
          width: SCREEN_WIDTH * 0.75,
          alignSelf: 'center',
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
        }
      ]}
    >
      <View style={styles.qrCodeContainer}>
        <Image
          source={qrCodeSource}
          style={styles.qrCodeImage}
        />
      </View>
      <TouchableOpacity
        style={[styles.copyPixButton, { transform: [{ scale: buttonScaleAnim }] }]}
        onPress={handleCopyPixQrCode}
        onPressIn={onPressInButton}
        onPressOut={onPressOutButton}
      >
        <Ionicons name="copy-outline" size={15} color={AppColors.white} />
        <Text style={styles.copyPixButtonText}>Copiar Código PIX</Text>
      </TouchableOpacity>
      <Text style={styles.pixBrCodeText} numberOfLines={1} ellipsizeMode="middle">
        {pixChargeDetails.brCode}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pixInfoSection: {
    borderRadius: 12,
    padding: 10,
    marginTop: 15,
    alignItems: 'center',
    position: 'relative',
    backgroundColor: AppColors.white, // Usando AppColors
    ...AppShadows.small, // Adicionando sombra
  },
  pixInfoHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.textBody, // Usando AppColors
    marginTop: 10,
    marginBottom: 8,
  },
  pixInfoText: {
    fontSize: 14,
    color: AppColors.textAuxiliary, // Usando AppColors
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  qrCodeContainer: {
    marginBottom: 10,
    borderWidth: 1,
    marginTop: -10,
    borderColor: AppColors.primaryInteractive + '10', // Usando AppColors
    borderRadius: 8,
    padding: 5,
    right: 0,
    backgroundColor: AppColors.primaryInteractive + '10', // Usando AppColors
  },
  qrCodeImage: {
    width: 240,
    height: 220,
    resizeMode: 'contain',
    right: 0,
    elevation: 33, // Manter elevação para efeito 3D
    shadowColor: AppColors.black, // Usando AppColors
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderRadius: 8,
  },
  copyPixButton: {
    flexDirection: 'row',
    backgroundColor: AppColors.primaryInteractive, // Usando AppColors
    paddingVertical: 8,
    paddingHorizontal: 68,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    right: 0,
  },
  copyPixButtonText: {
    color: AppColors.white, // Usando AppColors
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  pixBrCodeText: {
    marginTop: 5,
    fontSize: 12,
    color: AppColors.mediumGray, // Usando AppColors
    textAlign: 'center',
    fontStyle: 'italic',
    maxWidth: '98%',
    right: 0,
  },
  pixMessageAbsoluteContainer: {
    position: 'absolute',
    left: '47%',
    top: 10,
    width: 187,
    padding: 18,
    borderRadius: 28,
    backgroundColor: AppColors.backgroundLight, // Usando AppColors
    elevation: 3,
    shadowColor: AppColors.black, // Usando AppColors
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pixMessageTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: AppColors.textBody, // Usando AppColors
    marginBottom: 3,
    textAlign: 'center',
  },
  pixMessageText: {
    fontSize: 10,
    color: AppColors.textAuxiliary, // Usando AppColors
    textAlign: 'center',
    lineHeight: 12,
    marginBottom: 5,
  },
  pixMessageAttention: {
    fontSize: 10,
    color: AppColors.errorRed, // Usando AppColors
    fontWeight: 'bold',
    marginBottom: 10,
  },
});