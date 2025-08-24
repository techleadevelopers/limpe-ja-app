import React, { createContext, useContext } from 'react';
import type { MotionTokens } from './tokens';

export type MotionContextValue = {
  tokens: MotionTokens;
  prefersReducedMotion: boolean;
};

export const MotionContext = createContext<MotionContextValue | null>(null);

export function useMotion() {
  const ctx = useContext(MotionContext);
  if (!ctx) {
    throw new Error('useMotion deve ser usado dentro de <MotionProvider>');
  }
  return ctx;
}
