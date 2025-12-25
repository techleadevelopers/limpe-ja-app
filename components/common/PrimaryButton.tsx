// src/components/PrimaryButton.tsx
import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TouchableOpacityProps,
  Animated,
  NativeSyntheticEvent,
  NativeTouchEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from './theme/colors';
import { typography } from './theme/typography';
import { pressableBase, shadow, textBase } from '../../app/_shared/ui/parity';

// Estenda TouchableOpacityProps para herdar todas as propriedades padrão
interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  // onPressIn e onPressOut já são herdados de TouchableOpacityProps
  // e seus tipos esperam um argumento de evento.
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  children,
  onPressIn: externalOnPressIn, // Renomeie para evitar conflito com o interno
  onPressOut: externalOnPressOut, // Renomeie para evitar conflito com o interno
  ...rest // Captura todas as outras props, incluindo as de TouchableOpacity
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressableParity = pressableBase();

  // 1. Aceite o argumento 'event' aqui
  const handlePressIn = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    if (!loading && !disabled) {
      Animated.spring(scaleAnim, {
        toValue: 0.95, // Reduz para 95% do tamanho original
        useNativeDriver: true,
        friction: 5,
        tension: 150,
      }).start();
    }
    // 2. Passe o 'event' para a prop externa, se ela existir
    externalOnPressIn && externalOnPressIn(event);
  };

  // 1. Aceite o argumento 'event' aqui
  const handlePressOut = (event: NativeSyntheticEvent<NativeTouchEvent>) => {
    if (!loading && !disabled) {
      Animated.spring(scaleAnim, {
        toValue: 1, // Volta ao tamanho original
        useNativeDriver: true,
        friction: 5,
        tension: 150,
      }).start();
    }
    // 2. Passe o 'event' para a prop externa, se ela existir
    externalOnPressOut && externalOnPressOut(event);
  };

  return (
    <Animated.View
      style={[
        styles.buttonContainer,
        (loading || disabled) && styles.disabledButton,
        style,
        { transform: [{ scale: scaleAnim }] }, // Aplique a animação de escala
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        disabled={loading || disabled}
        onPressIn={handlePressIn} // Use o handler interno
        onPressOut={handlePressOut} // Use o handler interno
        style={pressableParity.style}
        {...rest} // Passa todas as outras props para o TouchableOpacity
      >
        <LinearGradient
          colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color={colors.textWhite} />
          ) : (
            <Text style={textBase(styles.buttonText)}>{title}</Text>
          )}
          {children} {/* Renderiza children se houver */}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 28,
    ...shadow(3),
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    ...typography.button,
    color: colors.textWhite,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default PrimaryButton;
