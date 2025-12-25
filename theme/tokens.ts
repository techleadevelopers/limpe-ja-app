// tokens.ts — Design System mínimo para consistência premium
export const tokens = {
  colors: {
    brand: { 500: '#4A90E2', 600: '#3F7EC7' },
    ink: { 900: '#1F2937', 500: '#6B7280' },
    surface: { 100: '#F7FAFF', 200: '#FFFFFF' },
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    neutral: { 400: '#E5E7EB', 600: '#D1D5DB' },
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  radii: { sm: 6, md: 12, lg: 18, xl: 22, xxl: 44 },
  typography: {
    sizes: { xs: 10, sm: 12, md: 14, lg: 15, xl: 16, xxl: 18 },
    weights: { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700', extrabold: '900' },
  },
  shadows: {
    low: {
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 0 },
    },
    medium: {
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.17, shadowRadius: 9 },
      android: { elevation: 0 },
    },
  },
  // Accent por categoria (exemplo; mapeie por categoryId)
  accents: {
    lavanderia: '#6EE7B7',
    passadoria: '#F59E0B',
    // Adicione mais...
  },
};