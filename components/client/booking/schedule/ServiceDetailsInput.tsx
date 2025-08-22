// LimpeJaApp/components/client/booking/schedule/ServiceDetailsInput.tsx
import { View, Text, TextInput, StyleSheet } from 'react-native';
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
        <View style={detailsStyles.container}>
            <Text style={detailsStyles.title}>Detalhes do Serviço</Text>
            {pricingType === PricingType.HOURLY && (
                <View>
                    <Text style={detailsStyles.label}>Duração do Serviço (em minutos)</Text>
                    <TextInput
                        style={detailsStyles.input}
                        keyboardType="numeric"
                        placeholder="Ex: 120"
                        value={durationInMinutes ? String(durationInMinutes) : ''}
                        onChangeText={(text) => setDurationInMinutes(Number(text) || null)}
                    />
                    <Text style={detailsStyles.infoText}>Preço por hora: R$ {pricePerUnit.toFixed(2).replace('.', ',')}</Text>
                    <Text style={detailsStyles.priceText}>Preço estimado: R$ {finalPrice.toFixed(2).replace('.', ',')}</Text>
                </View>
            )}
            {pricingType === PricingType.BY_SIZE && (
                <View>
                    <Text style={detailsStyles.label}>Área do Serviço (em m²)</Text>
                    <TextInput
                        style={detailsStyles.input}
                        keyboardType="numeric"
                        placeholder="Ex: 50"
                        value={squareMeters ? String(squareMeters) : ''}
                        onChangeText={(text) => setSquareMeters(Number(text) || null)}
                    />
                    <Text style={detailsStyles.infoText}>Preço por m²: R$ {pricePerUnit.toFixed(2).replace('.', ',')}</Text>
                    <Text style={detailsStyles.priceText}>Preço estimado: R$ {finalPrice.toFixed(2).replace('.', ',')}</Text>
                </View>
            )}
        </View>
    );
}

const detailsStyles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 60,
        marginTop: 20,
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        color: '#555',
        marginBottom: 5,
    },
    input: {
        height: 45,
        borderColor: '#E0E0E0',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 10,
        fontSize: 16,
    },
    infoText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
        marginBottom: 5,
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2A72E7',
        textAlign: 'right',
        marginTop: 5,
    },
});
