// components/common/Sheet.tsx
import React, { useRef, useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Animated, Dimensions, useColorScheme, StyleProp, ViewStyle, TextStyle, Easing } from 'react-native'; // Adicionado Easing
import { useReducedMotion } from '../components/utils/useReducedMotion'; // Certifique-se que este hook existe e funciona
import Colors from '../constants/Colors'; // Importação corrigida para default export
import { commonStyles } from '../constants/styles'; // Import common styles (assumindo que ele existe e é um named export)

// Hook para acessar as cores do tema atual (reutilizado dos outros componentes)
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  sheetStyle?: StyleProp<ViewStyle>; // Permite passar estilos para o container do sheet
  titleStyle?: StyleProp<TextStyle>; // Permite passar estilos para o título
  contentStyle?: StyleProp<ViewStyle>; // Permite passar estilos para o conteúdo
}

const { height: screenHeight } = Dimensions.get('window');

export const Sheet: React.FC<SheetProps> = ({ visible, onClose, title, children, sheetStyle, titleStyle, contentStyle }) => {
  const theme = useTheme(); // Obtém o tema atual

  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const reduced = useReducedMotion(); // Hook para verificar se o movimento deve ser reduzido

  useEffect(() => {
    if (visible) {
      // Animação de entrada
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: reduced ? 0 : 300, // Duração padrão para entrada
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: reduced ? 0 : 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animação de saída
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: reduced ? 0 : 250, // Saída ligeiramente mais rápida
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: reduced ? 0 : 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, backdropOpacity, reduced]);

  // Estilos dinâmicos baseados no tema
  const dynamicStyles = StyleSheet.create({
    themedBackdrop: {
      backgroundColor: theme.backdrop || 'rgba(0,0,0,0.5)', // Cor do backdrop, use uma cor padrão se theme.backdrop não existir
    },
    themedSheet: {
      backgroundColor: theme.cardBackground || theme.background, // Fundo do sheet, preferencialmente cardBackground
    },
    themedHandle: {
      backgroundColor: theme.grey, // Cor do handle
    },
    themedSheetTitle: {
      color: theme.textPrimary || theme.text, // Cor do título do sheet
    },
  });

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none" // Controlado por Animated
    >
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, dynamicStyles.themedBackdrop, { opacity: backdropOpacity }]} />
      </Pressable>

      {/* Sheet Content */}
      <Animated.View style={[
        commonStyles.sheet, // Estilos base do commonStyles
        styles.sheetOverride,
        dynamicStyles.themedSheet, // Estilos de tema para o sheet
        { transform: [{ translateY }] },
        sheetStyle, // Permite sobrescrever estilos via props
      ]}>
        <Pressable style={[commonStyles.handle, dynamicStyles.themedHandle]} onPress={onClose} accessibilityLabel="Fechar" />
        {title && <Text style={[commonStyles.sheetTitle, dynamicStyles.themedSheetTitle, titleStyle]}>{title}</Text>}
        <View style={[styles.sheetContent, contentStyle]}>
          {children}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheetOverride: {
    paddingHorizontal: 16, // Ajustado para corresponder ao padding comum
    paddingBottom: 20, // Adiciona padding inferior para área segura
    maxHeight: screenHeight * 0.9, // Impede que o sheet ocupe a altura total
    // Posicionamento do sheet na parte inferior da tela
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheetContent: {
    flex: 1, // Permite que o conteúdo se expanda
  },
});