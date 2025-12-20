import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  titleColor = '#636a79',
  noDataText = 'Nenhuma recomendacao disponivel no momento.',
  horizontal = false,
  renderItem,
}) => {
  const safeData = useMemo(
    () =>
      Array.isArray(data)
        ? data.filter(
            (item) =>
              item &&
              typeof item === 'object' &&
              typeof (item as any).id === 'string' &&
              (item as any).id.trim() !== '' &&
              typeof (item as any).fullName === 'string' &&
              (item as any).fullName.trim() !== '',
          )
        : [],
    [data],
  );

  const CARD_SCALE = 1.07;
  const CARD_BASE_WIDTH = 115 * CARD_SCALE;
  const CARD_MARGIN_RIGHT = 15 * CARD_SCALE;
  const ITEM_FULL_SIZE = CARD_BASE_WIDTH + CARD_MARGIN_RIGHT;

  const scrollX = useRef(new Animated.Value(0)).current;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: titleColor }]}>{titulo}</Text>
        {onVerTudoPress ? (
          <TouchableOpacity onPress={onVerTudoPress} style={styles.viewAllButton}>
            <Ionicons name="add" size={16} color="#398beeff" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.carouselWrapper}>
        {safeData.length > 0 ? (
          <Animated.ScrollView
            horizontal={horizontal}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsScrollContainer}
            decelerationRate="fast"
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
              useNativeDriver: true,
            })}
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

              if (
                !item ||
                typeof item !== 'object' ||
                typeof (item as any).id !== 'string' ||
                typeof (item as any).fullName !== 'string'
              ) {
                return null;
              }

              const rendered = renderItem({ item, index });
              if (!React.isValidElement(rendered)) {
                return null;
              }

              return (
                <Animated.View
                  key={(item as any).id || `rec-${index}`}
                  style={[styles.itemWrapper, { transform: [{ translateY }, { scale }], opacity }]}
                >
                  {rendered}
                </Animated.View>
              );
            })}
          </Animated.ScrollView>
        ) : (
          <Text style={styles.emptyText}>{noDataText}</Text>
        )}

        <LinearGradient
          pointerEvents="none"
          colors={['rgba(241,242,241,1)', 'rgba(241,242,241,0.98)', 'rgba(241,242,241,0.14)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.edgeFade, styles.edgeLeft]}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(241,242,241,0)', 'rgba(241,242,241,0.94)', 'rgba(241,242,241,1)']}
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
    marginTop: -29,
    marginBottom: -10,
    paddingHorizontal: 6,
    backgroundColor: 'transparent',
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
    color: 'rgba(44, 62, 80, 0.85)',
    letterSpacing: 0.5,
    marginTop: 22,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
    transform: [{ translateY: 14 }],
  },
  cardsScrollContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  carouselWrapper: {
    position: 'relative',
  },
  itemWrapper: {
    marginRight: 0,
  },
  edgeFade: {
    position: 'absolute',
    top: 8,
    bottom: 10,
    width: 28,
    zIndex: 2,
  },
  edgeLeft: {
    left: -16,
    bottom: 0,
  },
  edgeRight: {
    right: -16,
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


