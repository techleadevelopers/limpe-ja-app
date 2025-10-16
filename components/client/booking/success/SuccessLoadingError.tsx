// LimpeJaApp/app/(client)/bookings/components/success/SuccessLoadingError.tsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { AppColors } from '../../../../constants/appStyles';
import { sanitizeText } from '../../../../utils/formatters';

interface SuccessLoadingErrorProps {
  isLoading: boolean;
  error: string | null;
  headerPrimaryColor: string;
  onRetryPress: () => void;
}

export default function SuccessLoadingError({ isLoading, error, headerPrimaryColor, onRetryPress }: SuccessLoadingErrorProps) {
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: "Pagamento", headerShown: false }} />
        <ActivityIndicator size="large" color={headerPrimaryColor} />
        <Text style={styles.loadingText} maxFontSizeMultiplier={1.2}>Preparando os detalhes do seu agendamento…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: "Não foi possível carregar" }} />
        <Ionicons name="alert-circle-outline" size={48} color={AppColors.errorRed} />
        <Text style={styles.errorText} maxFontSizeMultiplier={1.2}>{sanitizeText(error)}</Text>
        <TouchableOpacity onPress={onRetryPress} style={styles.actionButton} activeOpacity={0.7}>
          <Text style={styles.actionButtonText} maxFontSizeMultiplier={1.2}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: AppColors.backgroundLight,
    paddingTop: Platform.OS === 'android' ? 100 : 80,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: AppColors.textAuxiliary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: AppColors.errorRed,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  actionButton: {
    backgroundColor: AppColors.primaryInteractive,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
  },
  actionButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
