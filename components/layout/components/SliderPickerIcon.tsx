// src/components/SliderPickerIcon.tsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
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

const SliderPickerIcon: React.FC<IconProps> = ({ size = 48, color = LIGHT_BLUE, animationTrigger }) => {
  const barWidth = size * 0.6;
  const barHeight = size * 0.1;
  const barX = size * 0.2;
  const barY = size * 0.45;

  const thumbRadius = size * 0.15;
  const thumbCenterY = barY + barHeight / 2;

  const thumbTranslateX = useSharedValue(0);

  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: thumbTranslateX.value }],
    };
  });

  useEffect(() => {
    if (animationTrigger) {
      const startX = 0;
      const endX = barWidth - thumbRadius * 2;

      thumbTranslateX.value = withRepeat(
        withTiming(endX, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      thumbTranslateX.value = 0;
    }
  }, [animationTrigger, thumbTranslateX, barWidth, thumbRadius]);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {SharedBlurFilter}
          <LinearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} />
            <Stop offset="100%" stopColor={MEDIUM_BLUE} />
          </LinearGradient>
          <RadialGradient id="thumbGradient" cx="50%" cy="50%" r="50%" fx="60%" fy="40%">
            <Stop offset="0%" stopColor={color} />
            <Stop offset="100%" stopColor={DARK_BLUE} />
          </RadialGradient>
        </Defs>

        <AnimatedGroup
          x={DEPTH_OFFSET_X * 1.5}
          y={DEPTH_OFFSET_Y * 1.5}
          opacity={0.3}
          filter="url(#blurFilter)"
        >
          <Rect x={barX} y={barY} width={barWidth} height={barHeight} fill={SHADOW_COLOR} rx={size * 0.02} ry={size * 0.02} />
        </AnimatedGroup>
        <AnimatedGroup
          x={DEPTH_OFFSET_X * 1.5 + barX + thumbRadius}
          y={DEPTH_OFFSET_Y * 1.5}
          opacity={0.3}
          filter="url(#blurFilter)"
          style={animatedThumbStyle}
        >
          <Circle cx={0} cy={thumbCenterY} r={thumbRadius} fill={SHADOW_COLOR} />
        </AnimatedGroup>

        <Rect
          x={barX + DEPTH_OFFSET_X}
          y={barY + DEPTH_OFFSET_Y}
          width={barWidth}
          height={barHeight}
          fill={MEDIUM_BLUE}
          rx={size * 0.02} ry={size * 0.02}
        />
        <Rect
          x={barX}
          y={barY}
          width={barWidth}
          height={barHeight}
          fill="url(#barGradient)"
          rx={size * 0.02} ry={size * 0.02}
        />

        <AnimatedGroup
          x={barX + thumbRadius + DEPTH_OFFSET_X}
          y={DEPTH_OFFSET_Y}
          style={animatedThumbStyle}
        >
          <Circle
            cx={0}
            cy={thumbCenterY + DEPTH_OFFSET_Y}
            r={thumbRadius}
            fill={MEDIUM_BLUE}
          />
        </AnimatedGroup>

        <AnimatedGroup
          x={barX + thumbRadius}
          y={0}
          style={animatedThumbStyle}
        >
          <Circle
            cx={0}
            cy={thumbCenterY}
            r={thumbRadius}
            fill="url(#thumbGradient)"
          />
        </AnimatedGroup>
      </Svg>
    </View>
  );
};

export default SliderPickerIcon;