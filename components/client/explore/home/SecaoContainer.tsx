import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
  noDataText = 'Nenhum item disponivel no momento.',
  horizontal = false,
  renderItem,
}: SecaoContainerProps<T>) => {
  const safeData = useMemo(
    () =>
      Array.isArray(data)
        ? data.filter(
            (item) =>
              item &&
              typeof item === 'object' &&
              (typeof (item as any).id === 'string' || typeof (item as any).id === 'number'),
          )
        : [],
    [data],
  );

  return (
    <View style={styles.container}>
      <View style={{ position: 'relative' }}>
        <ScrollView
          horizontal={horizontal}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsScrollContainer}
        >
          {safeData.length > 0 ? (
            safeData.map((item, index) => {
              const rendered = renderItem({ item, index });
              return React.isValidElement(rendered) ? (
                <React.Fragment key={(item as any).id}>{rendered}</React.Fragment>
              ) : null;
            })
          ) : (
            <Text style={styles.emptyText}>{noDataText}</Text>
          )}
        </ScrollView>

        {horizontal && (
          <LinearGradient
            colors={['rgba(255, 255, 255, 0)', '#F1F2F2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rightFade}
            pointerEvents="none"
          />
        )}
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
    paddingRight: 30,
    paddingLeft: 30,
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
