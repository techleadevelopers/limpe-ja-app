// src/components/XMarkIcon.tsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import {
  LIGHT_BLUE,
  MEDIUM_BLUE,
  DARK_BLUE,
  SHADOW_COLOR,
  DEPTH_OFFSET_X,
  DEPTH_OFFSET_Y,
  SharedBlurFilter,
  AnimatedGroup,
} from '../utils/constants';

interface IconProps {
  size?: number;
  color?: string;
  animationTrigger: boolean;
}

const XMarkIcon: React.FC<IconProps> = ({ size = 48, color = LIGHT_BLUE, animationTrigger }) => {
  const bar1Path = `M${size * 0.2},${size * 0.2} L${size * 0.8},${size * 0.8}`;
  const bar2Path = `M${size * 0.2},${size * 0.8} L${size * 0.8},${size * 0.2}`;

  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }],
    };
  });

  useEffect(() => {
    if (animationTrigger) {
      rotation.value = withRepeat(withTiming(360, { duration: 1500, easing: Easing.linear }), -1, true);
    } else {
      rotation.value = 0;
    }
  }, [animationTrigger, rotation]);

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            {SharedBlurFilter}
            <LinearGradient id="xGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={color} />
              <Stop offset="100%" stopColor={DARK_BLUE} />
            </LinearGradient>
          </Defs>

          <AnimatedGroup
            x={DEPTH_OFFSET_X * 1.5}
            y={DEPTH_OFFSET_Y * 1.5}
            opacity={0.3}
            filter="url(#blurFilter)"
          >
            <Path d={bar1Path} stroke={SHADOW_COLOR} strokeWidth={size * 0.08} strokeLinecap="round" />
            <Path d={bar2Path} stroke={SHADOW_COLOR} strokeWidth={size * 0.08} strokeLinecap="round" />
          </AnimatedGroup>

          <Path
            d={bar1Path}
            x={DEPTH_OFFSET_X}
            y={DEPTH_OFFSET_Y}
            stroke={MEDIUM_BLUE}
            strokeWidth={size * 0.08}
            strokeLinecap="round"
          />
          <Path
            d={bar1Path}
            stroke={color}
            strokeWidth={size * 0.08}
            strokeLinecap="round"
          />

          <Path
            d={bar2Path}
            x={DEPTH_OFFSET_X}
            y={DEPTH_OFFSET_Y}
            stroke={MEDIUM_BLUE}
            strokeWidth={size * 0.08}
            strokeLinecap="round"
          />
          <Path
            d={bar2Path}
            stroke={color}
            strokeWidth={size * 0.08}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

export default XMarkIcon;