import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

  // Parâmetros do carrossel (alinhados ao RecomendacaoCard)
  // Ajuste fino: refletir largura e espaçamento reais do RecomendacaoCard (com escala de 7%)
  const CARD_SCALE = 1.07;
  const CARD_BASE_WIDTH = 115 * CARD_SCALE; // ~123.05
  const CARD_MARGIN_RIGHT = 15 * CARD_SCALE; // ~16.05 (combina com marginRight atual do card)
  const ITEM_FULL_SIZE = CARD_BASE_WIDTH + CARD_MARGIN_RIGHT; // passo de snap

  // Animated scroll value para aplicar escala/opacidade por item
  const scrollX = useRef(new Animated.Value(0)).current;

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

      {/* Scroll premium com snap, escala central e fade nas bordas */}
      <View style={styles.carouselWrapper}>
        {safeData.length > 0 ? (
          <Animated.ScrollView
            horizontal={horizontal}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsScrollContainer}
            decelerationRate="fast"
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          >
            {safeData.map((item, index) => {
              const inputRange = [
                (index - 1) * ITEM_FULL_SIZE,
                index * ITEM_FULL_SIZE,
                (index + 1) * ITEM_FULL_SIZE,
              ];
              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.94, 1.02, 0.94],
                extrapolate: 'clamp',
              });
              const translateY = scrollX.interpolate({
                inputRange,
                outputRange: [2, 0, 2],
                extrapolate: 'clamp',
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.9, 1, 0.9],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View
                  key={item.id}
                  style={[
                    styles.itemWrapper,
                    { transform: [{ translateY }, { scale }], opacity },
                  ]}
                >
                  {renderItem({ item, index })}
                </Animated.View>
              );
            })}
          </Animated.ScrollView>
        ) : (
          <Text style={styles.emptyText}>{noDataText}</Text>
        )}

        {/* Fade lateral sutil para conforto visual */}
        <LinearGradient
          pointerEvents="none"
          // Aumenta a opacidade do fade da esquerda (mais marcante)
          colors={[
            "rgba(241,242,241,1)",
            "rgba(241,242,241,0.98)",
            "rgba(241,242,241,0.14)"
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.edgeFade, styles.edgeLeft]}
        />
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(241,242,241,0)", "rgba(241,242,241,0.94)", "rgba(241,242,241,1)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.edgeFade, styles.edgeRight]}
        />
      </View>
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
      marginTop: 22,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
    transform: [{ translateY: 14 }], // desloca mais para baixo (~8px)
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
  carouselWrapper: {
    position: 'relative',
  },
  itemWrapper: {
    // Mantém o espaçamento original do card
    marginRight: 0, // o RecomendacaoCard já tem marginRight interno
    
  },
  edgeFade: {
    position: 'absolute',
    top: 8, // alinha com a altura do conteúdo (ajuste fino)
    bottom: 10,
    width: 28,
    zIndex: 2,
  },
  edgeLeft: {
    left: -16, // empurra o fade mais para fora à esquerda
    bottom: 0,
  },
  edgeRight: {
    right: -16, // empurra o fade mais para fora à direita
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
