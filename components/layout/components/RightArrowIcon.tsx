// src/components/RightArrowIcon.tsx
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

const RightArrowIcon: React.FC<IconProps> = ({ size = 48, color = LIGHT_BLUE, animationTrigger }) => {
  const arrowPath = `
    M${size * 0.2},${size * 0.4}
    L${size * 0.6},${size * 0.4}
    L${size * 0.6},${size * 0.2}
    L${size * 0.8},${size * 0.5}
    L${size * 0.6},${size * 0.8}
    L${size * 0.6},${size * 0.6}
    L${size * 0.2},${size * 0.6}
    Z
  `;

  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  useEffect(() => {
    if (animationTrigger) {
      translateX.value = withRepeat(
        withTiming(size * 0.05, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      translateX.value = 0;
    }
  }, [animationTrigger, translateX, size]);

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            {SharedBlurFilter}
            <LinearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={color} />
              <Stop offset="100%" stopColor={DARK_BLUE} />
            </LinearGradient>
          </Defs>

          <AnimatedGroup x={DEPTH_OFFSET_X * 1.5} y={DEPTH_OFFSET_Y * 1.5} opacity={0.3} filter="url(#blurFilter)">
            <Path d={arrowPath} fill={SHADOW_COLOR} />
          </AnimatedGroup>

          <Path
            d={arrowPath}
            x={DEPTH_OFFSET_X}
            y={DEPTH_OFFSET_Y}
            fill={MEDIUM_BLUE}
          />
          <Path
            d={arrowPath}
            fill="url(#arrowGradient)"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

export default RightArrowIcon;