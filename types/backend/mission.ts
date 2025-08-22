// LimpeJaApp/types/mission.ts
export interface Mission {
    id: string;
    name: string; // Nome/título da missão
    description: string; // Descrição da missão
    currentProgress: number; // Progresso atual do usuário na missão
    targetValue: number; // Valor alvo para completar a missão
    rewardType: 'POINTS' | 'COUPON'; // Tipo de recompensa
    rewardValue: number; // Valor da recompensa
    status: 'ACTIVE' | 'COMPLETED' | 'CLAIMED'; // Status da missão para o usuário
}