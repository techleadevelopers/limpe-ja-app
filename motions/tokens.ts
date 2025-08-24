// path: motions/tokens.ts  (ajuste para src/motion/tokens.ts se esse for o seu path real)

import { Easing, EasingFunction } from 'react-native';

/** DURAÇÕES */
export type DurationTokens = {
  xs: number; // micro-interactions (icon hover)
  sm: number; // small elements (chips, badges)
  md: number; // standard UI (cards, sections)
  lg: number; // modals, page transitions
  xl: number; // emphasized / celebratory
};

/** ATRASOS (stagger/steps) */
export type DelayTokens = {
  none: number;
  xs: number; // stagger base
  sm: number; // list item step
  md: number; // section step
};

/** DISTÂNCIAS (offsets) */
export type DistanceTokens = {
  x: { sm: number; md: number; lg: number };
  y: { sm: number; md: number; lg: number };
  scale: { tap: number; hover: number };
};

/** EASINGS */
export type EasingTokens = {
  standard: EasingFunction;   // general-purpose
  decel: EasingFunction;      // entering elements
  accel: EasingFunction;      // exiting elements
  emphasized: EasingFunction; // emphasized motion (bouncy)
};

/** PACOTE DE TOKENS */
export type MotionTokens = {
  duration: DurationTokens;
  delay: DelayTokens;
  distance: DistanceTokens;
  easing: EasingTokens;
};

/** DEFAULTS RECOMENDADOS */
export const defaultMotionTokens: MotionTokens = {
  duration: {
    xs: 120,
    sm: 180,
    md: 250,
    lg: 380,
    xl: 520,
  },
  delay: {
    none: 0,
    xs: 60,
    sm: 90,
    md: 120,
  },
  distance: {
    x: { sm: 8, md: 16, lg: 24 },
    y: { sm: 8, md: 16, lg: 24 },
    scale: { tap: 0.96, hover: 0.98 },
  },
  easing: {
    // material-ish curves
    standard: Easing.bezier(0.2, 0, 0, 1),
    decel: Easing.bezier(0, 0, 0.2, 1),
    accel: Easing.bezier(0.4, 0, 1, 1),
    emphasized: Easing.bezier(0.2, 0.8, 0.2, 1),
  },
};

export default defaultMotionTokens;
