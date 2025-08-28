import React from 'react';
import { useRouter } from 'expo-router';
import SmartNudge from './SmartNudge';

type Props = {
  delayMs?: number;
  throttleHours?: number;
  showOnRoutes?: string[];
  bottomOffset?: number;
  points?: number; // pontos prometidos
  actionLabel?: string;
};

const IncentiveNudge: React.FC<Props> = ({
  delayMs = 5000,
  throttleHours = 24,
  showOnRoutes = ['/(client)/explore'],
  bottomOffset = 84, // aparece “um degrau” acima do de segurança, se ambos estiverem na mesma tela
  points = 50,
  actionLabel = 'Ver missões',
}) => {
  const router = useRouter();

  return (
    <SmartNudge
      namespace="incentive"
      id="finish_first_service_points"
      title="Ganhe pontos"
      message={`Conclua seu próximo serviço e ganhe +${points} pts para trocar por cupons.`}
      actionLabel={actionLabel}
      onAction={() => router.push('/(client)/missions' as any)}
      delayMs={delayMs}
      throttleHours={throttleHours}
      showOnRoutes={showOnRoutes}
      bottomOffset={bottomOffset}
      icon="trophy-outline"
      color="#6C5CE7"
    />
  );
};

export default IncentiveNudge;
