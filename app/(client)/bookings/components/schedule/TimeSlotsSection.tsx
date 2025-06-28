// ./app/(client)/bookings/components/schedule/TimeSlotsSection.tsx
import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import TimeSlotButton from './TimeSlotButton'; // Importa o componente já existente

interface TimeSlotsSectionProps {
    title: string;
    displaySlotsInfo: Array<{ time: string; isAvailable: boolean }>;
    isLoading: boolean;
    selectedTime: string | null;
    onTimeSelect: (time: string) => void;
    isPreference?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const itemMargin = 6;
const numColumns = 3;
const totalHorizontalPadding = 30; // 15px de padding em cada lado da seção (15 * 2)
const calculatedItemWidth = (SCREEN_WIDTH - totalHorizontalPadding - (itemMargin * (numColumns - 1))) / numColumns;


export default function TimeSlotsSection({ title, displaySlotsInfo, isLoading, selectedTime, onTimeSelect, isPreference = false }: TimeSlotsSectionProps) {
    return (
        <View style={isPreference ? styles.preferenceTimeSection : styles.timeSlotsSection}>
            <Text style={isPreference ? styles.preferenceTimeTitle : styles.timeSlotsTitle}>
                {title}
            </Text>
            {isLoading ? (
                <ActivityIndicator size="large" color="#2A72E7" style={styles.slotsLoader} />
            ) : displaySlotsInfo.length > 0 ? (
                <FlatList
                    data={displaySlotsInfo}
                    renderItem={({ item: slotInfo, index }) => { // Destrutura 'index' também
                        // ADICIONADO: LOG DE DEPURACAO PARA O VALOR 'time'
                        console.log(`[TimeSlotsSection] DEBUG: slotInfo.time para o item ${index}: "${slotInfo.time}", typeof: ${typeof slotInfo.time}`);
                        return (
                            <TimeSlotButton
                                time={slotInfo.time}
                                isSelected={selectedTime === slotInfo.time}
                                onPress={onTimeSelect}
                                isAvailable={slotInfo.isAvailable}
                                itemWidth={calculatedItemWidth}
                            />
                        );
                    }}
                    // CORREÇÃO TEMPORÁRIA DA KEY: Adiciona o index para garantir unicidade
                    // Isso vai silenciar o aviso, mas não resolve a causa raiz dos `<span>`s no texto.
                    keyExtractor={(item, index) => `${item.time}-${index}`}
                    numColumns={numColumns}
                    columnWrapperStyle={isPreference ? styles.preferenceTimeRow : styles.timeSlotsRow}
                    contentContainerStyle={isPreference ? styles.preferenceTimeListContainer : styles.timeSlotsListContainer}
                />
            ) : (
                <Text style={styles.noSlotsText}>Nenhum horário disponível para esta data.</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    timeSlotsSection: {
        marginTop: 12,
        paddingHorizontal: 15,
        alignItems: 'center',
    },
    timeSlotsTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
        marginBottom: 18,
        margin: 10,
        
    },
    slotsLoader: {
        marginVertical: 30,
    },
    timeSlotsListContainer: {
        alignItems: 'flex-start',
    },
    timeSlotsRow: {
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginHorizontal: 3,
    },
    noSlotsText: {
        textAlign: 'center',
        color: '#777777',
        fontSize: 14,
        marginVertical: 20,
        fontStyle: 'italic',
    },

    preferenceTimeSection: {
        marginTop: 20,
        paddingHorizontal: 15,
    },
    preferenceTimeTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
        marginBottom: 15,
    },
    preferenceTimeListContainer: {},
    preferenceTimeRow: {
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginHorizontal: 3,
    },
});