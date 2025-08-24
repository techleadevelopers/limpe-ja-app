import React, { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { MotionContext } from '../context';
import { defaultMotionTokens, MotionTokens } from '../tokens';

export type MotionProviderProps = {
  children: React.ReactNode;
  overrideTokens?: Partial<MotionTokens>;
};

export function MotionProvider({ children, overrideTokens }: MotionProviderProps) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((v: boolean) => {
        if (mounted) setReduced(Boolean(v));
      })
      .catch(() => { /* silencioso */ });

    // RN 0.65+ retorna um subscription com .remove()
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => {
      setReduced(Boolean(v));
    });

    return () => {
      mounted = false;
      // compatibilidade de versões (sub?.remove em versões antigas)
      if (sub && typeof (sub as any).remove === 'function') {
        (sub as any).remove();
      }
      // fallback RN antigos
      // @ts-ignore - compat API antiga
      else if (AccessibilityInfo.removeEventListener) {
        // @ts-ignore
        AccessibilityInfo.removeEventListener('reduceMotionChanged', setReduced);
      }
    };
  }, []);

  const mergedTokens: MotionTokens = useMemo(() => {
    // base clonado (para não mutar default)
    const base: MotionTokens = JSON.parse(JSON.stringify(defaultMotionTokens));

    if (reduced) {
      base.duration = { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 };
      base.delay = { none: 0, xs: 0, sm: 0, md: 0 };
      base.distance = {
        x: { sm: 0, md: 0, lg: 0 },
        y: { sm: 0, md: 0, lg: 0 },
        scale: { tap: 1, hover: 1 },
      };
    }

    // merge raso e por seções (override opcional)
    const o = overrideTokens ?? {};
    return {
      ...base,
      duration: { ...base.duration, ...(o.duration || {}) },
      delay: { ...base.delay, ...(o.delay || {}) },
      distance: {
        x: { ...base.distance.x, ...(o.distance?.x || {}) },
        y: { ...base.distance.y, ...(o.distance?.y || {}) },
        scale: { ...base.distance.scale, ...(o.distance?.scale || {}) },
      },
      easing: { ...base.easing, ...(o.easing || {}) },
    };
  }, [overrideTokens, reduced]);

  const value = useMemo(
    () => ({ tokens: mergedTokens, prefersReducedMotion: reduced }),
    [mergedTokens, reduced]
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

// reexport opcional do hook (se preferir importar daqui)
export { useMotion } from '../context';
