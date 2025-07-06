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

// Define a margem horizontal *por item* para que o cálculo seja preciso.
// Se TimeSlotButton usa `margin: 5`, então cada item tem 5px de margem à esquerda e à direita.
// No entanto, para o layout de colunas, precisamos apenas da margem ENTRE os itens.
// Vamos usar uma margem consistente que é aplicada apenas no TimeSlotButton.
const itemHorizontalMargin = 3; // A margem horizontal de cada TimeSlotButton
const numColumns = 3;
const sectionHorizontalPadding = 40; // Padding real da seção em cada lado

// Cálculo da largura do item:
// (Largura da Tela
// - Padding total da seção (esquerda + direita)
// - Margens *entre* as colunas: (numColumns - 1) * 2 * itemHorizontalMargin -> Cada item tem margem esquerda/direita,
//                                                                               mas só queremos a margem entre eles.
//                                                                               No 'columnWrapperStyle', o justifyContent 'space-between'
//                                                                               pode ser melhor.
// VAMOS SIMPLIFICAR O CÁLCULO E DEIXAR A MARGEM SER TRATADA PELO ITEM E PELO columnWrapperStyle.
// A largura do item será simplesmente a largura disponível dividida pelo número de colunas.
// O espaçamento será dado pelo `justifyContent: 'space-between'` no `columnWrapperStyle` e um `gap` ou `marginHorizontal` no botão.
const calculatedItemWidth = (SCREEN_WIDTH - (sectionHorizontalPadding * 2) - (itemHorizontalMargin * (numColumns * 2))) / numColumns;
// OU, mais simples para `numColumns` com margens laterais fixas no botão:
// A largura total disponível para os slots é SCREEN_WIDTH - 2 * sectionHorizontalPadding
// Cada slot tem 2 * itemHorizontalMargin de margem horizontal total.
// Então, largura útil = SCREEN_WIDTH - (sectionHorizontalPadding * 2)
// Largura para 3 slots = largura útil / 3
// Remova as margens do slot para obter a largura real do conteúdo
const itemBaseWidth = (SCREEN_WIDTH - (sectionHorizontalPadding * 2)) / numColumns;
// Ajuste para considerar o 'marginHorizontal' interno de cada item
const finalCalculatedItemWidth = itemBaseWidth - (itemHorizontalMargin * 2);


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
                    renderItem={({ item: slotInfo, index }) => {
                        console.log(`[TimeSlotsSection] DEBUG: slotInfo.time para o item ${index}: "${slotInfo.time}", typeof: ${typeof slotInfo.time}`);
                        return (
                            <TimeSlotButton
                                time={slotInfo.time}
                                isSelected={selectedTime === slotInfo.time}
                                onPress={onTimeSelect}
                                isAvailable={slotInfo.isAvailable}
                                // Passamos a largura calculada para o botão
                                itemWidth={finalCalculatedItemWidth}
                            />
                        );
                    }}
                    keyExtractor={(item, index) => `${item.time}-${index}`}
                    numColumns={numColumns}
                    // Ajuste aqui: justifyContent 'space-between' distribui os itens igualmente
                    // E 'paddingHorizontal' para garantir que os itens não fiquem colados nas bordas
                    columnWrapperStyle={[
                        isPreference ? styles.preferenceTimeRow : styles.timeSlotsRow,
                        { justifyContent: 'space-between', marginBottom: itemHorizontalMargin * 2 } // Adiciona margem entre as linhas
                    ]}
                    contentContainerStyle={styles.timeSlotsListContainer} // Já está ok com alignItems: 'flex-start'
                />
            ) : (
                <Text style={styles.noSlotsText}>Nenhum horário disponível para esta data.</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    timeSlotsSection: {
        marginTop: -16,
        paddingHorizontal: 15, // Mantenha o padding da seção
        alignItems: 'center', // Para centralizar o título e FlatList
         shadowColor: 'rgb(33, 34, 34)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
       
    },
    timeSlotsTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
        marginBottom: 20,
        margin: 10,

    },
    slotsLoader: {
        marginVertical: 30,
    },
    timeSlotsListContainer: {
        // FlatList já se estende, este alignItems: 'flex-start' garante que os itens não se espalhem muito
        // mas o columnWrapperStyle com 'space-between' lida com a distribuição horizontal.
        alignSelf: 'stretch', // Garante que o container da lista preencha a largura disponível
         shadowColor: 'rgb(33, 34, 34)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
        paddingHorizontal: itemHorizontalMargin, // Adicione padding para as margens laterais dos botões
    },
    timeSlotsRow: {
        // flexWrap: 'wrap' e justifyContent são controlados pelo columnWrapperStyle da FlatList
        // Remova marginHorizontal daqui, pois o columnWrapperStyle e o itemMargin no botão lidam com isso.
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
    preferenceTimeListContainer: {
        alignSelf: 'stretch',
        paddingHorizontal: itemHorizontalMargin,
    },
    preferenceTimeRow: {
        // flexWrap: 'wrap' e justifyContent são controlados pelo columnWrapperStyle da FlatList
        // Remova marginHorizontal daqui
    },
});