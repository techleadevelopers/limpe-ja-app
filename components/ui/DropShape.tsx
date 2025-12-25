import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface DropShapeProps {
  size?: number;
}

const DropShape: React.FC<DropShapeProps> = ({ size = 400 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LinearGradient
        colors={['#afecffc5', '#004db193']}
        start={{ x: 0.2, y: 0.2 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.drop,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <View
          style={[
            styles.innerShadowDark,
            { borderRadius: size / 2 },
          ]}
        />
        <View
          style={[
            styles.innerShadowLight,
            { borderRadius: size / 2 },
          ]}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }], // Corrigido: Removida rotação de -45deg para alinhar vertical (ponta para baixo, sem "lado")
    top: 570,
  },
  drop: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    borderTopLeftRadius: 0,
    overflow: 'hidden',
    // sombra externa
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 0,
  },
  innerShadowDark: {
    ...StyleSheet.absoluteFillObject,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 10, height: -5 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  innerShadowLight: {
    ...StyleSheet.absoluteFillObject,
    shadowColor: 'rgba(255,255,255,0.25)',
    shadowOffset: { width: -15, height: -5 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
});

export default DropShape;