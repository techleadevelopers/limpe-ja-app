import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProviderEarningsSummary } from '../../../../types'; // Ajuste o caminho
import Toast from 'react-native-toast-message'; // Para ToastMessages

// REMOVIDO: A importação condicional do SkeletonPlaceholder foi removida.
// const SafeSkeletonPlaceholder = Platform.OS === 'web'
//   ? ({ children }: { children: React.ReactNode }) => <>{children}</>
//   : require('react-native-skeleton-placeholder').default;

interface EarningsSnapshotSectionProps {
  contentAnim: Animated.Value;
  earningsSummary: ProviderEarningsSummary;
  onViewAllEarningsPress: () => void;
  reflectionOffset: Animated.AnimatedInterpolation<string | number>;
  isLoading: boolean; // Adicionado prop para estado de carregamento
}

// Cores para o tema
const LIGHT_BLUE = '#A0D8F7';
const ROYAL_PURPLE_BLUE = '#6A5ACD';
const WHITE_TRANSPARENT = 'rgba(255, 255, 255, 0.2)';
const SHADOW_COLOR_BLUE = 'rgba(0, 122, 255, 0.2)';

const EarningsSnapshotSection: React.FC<EarningsSnapshotSectionProps> = ({
  contentAnim,
  earningsSummary,
  onViewAllEarningsPress,
  reflectionOffset,
  isLoading,
}) => {
  const animatedToday = useRef(new Animated.Value(0)).current;
  const animatedWeekly = useRef(new Animated.Value(0)).current;
  const animatedMonthly = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading && earningsSummary) {
      Animated.timing(animatedToday, {
        toValue: earningsSummary.today,
        duration: 800,
        useNativeDriver: true,
      }).start();
      Animated.timing(animatedWeekly, {
        toValue: earningsSummary.weekly,
        duration: 1000,
        useNativeDriver: true,
      }).start();
      Animated.timing(animatedMonthly, {
        toValue: earningsSummary.monthly,
        duration: 1200,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, earningsSummary]);

  const handleInfoPress = () => {
    Toast.show({
      type: 'info',
      text1: 'Ganhos de Hoje',
      text2: 'Total de serviços concluídos no dia, antes de taxas e comissões.',
      position: 'bottom',
    });
  };

  return (
    <Animated.View style={[styles.sectionContainer, { opacity: contentAnim }]}>
      <LinearGradient
        colors={[ROYAL_PURPLE_BLUE, LIGHT_BLUE]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Seus Ganhos</Text>
        <TouchableOpacity onPress={handleInfoPress} style={styles.infoIcon}>
          <Ionicons name="information-circle-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        // SEU ESQUELETO DE CARREGAMENTO AQUI
        <View style={styles.summaryGrid}>
          {[...Array(3)].map((_, i) => (
            <View key={i} style={[styles.skeletonSummaryItem, { backgroundColor: 'rgba(255,255,255,0.1)' }]}> {/* Adicionado BG para visibilidade */}
              <View style={{ width: 30, height: 30, borderRadius: 15, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.2)' }} />
              <View style={{ width: 80, height: 20, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' }} />
              <View style={{ width: 50, height: 14, borderRadius: 4, marginTop: 4, backgroundColor: 'rgba(255,255,255,0.2)' }} />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.summaryGrid}>
          {/* SEU CONTEÚDO REAL DE GANHOS VAI AQUI. Certifique-se de que ele esteja aqui! */}
            {/* Exemplo de como era o conteúdo real (se não estiver lá, seu app ficará sem ele) */}
            <View style={styles.wrapper}>
                <Text style={styles.value}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(earningsSummary.today)}
                </Text>
                <Text style={styles.label}>Hoje</Text>
            </View>
            <View style={styles.wrapper}>
                <Text style={styles.value}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(earningsSummary.weekly)}
                </Text>
                <Text style={styles.label}>Semana</Text>
            </View>
            <View style={styles.wrapper}>
                <Text style={styles.value}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(earningsSummary.monthly)}
                </Text>
                <Text style={styles.label}>Mês</Text>
            </View>
        </View>
      )}

      <TouchableOpacity style={styles.viewAllButton} onPress={onViewAllEarningsPress}>
        <Text style={styles.viewAllButtonText}>Ver Detalhes dos Ganhos</Text>
        <Ionicons name="arrow-forward-outline" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: WHITE_TRANSPARENT,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  infoIcon: {
    marginLeft: 10,
    padding: 5,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    width: '100%',
  },
  skeletonSummaryItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
    flex: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    paddingVertical: 12,
    marginTop: 10,
  },
  viewAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  // Adicionei os estilos que provavelmente estavam no seu conteúdo real, se faltarem
  wrapper: {
    alignItems: 'center',
    flex: 1,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
});

export default EarningsSnapshotSection;