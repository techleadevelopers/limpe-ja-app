
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { AppColors, AppShadows } from '../../../../constants/appStyles';
import NotificationUIService from '../../../../services/notificationUIService';
import { fetchApi } from '../../../../services/api';

interface SecurityInfoSectionProps {
  successColor: string;
  bookingId?: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SecurityInfoSection({ successColor, bookingId }: SecurityInfoSectionProps) {
  const blueBackgroundColor = `${AppColors.backgroundLight}CC`;
  const blueBorderColor = `${AppColors.primaryInteractive}20`;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const reduceMotionRef = useRef(false);

  const [openingTicket, setOpeningTicket] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      reduceMotionRef.current = enabled;
    });
  }, []);

  useEffect(() => {
    if (reduceMotionRef.current) {
      fadeAnim.setValue(1);
      translateYAnim.setValue(0);
      scaleAnim.setValue(1);
      return;
    }

    const entryAnim = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 500,
        delay: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    entryAnim.start();
    return () => entryAnim.stop();
  }, [fadeAnim, scaleAnim, translateYAnim]);

  const handleOpenSupport = useCallback(async () => {
    if (!bookingId || openingTicket) {
      return;
    }

    setOpeningTicket(true);
    try {
      await fetchApi('/v1/support/tickets', {
        method: 'POST',
        data: {
          bookingId,
          // Use only backend-supported categories
          category: 'OTHER',
          // Backend expects `description` (not `message`)
          description: 'Ajuda com meu agendamento',
        },
        headers: { 'x-silent': '1' },
      });
      NotificationUIService.showSuccess('Nossa equipe já recebeu sua solicitação.', 'Ticket de suporte aberto');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[SecurityInfoSection] Falha ao abrir ticket de suporte:', error);
      NotificationUIService.showError('Não foi possível abrir o chamado agora. Tente novamente.');
    } finally {
      setOpeningTicket(false);
    }
  }, [bookingId, openingTicket]);

  return (
    <Animated.View
      style={[
        styles.securitySection,
        {
          backgroundColor: blueBackgroundColor,
          borderColor: blueBorderColor,
          width: SCREEN_WIDTH * 0.92,
          alignSelf: 'center',
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
          marginHorizontal: Platform.OS === 'ios' ? 12 : 8,
        },
      ]}
    >
      <Image
        source={require('../../../../assets/images/safe-icon.png')}
        style={styles.securityImage}
        accessible={false}
      />
      <Text style={styles.securityTextHeader} maxFontSizeMultiplier={1.2}>
        Sua Segurança é Nossa Prioridade
      </Text>
      <Text style={styles.securityText} maxFontSizeMultiplier={1.2} numberOfLines={3}>
        Nossos prestadores passam por verificação rigorosa e cada serviço possui cobertura de garantia. Em caso de dúvida ou incidente, acione o suporte imediatamente.
      </Text>
      <Text style={styles.securityTextSmall} maxFontSizeMultiplier={1.2}>
        Agendamento registrado com segurança.
      </Text>
      <TouchableOpacity
        style={[
          styles.supportButton,
          { backgroundColor: successColor },
          (!bookingId || openingTicket) && styles.supportButtonDisabled,
        ]}
        onPress={handleOpenSupport}
        disabled={!bookingId || openingTicket}
        accessibilityRole="button"
        accessibilityHint="Abre um chamado de suporte para este agendamento"
      >
        <Text style={styles.supportButtonText}>
          {openingTicket ? 'Abrindo chamado…' : 'Falar com suporte'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  securitySection: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    ...AppShadows.medium,
    paddingBottom: 20,
  },
  securityImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  securityTextHeader: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    fontWeight: '600',
    color: AppColors.textBody,
    marginBottom: 8,
    textAlign: 'center',
  },
  securityText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    color: AppColors.textAuxiliary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  securityTextSmall: {
    fontSize: 11,
    fontFamily: 'Montserrat-Regular',
    color: AppColors.textAuxiliary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  supportButton: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  supportButtonDisabled: {
    backgroundColor: `${AppColors.primaryInteractive}55`,
  },
  supportButtonText: {
    color: AppColors.white,
    fontSize: 13,
    fontFamily: 'Montserrat-SemiBold',
    textAlign: 'center',
  },
});
