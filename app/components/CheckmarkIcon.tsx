// src/components/CheckmarkIcon.tsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  useSharedValue,
  useAnimatedProps,
  withTiming,
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
  AnimatedPath,
  AnimatedGroup,
} from '../utils/constants'; // Import constants

interface IconProps {
  size?: number;
  color?: string;
  animationTrigger: boolean;
}

const CheckmarkIcon: React.FC<IconProps> = ({ size = 48, color = LIGHT_BLUE, animationTrigger }) => {
  const checkmarkPath = `M${size * 0.2},${size * 0.5} L${size * 0.4},${size * 0.75} L${size * 0.8},${size * 0.25}`;
  const pathLength = (Math.sqrt(0.2 * 0.2 + 0.25 * 0.25) + Math.sqrt(0.4 * 0.4 + 0.5 * 0.5)) * size;

  const dashOffset = useSharedValue(pathLength);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: dashOffset.value,
    };
  });

  useEffect(() => {
    if (animationTrigger) {
      dashOffset.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.ease) });
    } else {
      dashOffset.value = pathLength;
    }
  }, [animationTrigger, dashOffset, pathLength]);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {SharedBlurFilter}
          <LinearGradient id="checkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
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
          <Path
            d={checkmarkPath}
            stroke={SHADOW_COLOR}
            strokeWidth={size * 0.08}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </AnimatedGroup>

        <Path
          d={checkmarkPath}
          x={DEPTH_OFFSET_X}
          y={DEPTH_OFFSET_Y}
          stroke={MEDIUM_BLUE}
          strokeWidth={size * 0.08}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <AnimatedPath
          d={checkmarkPath}
          stroke={color}
          strokeWidth={size * 0.08}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
};

export default CheckmarkIcon;