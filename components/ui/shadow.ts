import { Platform } from 'react-native';

export function shadow(elevation: number) {
  if (Platform.OS === 'web') {
    const y = Math.max(1, Math.min(16, elevation));
    const blur = Math.round(1.5 * y + 3);
    const spread = Math.max(0, Math.round(y / 3 - 1));
    const alpha = Math.min(0.24, 0.08 + y * 0.01);
    return {
      boxShadow: `0 ${y}px ${blur}px ${spread}px rgba(0,0,0,${alpha})`,
    } as any;
  }
  return {
    elevation,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Math.max(1, Math.round(elevation / 2)) },
    shadowOpacity: Math.min(0.3, 0.06 + elevation * 0.02),
    shadowRadius: Math.round(elevation + 2),
  } as any;
}

