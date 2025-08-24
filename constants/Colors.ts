// LimpeJaApp/src/constants/Colors.ts
// Este é um exemplo, ajuste às cores da sua marca LimpeJá

const tintColorLight = '#007AFF'; // Azul padrão iOS
const tintColorDark  = '#FFFFFF'; // Esta constante é usada para o tint do dark mode

export default {
  light: {
    text: '#1A2538', // Mapeado para TEXT_DARK anterior
    background: '#FFFFFF',
    tint: tintColorLight, // Usado como ICON_PRIMARY
    tabIconDefault: '#7A8599', // Mapeado para TEXT_MUTED
    tabIconSelected: tintColorLight,
    primary: '#007AFF', // Mapeado para ICON_PRIMARY
    secondary: '#28a745',   // Mapeado para SUCCESS_GREEN
    accent: '#FFC107',      // Mapeado para WARNING_YELLOW
    error: '#dc3545',       // Mapeado para DANGER_RED
    grey: '#8E8E93',
    lightGrey: '#EFEFF4', // Usado como background para placeholders
    darkGrey: '#3A3A3C',
    icon: '#000000',        // Cor padrão de ícone
    textLight: '#FFFFFF', // <-- CORREÇÃO: Adicionado para o tema claro, geralmente usado para texto em fundos escuros (como headers)
    
    // Cores personalizadas adicionadas ou mapeadas para consistência:
    backgroundAlt: '#F8F9FD', // Mapeado para BACKGROUND_ALT
    textMedium: '#4A5568', // Mapeado para TEXT_MEDIUM
    borderSubtle: 'rgba(0,0,0,0.08)', // Mapeado para BORDER_SUBTLE
    shadowColorCard: 'rgba(0, 0, 0, 0.06)', // Mapeado para SHADOW_COLOR_CARD
    shadowColorSection: 'rgba(0, 0, 0, 0.1)', // Mapeado para SHADOW_COLOR_SECTION
    primaryLight: '#EBF5FF', // Mapeado para PRIMARY_LIGHT
    
    // Adicionadas para resolver os erros de propriedade em document-upload.tsx e facial-recognition.tsx
    // Com base na sua paleta de cores original fornecida em document-upload.tsx e facial-recognition.tsx
    cardBackground: '#FFFFFF', 
    textPrimary: '#2D3748', // Usado para títulos (effects.md: #2C3E50)
    textSecondary: '#6C757D', 
    successBg: '#E8F5E9', 
    errorBg: '#FFEBEE',
    info: '#17A2B8',
    primaryGradientStart: '#007AFF',
    lightBlueBorder: '#B3D9FF',
    
    // Cores específicas para EarningsSummaryCard e EarningsChartSection se forem diferentes das globais
    // Mapeando para as cores globais mais próximas para consistência
    earningsPrimary: '#007AFF', // Pode ser 'primary' ou 'tint'
    earningsWarning: '#FFC107', // Pode ser 'accent'
    earningsSuccess: '#28A745', // Pode ser 'secondary'
    earningsTextDark: '#1C3A5F', // Mapeado de TEXT_COLOR_DARK original para text
    earningsMutedText: '#6C757D', // Mapeado de MUTED_TEXT_COLOR original para tabIconDefault ou grey
    earningsBorder: '#E9ECEF', // Mapeado de BORDER_COLOR
    earningsBackgroundLight: '#F8F9FA', // Mapeado de BACKGROUND_COLOR_LIGHT
    earningsMutedSubtitle: '#868E96', // Mapeado de TEXT_COLOR_MUTED_SUBTITLE
    earningsPositiveAmount: '#28A745', // Mapeado de POSITIVE_AMOUNT_COLOR
    earningsNegativeAmount: '#DC3545', // Mapeado de NEGATIVE_AMOUNT_COLOR
    earningsDefaultText: '#212529', // Mapeado de DEFAULT_TEXT_COLOR
    earningsBackgroundAltDetail: '#F0F2F5', // Mapeado de BACKGROUND_COLOR_ALT em AnimatedTransactionItem

    // Cores para ícones de transação
    iconTransactionPayment: '#007AFF',
    iconTransactionWithdrawal: '#DC3545',
    iconTransactionCommission: '#FFC107',

    // NOVAS CORES INJETADAS DO EFFECTS.MD (Light Mode)
    interactivePrimary: '#4A90E2', // Primário Interativo (effects.md)
    primaryDark: '#2A72E7', // Primário Escuro (effects.md)
    brandSupport: '#1A73E8', // Ações Relevantes/Brand Support (effects.md)
    successStrong: '#218838', // Sucesso forte (effects.md)
    specialIndicator: '#00BFA5', // Hoje/indicadores especiais (effects.md)
    textBody: '#333', // Corpo (effects.md)
    textMuted: '#666', // Auxiliar (effects.md)
    danger: '#D32F2F', // Erro/alerta (effects.md)
    destructive: '#E74C3C', // Ação destrutiva (effects.md)
    sensitiveBackground: '#FFE0E6', // Contextos sensíveis (effects.md)
    sensitiveBorder: '#FFC0CB', // Contextos sensíveis (effects.md)
    border: '#E0E0E0', // Bordas/inputs (effects.md)
    link: '#007AFF', // Adicionado: Cor de link para o tema claro
    backdrop: 'rgba(0,0,0,0.5)', // Adicionado: Cor do backdrop para o tema claro

    // Adições para resolver os erros de propriedade 'success' e 'warning'
    success: '#28a745', // Mapeado para secondary/SUCCESS_GREEN
    warning: '#FFC107', // Mapeado para accent/WARNING_YELLOW
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    tint: tintColorDark,
    tabIconDefault: '#CCCCCC',
    tabIconSelected: tintColorDark,
    primary: '#0A84FF',
    secondary: '#30D158',
    accent: '#FF9F0A',
    error: '#FF453A',
    grey: '#8E8E93',
    lightGrey: '#1C1C1E',
    darkGrey: '#E5E5EA',
    icon: '#FFFFFF',
    textLight: '#212529', // <-- CORREÇÃO: Adicionado para o tema escuro. Geralmente é uma cor mais clara para texto em fundos escuros. Se você usa branco em fundos escuros, pode ser '#FFFFFF'. Ajustei para uma cor que é "clara" no contexto do dark mode, mas não branca pura, como você tinha em um exemplo anterior.

    // Cores personalizadas adicionadas ou mapeadas para consistência no modo escuro
    backgroundAlt: '#1E1E1E', // Exemplo para dark mode
    textMedium: '#B0B0B0',
    borderSubtle: 'rgba(255,255,255,0.1)',
    shadowColorCard: 'rgba(255,255,255,0.08)',
    shadowColorSection: 'rgba(255,255,255,0.15)',
    primaryLight: '#0A84FF', // Pode ser o mesmo do primary
    
    // Adicionadas para resolver os erros de propriedade no modo escuro
    cardBackground: '#1E1E1E', // Exemplo de cor para card no dark mode
    textPrimary: '#FFFFFF', // Cor primária de texto no dark mode (para títulos)
    textSecondary: '#CCCCCC', // Cor secundária de texto no dark mode
    successBg: '#1C1C1E', // Exemplo de cor de fundo de sucesso no dark mode
    errorBg: '#2C1B1B', // Exemplo de cor de fundo de erro no dark mode
    info: '#4080B0', // Exemplo de cor de informação no dark mode
    primaryGradientStart: '#0A84FF',
    lightBlueBorder: '#50A0D0',

    // Cores específicas para EarningsSummaryCard e EarningsChartSection no modo escuro
    earningsPrimary: '#0A84FF',
    earningsWarning: '#FF9F0A',
    earningsSuccess: '#30D158',
    earningsTextDark: '#E5E5EA',
    earningsMutedText: '#8E8E93',
    earningsBorder: '#3A3A3C',
    earningsBackgroundLight: '#1C1C1E',
    earningsMutedSubtitle: '#8E8E93',
    earningsPositiveAmount: '#30D158',
    earningsNegativeAmount: '#FF453A',
    earningsDefaultText: '#E5E5EA',
    earningsBackgroundAltDetail: '#2C2C2E', // Exemplo para dark mode
    
    // Cores para ícones de transação no modo escuro
    iconTransactionPayment: '#0A84FF',
    iconTransactionWithdrawal: '#FF453A',
    iconTransactionCommission: '#FF9F0A',

    // NOVAS CORES INJETADAS DO EFFECTS.MD (Dark Mode)
    interactivePrimary: '#6FA8DC', // Tom mais claro para interativo no dark mode
    primaryDark: '#1A52B7', // Tom mais escuro para primaryDark no dark mode
    brandSupport: '#3A83F8', // Tom mais claro para brandSupport no dark mode
    successStrong: '#1A6A2C', // Tom mais escuro para successStrong no dark mode
    specialIndicator: '#00E0C5', // Tom mais claro para specialIndicator no dark mode
    textBody: '#E5E5EA', // Usando darkGrey como textBody no dark mode
    textMuted: '#8E8E93', // Usando grey como textMuted no dark mode
    danger: '#FF453A', // Usando error como danger no dark mode
    destructive: '#FF6F61', // Tom mais claro para destructive no dark mode
    sensitiveBackground: '#3A1E20', // Fundo sensível mais escuro no dark mode
    sensitiveBorder: '#5A2E30', // Borda sensível mais escura no dark mode
    border: '#3A3A3C', // Usando darkGrey como border no dark mode
    link: '#0A84FF', // Adicionado: Cor de link para o tema escuro
    backdrop: 'rgba(0,0,0,0.7)', // Adicionado: Cor do backdrop para o tema escuro

    // Adições para resolver os erros de propriedade 'success' e 'warning'
    success: '#30D158', // Mapeado para secondary/SUCCESS_GREEN
    warning: '#FF9F0A', // Mapeado para accent/WARNING_YELLOW
  },
  // Cores da Marca (se aplicável, fora do tema light/dark)
  brand: {
    primaryGreen: '#28A745',
    lightBlue: '#E9F5FF',
    // ...
  }
};