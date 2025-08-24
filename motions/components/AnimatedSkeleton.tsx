// path: src/motion/components/AnimatedSkeleton.tsx
// ---------------------------------------------
import React, { useCallback, useState } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';


export type AnimatedSkeletonProps = {
width: number | string;
height: number | string;
radius?: number;
style?: ViewStyle;
};


export function AnimatedSkeleton({ width, height, radius = 12, style }: AnimatedSkeletonProps) {
const [w, setW] = useState(0);
const translate = useSharedValue(-150);


const onLayout = useCallback((e: any) => setW(e.nativeEvent.layout.width), []);


// loop shimmer
translate.value = withRepeat(withTiming(w + 150, { duration: 1200 }), -1, false);


const shimmerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translate.value }] }));


return (
<View onLayout={onLayout} style={[{ overflow: 'hidden', width, height, borderRadius: radius, backgroundColor: '#E9ECEF' }, style]}>
<Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, width: 150 }, shimmerStyle]}>
<LinearGradient
colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
style={{ flex: 1 }}
/>
</Animated.View>
</View>
);
}