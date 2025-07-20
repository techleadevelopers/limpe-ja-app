// src/components/InfoIcon.tsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import {
  AnimatedGroup,
  DARK_BLUE,
  DEPTH_OFFSET_X,
  DEPTH_OFFSET_Y,
  LIGHT_BLUE,
  MEDIUM_BLUE,
  SHADOW_COLOR,
  SharedBlurFilter,
} from '../../utils/constants';

interface IconProps {
  size?: number;
  color?: string;
  animationTrigger: boolean;
}

const InfoIcon: React.FC<IconProps> = ({ size = 48, color = LIGHT_BLUE, animationTrigger }) => {
  const circleRadius = size * 0.4;
  const circleCx = size / 2;
  const circleCy = size / 2;

  const iBarWidth = size * 0.08;
  const iBarHeight = size * 0.3;
  const iBarX = size / 2 - iBarWidth / 2;
  const iBarY = size * 0.35;
  const iDotRadius = size * 0.05;
  const iDotCx = size / 2;
  const iDotCy = size * 0.25;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  useEffect(() => {
    if (animationTrigger) {
      scale.value = withRepeat(
        withTiming(1.1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      scale.value = 1;
    }
  }, [animationTrigger, scale]);

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            {SharedBlurFilter}
            <RadialGradient id="infoCircleGradient" cx="50%" cy="50%" r="50%" fx="60%" fy="40%">
              <Stop offset="0%" stopColor={color} />
              <Stop offset="100%" stopColor={DARK_BLUE} />
            </RadialGradient>
            <LinearGradient id="infoIGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} />
              <Stop offset="100%" stopColor={DARK_BLUE} />
            </LinearGradient>
          </Defs>

          <AnimatedGroup x={DEPTH_OFFSET_X * 1.5} y={DEPTH_OFFSET_Y * 1.5} opacity={0.3} filter="url(#blurFilter)">
            <Circle cx={circleCx} cy={circleCy} r={circleRadius} fill={SHADOW_COLOR} />
          </AnimatedGroup>
          <AnimatedGroup x={DEPTH_OFFSET_X * 1.5} y={DEPTH_OFFSET_Y * 1.5} opacity={0.3} filter="url(#blurFilter)">
            <Rect x={iBarX} y={iBarY} width={iBarWidth} height={iBarHeight} fill={SHADOW_COLOR} rx={size * 0.01} ry={size * 0.01} />
          </AnimatedGroup>
          <AnimatedGroup x={DEPTH_OFFSET_X * 1.5} y={DEPTH_OFFSET_Y * 1.5} opacity={0.3} filter="url(#blurFilter)">
            <Circle cx={iDotCx} cy={iDotCy} r={iDotRadius} fill={SHADOW_COLOR} />
          </AnimatedGroup>

          <Circle
            cx={circleCx + DEPTH_OFFSET_X}
            cy={circleCy + DEPTH_OFFSET_Y}
            r={circleRadius}
            fill={MEDIUM_BLUE}
          />
          <Circle
            cx={circleCx}
            cy={circleCy}
            r={circleRadius}
            fill="url(#infoCircleGradient)"
          />

          <Rect
            x={iBarX + DEPTH_OFFSET_X}
            y={iBarY + DEPTH_OFFSET_Y}
            width={iBarWidth}
            height={iBarHeight}
            fill={MEDIUM_BLUE}
            rx={size * 0.01} ry={size * 0.01}
          />
          <Rect
            x={iBarX}
            y={iBarY}
            width={iBarWidth}
            height={iBarHeight}
            fill="url(#infoIGradient)"
            rx={size * 0.01} ry={size * 0.01}
          />

          <Circle
            cx={iDotCx + DEPTH_OFFSET_X}
            cy={iDotCy + DEPTH_OFFSET_Y}
            r={iDotRadius}
            fill={MEDIUM_BLUE}
          />
          <Circle
            cx={iDotCx}
            cy={iDotCy}
            r={iDotRadius}
            fill="url(#infoIGradient)"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

export default InfoIcon;