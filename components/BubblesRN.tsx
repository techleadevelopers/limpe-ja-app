import React, { useEffect, useMemo } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
  Easing,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type BubbleSpec = {
  key: string;
  left: number; // percentual 0..1
  size: number; // px
  duration: number; // ms
  delay: number; // ms
  horizontalOffset: number; // px amplitude for wobble
  blurRadius: number; // optional shadow blur
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

export default function BubblesRN({
  countMin = 55,
  countMax = 65,
  bubbleMin = 6,
  bubbleMax = 18,
  // cor de preenchimento por padrão transparente; borda azul por padrão
  bubbleColor = 'transparent',
  bubbleBorderColor = 'rgba(29, 93, 242, 0.18)',
  bubbleBorderWidth = 1,
  style,
  pointerEvents = 'none',
}: {
  countMin?: number;
  countMax?: number;
  bubbleMin?: number;
  bubbleMax?: number;
  bubbleColor?: string;
  bubbleBorderColor?: string;
  bubbleBorderWidth?: number;
  style?: any;
  pointerEvents?: any;
}) {
  // generate specs only once per mount
  const isAndroid = Platform.OS === 'android';
  const effectiveBubbleColor =
    isAndroid && bubbleColor === 'transparent' ? 'transparent' : bubbleColor;
  const effectiveBubbleBorderColor =
    isAndroid && bubbleBorderColor === 'rgba(29, 93, 242, 0.18)'
      ? 'rgba(255,100,100,0.9)'
      : bubbleBorderColor;
  const specs: BubbleSpec[] = useMemo(() => {
    const count = countMin + Math.floor(Math.random() * (countMax - countMin + 1));
    const arr: BubbleSpec[] = [];
    for (let i = 0; i < count; i++) {
      const size = randInt(bubbleMin, bubbleMax);
      const left = rand(0, 1);
      const duration = randInt(3500, 10000); // ms
      const delay = randInt(0, 7000);
      const horizontalOffset = rand(6, 28); // px wobble amplitude
      const blurRadius = randInt(0, 2);
      arr.push({
        key: `b-${i}-${Date.now()}`,
        left,
        size,
        duration,
        delay,
        horizontalOffset,
        blurRadius,
      });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // We'll render Animated.View for each bubble with a translateY animation (looped)
  return (
    <View style={[styles.container, style]} pointerEvents={pointerEvents}>
      {specs.map((s) => (
      <Bubble
        key={s.key}
        spec={s}
        color={effectiveBubbleColor}
        borderColor={effectiveBubbleBorderColor}
        borderWidth={bubbleBorderWidth}
      />
      ))}
    </View>
  );
}

function Bubble({
  spec,
  color,
  borderColor,
  borderWidth,
}: {
  spec: BubbleSpec;
  color: string;
  borderColor: string;
  borderWidth: number;
}) {
  const translateY = useMemo(() => new Animated.Value(0), []);
  const wobble = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    // translateY: 0 -> -screen height - size (start from bottom)
    const toValue = -(SCREEN_HEIGHT + spec.size + 40);
    const anim = Animated.sequence([
      Animated.delay(spec.delay),
      Animated.loop(
        Animated.timing(translateY, {
          toValue,
          duration: spec.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        { iterations: -1 }
      ),
    ]);
    anim.start();

    // wobble (left-right) loop
    const wob = Animated.loop(
      Animated.timing(wobble, {
        toValue: 1,
        duration: Math.max(300, Math.floor(spec.duration / 8)),
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { iterations: -1 }
    );
    wob.start();

    return () => {
      try {
        translateY.stopAnimation();
      } catch {
        /* ignored */
      }
      try {
        wobble.stopAnimation();
      } catch {
        /* ignored */
      }
    };
  }, [spec, translateY, wobble]);

  // Interpolate wobble to sinusoidal left-right movement
  const wobbleX = wobble.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, spec.horizontalOffset / 2, 0],
    extrapolate: 'clamp',
  });

  const initialLeft = spec.left * SCREEN_WIDTH - spec.size / 2;

  const animatedStyle = {
    transform: [
      { translateY: translateY },
      { translateX: wobbleX },
      // slight scale pulsation:
      { scale: wobble.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.98, 1] }) },
    ],
  } as any;

  // ✅ Android-only tuning (não altera o que já tá 100% no iOS)
  const isAndroid = Platform.OS === 'android';

  // Android costuma “pesar” a borda + sombra. Ajuste fino só no Android:
  const effectiveBorderColor = isAndroid ? 'rgba(255, 120, 130, 0.95)' : borderColor;
  const effectiveBorderWidth = isAndroid ? Math.max(1, borderWidth) : borderWidth;

  // Remover halo escuro do elevation (principal causa da bolha ficar mais escura no Android)
  const androidElevation = 0;

  // Mantém opacidade plena para evitar fundo acinzentado no Android quando o preenchimento é transparente
  const effectiveOpacity = 1;

  // Use shadow/blur for iOS/Android
  const bubbleStyle: any = {
    position: 'absolute',
    left: initialLeft,
    bottom: -spec.size - 10,
    width: spec.size,
    height: spec.size,
    borderRadius: spec.size / 2,
    backgroundColor: color,

    // 👇 apply platform-only adjustments
    borderColor: effectiveBorderColor,
    borderWidth: effectiveBorderWidth,
    opacity: effectiveOpacity,

    ...Platform.select({
      ios: {
        shadowColor: borderColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: spec.blurRadius + 1.5,
      },
      android: {
        elevation: androidElevation,
        shadowColor: 'transparent',
        shadowRadius: 0,
        shadowOpacity: 0,
      },
    }),
  };

  return <Animated.View style={[bubbleStyle, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
