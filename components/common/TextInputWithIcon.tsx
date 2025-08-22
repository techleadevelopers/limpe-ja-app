// src/components/TextInputWithIcon.tsx
import React, { useState, useRef } from 'react'; // Importe useState e useRef
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  Platform, // Importe Platform aqui
  Animated, // Importe Animated
  TouchableOpacity, // Importe TouchableOpacity para o botão de limpar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from './theme/colors';
import { typography } from './theme/typography';
import { shadows } from './theme/shadows'; // Certifique-se de que shadows está definido

interface TextInputWithIconProps extends TextInputProps {
  iconName?: string;
  containerStyle?: ViewStyle;
  isInvalid?: boolean; // Nova prop para indicar estado de erro
  showClearButton?: boolean; // Nova prop para mostrar botão de limpar
  onClear?: () => void; // Callback para o botão de limpar
}

const TextInputWithIcon: React.FC<TextInputWithIconProps> = ({
  iconName,
  containerStyle,
  isInvalid = false, // Padrão para false
  showClearButton = false, // Padrão para false
  onClear,
  onFocus, // Captura o onFocus original
  onBlur, // Captura o onBlur original
  value, // Captura o valor para controlar o botão de limpar
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedBorderColor = useRef(new Animated.Value(0)).current; // 0 para normal, 1 para focado
  const animatedShadowElevation = useRef(new Animated.Value(0)).current; // 0 para normal, 1 para focado

  const handleFocus = (event: any) => {
    setIsFocused(true);
    Animated.parallel([
      Animated.timing(animatedBorderColor, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false, // Cores não podem usar native driver
      }),
      Animated.timing(animatedShadowElevation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: Platform.OS === 'android', // Elevation pode usar native driver no Android
      }),
    ]).start();
    onFocus && onFocus(event); // Chama o onFocus original, se existir
  };

  const handleBlur = (event: any) => {
    setIsFocused(false);
    Animated.parallel([
      Animated.timing(animatedBorderColor, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(animatedShadowElevation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: Platform.OS === 'android',
      }),
    ]).start();
    onBlur && onBlur(event); // Chama o onBlur original, se existir
  };

  // Interpolação para a cor da borda/sombra
  const borderColor = animatedBorderColor.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary], // Borda normal vs. borda focada
  });

  const shadowStyle = Platform.select({
    ios: {
      shadowColor: isInvalid ? colors.error : borderColor, // Sombra vermelha se inválido
      shadowOffset: { width: 0, height: animatedShadowElevation.interpolate({ inputRange: [0, 1], outputRange: [1, 3] }) },
      shadowOpacity: animatedShadowElevation.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.15] }),
      shadowRadius: animatedShadowElevation.interpolate({ inputRange: [0, 1], outputRange: [2, 6] }),
    },
    android: {
      elevation: animatedShadowElevation.interpolate({ inputRange: [0, 1], outputRange: [2, 6] }),
      // No Android, a cor da elevação é mais difícil de controlar via animação sem uma biblioteca externa
      // Mas podemos usar a cor da borda para o contorno.
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        containerStyle,
        { borderColor: isInvalid ? colors.error : borderColor, borderWidth: 1 }, // Borda visível
        shadowStyle,
        isFocused && styles.focusedContainer, // Estilo adicional quando focado
        isInvalid && styles.invalidContainer, // Estilo para estado inválido
      ]}
    >
      {iconName && (
        <View style={styles.iconContainer}>
          <Icon name={iconName} size={20} color={isFocused ? colors.primaryDark : colors.textPlaceholder} />
        </View>
      )}
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textPlaceholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        value={value}
        {...rest}
      />
      {showClearButton && value && value.length > 0 && (
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <Icon name="cancel" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 28,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginVertical: 8,
    // A sombra base será aplicada via animatedShadowElevation
    // ...shadows.input, // Removido daqui para ser controlado pela animação
  },
  focusedContainer: {
    // Estilo adicional quando focado, pode ser um background mais claro ou outra sombra
    // backgroundColor: colors.backgroundLight,
  },
  invalidContainer: {
    // Estilo para campo inválido
    // borderColor: colors.error, // Já tratado na lógica da prop isInvalid
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundLightest, // Fundo mais claro para o ícone
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    ...shadows.card, // Sombra sutil para o círculo do ícone
  },
  input: {
    flex: 1,
    ...typography.input,
    paddingVertical: 0,
    color: colors.textPrimary, // Cor do texto digitado
  },
  clearButton: {
    marginLeft: 10,
    padding: 5,
  },
});

export default TextInputWithIcon;