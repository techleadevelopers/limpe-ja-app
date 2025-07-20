// src/components/EyeIcon.tsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
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

const EyeIcon: React.FC<IconProps> = ({ size = 48, color = LIGHT_BLUE, animationTrigger }) => {
  const eyePath = `
    M${size * 0.15},${size * 0.5}
    C${size * 0.3},${size * 0.2}, ${size * 0.7},${size * 0.2}, ${size * 0.85},${size * 0.5}
    C${size * 0.7},${size * 0.8}, ${size * 0.3},${size * 0.8}, ${size * 0.15},${size * 0.5}
    Z
  `;

  const pupilRadius = size * 0.1;
  const pupilCx = size / 2;
  const pupilCy = size / 2;

  const pupilScale = useSharedValue(1);

  const animatedPupilStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pupilScale.value }],
    };
  });

  useEffect(() => {
    if (animationTrigger) {
      pupilScale.value = withRepeat(
        withTiming(0.7, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pupilScale.value = 1;
    }
  }, [animationTrigger, pupilScale]);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {SharedBlurFilter}
          <LinearGradient id="eyeOutlineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} />
            <Stop offset="100%" stopColor={MEDIUM_BLUE} />
          </LinearGradient>
          <RadialGradient id="pupilGradient" cx="50%" cy="50%" r="50%" fx="60%" fy="40%">
            <Stop offset="0%" stopColor={DARK_BLUE} />
            <Stop offset="100%" stopColor="#000000" />
          </RadialGradient>
          <RadialGradient id="pupilHighlightGradient" cx="50%" cy="50%" r="50%" fx="70%" fy="30%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <AnimatedGroup x={DEPTH_OFFSET_X * 1.5} y={DEPTH_OFFSET_Y * 1.5} opacity={0.3} filter="url(#blurFilter)">
          <Path d={eyePath} fill={SHADOW_COLOR} />
        </AnimatedGroup>
        <AnimatedGroup x={DEPTH_OFFSET_X * 1.5} y={DEPTH_OFFSET_Y * 1.5} opacity={0.3} filter="url(#blurFilter)">
          <Circle cx={pupilCx} cy={pupilCy} r={pupilRadius} fill={SHADOW_COLOR} />
        </AnimatedGroup>

        <Path
          d={eyePath}
          x={DEPTH_OFFSET_X}
          y={DEPTH_OFFSET_Y}
          fill={MEDIUM_BLUE}
        />
        <Path
          d={eyePath}
          fill="url(#eyeOutlineGradient)"
        />

        <AnimatedGroup style={animatedPupilStyle}>
          <Circle
            cx={pupilCx + DEPTH_OFFSET_X}
            cy={pupilCy + DEPTH_OFFSET_Y}
            r={pupilRadius}
            fill={MEDIUM_BLUE}
          />
        </AnimatedGroup>
        <AnimatedGroup style={animatedPupilStyle}>
          <Circle
            cx={pupilCx}
            cy={pupilCy}
            r={pupilRadius}
            fill="url(#pupilGradient)"
          />
          <Circle
            cx={pupilCx + pupilRadius * 0.3}
            cy={pupilCy - pupilRadius * 0.3}
            r={pupilRadius * 0.4}
            fill="url(#pupilHighlightGradient)"
          />
        </AnimatedGroup>
      </Svg>
    </View>
  );
};

export default EyeIcon;