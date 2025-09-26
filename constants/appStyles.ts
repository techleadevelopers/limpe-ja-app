// relaxed-app/constants/appStyles.ts
import { Dimensions, Platform, TextStyle, ViewStyle } from 'react-native'; // Import TextStyle and ViewStyle

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const AppColors = {
  primaryInteractive: '#4A90E2',
  primaryDark: '#2A72E7',
  successStandard: '#28A745',
  successStrong: '#218838',
  attentionYellow: '#FFD700',
  warningYellow: '#FFC107', // Adicionado: Cor para avisos/amarelo
  errorRed: '#D32F2F',
  backgroundLight: '#F8FAFB',
  backgroundNeutral: '#F0F2F5',
  borderNeutral: '#E0E0E0',
  textTitle: '#2C3E50',
  textBody: '#333',
  textAuxiliary: '#666',
  white: '#FFFFFF',
  black: '#000000',
  lightGray: '#CED4DA',
  mediumGray: '#868E96',
  accentLight: '#EBF5FF', // Adicionado: Um azul claro para acentos
};

export const AppDurations = {
  xs: 120,
  sm: 180,
  md: 250,
  lg: 380,
  xl: 520,
};

export const AppOffsets = {
  translateY: 16,
  scalePress: 0.96,
  staggerStep: 60,
};

export const AppShadows = {
  small: {
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle, // Explicitamente tipado como ViewStyle
  medium: {
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  } as ViewStyle, // Explicitamente tipado como ViewStyle
  large: Platform.select({ // Adicionado: Sombra grande
    ios: {
      shadowColor: AppColors.black,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
    },
    android: {
      elevation: 12,
    },
  }) as ViewStyle, // Explicitamente tipado como ViewStyle
};

export const AppTypography = {
  title: {
    fontSize: 22, // Ajustado para corresponder ao uso em ReturnCouponCard
    fontWeight: 'bold',
    color: AppColors.textTitle,
  } as TextStyle, // Explicitamente tipado como TextStyle
  subtitle: {
    fontSize: 16, // Ajustado para corresponder ao uso em ReturnCouponCard
    fontWeight: '500', // Exemplo de fontWeight literal
    color: AppColors.textAuxiliary,
  } as TextStyle, // Explicitamente tipado como TextStyle
  body: {
    fontSize: 16,
    fontWeight: 'normal', // Exemplo de fontWeight literal
    color: AppColors.textBody,
  } as TextStyle, // Explicitamente tipado como TextStyle
  buttonText: {
    fontSize: 16,
    fontWeight: '600', // Exemplo de fontWeight literal
    color: AppColors.white,
  } as TextStyle, // Explicitamente tipado como TextStyle
  h1: { fontSize: 28, fontWeight: 'bold', color: AppColors.textBody } as TextStyle,
  h2: { fontSize: 24, fontWeight: 'bold', color: AppColors.textBody } as TextStyle,
  h3: { fontSize: 20, fontWeight: 'bold', color: AppColors.textBody } as TextStyle,
  small: { fontSize: 14, fontWeight: 'normal', color: AppColors.textAuxiliary } as TextStyle, // Exemplo de fontWeight literal
  xsmall: { fontSize: 12, fontWeight: 'normal', color: AppColors.mediumGray } as TextStyle, // Exemplo de fontWeight literal
};


export { SCREEN_WIDTH, SCREEN_HEIGHT };