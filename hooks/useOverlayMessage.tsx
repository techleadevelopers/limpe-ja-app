// app/hooks/useOverlayMessage.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import i18n from '../i18n';
import OverlayMessage from '../components/ui/OverlayMessage';

type Variant = 'success' | 'info' | 'warning' | 'error';

type Item = {
  id: string;
  title: string; // title já traduzido/normalizado como string
  subtitle?: string; // subtitle traduzido/normalizado como string | undefined
  variant: Variant;
  iconName?: any;
  durationMs?: number;
};

type ShowOverlayOpts = {
  titleKey?: string;
  subtitleKey?: string;
  variant?: Variant;
  iconName?: any;
  durationMs?: number;
  title?: string;
  subtitle?: string;
};

const listeners = new Set<(item: Item | null) => void>();

function normalizeText(value?: string) {
  if (typeof value === 'string') {
    return value;
  }
  return '';
}

export function showOverlay(opts: ShowOverlayOpts) {
  // traduzir se keys foram enviadas
  let title = opts.title ?? (opts.titleKey ? i18n.t(opts.titleKey) : '');
  let subtitle = opts.subtitle ?? (opts.subtitleKey ? i18n.t(opts.subtitleKey) : '');

  title = normalizeText(title);
  subtitle = normalizeText(subtitle);

  const payload: Item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    subtitle: subtitle || undefined,
    variant: opts.variant ?? 'info',
    iconName: opts.iconName,
    durationMs: opts.durationMs ?? 2600,
  };

  // Dedupe simples por título em 3s (não reenvia se igual)
  const now = Date.now();
  if ((global as any).__overlay_last) {
    const last = (global as any).__overlay_last as { time: number; title: string };
    if (now - last.time < 3000 && last.title === payload.title) {
      return;
    }
  }
  (global as any).__overlay_last = { time: now, title: payload.title };

  listeners.forEach((fn) => fn(payload));
}

export function useOverlayMessage() {
  return { showOverlay };
}

export const OverlayPortal: React.FC = () => {
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    const handler = (it: Item | null) => setItem(it);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const onHide = useCallback(() => setItem(null), []);

  return (
    <OverlayMessage
      visible={!!item}
      title={item?.title ?? ''}
      subtitle={item?.subtitle}
      variant={item?.variant ?? 'info'}
      iconName={item?.iconName}
      onHide={onHide}
      durationMs={item?.durationMs}
    />
  );
};