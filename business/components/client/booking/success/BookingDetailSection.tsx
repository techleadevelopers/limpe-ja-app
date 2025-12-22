// LimpeJaApp/app/client/bookings/components/success/BookingDetailSection.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Easing, Platform } from 'react-native';
import { AppColors } from '../../../../constants/appStyles'; // Importe AppColors
import { sanitizeText } from '../../../../utils/formatters'; // Importar sanitizeText

interface BookingDetailSectionProps {
  serviceName: string;
  formattedAddressLine1: string;
  formattedAddressLine2: string;
  notes?: string | null;
  iconColor: string; // Mantido, mas AppColors.primaryInteractive é usado diretamente
}

export default function BookingDetailSection({
  serviceName,
  formattedAddressLine1,
  formattedAddressLine2,
  notes,
  iconColor, // Não usado diretamente, AppColors.primaryInteractive é usado
}: BookingDetailSectionProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const entryAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 500,
        delay: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);
    entryAnimation.start();

    return () => entryAnimation.stop(); // Cleanup da animação
  }, []);

  return (
    <Animated.View
      style={[
        styles.detailSection,
        { opacity: fadeAnim, transform: [{ translateY: translateYAnim }, { scale: scaleAnim }] },
      ]}
    >
      <View style={styles.detailItem}>
        <Ionicons name="brush-outline" size={19} color={AppColors.primaryInteractive} />
        <Text style={styles.detailLabel} maxFontSizeMultiplier={1.2}>Serviço Contratado</Text>
        <Text style={styles.detailValue} numberOfLines={2} maxFontSizeMultiplier={1.2}>{sanitizeText(serviceName)}</Text>
      </View>

      <View style={styles.detailItem}>
        <Ionicons name="location-outline" size={19} color={AppColors.primaryInteractive} />
        <Text style={styles.detailLabel} maxFontSizeMultiplier={1.2}>Local do Serviço</Text>
        <View style={styles.addressContainer}>
          <Text style={styles.detailValue} numberOfLines={1} maxFontSizeMultiplier={1.2}>{sanitizeText(formattedAddressLine1)}</Text>
          <Text style={styles.detailValue} numberOfLines={1} maxFontSizeMultiplier={1.2}>{sanitizeText(formattedAddressLine2)}</Text>
        </View>
      </View>

      {notes ? (
        <View style={styles.detailItem}>
          <Ionicons name="document-text-outline" size={18} color={AppColors.primaryInteractive} />
          <Text style={styles.detailLabel} maxFontSizeMultiplier={1.2}>Observações</Text>
          <Text style={styles.detailValueNotes} numberOfLines={3} maxFontSizeMultiplier={1.2}>{sanitizeText(notes)}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  detailSection: {
    marginBottom: 25,
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'android' ? 5 : 0,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16, // Espaçamento lógico
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    color: AppColors.textAuxiliary,
    marginLeft: 16,
    flex: 1,
  },
  addressContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  detailValue: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    fontWeight: 'bold',
    color: AppColors.textBody,
    textAlign: 'right',
  },
  detailValueNotes: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    color: AppColors.textBody,
    flex: 2,
    textAlign: 'right',
    lineHeight: 20,
  },
});