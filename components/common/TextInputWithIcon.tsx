// src/components/TextInputWithIcon.tsx
import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Exemplo de ícone
import { colors } from './theme/colors';
import { typography } from './theme/typography';
import { shadows } from './theme/shadows';

interface TextInputWithIconProps extends TextInputProps {
  iconName?: string;
  containerStyle?: ViewStyle;
}

const TextInputWithIcon: React.FC<TextInputWithIconProps> = ({ iconName, containerStyle, ...rest }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {iconName && (
        <View style={styles.iconContainer}>
          <Icon name={iconName} size={20} color={colors.primary} />
        </View>
      )}
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textPlaceholder}
        {...rest}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 28,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8, // Ajuste para alinhamento em diferentes plataformas
    marginVertical: 8,
    ...shadows.input,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.iconCircleBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    ...shadows.card, // Sombra sutil para o círculo do ícone
  },
  input: {
    flex: 1,
    ...typography.input,
    paddingVertical: 0, // Remover padding padrão do TextInput
  },
});

import { Platform } from 'react-native'; // Importar Platform aqui
export default TextInputWithIcon;