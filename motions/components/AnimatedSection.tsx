// path: src/motion/components/AnimatedSection.tsx
// ---------------------------------------------
import React from 'react';
import Animated from 'react-native-reanimated';
import { useFadeIn } from '../../hooks/useFadeIn';


export type AnimatedSectionProps = React.PropsWithChildren<{ delay?: number; offsetY?: number; style?: any }>;


export function AnimatedSection({ delay, offsetY, style, children }: AnimatedSectionProps) {
const { style: s } = useFadeIn({ delay, offsetY });
return <Animated.View style={[s, style]}>{children}</Animated.View>;
}