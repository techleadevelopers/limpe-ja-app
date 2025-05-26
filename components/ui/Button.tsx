// LimpeJaApp/src/components/ui/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Colors from '../../constants/Colors'; // Ajuste o caminho para seus Colors
import { useColorScheme } from 'react-native'; // Ou seu hook de tema

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
  isLoading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  isLoading = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  const colorScheme = useColorScheme() || 'light';
  const themeColors = Colors[colorScheme];

  const getButtonStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: themeColors.secondary,
          borderColor: themeColors.secondary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: themeColors.primary,
          borderWidth: 1,
        };
      case 'danger':
        return {
          backgroundColor: themeColors.error,
          borderColor: themeColors.error,
        };
      case 'primary':
      default:
        return {
          backgroundColor: themeColors.primary,
          borderColor: themeColors.primary,
        };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return { color: themeColors.primary };
      default:
        return { color: themeColors.background }; // Texto branco para fundos coloridos
    }
  };

  const buttonVariantStyle = getButtonStyles();
  const textVariantStyle = getTextStyle();

  return (
    <TouchableOpacity
      style={[
        styles.buttonBase,
        buttonVariantStyle,
        disabled || isLoading ? styles.disabled : {},
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={textVariantStyle.color || themeColors.text} />
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text style={[styles.textBase, textVariantStyle, textStyle]}>{title}</Text>
          {rightIcon && <>{rightIcon}</>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48,
  },
  textBase: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 5, // Espaço se houver ícones
  },
  disabled: {
    opacity: 0.6,
  },
});

export default CustomButton;