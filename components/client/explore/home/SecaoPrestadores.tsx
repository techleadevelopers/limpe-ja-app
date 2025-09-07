// app/(client)/explore/components/home/SecaoPrestadores.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Animated, Easing } from 'react-native'; // Importado Animated, Easing

import { ProviderDisplayInfo } from '../../../../types/backend/providers';

interface SecaoPrestadoresProps {
  titulo: string;
  data: ProviderDisplayInfo[]; // Já estava correto
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
  titleColor = '#4f5a71ff',
  noDataText = 'Nenhum prestador disponível no momento.',
  horizontal = false,
  renderItem,
}) => {
  const arrowAnim = useRef(new Animated.Value(0)).current; // Animação para a seta

  const onPressInViewAll = () => {
    Animated.spring(arrowAnim, {
      toValue: 5, // Desloca a seta para a frente
      useNativeDriver: true,
      friction: 5, // Ajuste para um efeito de mola mais suave
      tension: 80, // Ajuste para um retorno rápido
    }).start();
  };

  const onPressOutViewAll = () => {
    Animated.spring(arrowAnim, {
      toValue: 0, // Retorna a seta à posição original
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: titleColor }]}>{titulo}</Text>
        {onVerTudoPress && (
          <TouchableOpacity
            onPress={onVerTudoPress}
            style={styles.viewAllButton}
            onPressIn={onPressInViewAll}
            onPressOut={onPressOutViewAll}
          >
            <Text style={styles.viewAllText}>mais </Text>
            <Animated.View style={{ transform: [{ translateX: arrowAnim }] }}>
              <Ionicons name="chevron-forward" size={14} color="#65707bff" />
            </Animated.View>
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
    marginTop: -2,
    marginBottom: -18,
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
    fontSize: 15,
    fontFamily: 'Montserrat-Regular',
    fontWeight: '800',

  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 12,
    color: '#65707bff',
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
    marginTop: 10,
    paddingHorizontal: 20,
  },
});

export default SecaoPrestadores;