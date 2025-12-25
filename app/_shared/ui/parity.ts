import {
  Platform,
  PressableProps,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native';

type ShadowLevel = 0 | 1 | 2 | 3 | 4;
const isAndroid = Platform.OS === 'android';

const shadowPresets: Record<ShadowLevel, { ios: ViewStyle; android: ViewStyle }> = {
  0: { ios: {}, android: { elevation: 0 } },
  1: {
    ios: { shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
    android: { elevation: 0, shadowColor: 'rgba(0, 0, 0, 0.25)' },
  },
  2: {
    ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } },
    android: { elevation: 0, shadowColor: 'rgba(0, 0, 0, 0.28)' },
  },
  3: {
    ios: { shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 6 } },
    android: { elevation: 0, shadowColor: 'rgba(0, 0, 0, 0.32)' },
  },
  4: {
    ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 10 } },
    android: { elevation: 0, shadowColor: 'rgba(0, 0, 0, 0.36)' },
  },
};

export const shadow = (level: ShadowLevel = 1): ViewStyle =>
  isAndroid ? shadowPresets[level].android : shadowPresets[level].ios;

/**
 * Android text parity: remove font padding and normalize line-height/spacing.
 * iOS is the "truth", Android gets adjusted to match.
 */
export const textBase = (overrides: TextStyle = {}): TextStyle => {
  if (!isAndroid) return overrides;

  const base: TextStyle = {
    includeFontPadding: false,
    letterSpacing: overrides.letterSpacing ?? 0.1,
  };

  // If caller didn't set lineHeight, derive a stable one from fontSize.
  if (!overrides.lineHeight && overrides.fontSize) {
    base.lineHeight = Math.round(overrides.fontSize * 1.25);
  }

  return { ...base, ...overrides };
};

/**
 * Android input parity: center text vertically and remove extra padding.
 */
export const inputBase = (): TextStyle =>
  isAndroid
    ? { textAlignVertical: 'center', paddingVertical: 0, includeFontPadding: false }
    : {};

/**
 * Aliases for older call sites (do NOT change UI; just keep compilation stable).
 * Some screens imported textFix/inputFix previously.
 */
export const textFix = textBase;
export const inputFix = inputBase;

export interface PressableParity {
  style?: ViewStyle;
  androidRipple?: PressableProps['android_ripple'];
}

export const pressableBase = (): PressableParity => ({
  style: isAndroid ? { overflow: 'hidden' } : undefined,
  androidRipple: isAndroid ? { color: 'rgba(15, 23, 42, 0.08)', borderless: false } : undefined,
});

// Alias to keep older imports working
export const pressableFix = pressableBase;

/**
 * Merge StyleProp safely (pragmatic typing).
 * Behavior is identical to flatten; this just avoids TS generic headaches.
 */
export const mergeStyles = <T extends ViewStyle | TextStyle>(
  ...styles: Array<StyleProp<T> | undefined>
): StyleProp<T> | undefined => {
  const normalized = styles.filter(Boolean) as Array<StyleProp<T>>;
  if (!normalized.length) return undefined;

  // StyleSheet.flatten returns ViewStyle | TextStyle | number | (array), TS typing is loose.
  // We cast to keep call sites simple and stable.
  return StyleSheet.flatten(normalized) as unknown as StyleProp<T>;
};
