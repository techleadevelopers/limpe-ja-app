// LimpeJaApp/app/(client)/bookings/components/success/SuccessPixInfo.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View, Animated, Easing, Platform } from 'react-native';
import Toast from 'react-native-toast-message'; // Importar Toast para feedback de erro

import { PixChargeResponseDto } from '../../../../types/backend/payments';
import { AppColors, AppShadows } from '../../../../constants/appStyles'; // Importe AppColors e AppShadows
import { sanitizeText } from '../../../../utils/formatters'; // Importar sanitizeText

interface SuccessPixInfoProps {
  pixChargeDetails?: PixChargeResponseDto | null;
  handleCopyPixQrCode: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SuccessPixInfo({ pixChargeDetails, handleCopyPixQrCode }: SuccessPixInfoProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

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

    return () => entryAnimation.stop(); // Cleanup da animação
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
    // Mostrar Toast de erro se não houver código PIX
    useEffect(() => {
      Toast.show({
        type: 'error',
        text1: 'Erro ao gerar PIX',
        text2: 'Não foi possível obter o código PIX para exibir.',
        visibilityTime: 4000,
      });
    }, []);
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
          width: SCREEN_WIDTH * 0.85, // Alinhado centralizado premium
          alignSelf: 'center',
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
          marginTop: 15,
          // ... (dentro do style do Animated.View)
marginBottom: Platform.OS === 'ios' ? 5 : 4, // ✅ FIX: Reduzido de 10/8 para 5/4 – minimiza gap com cupom abaixo
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
        activeOpacity={0.7}
      >
        <Ionicons name="copy-outline" size={15} color={AppColors.white} />
        <Text style={styles.copyPixButtonText} maxFontSizeMultiplier={1.2}>Copiar Código PIX</Text>
      </TouchableOpacity>
      <Text style={styles.pixBrCodeText} numberOfLines={1} ellipsizeMode="middle" maxFontSizeMultiplier={1.2}>
        {sanitizeText(pixChargeDetails.brCode)}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pixInfoSection: {
    borderRadius: 12,
    padding: 15, // Padding aumentado para conforto
    alignItems: 'center',
    position: 'relative',
    backgroundColor: AppColors.white,
    ...AppShadows.small,
  },
  pixInfoHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.textBody,
    marginTop: 10,
    marginBottom: 8,
  },
  pixInfoText: {
    fontSize: 14,
    color: AppColors.textAuxiliary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  qrCodeContainer: {
    marginBottom: 10,
    borderWidth: 1,
    marginTop: -10,
    borderColor: AppColors.primaryInteractive + '10',
    borderRadius: 8,
    padding: 5,
    backgroundColor: AppColors.primaryInteractive + '10',
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
  pixMessageAbsoluteContainer: {
    position: 'absolute',
    left: '47%',
    top: 10,
    width: 187,
    padding: 18,
    borderRadius: 28,
    backgroundColor: AppColors.backgroundLight,
    elevation: 3,
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pixMessageTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: AppColors.textBody,
    marginBottom: 3,
    textAlign: 'center',
  },
  pixMessageText: {
    fontSize: 10,
    color: AppColors.textAuxiliary,
    textAlign: 'center',
    lineHeight: 12,
    marginBottom: 5,
  },
  pixMessageAttention: {
    fontSize: 10,
    color: AppColors.errorRed,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});