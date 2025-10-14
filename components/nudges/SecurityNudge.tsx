import React from 'react';
import { useRouter } from 'expo-router';
import SmartNudge from './SmartNudge';

type Props = {
  delayMs?: number;
  throttleHours?: number;
  showOnRoutes?: string[];
  bottomOffset?: number;
  message?: string;
  actionLabel?: string;
  /** Propaga pointerEvents ao container para não bloquear interações subjacentes */
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
};

const SecurityNudge: React.FC<Props> = ({
  delayMs = 3500,
  throttleHours = 24,
  showOnRoutes = ['/(client)/explore'],
  bottomOffset = 20,
  message = 'Ative o SOS e configure contatos de confiança para maior segurança.',
  actionLabel = 'Ver segurança',
  pointerEvents = 'box-none',
}) => {
  const router = useRouter();

  return (
    <SmartNudge
      namespace="security"
      id="secure_sos_setup"
      title="Segurança primeiro"
      message={message}
      actionLabel={actionLabel}
      onAction={() => router.push('/(common)/safety' as any)}
      delayMs={delayMs}
      throttleHours={throttleHours}
      showOnRoutes={showOnRoutes}
      bottomOffset={bottomOffset}
      icon="shield-checkmark-outline"
      color="#FFB020"
      pointerEvents={pointerEvents}
    />
  );
};

export default SecurityNudge;
