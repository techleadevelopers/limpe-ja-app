import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icons3D, Icon3DKey } from '../../constants/icons3d';

type Props = {
  name: Icon3DKey;
  size?: number;          // default 28
  onPress?: () => void;
  testID?: string;
};

export default function Icon3D({ name, size = 28, onPress, testID }: Props) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.96, friction: 4, useNativeDriver: true }).start();

  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start();

  const pressable = !!onPress;

  const Img = (
    <Animated.Image
      testID={testID}
      source={Icons3D[name]}
      style={{ width: size, height: size, transform: [{ scale }], opacity }}
      resizeMode="contain"
    />
  );

  if (!pressable) return Img;

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={8}
    >
      {Img}
    </Pressable>
  );
}
