// LimpeJaApp/src/components/ui/Input.tsx
import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, TextStyle, ViewStyle } from 'react-native';
import Colors from '../../constants/Colors';
import { useColorScheme } from 'react-native';

interface CustomInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle; // Para o próprio TextInput
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const CustomInput: React.FC<CustomInputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const colorScheme = useColorScheme() || 'light';
  const themeColors = Colors[colorScheme];

  return (
    <View style={[styles.containerBase, containerStyle]}>
      {label && <Text style={[styles.labelBase, { color: themeColors.text }, labelStyle]}>{label}</Text>}
      <View style={[
        styles.inputWrapperBase,
        { borderColor: error ? themeColors.error : themeColors.grey, backgroundColor: themeColors.background }, // Ou uma cor de fundo para input
        error ? { borderColor: themeColors.error } : {}
      ]}>
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <TextInput
          style={[styles.inputBase, { color: themeColors.text }, inputStyle]}
          placeholderTextColor={themeColors.grey}
          {...props}
        />
        {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
      </View>
      {error && <Text style={[styles.errorBase, { color: themeColors.error }, errorStyle]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  containerBase: {
    marginBottom: 16,
  },
  labelBase: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
  },
  inputWrapperBase: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputBase: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10, // Ajuste conforme necessário
  },
  iconContainer: {
    marginHorizontal: 8,
  },
  errorBase: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default CustomInput;