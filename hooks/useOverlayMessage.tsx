// app/hooks/useOverlayMessage.tsx
import React, { useCallback, useEffect, useState } from 'react';
import i18n from '../i18n';
import OverlayMessage from '../components/ui/OverlayMessage';

type Variant = 'success' | 'info' | 'warning' | 'error';
type OverlayPlacement = 'top' | 'center';
type OverlayTone = 'default' | 'soft';

type Item = {
  id: string;
  title: string; // title já traduzido/normalizado como string
  subtitle?: string; // subtitle traduzido/normalizado como string | undefined
  variant: Variant;
  iconName?: any;
  durationMs?: number;
  placement?: OverlayPlacement;
  tone?: OverlayTone;
  imageSource?: any;
  imageSize?: number;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
};

type ShowOverlayOpts = {
  titleKey?: string;
  subtitleKey?: string;
  variant?: Variant;
  iconName?: any;
  durationMs?: number;
  title?: string;
  subtitle?: string;
  placement?: OverlayPlacement;
  tone?: OverlayTone;
  imageSource?: any;
  imageSize?: number;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
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
    placement: opts.placement,
    tone: opts.tone,
    imageSource: opts.imageSource,
    imageSize: opts.imageSize,
    primaryActionLabel: opts.primaryActionLabel,
    onPrimaryAction: opts.onPrimaryAction,
  };

  // Dedupe simples por título em 3s (não reenvia se igual)
  const now = Date.now();
  const key = `${payload.title}|${payload.subtitle ?? ''}|${payload.variant}`;
  if ((global as any).__overlay_last) {
    const last = (global as any).__overlay_last as { time: number; key: string };
    if (now - last.time < 3000 && last.key === key) {
      return;
    }
  }
  (global as any).__overlay_last = { time: now, key };

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
      placement={item?.placement}
      tone={item?.tone}
      imageSource={item?.imageSource}
      imageSize={item?.imageSize}
      primaryActionLabel={item?.primaryActionLabel}
      onPrimaryAction={item?.onPrimaryAction}
    />
  );
};

