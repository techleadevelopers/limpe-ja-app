// components/client/explore/home/SecaoContainer.tsx
import React, { useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Torne SecaoContainer genérico adicionando <T>
interface SecaoContainerProps<T> {
  titulo: string;
  data: T[]; // Tipo genérico para dados
  onVerTudoPress: () => void;
  titleColor?: string;
  noDataText?: string;
  horizontal?: boolean;
  // Tipo genérico para a função renderItem
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement | null;
}

// Use React.FC com o tipo genérico
// Adicionei uma restrição a T para garantir que tenha uma propriedade 'id'
// para ser usada como 'key' na renderização da lista.
const SecaoContainer = <T extends { id: string | number } /* Restrição opcional */>({
  titulo,
  data,
  onVerTudoPress,
  titleColor = '#4f5a71ff',
  noDataText = 'Nenhum item disponível no momento.',
  horizontal = false,
  renderItem,
}: SecaoContainerProps<T>) => {
  const arrowAnim = useRef(new Animated.Value(0)).current;

  const onPressInViewAll = () => {
    Animated.spring(arrowAnim, {
      toValue: 5,
      useNativeDriver: true,
    }).start();
  };

  const onPressOutViewAll = () => {
    Animated.spring(arrowAnim, {
      toValue: 0,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* O Header foi removido daqui no arquivo original. Se precisar de um título, ele deve ser adicionado externamente ou reintroduzido aqui. */}
      {/* Mantendo a estrutura para o `onVerTudoPress` caso seja usado em um contexto diferente ou reintroduzido */}
      {/* Se o título for necessário, ele pode ser adicionado aqui: */}
      {/* <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: titleColor }]}>{titulo}</Text>
        {onVerTudoPress && (
          <TouchableOpacity
            onPress={onVerTudoPress}
            style={styles.viewAllButton}
            onPressIn={onPressInViewAll}
            onPressOut={onPressOutViewAll}
          >
            <Text style={styles.viewAllText}>Ver Tudo </Text>
            <Animated.View style={{ transform: [{ translateX: arrowAnim }] }}>
              <Ionicons name="chevron-forward" size={14} color="#007BFF" />
            </Animated.View>
          </TouchableOpacity>
        )}
      </View> */}

      <ScrollView horizontal={horizontal} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScrollContainer}>
        {data.length > 0 ? (
          data.map((item, index) => (
            // Use item.id para a chave se T tiver uma propriedade 'id'
            <React.Fragment key={item.id}>
              {renderItem({ item, index })}
            </React.Fragment>
          ))
        ) : (
          <Text style={styles.emptyText}>{noDataText}</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 0, // Ajuste conforme necessário
    marginBottom: 10,
    backgroundColor: 'transparent', // ALTERADO AQUI: Fundo transparente
  },
  // O estilo 'header' e 'sectionTitle' foram removidos do arquivo original,
  // mas estou incluindo-os comentados caso sejam reintroduzidos.
  /*
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
    color: '#202633',
  },
  */
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 12,
    color: '#007BFF',
        fontFamily: 'Montserrat-Regular',
    fontWeight: '800',
    marginRight: 5, // Adicionado um pequeno espaçamento entre o texto e a seta
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

export default SecaoContainer;