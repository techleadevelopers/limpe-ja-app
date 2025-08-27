// LimpeJaApp/components/client/booking/schedule/ServiceDetailsInput.tsx
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import React from 'react';
import { PricingType } from '../../../../types/backend/services';

interface ServiceDetailsInputProps {
  pricingType: PricingType;
  durationInMinutes: number | null;
  setDurationInMinutes: (value: number | null) => void;
  squareMeters: number | null;
  setSquareMeters: (value: number | null) => void;
  pricePerUnit: number;
  finalPrice: number;
}

export default function ServiceDetailsInput({
  pricingType,
  durationInMinutes,
  setDurationInMinutes,
  squareMeters,
  setSquareMeters,
  pricePerUnit,
  finalPrice
}: ServiceDetailsInputProps) {
  return (
    <View style={s.card}>
      <Text style={s.title}>Detalhes do Serviço</Text>

      {pricingType === PricingType.HOURLY && (
        <View>
          <Text style={s.label}>Duração (min)</Text>
          <TextInput
            style={s.input}
            keyboardType="numeric"
            placeholder="Ex: 120"
            value={durationInMinutes ? String(durationInMinutes) : ''}
            onChangeText={(text) => setDurationInMinutes(Number(text) || null)}
            placeholderTextColor="#8BA0B5"
          />
          <View style={s.rowRight}>
            <Text style={s.info}>Preço/hora: R$ {pricePerUnit.toFixed(2).replace('.', ',')}</Text>
            <Text style={s.price}>Est.: R$ {finalPrice.toFixed(2).replace('.', ',')}</Text>
          </View>
        </View>
      )}

      {pricingType === PricingType.BY_SIZE && (
        <View>
          <Text style={s.label}>Área (m²)</Text>
          <TextInput
            style={s.input}
            keyboardType="numeric"
            placeholder="Ex: 50"
            value={squareMeters ? String(squareMeters) : ''}
            onChangeText={(text) => setSquareMeters(Number(text) || null)}
            placeholderTextColor="#8BA0B5"
          />
          <View style={s.rowRight}>
            <Text style={s.info}>Preço/m²: R$ {pricePerUnit.toFixed(2).replace('.', ',')}</Text>
            <Text style={s.price}>Est.: R$ {finalPrice.toFixed(2).replace('.', ',')}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: '#1E2A3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2E45',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  label: { fontSize: 13, color: '#44596E', marginBottom: 6 },
  input: {
    height: 44,
    borderColor: '#E3ECF8',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    fontSize: 15,
    backgroundColor: '#F8FBFF',
  },
  rowRight: { flexDirection: 'row', justifyContent: 'space-between' },
  info: { fontSize: 12, color: '#667A90' },
  price: { fontSize: 15, fontWeight: '700', color: '#2A72E7' },
});
