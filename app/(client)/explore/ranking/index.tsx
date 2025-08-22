// LimpeJaApp/app/(client)/ranking/index.tsx (Exemplo de tela)
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, FlatList, Animated, Easing } from 'react-native';
import RankingCard from '../../../../components/ranking/RankingCard'; // Ajuste o caminho

interface UserRank {
  id: string;
  rank: number;
  name: string;
  score: number;
  avatarUrl?: string;
}

const dummyRankingData: UserRank[] = [
  { id: 'u1', rank: 1, name: 'Maria Silva', score: 1250, avatarUrl: 'https://via.placeholder.com/150/FF5733/FFFFFF?text=MS' },
  { id: 'u2', rank: 2, name: 'João Santos', score: 1180, avatarUrl: 'https://via.placeholder.com/150/33FF57/FFFFFF?text=JS' },
  { id: 'u3', rank: 3, name: 'Ana Costa', score: 1020, avatarUrl: 'https://via.placeholder.com/150/3357FF/FFFFFF?text=AC' },
  { id: 'u4', rank: 4, name: 'Carlos Pereira (Você)', score: 980, avatarUrl: 'https://via.placeholder.com/150/8A2BE2/FFFFFF?text=CP' }, // Este seria o usuário logado
  { id: 'u5', rank: 5, name: 'Fernanda Lima', score: 910, avatarUrl: 'https://via.placeholder.com/150/FF33A1/FFFFFF?text=FL' },
];

export default function RankingScreen() {
  const currentUser = 'u4'; // ID do usuário logado para destaque

  // Animação para o título do cabeçalho
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  const handleCardPress = (user: UserRank) => {
    alert(`Detalhes de ${user.name}: Rank ${user.rank}, Score ${user.score}`);
  };

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.headerTitle,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          },
        ]}
      >
        Ranking Global
      </Animated.Text>
      <FlatList
        data={dummyRankingData}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <RankingCard
            rank={item.rank}
            name={item.name}
            score={item.score}
            avatarUrl={item.avatarUrl}
            isCurrentUser={item.id === currentUser}
            onPress={() => handleCardPress(item)}
            delay={index * 100} // Atraso escalonado para cada item
          />
        )}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
});