// relaxed-app/constants/appStyles.ts
import { Dimensions, Platform } from 'react-native';

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
  },
  medium: {
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
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
  }),
};

export const AppTypography = {
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.textTitle,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.textAuxiliary,
  },
  body: {
    fontSize: 16,
    color: AppColors.textBody,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.white,
  },
  h1: { fontSize: 28, fontWeight: 'bold', color: AppColors.textBody },
  h2: { fontSize: 24, fontWeight: 'bold', color: AppColors.textBody },
  h3: { fontSize: 20, fontWeight: 'bold', color: AppColors.textBody },
  small: { fontSize: 14, color: AppColors.textAuxiliary },
  xsmall: { fontSize: 12, color: AppColors.mediumGray },
};


export { SCREEN_WIDTH, SCREEN_HEIGHT };