// src/theme/typography.ts OU components/common/theme/typography.ts
import { Platform, TextStyle } from 'react-native';

// Certifique-se de que esta linha de importação esteja correta para o seu colors.ts
import { colors } from './colors'; // Se colors.ts estiver na mesma pasta

export const typography = { // <--- ESTA LINHA É CRÍTICA
  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto', // Fonte padrão do sistema

  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  h2: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  h3: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  } as TextStyle,
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  } as TextStyle,
  body: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  } as TextStyle,
  bodySmall: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  } as TextStyle,
  button: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textWhite,
  } as TextStyle,
  input: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  } as TextStyle,
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  } as TextStyle,
};

