// components/common/Chip.tsx
// Chip acessível com variantes, animação sutil e suporte a tema light/dark (Colors.ts)

import React, { ReactNode, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useColorScheme,
} from 'react-native';
import Colors from '../../constants/Colors';

export type ChipVariant = 'solid' | 'soft' | 'outline';
// MODIFICAÇÃO: Adicionado 'error' ao tipo ChipColor
export type ChipColor = 'primary' | 'success' | 'warning' | 'info' | 'neutral' | 'error';

export interface ChipProps {
  label?: string;
  children?: ReactNode;
  variant?: ChipVariant;
  color?: ChipColor;
  selected?: boolean;
  onPress?: () => void;
  onClose?: () => void; // exibe um X para descartar
  style?: StyleProp<ViewStyle>;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: 'sm' | 'md';
  testID?: string;
  accessibilityLabel?: string;
}

// Estilos estáticos (dinâmicos entram inline)
const stylesC = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
  },
  label: { fontWeight: '700' },
});

function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  // Colors é um default export com chaves light/dark
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as Record<string, string>;
}

export default function Chip({
  label,
  children,
  variant = 'soft',
  color = 'primary',
  selected = false,
  onPress,
  onClose,
  style,
  leftIcon,
  rightIcon,
  size = 'md',
  testID,
  accessibilityLabel,
}: ChipProps) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.03 : 1.0,
      useNativeDriver: true,
      friction: 7,
      tension: 220,
    }).start();
  }, [selected, scale]);

  const palette = useMemo(() => {
    // mapeamento de cores por variante
    return {
      primary: {
        base: theme.interactivePrimary || theme.primary,
        softBg: theme.primaryLight || '#EBF5FF',
        softBorder: theme.lightBlueBorder || '#B3D9FF',
      },
      success: {
        base: theme.secondary || '#28A745',
        softBg: theme.successBg || '#E8F5E9',
        softBorder: '#B7E1CD', // Pode vir do tema se disponível
      },
      warning: {
        base: theme.accent || '#FFC107',
        softBg: '#FFF7E0', // Pode vir do tema se disponível
        softBorder: '#FFE29A', // Pode vir do tema se disponível
      },
      info: {
        base: theme.info || '#17A2B8',
        softBg: '#E8F4FB', // Pode vir do tema se disponível
        softBorder: '#CFE9FF', // Pode vir do tema se disponível
      },
      neutral: {
        base: theme.textSecondary || '#6B7280',
        softBg: theme.lightGrey || '#EFEFF4',
        softBorder: theme.border || '#E0E0E0',
      },
      // MODIFICAÇÃO: Adicionado a paleta para 'error'
      error: {
        base: theme.error || '#dc3545',
        softBg: theme.errorBg || '#FFEBEE',
        softBorder: '#FFC1C1', // Exemplo de cor de borda suave para erro
      },
    } as const;
  }, [theme]);

  const c = palette[color];

  const s = size === 'sm'
    ? { padV: 6, padH: 10, font: 12 }
    : { padV: 8, padH: 12, font: 14 };

  const bgColor = variant === 'solid' ? c.base : variant === 'soft' ? c.softBg : 'transparent';
  const borderColor = variant === 'outline' ? c.base : c.softBorder;
  const textColor = variant === 'solid' ? '#FFF' : c.base;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        accessibilityRole={onPress ? 'button' : 'text'}
        accessibilityState={{ selected }}
        accessibilityLabel={accessibilityLabel || label}
        testID={testID}
        style={[
          stylesC.wrap,
          {
            backgroundColor: bgColor,
            borderColor,
            paddingVertical: s.padV,
            paddingHorizontal: s.padH,
          },
          style,
        ]}
      >
        {leftIcon ? <View style={{ marginRight: 8 }}>{leftIcon}</View> : null}
        {label ? (
          <Text style={[stylesC.label, { color: textColor, fontSize: s.font }]}>{label}</Text>
        ) : (
          children
        )}
        {rightIcon ? <View style={{ marginLeft: 8 }}>{rightIcon}</View> : null}
        {onClose ? (
          <Pressable
            onPress={onClose}
            accessibilityLabel="Remover"
            style={{ marginLeft: 6 }}
          >
            <Text style={{ color: textColor }}>✕</Text>
          </Pressable>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}