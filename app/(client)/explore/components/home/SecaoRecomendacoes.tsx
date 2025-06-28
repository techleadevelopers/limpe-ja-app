import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProviderDisplayInfo } from '../../../../types/backend/providers';

interface SecaoRecomendacoesProps {
  titulo: string;
  data: ProviderDisplayInfo[];
  onVerTudoPress: () => void;
  titleColor?: string;
  noDataText?: string;
  horizontal?: boolean;
  renderItem: ({ item, index }: { item: ProviderDisplayInfo; index: number }) => React.ReactElement | null;
}

const SecaoRecomendacoes: React.FC<SecaoRecomendacoesProps> = ({
  titulo,
  data,
  onVerTudoPress,
  titleColor = '#202633',
  noDataText = 'Nenhuma recomendação disponível no momento.',
  horizontal = false,
  renderItem,
}) => {
  const safeData = Array.isArray(data) ? data.filter((item) => item && item.fullName) : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: titleColor }]}>{titulo}</Text>
        {onVerTudoPress && (
          <TouchableOpacity onPress={onVerTudoPress} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>
              Ver Tudo <Ionicons name="arrow-forward" size={14} color="#007BFF" />
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal={horizontal}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsScrollContainer}
      >
        {safeData.length > 0 ? (
          safeData.map((item, index) => {
            try {
              return renderItem({ item, index });
            } catch (err) {
              console.error(`[SecaoRecomendacoes] Erro ao renderizar item no índice ${index}:`, err);
              return null;
            }
          })
        ) : (
          <Text style={styles.emptyText}>{noDataText}</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 1,
    backgroundColor: '#F4F7FC',
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
       fontSize: 19,
    fontWeight: '700',
    color: '#1C3A5F',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '600',
  },
  cardsScrollContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  emptyText: {
    flex: 1,
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    paddingHorizontal: 20,
  },
});

export default SecaoRecomendacoes;
