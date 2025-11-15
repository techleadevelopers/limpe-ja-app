import React, { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SecaoContainerProps<T> {
  titulo: string;
  data: T[];
  onVerTudoPress: () => void;
  titleColor?: string;
  noDataText?: string;
  horizontal?: boolean;
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement | null;
}

const SecaoContainer = <T extends { id: string | number }>({
  titulo,
  data,
  onVerTudoPress,
  titleColor = '#6a7181ff',
  noDataText = 'Nenhum item disponível no momento.',
  horizontal = false,
  renderItem,
}: SecaoContainerProps<T>) => {
  const arrowAnim = useRef(new Animated.Value(0)).current;

  return (
    <View style={styles.container}>
      <View style={{ position: 'relative' }}>
        <ScrollView
          horizontal={horizontal}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsScrollContainer}
        >
          {data.length > 0 ? (
            data.map((item, index) => <React.Fragment key={item.id}>{renderItem({ item, index })}</React.Fragment>)
          ) : (
            <Text style={styles.emptyText}>{noDataText}</Text>
          )}
        </ScrollView>

        {horizontal && (
          <LinearGradient
            // PREMIUM: Gradiente mais suave com base no fundo branco
            colors={['rgba(255, 255, 255, 0)', '#F1F2F2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rightFade}
            pointerEvents="none"
          />
        )}
        {/* PREMIUM: Ativado o fade da esquerda para simetria */}
        {horizontal && (
          <LinearGradient
            colors={['#F1F2F2', 'rgba(255, 255, 255, 0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.leftFade}
            pointerEvents="none"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    marginBottom: 18,
    backgroundColor: 'transparent',
  },
  cardsScrollContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
    marginTop: -1,
    paddingRight: 30, // dá espaço para o último card não encostar no fade
    paddingLeft: 30,  // dá espaço para o primeiro card não encostar no fade
  },
  emptyText: {
    flex: 1,
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  rightFade: {
    position: 'absolute',
    right: 0,
    
    top: 0,
    bottom: 0,
    width: 15, 
  },
  leftFade: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 18,
  },
});

export default SecaoContainer;