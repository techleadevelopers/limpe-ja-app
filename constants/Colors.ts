// LimpeJaApp/src/constants/Colors.ts
// Este é um exemplo, ajuste às cores da sua marca LimpeJá

const tintColorLight = '#007AFF'; // Azul padrão iOS
const tintColorDark  = '#FFFFFF';

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
    
    // Cores personalizadas adicionadas ou mapeadas para consistência:
    backgroundAlt: '#F8F9FD', // Mapeado para BACKGROUND_ALT
    textMedium: '#4A5568', // Mapeado para TEXT_MEDIUM
    borderSubtle: 'rgba(0,0,0,0.08)', // Mapeado para BORDER_SUBTLE
    shadowColorCard: 'rgba(0, 0, 0, 0.06)', // Mapeado para SHADOW_COLOR_CARD
    shadowColorSection: 'rgba(0, 0, 0, 0.1)', // Mapeado para SHADOW_COLOR_SECTION
    primaryLight: '#EBF5FF', // Mapeado para PRIMARY_LIGHT
    
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

    // Cores personalizadas adicionadas ou mapeadas para consistência no modo escuro
    backgroundAlt: '#1E1E1E', // Exemplo para dark mode
    textMedium: '#B0B0B0',
    borderSubtle: 'rgba(255,255,255,0.1)',
    shadowColorCard: 'rgba(255,255,255,0.08)',
    shadowColorSection: 'rgba(255,255,255,0.15)',
    primaryLight: '#0A84FF', // Pode ser o mesmo do primary
    
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
  },
  // Cores da Marca (se aplicável, fora do tema light/dark)
  brand: {
    primaryGreen: '#28A745',
    lightBlue: '#E9F5FF',
    // ...
  }
};