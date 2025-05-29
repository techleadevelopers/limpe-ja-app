import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Easing, Platform } from 'react-native'; // Importar Platform
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface TimeSlotButtonProps {
  time: string;
  isSelected: boolean;
  onPress: (time: string) => void;
}

const TimeSlotButton: React.FC<TimeSlotButtonProps> = ({ time, isSelected, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      bounciness: 10,
      speed: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 10,
      speed: 10,
    }).start();
  };

  return (
    <View
      style={[
        styles.timeSlotOuterContainer,
        isSelected && styles.timeSlotOuterContainerSelected,
      ]}
    >
      <Animated.View
        style={[
          styles.timeSlotButtonContainer,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <LinearGradient
          // Novas cores do gradiente baseadas no HeroHeader, com 90% de opacidade
          colors={['rgba(106, 144, 240, 0.9)', 'rgba(93, 137, 230, 0.9)', 'rgba(74, 112, 208, 0.9)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.timeSlotGradientBackground}
        >
          {/* Tint mantido como 'light' para evitar o fundo cinza */}
          <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
          <TouchableOpacity
            style={styles.timeSlotButtonContent}
            onPress={() => onPress(time)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
          >
            <Text style={[
              styles.timeSlotText,
              isSelected && styles.timeSlotSelectedText,
            ]}>
              {time}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  timeSlotOuterContainer: {
    borderRadius: 30, // Ajustado para 10 para combinar com o HeroHeader
    margin: 4,
    flex: 1,
    maxWidth: (SCREEN_WIDTH - 30 - (4 * 2)) / 3.2,
    minWidth: (SCREEN_WIDTH - 30 - (4 * 2)) / 3.2,
    height: 44,
    // Sombras baseadas no HeroHeader
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8, // Alta opacidade para sombra mais forte
        shadowRadius: 4,
      },
      android: {
        elevation: 8, // Elevação baseada no HeroHeader
      },
    }),
  },
  timeSlotOuterContainerSelected: {
    // Sombras para o estado selecionado, mais pronunciadas
    ...Platform.select({
      ios: {
        shadowColor: '#2A72E7', // Cor da sombra azul para o selecionado
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
      },
      android: {
        elevation: 12, // Elevação maior para o selecionado
      },
    }),
  },
  timeSlotButtonContainer: {
    flex: 1,
    borderRadius: 30, // Ajustado para 10 para combinar com o HeroHeader
    overflow: 'hidden',
  },
  timeSlotGradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1, // Borda mais fina para suavizar
    borderColor: 'rgba(255,255,255,0.3)', // Borda sutil para o efeito de vidro
  },
  timeSlotButtonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 10,
    zIndex: 1,
  },
  timeSlotText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  timeSlotSelectedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default TimeSlotButton;