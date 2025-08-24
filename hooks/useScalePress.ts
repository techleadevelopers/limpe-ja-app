// path: src/motion/hooks/useScalePress.ts
// ---------------------------------------------
import { useCallback } from 'react';
import { withSpring, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useMotion } from '../motions/provider/MotionProvider';


export function useScalePress() {
const { tokens } = useMotion();
const scale = useSharedValue(1);


const onPressIn = useCallback(() => {
scale.value = withSpring(tokens.distance.scale.tap, { damping: 15, stiffness: 260 });
}, [scale, tokens.distance.scale.tap]);


const onPressOut = useCallback(() => {
scale.value = withSpring(1, { damping: 14, stiffness: 220 });
}, [scale]);


const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));


return { style, onPressIn, onPressOut, scale } as const;
}