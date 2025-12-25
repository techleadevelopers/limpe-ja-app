// src/theme/shadows.ts
import { ViewStyle } from 'react-native';
import { colors } from './colors';

export const shadows = {
  card: {
    shadowColor: colors.primaryDark, // Usando um azul escuro para sombra de card
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 0, // Para Android
  } as ViewStyle,
  button: {
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 0, // Para Android
  } as ViewStyle,
  input: {
    shadowColor: colors.primaryLight,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 0, // Para Android
  } as ViewStyle,
};