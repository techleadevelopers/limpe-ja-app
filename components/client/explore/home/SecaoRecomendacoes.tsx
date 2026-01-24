import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProviderDisplayInfo } from '../../../../types/backend/providers';
import { normalizeProviderAvailability } from './providerAvailability';

interface SecaoRecomendacoesProps {
  titulo: string;
  data: ProviderDisplayInfo[];
  onVerTudoPress: () => void;
  titleColor?: string;
  noDataText?: string;
  horizontal?: boolean;
  renderItem: ({
    item,
    index,
    isVisible,
  }: {
    item: ProviderDisplayInfo;
    index: number;
    isVisible?: boolean;
  }) => React.ReactElement | null;
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
        ? data
            .filter(
              (item) =>
                item &&
                typeof item === 'object' &&
                typeof (item as any).id === 'string' &&
                (item as any).id.trim() !== '' &&
                typeof (item as any).fullName === 'string' &&
                (item as any).fullName.trim() !== '',
            )
            .map((item) => normalizeProviderAvailability(item) ?? item)
        : [],
    [data],
  );

  const CARD_SCALE = 1.07;
  const CARD_BASE_WIDTH = 105 * CARD_SCALE;
  const CARD_MARGIN_RIGHT = 15 * CARD_SCALE;
  const ITEM_FULL_SIZE = CARD_BASE_WIDTH + CARD_MARGIN_RIGHT;
  const VISIBILITY_BUFFER = ITEM_FULL_SIZE * 0.6;

  const scrollX = useRef(new Animated.Value(0)).current;
  const [scrollOffset, setScrollOffset] = useState(0);
  const { width: windowWidth } = useWindowDimensions();
  const [carouselWidth, setCarouselWidth] = useState(windowWidth);
  const pendingFrameRef = useRef<number | null>(null);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x || 0;
    if (pendingFrameRef.current != null) {
      cancelAnimationFrame(pendingFrameRef.current);
    }
    pendingFrameRef.current = requestAnimationFrame(() => {
      pendingFrameRef.current = null;
      setScrollOffset(offset);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (pendingFrameRef.current != null) {
        cancelAnimationFrame(pendingFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setCarouselWidth(windowWidth);
  }, [windowWidth]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: titleColor }]}>{titulo}</Text>
        
      </View>

      <View style={styles.carouselWrapper}>
        {safeData.length > 0 ? (
          <Animated.ScrollView
            horizontal={horizontal}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsScrollContainer}
            decelerationRate="fast"
            onLayout={(event) => {
              const width = event.nativeEvent.layout.width;
              if (width > 0 && width !== carouselWidth) {
                setCarouselWidth(width);
              }
            }}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
              useNativeDriver: true,
              listener: handleScroll,
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

            const cardStart = index * ITEM_FULL_SIZE;
            const cardEnd = cardStart + ITEM_FULL_SIZE;
            const viewportLeft = Math.max(0, scrollOffset - VISIBILITY_BUFFER);
            const viewportRight = scrollOffset + carouselWidth + VISIBILITY_BUFFER;
            const isVisible = cardEnd >= viewportLeft && cardStart <= viewportRight;

            let rendered: React.ReactElement | null = null;
            try {
              rendered = renderItem({ item, index, isVisible });
            } catch (err) {
              console.error(`[SecaoRecomendacoes] Erro ao renderizar item no Indice ${index}:`, err);
              return null;
            }
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
    marginTop: Platform.OS === 'android' ? -5 : -9,
    marginBottom: -10,
    paddingHorizontal: Platform.OS === 'android' ?10 : 6,
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
    fontSize: Platform.OS === 'android' ? 15 : 15.5,
    fontFamily: 'Montserrat-Regular',
    fontWeight: '600',
    color: 'rgba(95, 118, 141, 0.7)',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 0,
    right: Platform.OS === 'android' ? 0 : 0,
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
    width: 60,
    zIndex: 2,
  },
  edgeLeft: {
    left: -27,
    bottom: 0,
  },
  edgeRight: {
    right: -34,
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
