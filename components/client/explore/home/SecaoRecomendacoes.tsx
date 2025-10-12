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
  titleColor = '#636a79', // Cor original mantida como fallback
  noDataText = 'Nenhuma recomendação disponível no momento.',
  horizontal = false,
  renderItem,
}) => {
  const safeData = Array.isArray(data) ? data.filter((item) => item && item.fullName) : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{titulo}</Text>
        {onVerTudoPress && (
          <TouchableOpacity onPress={onVerTudoPress} style={styles.viewAllButton}>
            <Ionicons name="add" size={16} color="#398beeff" />
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
    marginTop: -25,
    marginBottom: -10,
    paddingHorizontal: 6,
    backgroundColor: 'transparent', // Mantido transparente conforme original, mas pode ser 'rgba(255,255,255,0.65)' para efeito de vidro
    // borderRadius: 18, // Adicionar se o background for ativado
    // paddingTop: 5, // Adicionar se o background for ativado
  },
  header: {
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  sectionTitle: {
      fontSize: 15.5,
      fontFamily: 'Montserrat-Regular',
      fontWeight: '600',
      // PREMIUM: Estilo de título refinado
      color: 'rgba(44, 62, 80, 0.85)',
      letterSpacing: 0.5,
      marginTop:30,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
  },
  viewAllText: {
    fontSize: 1,
    color: '#6c7989ff',
    fontWeight: '600',
    marginTop: 5,
  },
  cardsScrollContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  emptyText: {
    flex: 1,
    textAlign: 'center',
    color: '#f8e6e6ff',
    marginTop: 20,
    paddingHorizontal: 20,
  },
});

export default SecaoRecomendacoes;