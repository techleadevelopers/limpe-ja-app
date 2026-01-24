// app/components/Bubble.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface BubbleProps {
  size: number;
  initialX: number;
  initialY: number;
  animationDelay: number;
  animationDuration: number;
  color1: string;
  color2: string;
  motionOffset: number;
  yOffsetAmplitude: number;
}

const randomRange = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

export default function Bubble({
  size,
  initialX,
  initialY,
  animationDelay,
  animationDuration,
  color1,
  color2,
  motionOffset,
  yOffsetAmplitude,
}: BubbleProps) {
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const shadowOpacityAnim = useSharedValue(0.3);

  // Separate shared value for vertical wobble
  const wobbleY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(animationDelay, withTiming(1, { duration: 1000 }));

    scale.value = withDelay(
      animationDelay,
      withRepeat(
        withTiming(1, { duration: animationDuration / 4, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );

    shadowOpacityAnim.value = withDelay(
      animationDelay,
      withRepeat(
        withTiming(0.7, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );

    // --- Complex movement animation for X and Y separately ---
    const generateRandomXMovementSequence = (
      currentX: number,
      totalDuration: number
    ) => {
      const movements = [];
      const numSegments = Math.floor(totalDuration / 1000);
      let currentOffsetX = 0;

      for (let i = 0; i < numSegments; i++) {
        const dx = randomRange(-motionOffset, motionOffset);
        const segmentDuration = randomRange(800, 1500);

        currentOffsetX += dx;
        currentOffsetX = Math.max(-width / 2, Math.min(width / 2, currentOffsetX)); // Keep somewhat within bounds

        movements.push(
          withTiming(
            initialX + currentOffsetX, // Only return the x value
            { duration: segmentDuration, easing: Easing.inOut(Easing.ease) }
          )
        );
      }
      return withSequence(...movements);
    };

    const generateRandomYMovementSequence = (
      currentY: number,
      totalDuration: number
    ) => {
      const movements = [];
      const numSegments = Math.floor(totalDuration / 1000);
      let currentOffsetY = 0;

      for (let i = 0; i < numSegments; i++) {
        const dy = randomRange(-motionOffset, motionOffset);
        const segmentDuration = randomRange(800, 1500);

        currentOffsetY += dy;
        currentOffsetY = Math.max(-height / 2, Math.min(height / 2, currentOffsetY)); // Keep somewhat within bounds

        movements.push(
          withTiming(
            initialY + currentOffsetY, // Only return the y value
            { duration: segmentDuration, easing: Easing.inOut(Easing.ease) }
          )
        );
      }
      return withSequence(...movements);
    };

    translateX.value = withDelay(
      animationDelay,
      withRepeat(
        generateRandomXMovementSequence(initialX, animationDuration),
        -1,
        false
      )
    );

    translateY.value = withDelay(
      animationDelay,
      withRepeat(
        generateRandomYMovementSequence(initialY, animationDuration),
        -1,
        false
      )
    );

    // Vertical wobble animation
    wobbleY.value = withDelay(
      animationDelay,
      withRepeat(
        withTiming(yOffsetAmplitude, {
          duration: animationDuration / 8,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    );

  }, [
    initialX,
    initialY,
    animationDelay,
    animationDuration,
    motionOffset,
    yOffsetAmplitude,
    scale,
    opacity,
    translateX,
    translateY,
    shadowOpacityAnim,
    wobbleY,
  ]);

  const animatedBubbleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value + wobbleY.value }, // Apply wobble here
      { scale: scale.value },
    ],
    opacity: opacity.value,
    shadowOpacity: shadowOpacityAnim.value,
  }));

  const bubbleGradientColors = [color1, color2] as const;

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          shadowColor: color1,
        },
        animatedBubbleStyle,
      ]}
    >
      <LinearGradient
        colors={bubbleGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bubbleGradient}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    elevation: 0,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  bubbleGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.8)',
  },
});
