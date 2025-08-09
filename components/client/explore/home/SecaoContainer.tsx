// app/(client)/explore/components/home/SecaoPrestadores.tsx

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ProviderDisplayInfo } from '../../../../types/backend/providers';

interface SecaoPrestadoresProps {
  titulo: string;
  data: ProviderDisplayInfo[];
  onVerTudoPress: () => void;
  titleColor?: string;
  noDataText?: string;
  horizontal?: boolean;
  renderItem: ({ item, index }: { item: ProviderDisplayInfo; index: number }) => React.ReactElement | null;
}

const SecaoPrestadores: React.FC<SecaoPrestadoresProps> = ({
  titulo,
  data,
  onVerTudoPress,
  titleColor = '#202633',
  noDataText = 'Nenhum prestador disponível no momento.',
  horizontal = false,
  renderItem,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: titleColor }]}>{titulo}</Text>
        {onVerTudoPress && (
          <TouchableOpacity onPress={onVerTudoPress} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Ver Tudo <Ionicons name="arrow-forward" size={14} color="#007BFF" /></Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal={horizontal} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScrollContainer}>
        {data.length > 0 ? (
          data.map((item, index) => renderItem({ item, index }))
        ) : (
          <Text style={styles.emptyText}>{noDataText}</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 2,
    marginBottom: 5,
    backgroundColor: '#F4F7FC',
  },
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#202633',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 12,
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

export default SecaoPrestadores;