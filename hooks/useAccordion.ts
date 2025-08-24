// path: src/motion/hooks/useAccordion.ts
// ---------------------------------------------
import { useCallback, useState } from 'react';
import { useSharedValue, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { useMotion } from '../motions/provider/MotionProvider';


export function useAccordion(initial = false) {
const { tokens } = useMotion();
const [measuredHeight, setMeasuredHeight] = useState(0);
const open = useSharedValue(initial ? 1 : 0);


const toggle = useCallback(() => {
open.value = withTiming(open.value === 1 ? 0 : 1, { duration: tokens.duration.md, easing: tokens.easing.standard });
}, [open, tokens.duration.md, tokens.easing.standard]);


const onContentLayout = useCallback((e: any) => {
setMeasuredHeight(e.nativeEvent.layout.height);
}, []);


const containerStyle = useAnimatedStyle(() => ({
height: measuredHeight * open.value,
opacity: open.value,
}), [measuredHeight]);


const chevronStyle = useAnimatedStyle(() => ({
transform: [{ rotate: `${open.value * 180}deg` }],
}));


return { toggle, onContentLayout, containerStyle, chevronStyle, open } as const;
}