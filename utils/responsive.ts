// utils/responsive.ts
import { useWindowDimensions } from 'react-native';

// Larguras lógicas típicas: SE=320/375, 12/13/14/15=390, Pro Max=428
export const useDevice = () => {
  const { width, height } = useWindowDimensions();
  const min = Math.min(width, height);

  const isSmallPhone = min < 360; // SE/8/menores
  const isBaselinePhone = min >= 360 && min < 420; // onde o 12 Pro (390) está
  const isLargePhone = min >= 420; // 428 (Pro Max) e acima

  return { width, height, isSmallPhone, isBaselinePhone, isLargePhone };
};

