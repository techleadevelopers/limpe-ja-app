// path: src/motion/hooks/useFadeIn.ts
// ---------------------------------------------
import { useEffect } from 'react';
import { withDelay, withTiming, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useMotion } from '../motions/provider/MotionProvider';


export type UseFadeInOptions = {
delay?: number; // extra delay in ms
offsetY?: number; // start offset on Y axis
duration?: number; // override duration
};


export function useFadeIn(opts: UseFadeInOptions = {}) {
const { tokens } = useMotion();
const { delay = tokens.delay.none, offsetY = tokens.distance.y.md, duration = tokens.duration.md } = opts;


const progress = useSharedValue(0);


useEffect(() => {
progress.value = withDelay(delay, withTiming(1, { duration, easing: tokens.easing.decel }));
}, [delay, duration, tokens.easing.decel, progress]);


const style = useAnimatedStyle(() => {
const t = progress.value;
return {
opacity: t,
transform: [{ translateY: (1 - t) * offsetY }],
};
}, [offsetY]);


return { style, progress } as const;
}