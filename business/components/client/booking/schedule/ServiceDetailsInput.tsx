import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { AppColors } from '../../../../../constants/appStyles';

type Props = {
  durationInMinutes?: number | null;
  setDurationInMinutes?: (v: number | null) => void;
  pricePerHour?: number | null;
  totalPrice?: number | null;
  hideHeader?: boolean; // Opcional: esconde o header interno
};

const MINIMUM_DURATION_MINUTES = 240;

export default function ServiceDetailsInput(props: Props) {
  const { 
    durationInMinutes,
    setDurationInMinutes,
    pricePerHour,
    totalPrice,
    hideHeader = false,
  } = props;

  const handleDurationChange = (text: string) => {
    const num = parseFloat(text) || null;
    if (setDurationInMinutes) {
      setDurationInMinutes(num);
    }
  };

  const effectiveDuration = durationInMinutes
    ? Math.max(MINIMUM_DURATION_MINUTES, durationInMinutes)
    : MINIMUM_DURATION_MINUTES;
  const totalEstimate = totalPrice ?? (pricePerHour && effectiveDuration
    ? pricePerHour * Math.ceil(effectiveDuration / 60)
    : 0);

  return (
    <View style={styles.container}>
      {!hideHeader && (
        <Text style={styles.legacyTitle}>Detalhes do Serviço</Text>
      )}

      <View style={styles.chipsContainer}>
        <Text style={styles.chip}>
          Por Hora · R$ {pricePerHour?.toFixed(2) ?? '--'}/h · mínimo 4h
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Duração (minutos)</Text>
        <TextInput
          style={styles.input}
          value={durationInMinutes?.toString() || ''}
          onChangeText={handleDurationChange}
          keyboardType="numeric"
          placeholder="Ex: 120"
        />
        <Text style={styles.priceText}>
          Total estimado: R$ {totalEstimate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Sem sombra aqui; sombra fica no card pai (schedule-service.tsx)
    padding: 16,
    backgroundColor: AppColors.white, // Fundo branco para consistência
  },
  legacyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F3A4A',
    // ✅ MODIFICAÇÃO 2: Sem sombra (removido shadowColor/opacity/radius)
    marginBottom: 10,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: '#F6F8FB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 14,
    color: AppColors.textBody,
    borderWidth: 1,
    borderColor: '#E6EEF9',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textBody,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E6EEF9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F6F8FB',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.primaryInteractive,
    marginTop: 8,
    textAlign: 'right',
  },
});
