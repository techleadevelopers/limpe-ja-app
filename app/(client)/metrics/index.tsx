// LimpeJaApp/app/(client)/metrics/index.tsx
import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { metricsService } from '../../../services/metricsService';
import { MetricsSummary, MetricsTimeseriesDataPoint, MetricsFunnel } from '../../../types/backend/metrics';
import { LineChart } from 'react-native-chart-kit'; // Make sure to install this library: `npm install react-native-chart-kit`
import { KPIValue } from '../../../components/KPIValue'; // Importar KPIValue
import { Skeleton } from '../../../components/Skeleton'; // Importar Skeleton
import { EmptyState } from '../../../components/EmptyState'; // Importar EmptyState

const { width } = Dimensions.get('window');

/**
 * ClientMetricsScreen component displays various metrics for the client,
 * including a summary, timeseries data (e.g., bookings and revenue over time),
 * and a conversion funnel.
 */
export default function ClientMetricsScreen() {
    const router = useRouter();
    const [summary, setSummary] = useState<MetricsSummary | null>(null);
    const [timeseries, setTimeseries] = useState<MetricsTimeseriesDataPoint[]>([]);
    const [funnel, setFunnel] = useState<MetricsFunnel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetches all metrics data concurrently.
     * Wrapped in useCallback to ensure its stability across renders,
     * which is good practice when passing functions to event handlers or useEffect dependencies.
     */
    const fetchMetrics = useCallback(async () => {
        try {
            setLoading(true);
            const [summaryData, timeseriesData, funnelData] = await Promise.all([
                metricsService.getMetricsSummary(),
                metricsService.getMetricsTimeseries('month'), // Example: fetch last month's data
                metricsService.getMetricsFunnel(),
            ]);
            setSummary(summaryData);
            setTimeseries(timeseriesData);
            setFunnel(funnelData);
        } catch (err) {
            console.error('Failed to fetch metrics:', err);
            setError('Não foi possível carregar as métricas. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array means this function is created once

    useEffect(() => {
        fetchMetrics(); // Call the memoized fetchMetrics function
    }, [fetchMetrics]); // Depend on fetchMetrics to re-run if it ever changes (which it won't with empty deps)

    // Configuration for the LineChart component
    const chartConfig = {
        backgroundGradientFrom: '#FFFFFF',
        backgroundGradientTo: '#FFFFFF',
        decimalPlaces: 0, // Optional: defaults to 2dp, set to 0 for integer values
        color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`, // Main blue color for the chart
        labelColor: (opacity = 1) => `rgba(45, 45, 45, ${opacity})`, // Dark gray for labels
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false, // Optional: if true, uses dataset color for shadow
        propsForDots: {
            r: "4", // Radius of dots
            strokeWidth: "2", // Stroke width of dots
            stroke: "#4A90E2" // Stroke color of dots
        },
    };

    if (loading) {
        return (
            <View style={styles.centeredContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                {/* Substituído ActivityIndicator por Skeleton */}
                <Skeleton height={150} width="90%" radius={12} style={{ marginBottom: 20 }} />
                <Skeleton height={20} width="60%" radius={8} />
                <Text style={styles.loadingText}>Carregando métricas...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centeredContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <Ionicons name="alert-circle-outline" size={50} color="#D32F2F" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchMetrics}> {/* Corrected: fetchMetrics is now accessible */}
                    <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Prepare data for the LineChart
    const chartData = {
        labels: timeseries.map(data => new Date(data.date).getDate().toString()), // Extracts day number for labels
        datasets: [
            {
                data: timeseries.map(data => data.bookings),
                color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`, // Blue for bookings line
                strokeWidth: 2,
                withDots: true,
            },
            {
                data: timeseries.map(data => data.revenue / 100), // Assuming revenue is in cents, convert to R$
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for revenue line
                strokeWidth: 2,
                withDots: true,
            }
        ],
        legend: ["Agendamentos", "Receita (R$)"] // Legend for the chart lines
    };

    const hasData = summary && (summary.totalBookings > 0 || summary.totalRevenue > 0 || summary.completedMissions > 0 || timeseries.length > 0 || funnel);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header with back button */}
            <View style={styles.customHeader}>
                <TouchableOpacity style={styles.headerIconLeft} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#2F4F4F" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Minhas Métricas</Text>
                <View style={styles.headerIconRightPlaceholder} /> {/* Placeholder for alignment */}
            </View>

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {!hasData ? (
                    <EmptyState
                        title="Nenhuma Métrica Disponível"
                        subtitle="Parece que você ainda não tem dados para exibir. Comece a explorar nossos serviços!"
                        ctaLabel="Explorar Serviços"
                        onPress={() => router.push('/(client)/explore' as any)}
                    />
                ) : (
                    <>
                        {/* Metrics Summary Card */}
                        {summary && (
                            <View style={styles.sectionCard}>
                                <Text style={styles.cardTitle}>Resumo Geral</Text>
                                <View style={styles.summaryGrid}>
                                    <View style={styles.summaryItem}>
                                        <KPIValue value={summary.totalBookings} style={styles.summaryValue} />
                                        <Text style={styles.summaryLabel}>Agendamentos Totais</Text>
                                    </View>
                                    <View style={styles.summaryItem}>
                                        <KPIValue value={summary.totalRevenue} prefix="R$ " style={styles.summaryValue} />
                                        <Text style={styles.summaryLabel}>Receita Total</Text>
                                    </View>
                                    <View style={styles.summaryItem}>
                                        <KPIValue value={summary.averageRating} style={styles.summaryValue} />
                                        <Text style={styles.summaryLabel}>Avaliação Média</Text>
                                    </View>
                                    <View style={styles.summaryItem}>
                                        <KPIValue value={summary.completedMissions} style={styles.summaryValue} />
                                        <Text style={styles.summaryLabel}>Missões Concluídas</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Timeseries Chart Card (Bookings and Revenue) */}
                        {timeseries.length > 0 ? (
                            <View style={styles.sectionCard}>
                                <Text style={styles.cardTitle}>Agendamentos e Receita (Último Mês)</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <LineChart
                                        data={chartData}
                                        // Adjust chart width based on number of data points to prevent crowding
                                        width={Math.max(width - 40, timeseries.length * 40)}
                                        height={220}
                                        chartConfig={chartConfig}
                                        bezier // Smooth curves
                                        style={styles.chart}
                                    />
                                </ScrollView>
                            </View>
                        ) : (
                            <View style={styles.sectionCard}>
                                <Text style={styles.cardTitle}>Agendamentos e Receita (Último Mês)</Text>
                                <Skeleton height={220} width="100%" radius={16} />
                            </View>
                        )}

                        {/* Conversion Funnel Card */}
                        {funnel && (
                            <View style={styles.sectionCard}>
                                <Text style={styles.cardTitle}>Funil de Conversão</Text>
                                {funnel.steps.map((step, index) => (
                                    <View key={index} style={styles.funnelItem}>
                                        <Text style={styles.funnelLabel}>{step.name}</Text>
                                        <Text style={styles.funnelValue}>{step.count} ({step.percentage.toFixed(1)}%)</Text>
                                        <View style={styles.funnelProgressBarContainer}>
                                            <View style={[styles.funnelProgressBar, { width: `${step.percentage}%` }]} />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F8FF', // AliceBlue - Light background
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F8FF',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#6C757D', // Dark gray for loading text
    },
    errorText: {
        marginTop: 15,
        fontSize: 16,
        color: '#D32F2F', // Red for error text
        textAlign: 'center',
        marginHorizontal: 20,
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#4A90E2', // Blue button
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20, // Adjust padding for iOS notch
        backgroundColor: 'transparent', // Transparent header background
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2F4F4F', // Dark text for contrast
        textAlign: 'center',
        flex: 1,
    },
    headerIconLeft: {
        padding: 5,
        zIndex: 1,
    },
    headerIconRightPlaceholder: {
        width: 24 + 10, // Matches the left icon's width for centering
        zIndex: 1,
    },
    scrollViewContent: {
        paddingVertical: 20,
        paddingHorizontal: 15,
    },
    sectionCard: {
        backgroundColor: '#FFFFFF', // White background for cards
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.08)',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529', // Dark gray for titles
        marginBottom: 15,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    summaryItem: {
        width: '48%', // Two items per row
        backgroundColor: '#F8FAFB', // Very light gray for summary item background
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#4A90E2', // Blue for key values
    },
    summaryLabel: {
        fontSize: 13,
        color: '#6C757D', // Dark gray for labels
        textAlign: 'center',
        marginTop: 5,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    funnelItem: {
        marginBottom: 15,
    },
    funnelLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#212529', // Dark gray for funnel step labels
    },
    funnelValue: {
        fontSize: 14,
        color: '#6C757D', // Dark gray for funnel step values
        marginTop: 4,
    },
    funnelProgressBarContainer: {
        height: 8,
        backgroundColor: '#E9ECEF', // Light gray for progress bar track
        borderRadius: 4,
        marginTop: 8,
        overflow: 'hidden',
    },
    funnelProgressBar: {
        height: '100%',
        backgroundColor: '#4CAF50', // Green for progress fill
        borderRadius: 4,
    },
});