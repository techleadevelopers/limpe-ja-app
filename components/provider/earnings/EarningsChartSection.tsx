// app/(provider)/earnings/components/EarningsChartSection.tsx
import React from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

// Importa a tipagem de ChartData
interface ChartData {
    labels: string[];
    datasets: {
        data: number[];
        color?: (opacity: number) => string;
        strokeWidth?: number;
    }[];
}

interface EarningsChartSectionProps {
    chartData: ChartData | null;
    animation: Animated.Value;
}

// DEFINIÇÕES DE CORES LOCAIS (Para resolver o erro de forma direta)
const WHITE = '#FFFFFF';
const BACKGROUND_COLOR_LIGHT = '#F8F9FA'; // Fundo para placeholders
const MUTED_TEXT_COLOR = '#6C757D'; // Cinza para rótulos do gráfico e texto muted
const PLACEHOLDER_ICON_COLOR = '#CED4DA'; // Cinza claro para ícones de placeholder
const PRIMARY_COLOR_CHART = '#007AFF'; // Azul principal do gráfico
const TEXT_COLOR_DARK_CHART = '#1C3A5F'; // Azul escuro para títulos de seção
const BORDER_COLOR_CHART = '#E9ECEF'; // Borda sutil

const EarningsChartSection: React.FC<EarningsChartSectionProps> = ({ chartData, animation }) => {
    // Largura do gráfico ajustada para o tamanho da tela e paddings
    const chartWidth = Platform.OS === 'web' ? Dimensions.get('window').width * 0.8 : (Dimensions.get('window').width - 30 - 40);

    return (
        <Animated.View style={[styles.chartSection, { opacity: animation, transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Ganhos ao Longo do Tempo</Text>
            {chartData ? (
                <View style={styles.chartContainer}>
                    <LineChart
                        data={chartData}
                        width={chartWidth}
                        height={220}
                        yAxisLabel="R$"
                        yAxisSuffix=""
                        chartConfig={{
                            backgroundColor: WHITE,
                            backgroundGradientFrom: WHITE,
                            backgroundGradientTo: WHITE,
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(${parseInt(PRIMARY_COLOR_CHART.slice(1,3), 16)}, ${parseInt(PRIMARY_COLOR_CHART.slice(3,5), 16)}, ${parseInt(PRIMARY_COLOR_CHART.slice(5,7), 16)}, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(${parseInt(MUTED_TEXT_COLOR.slice(1,3), 16)}, ${parseInt(MUTED_TEXT_COLOR.slice(3,5), 16)}, ${parseInt(MUTED_TEXT_COLOR.slice(5,7), 16)}, ${opacity})`,
                            style: {
                                borderRadius: 10
                            },
                            propsForDots: {
                                r: "6",
                                strokeWidth: "2",
                                stroke: PRIMARY_COLOR_CHART
                            }
                        }}
                        bezier
                        style={{
                            marginVertical: 8,
                            borderRadius: 10
                        }}
                    />
                </View>
            ) : (
                <View style={styles.chartPlaceholder}>
                    <MaterialCommunityIcons name="chart-line" size={60} color={PLACEHOLDER_ICON_COLOR} accessibilityLabel="Ícone de Gráfico Vazio" />
                    <Text style={styles.chartPlaceholderText}>Gráfico de Ganhos (dados em breve)</Text>
                    <Text style={styles.chartPlaceholderSubText}>Visualize seu histórico de ganhos aqui.</Text>
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: TEXT_COLOR_DARK_CHART, // Usando constante local
        marginBottom: 15,
        marginTop: 10,
        fontFamily: 'System'
    },
    chartSection: {
        backgroundColor: WHITE,
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        ...Platform.select({
            ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
            android: { elevation: 4 },
        }),
    },
    chartContainer: {
        width: Dimensions.get('window').width - 30 - 40,
        alignSelf: 'center',
    },
    chartPlaceholder: {
        backgroundColor: BACKGROUND_COLOR_LIGHT, // Usando constante local
        borderRadius: 10,
        width: '100%',
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: BORDER_COLOR_CHART, // Usando constante local
        borderStyle: 'dashed',
    },
    chartPlaceholderText: {
        fontSize: 16,
        color: MUTED_TEXT_COLOR, // Usando constante local
        marginTop: 10,
        fontFamily: 'System'
    },
    chartPlaceholderSubText: {
        fontSize: 14,
        color: MUTED_TEXT_COLOR, // Usando constante local
        marginTop: 5,
        fontFamily: 'System'
    },
});

export default EarningsChartSection;