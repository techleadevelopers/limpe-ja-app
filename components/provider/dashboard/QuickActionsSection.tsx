import React from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { QuickActionItem } from '../../../types/provider'; // Ajuste o caminho
import AnimatedQuickActionButton from './AnimatedQuickActionButton';
// REMOVIDO: A importação condicional do SkeletonPlaceholder foi removida.
// const SafeSkeletonPlaceholder = Platform.OS === 'web'
//   ? ({ children }: { children: React.ReactNode }) => <>{children}</>
//   : require('react-native-skeleton-placeholder').default;

// Define the interface for QuickActionsSection's props
interface QuickActionsSectionProps {
  contentAnim: Animated.Value;
  actions: QuickActionItem[];
  isLoading: boolean; // Adicionado prop para estado de carregamento
}

const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({ contentAnim, actions, isLoading }) => {
  return (
    <Animated.View style={[styles.sectionContainer, { opacity: contentAnim }]}>
      <Text style={styles.sectionTitle}>Atalhos do Dia</Text>
      <View style={styles.actionsGrid}>
        {isLoading ? (
          // SEU ESQUELETO DE CARREGAMENTO AQUI
          <View style={styles.skeletonGrid}>
            {[...Array(4)].map((_, i) => ( // Renderiza 4 placeholders de botão
              <View key={i} style={[styles.skeletonButton, { backgroundColor: '#E0E0E0' }]}> {/* Adicionado BG para visibilidade */}
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#CCCCCC' }} /> {/* Cor mais escura para o ícone */}
                <View style={{ width: '70%', height: 16, borderRadius: 4, marginTop: 10, backgroundColor: '#CCCCCC' }} /> {/* Cor mais escura para o texto */}
              </View>
            ))}
          </View>
        ) : (
          actions.map((action, index) => (
            <AnimatedQuickActionButton
              key={action.label}
              label={action.label}
              iconName={action.iconName}
              onPress={action.onPress}
              iconType={action.iconType}
              delay={index * 100} // Stagger animation for each button
            />
          ))
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  skeletonButton: {
    width: '48%', // Ajuste para caber 2 por linha
    aspectRatio: 1.2, // Proporção para manter o tamanho do botão
    borderRadius: 15,
    // backgroundColor: '#E0E0E0', // Já está sendo aplicado inline, se precisar de shimmer, adicione aqui
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
});

export default QuickActionsSection;