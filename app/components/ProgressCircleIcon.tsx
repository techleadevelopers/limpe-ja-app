// src/components/ProgressCircleIcon.tsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
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
  AnimatedCircle,
  AnimatedGroup,
} from '../utils/constants';

interface ProgressCircleIconProps {
  size?: number;
  color?: string;
  animationTrigger: boolean;
  progress?: number;
}

const ProgressCircleIcon: React.FC<ProgressCircleIconProps> = ({ size = 48, color = LIGHT_BLUE, animationTrigger, progress = 0.75 }) => {
  const circleRadius = size * 0.4;
  const circleCx = size / 2;
  const circleCy = size / 2;
  const strokeWidth = size * 0.08;
  const circumference = 2 * Math.PI * circleRadius;

  const dashOffset = useSharedValue(circumference);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: dashOffset.value,
    };
  });

  useEffect(() => {
    if (animationTrigger) {
      dashOffset.value = withTiming(circumference * (1 - progress), { duration: 1500, easing: Easing.inOut(Easing.ease) });
    } else {
      dashOffset.value = circumference;
    }
  }, [animationTrigger, dashOffset, circumference, progress]);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {SharedBlurFilter}
          <LinearGradient id="progressStrokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} />
            <Stop offset="100%" stopColor={DARK_BLUE} />
          </LinearGradient>
          <LinearGradient id="progressTrackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={MEDIUM_BLUE} />
            <Stop offset="100%" stopColor={DARK_BLUE} />
          </LinearGradient>
        </Defs>

        <AnimatedGroup x={DEPTH_OFFSET_X * 1.5} y={DEPTH_OFFSET_Y * 1.5} opacity={0.3} filter="url(#blurFilter)">
          <Circle
            cx={circleCx}
            cy={circleCy}
            r={circleRadius}
            stroke={SHADOW_COLOR}
            strokeWidth={strokeWidth}
            fill="none"
          />
        </AnimatedGroup>
        <AnimatedGroup x={DEPTH_OFFSET_X * 1.5} y={DEPTH_OFFSET_Y * 1.5} opacity={0.3} filter="url(#blurFilter)">
          <Circle
            cx={circleCx}
            cy={circleCy}
            r={circleRadius}
            stroke={SHADOW_COLOR}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            transform={`rotate(-90 ${circleCx} ${circleCy})`}
          />
        </AnimatedGroup>

        <Circle
          cx={circleCx + DEPTH_OFFSET_X}
          cy={circleCy + DEPTH_OFFSET_Y}
          r={circleRadius}
          stroke={MEDIUM_BLUE}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={circleCx}
          cy={circleCy}
          r={circleRadius}
          stroke="url(#progressTrackGradient)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        <Circle
          cx={circleCx + DEPTH_OFFSET_X}
          cy={circleCy + DEPTH_OFFSET_Y}
          r={circleRadius}
          stroke={DARK_BLUE}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          transform={`rotate(-90 ${circleCx} ${circleCy})`}
        />
        <AnimatedCircle
          cx={circleCx}
          cy={circleCy}
          r={circleRadius}
          stroke="url(#progressStrokeGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          transform={`rotate(-90 ${circleCx} ${circleCy})`}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
};

export default ProgressCircleIcon;