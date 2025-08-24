// path: src/motion/components/AnimatedPressable.tsx
// ---------------------------------------------
import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated from 'react-native-reanimated';
import { useScalePress } from '../../hooks/useScalePress';


export type AnimatedPressableProps = PressableProps & { children: React.ReactNode };


export function AnimatedPressable({ children, onPressIn, onPressOut, ...rest }: AnimatedPressableProps) {
const { style, onPressIn: _in, onPressOut: _out } = useScalePress();
return (
<Animated.View style={style}>
<Pressable onPressIn={(e) => { _in(); onPressIn?.(e); }} onPressOut={(e) => { _out(); onPressOut?.(e); }} {...rest}>
{children}
</Pressable>
</Animated.View>
);
}