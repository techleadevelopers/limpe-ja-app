// path: src/motion/hooks/useCountUp.ts
// ---------------------------------------------
import { useEffect, useState } from 'react';
import { useSharedValue, withTiming, useAnimatedReaction, runOnJS, Easing } from 'react-native-reanimated';
import { useMotion } from '../motions/provider/MotionProvider';


export type UseCountUpOptions = {
from?: number;
to: number;
duration?: number;
formatter?: (n: number) => string;
easing?: (value: number) => number;
};


export function useCountUp({ from = 0, to, duration, formatter, easing }: UseCountUpOptions) {
const { tokens } = useMotion();
const d = duration ?? tokens.duration.lg;
const e = easing ?? tokens.easing.emphasized;
const value = useSharedValue(from);
const [display, setDisplay] = useState(formatter ? formatter(from) : Math.round(from).toString());


useEffect(() => {
value.value = withTiming(to, { duration: d, easing: e });
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [to, d, e]);


useAnimatedReaction(
() => value.value,
(v) => {
runOnJS(setDisplay)(formatter ? formatter(v) : Math.round(v).toString());
},
[]
);


return { display, value } as const;
}