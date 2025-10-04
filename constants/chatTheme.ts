// constants/chatTheme.ts
import { AppColors, AppShadows } from '../constants/appStyles';

export const AppChat = {
  headerBg: AppColors.primaryInteractive,
  surface: AppColors.white,
  background: '#F6F8FB',
  myBubbleBg: AppColors.primaryInteractive,
  theirBubbleBg: AppColors.white,
  unreadBg: AppColors.primaryInteractive,
  unreadFg: AppColors.white,
  typing: AppColors.primaryInteractive,
  timeMy: 'rgba(255,255,255,0.7)',
  timeTheir: '#6C757D',
  title: AppColors.white,
  subtitle: 'rgba(255,255,255,0.8)',
  shadowCard: AppShadows.medium,      // use nas cards da lista
  shadowBar: AppShadows.small,        // barra de input
  borderNeutral: '#E9ECEF'
} as const;
