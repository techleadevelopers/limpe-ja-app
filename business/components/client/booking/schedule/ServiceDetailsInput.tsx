import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { PricingType } from '../../../../types/backend/services'; // Ajuste o path conforme sua estrutura
import { AppColors } from '../../../../constants/appStyles'; // Ajuste o path

type Props = {
  pricingType: PricingType;
  durationInMinutes?: number | null;
  setDurationInMinutes?: (v: number | null) => void;
  squareMeters?: number | null;
  setSquareMeters?: (v: number | null) => void;
  pricePerUnit?: number;
  finalPrice?: number;
  hideHeader?: boolean; // ← NOVA PROP: Opcional, esconde o header interno
};

export default function ServiceDetailsInput(props: Props) {
  const { 
    pricingType, 
    durationInMinutes, 
    setDurationInMinutes, 
    squareMeters, 
    setSquareMeters, 
    pricePerUnit, 
    finalPrice,
    hideHeader = false, // Default: mostra header se não especificado
  } = props;

  // Lógica simples para inputs (exemplo; ajuste conforme necessário)
  const handleDurationChange = (text: string) => {
    const num = parseFloat(text) || null;
    if (setDurationInMinutes) setDurationInMinutes(num);
  };

  const handleSquareMetersChange = (text: string) => {
    const num = parseFloat(text) || null;
    if (setSquareMeters) setSquareMeters(num);
  };

  // Exemplo de chip para pricing (ajuste conforme seu design)
  const renderPricingChip = () => {
    switch (pricingType) {
      case PricingType.HOURLY:
        return <Text style={styles.chip}>Por Hora (R$ {pricePerUnit?.toFixed(2)}/h)</Text>;
      case PricingType.BY_SIZE:
        return <Text style={styles.chip}>Por m² (R$ {pricePerUnit?.toFixed(2)}/m²)</Text>;
      default:
        return <Text style={styles.chip}>Preço Fixo (R$ {finalPrice?.toFixed(2)})</Text>;
    }
  };

  return (
    <View style={styles.container}>
      {/* ✅ MODIFICAÇÃO 2: Header condicional - só renderiza se !hideHeader, e sem sombra */}
      {!hideHeader && (
        <Text style={styles.legacyTitle}>Detalhes do Serviço</Text>
      )}

      {/* ✅ Conteúdo principal: Chips de pricing */}
      <View style={styles.chipsContainer}>
        {renderPricingChip()}
      </View>

      {/* Inputs condicionais baseados no pricingType */}
      {pricingType === PricingType.HOURLY && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Duração (minutos)</Text>
          <TextInput
            style={styles.input}
            value={durationInMinutes?.toString() || ''}
            onChangeText={handleDurationChange}
            keyboardType="numeric"
            placeholder="Ex: 120"
          />
          <Text style={styles.priceText}>Preço estimado: R$ {(finalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
        </View>
      )}

      {pricingType === PricingType.BY_SIZE && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Área (m²)</Text>
          <TextInput
            style={styles.input}
            value={squareMeters?.toString() || ''}
            onChangeText={handleSquareMetersChange}
            keyboardType="numeric"
            placeholder="Ex: 50"
          />
          <Text style={styles.priceText}>Preço estimado: R$ {(finalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
        </View>
      )}

      {/* Outros pricing types: Sem inputs extras */}
      {pricingType !== PricingType.HOURLY && pricingType !== PricingType.BY_SIZE && (
        <Text style={styles.priceText}>Preço fixo: R$ {(finalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
      )}
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