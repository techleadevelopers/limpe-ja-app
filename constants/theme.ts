// LimpeJaApp/src/constants/theme.ts
import Colors from './Colors'; // Importa o objeto Colors

// Exemplo de tema para espaçamentos, tamanhos de fonte, etc.
export const SIZES = {
  // Global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 24,
  paddingSmall: 16,

  // Font sizes
  h1: 30,
  h2: 22,
  h3: 16,
  h4: 14,
  body1: 30,
  body2: 22,
  body3: 16,
  body4: 14,
  // Adicione mais conforme necessário
};

export const FONTS = {
  h1: { fontFamily: 'System', fontSize: SIZES.h1, lineHeight: 36 }, // Substitua 'System' pela sua fonte
  h2: { fontFamily: 'System', fontSize: SIZES.h2, lineHeight: 30 },
  h3: { fontFamily: 'System', fontSize: SIZES.h3, lineHeight: 22 },
  h4: { fontFamily: 'System', fontSize: SIZES.h4, lineHeight: 22 },
  body1: { fontFamily: 'System', fontSize: SIZES.body1, lineHeight: 36 },
  body2: { fontFamily: 'System', fontSize: SIZES.body2, lineHeight: 30 },
  body3: { fontFamily: 'System', fontSize: SIZES.body3, lineHeight: 22 },
  body4: { fontFamily: 'System', fontSize: SIZES.body4, lineHeight: 22 },
  // Adicione mais conforme necessário
};

// Exemplo de um objeto de tema que pode ser usado com ThemeProvider (ex: react-navigation ou styled-components)
// Esta é uma estrutura bem básica. Bibliotecas como react-navigation/native-stack ou react-native-paper
// têm suas próprias estruturas de tema que você pode querer adaptar.
export type AppThemeType = {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
    // Adicione mais cores específicas do tema
    secondary: string;
    accent: string;
    error: string;
    grey: string;
    lightGrey: string;
  };
  // Você pode adicionar SIZES e FONTS aqui também se quiser que façam parte do tema
  sizes: typeof SIZES;
  fonts: typeof FONTS;
};

export const lightTheme: AppThemeType = {
  dark: false,
  colors: {
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.background, // Ou uma cor ligeiramente diferente para cards
    text: Colors.light.text,
    border: Colors.light.lightGrey,
    notification: Colors.light.tint,
    secondary: Colors.light.secondary,
    accent: Colors.light.accent,
    error: Colors.light.error,
    grey: Colors.light.grey,
    lightGrey: Colors.light.lightGrey,
  },
  sizes: SIZES,
  fonts: FONTS,
};

export const darkTheme: AppThemeType = {
  dark: true,
  colors: {
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.lightGrey, // Um cinza escuro para cards
    text: Colors.dark.text,
    border: Colors.dark.darkGrey, // Um cinza mais claro para bordas em tema escuro
    notification: Colors.dark.tint,
    secondary: Colors.dark.secondary,
    accent: Colors.dark.accent,
    error: Colors.dark.error,
    grey: Colors.dark.grey,
    lightGrey: Colors.dark.lightGrey,
  },
  sizes: SIZES,
  fonts: FONTS,
};

const appTheme = { SIZES, FONTS, lightTheme, darkTheme };
export default appTheme;