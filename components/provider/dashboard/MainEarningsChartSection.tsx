// app/(provider)/earnings/components/MainEarningsChartSection.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import CircularProgressChart from './CircularProgressChart';

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
      // Reset the animated value to 0 before starting the animation
      animatedTotalSales.setValue(0);
      Animated.timing(animatedTotalSales, {
        toValue: totalGrossSales,
        duration: 1000, // Animar a contagem do valor total
        // useNativeDriver: true pode ser usado se você não estiver lendo o valor animado diretamente para texto
        // Se o CircularProgressChart for ler o valor para exibir texto, useNativeDriver deve ser false
        useNativeDriver: false, // Alterado para false para permitir a leitura do valor animado no JS
      }).start();
    }
  }, [isLoading, totalGrossSales, animatedTotalSales]);

  // REMOVIDO: A interpolação para string de moeda (formattedAnimatedTotalSales)
  // era a causa do erro. O componente CircularProgressChart agora deve ser
  // responsável por formatar o Animated.Value numérico para exibição.

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
            value={animatedTotalSales} // Passa o Animated.Value numérico diretamente
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
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  skeletonChartBottomCard: {
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
});

export default MainEarningsChartSection;