// app/client/explore/components/home/SecaoPrestadores.tsx

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProviderDisplayInfo } from '../../../../types/backend/providers';
import { normalizeProviderAvailability } from './providerAvailability';

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
  titleColor = '#4f5a71ff',
  noDataText = 'Nenhum prestador disponivel no momento.',
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle,]}>{titulo}</Text>
        {onVerTudoPress ? (
          <TouchableOpacity
            onPress={onVerTudoPress}
            style={styles.viewAllButton}
          >
           
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.carouselWrapper}>
        <ScrollView horizontal={horizontal} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScrollContainer}>
          {safeData.length > 0 ? (
            safeData.map((item, index) => {
              const rendered = renderItem({ item, index });
              return React.isValidElement(rendered) ? rendered : null;
            })
          ) : (
            <Text style={styles.emptyText}>{noDataText}</Text>
          )}
        </ScrollView>
        <LinearGradient
          colors={['rgba(255,255,255,0)', '#F1F2F2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rightFade}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['#F1F2F2', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.leftFade}
          pointerEvents="none"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: -2,
    marginBottom: Platform.OS === 'android' ? 4 :  12,
    paddingHorizontal: 3,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 16,
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
    paddingVertical: 4,
    transform: [{ translateY: 14 }],
  },
  viewAllText: {
    fontSize: 12,
    color: '#65707bff',
    fontWeight: '600',
  },
  cardsScrollContainer: {
    paddingHorizontal: 32,
    paddingBottom: 10,
  },
  carouselWrapper: {
    position: 'relative',
  },
  rightFade: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 22,
  },
  leftFade: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 22,
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
