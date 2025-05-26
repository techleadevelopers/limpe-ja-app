// LimpeJaApp/src/constants/Colors.ts
// Este é um exemplo, ajuste às cores da sua marca LimpeJá

const tintColorLight = '#007AFF'; // Azul padrão iOS
const tintColorDark = '#FFFFFF';

export default {
  light: {
    text: '#000000',
    background: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#CCCCCC',
    tabIconSelected: tintColorLight,
    primary: '#007AFF',
    secondary: '#4CD964', // Verde para sucesso/confirmação
    accent: '#FF9500', // Laranja para alertas ou destaque
    error: '#FF3B30', // Vermelho para erros
    grey: '#8E8E93',
    lightGrey: '#EFEFF4',
    darkGrey: '#3A3A3C',
    // ...outras cores
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000', // Ou um cinza muito escuro
    tint: tintColorDark,
    tabIconDefault: '#CCCCCC',
    tabIconSelected: tintColorDark,
    primary: '#0A84FF', // Azul mais vibrante para dark mode
    secondary: '#30D158', // Verde
    accent: '#FF9F0A', // Laranja
    error: '#FF453A', // Vermelho
    grey: '#8E8E93',
    lightGrey: '#1C1C1E', // Cinza escuro para cards/elementos
    darkGrey: '#E5E5EA', // Cinza claro para texto em fundo escuro
    // ...outras cores
  },
  // Cores da Marca (se aplicável, fora do tema light/dark)
  brand: {
    primaryGreen: '#28A745', // Exemplo de um verde LimpeJá
    lightBlue: '#E9F5FF',   // Exemplo de um azul claro para fundos
    // ...
  }
};