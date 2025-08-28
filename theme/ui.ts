// tokens simples e consistentes com seu app
export const colors = {
  white: '#FFFFFF',
  bgAlt: '#F8F9FD',
  textDark: '#1A2538',
  textMed: '#4A5568',
  textMuted: '#7A8599',
  primary: '#007AFF',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#FFC107',
  border: 'rgba(0,0,0,0.08)',
  shadowCard: 'rgba(0,0,0,0.06)',
};

export const radius = { xs: 6, sm: 10, md: 12, lg: 16, xl: 20, pill: 999 };

export const shadow = {
  card: {
    ios: { shadowColor: colors.shadowCard, shadowOffset: {width:0, height:3}, shadowOpacity: 0.08, shadowRadius: 5 },
    android: { elevation: 4 },
  },
};
