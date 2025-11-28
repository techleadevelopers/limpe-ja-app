import React from 'react';
import SmartNudge from '../nudges/SmartNudge'; // Verify path is correct for SmartNudge

// This component will house all nudges for providers
const ProviderNudgeContainer = () => {
  // Esta função agora é um handler genérico para nudges de provedor.
  // O 'code' será passado para ela apenas se o SmartNudge for configurado para isso,
  // ou se a lógica interna do SmartNudge for modificada para expor o 'code'.
  // Para este caso, vamos assumir que o 'code' é o 'code' da prop do SmartNudge.
  const handleApplyMissionCoupon = (code: string) => {
    // Logic to navigate or apply mission-related coupons
    // Exemplo: router.push('/(provider)/missions');
  };

  return (
    <>
      {/* Example Nudge for Providers */}
      <SmartNudge
        namespace="provider_mission" // <-- NAMESPACE CORRIGIDO
        id="mission_almost_complete"
        // Se o SmartNudge precisar passar um 'code' para onAction, ele precisaria ter uma prop 'code'
        // e onAction receberia esse 'code'. Como a onAction atual do SmartNudge não passa argumentos,
        // o 'code' deve ser capturado do escopo.
        code="META10" // Esta prop 'code' é para exibição dentro do SmartNudge
        title="Missão Quase Completa!"
        message="Faltam 2 serviços para sua recompensa."
        delayMs={4000}
        throttleHours={48}
        showOnRoutes={['/(provider)/dashboard', '/(provider)/earnings']}
        bottomOffset={90} // Positioned above the provider's nav bar
        onAction={() => handleApplyMissionCoupon("META10")} // <-- onAction CORRIGIDO: Agora é uma função sem argumentos que chama handleApplyMissionCoupon com o código específico.
        icon="trophy-outline"
        color="#6C5CE7"
        actionLabel="Aplicar Cupom" // <-- ADICIONADO: Propriedade actionLabel é obrigatória
      />
      {/* Add other provider-specific nudges here */}
    </>
  );
};

export default ProviderNudgeContainer;
