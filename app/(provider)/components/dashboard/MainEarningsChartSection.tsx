import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import CircularProgressChart from './CircularProgressChart';
// REMOVIDO: A importação condicional do SkeletonPlaceholder foi removida.
// const SafeSkeletonPlaceholder = Platform.OS === 'web'
//   ? ({ children }: { children: React.ReactNode }) => <>{children}</>
//   : require('react-native-skeleton-placeholder').default;

interface EarningsSummary {
  today: number;
  weekly: number;
  monthly: number;
}

interface MainEarningsChartSectionProps {
  contentAnim: Animated.Value;
  totalGrossSales: number;
  earningsSummary: EarningsSummary;
  isLoading: boolean; // Adicionado prop para estado de carregamento
  onChartDetailPress: () => void; // Para o botão "Detalhe" do gráfico
}

const MainEarningsChartSection: React.FC<MainEarningsChartSectionProps> = ({
  contentAnim,
  totalGrossSales,
  earningsSummary,
  isLoading,
  onChartDetailPress,
}) => {
  const animatedTotalSales = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading && totalGrossSales !== undefined) {
      Animated.timing(animatedTotalSales, {
        toValue: totalGrossSales,
        duration: 1000, // Animar a contagem do valor total
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, totalGrossSales]);

  // Interpolador para formatar o valor animado para moeda
  const formattedAnimatedTotalSales = animatedTotalSales.interpolate({
    inputRange: [0, totalGrossSales || 1],
    outputRange: ['R$ 0,00', new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGrossSales || 0)],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.mainChartContainer, { opacity: contentAnim }]}>
      {isLoading ? (
        <View style={styles.skeletonChartContainer}>
          <View style={{ width: 180, height: 180, borderRadius: 90, marginBottom: 20, backgroundColor: '#E0E0E0' }} />
          <View style={styles.chartBottomCards}>
            <View style={styles.skeletonChartBottomCard}>
              <View style={{ width: 100, height: 14, borderRadius: 4, backgroundColor: '#E0E0E0' }} />
              <View style={{ width: 80, height: 20, borderRadius: 4, marginTop: 5, backgroundColor: '#E0E0E0' }} />
            </View>
            <View style={styles.skeletonChartBottomCard}>
              <View style={{ width: 100, height: 14, borderRadius: 4, backgroundColor: '#E0E0E0' }} />
              <View style={{ width: 80, height: 20, borderRadius: 4, marginTop: 5, backgroundColor: '#E0E0E0' }} />
            </View>
          </View>
        </View>
      ) : (
        <>
          <CircularProgressChart
            progress={Math.min(1, earningsSummary.today / (earningsSummary.monthly || 1))}
            radius={100}
            strokeWidth={15}
            color="#007AFF"
            backgroundColor="#E0E0E0"
            value={formattedAnimatedTotalSales as any} // Passa o valor animado para o gráfico
            label="Ganhos Brutos"
            onDetailPress={onChartDetailPress} // Passa a função de clique
          />
          <View style={styles.chartBottomCards}>
            <View style={styles.chartBottomCard}>
              <Text style={styles.chartBottomCardLabel}>Ganhos Semanais</Text>
              <Text style={styles.chartBottomCardValue}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(earningsSummary.weekly)}
              </Text>
            </View>
            <View style={styles.chartBottomCard}>
              <Text style={styles.chartBottomCardLabel}>Ganhos Mensais</Text>
              <Text style={styles.chartBottomCardValue}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(earningsSummary.monthly)}
              </Text>
            </View>
          </View>
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  mainChartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  chartBottomCards: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  chartBottomCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  chartBottomCardLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 5,
  },
  chartBottomCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  skeletonChartContainer: {
    // Estes estilos já estão definidos, mas pode ser necessário adicionar um background-color se o SafeSkeletonPlaceholder tivesse um padrao
    alignItems: 'center',
    padding: 20,
    width: '100%',
    // backgroundColor: '#F0F0F0', // Adicione se o background do skeleton não estiver visível
  },
  skeletonChartBottomCard: {
    backgroundColor: '#E0E0E0', // Mantido para simular a cor do esqueleto
    borderRadius: 10,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
});

export default MainEarningsChartSection;