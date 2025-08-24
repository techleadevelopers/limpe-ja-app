// LimpeJaApp/src/components/common/Button.tsx
import React, { useMemo } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '../../constants/Colors'; // Importe Colors

interface ButtonProps {
  title: string;
  onPress: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  // ADICIONADO: A propriedade 'kind' para definir variantes do botão
  kind?: 'primary' | 'secondary' | 'ghost';
}

// Hook para acessar as cores do tema atual
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  // Colors é um default export com chaves light/dark
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light; // Garante que o tipo retornado é o do tema light para inferência
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  onPressIn,
  onPressOut,
  style,
  textStyle,
  disabled,
  kind = 'primary', // Define 'primary' como o tipo padrão do botão
}) => {
  const theme = useTheme();

  // Calcula os estilos específicos da variante do botão usando useMemo para otimização
  const variantStyles = useMemo(() => {
    switch (kind) {
      case 'secondary':
        return {
          button: {
            backgroundColor: theme.secondary,
            borderColor: theme.secondary,
            borderWidth: 1, // Garante que a borda esteja presente
          },
          text: {
            color: '#FFF', // Texto branco para botões sólidos secundários
          },
        };
      case 'ghost':
        return {
          button: {
            backgroundColor: 'transparent',
            // Usa interactivePrimary para a cor da borda e do texto em botões ghost,
            // ou primary como fallback se interactivePrimary não estiver disponível.
            borderColor: theme.interactivePrimary || theme.primary,
            borderWidth: 1, // Botões ghost geralmente têm borda
          },
          text: {
            color: theme.interactivePrimary || theme.primary, // Texto com a cor primária interativa
          },
        };
      case 'primary': // Caso padrão
      default:
        return {
          button: {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
            borderWidth: 1, // Garante que a borda esteja presente
          },
          text: {
            color: '#FFF', // Texto branco para botões sólidos primários
          },
        };
    }
  }, [kind, theme]); // Recalcula apenas se kind ou theme mudarem

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={({ pressed }) => [
        styles.baseButton, // Estilos base comuns a todos os botões (padding, border-radius, etc.)
        variantStyles.button, // Estilos específicos da variante (cor de fundo, borda)
        pressed && styles.buttonPressed, // Efeito de pressionado
        disabled && styles.buttonDisabled, // Estilos para botão desabilitado
        style, // Estilos fornecidos pelo usuário (último na ordem para permitir sobrescrever)
      ]}
    >
      <Text style={[
        styles.baseButtonText, // Estilos base do texto do botão (tamanho da fonte, peso)
        variantStyles.text, // Cor do texto específica da variante
        textStyle, // Estilos de texto fornecidos pelo usuário
      ]}>
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  baseButton: { // Estilos comuns a todos os tipos de botões
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120, // Opcional: define uma largura mínima para botões
  },
  buttonPressed: {
    opacity: 0.8, // Reduz a opacidade quando o botão é pressionado
  },
  buttonDisabled: {
    opacity: 0.5, // Reduz a opacidade e desabilita interações quando o botão está desabilitado
  },
  baseButtonText: { // Estilos comuns para o texto do botão
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Button;