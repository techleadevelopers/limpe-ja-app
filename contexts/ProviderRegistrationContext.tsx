// LimpeJaApp/contexts/ProviderRegistrationContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Alert } from 'react-native';
// import { useAuth } from '../hooks/useAuth'; // REMOVIDO: Não desestruturar useAuth aqui
import { RegisterProviderDto, CreateAddressDto } from '../app/types/backend/auth'; // CORRIGIDO: Caminho para auth.ts
// import { UserProfile } from '../app/types/backend/users'; // REMOVIDO: UserProfile não é usado diretamente aqui
// import * as providerService from '../app/services/providerService'; // Exemplo: serviço para atualizar o provedor

// Tipos para os dados do formulário do provedor
interface PersonalDetails {
  email: string;
  password: string; // Senha em texto simples
  fullName: string;
  cpf: string;
  dateOfBirth: string; // Formato AAAA-MM-DD
  phone: string;
  address: CreateAddressDto;
}

interface ServiceDetails {
  experiencia: string;
  servicosOferecidos: string;
  estruturaPreco: string;
  areasAtendimento: string;
  anosExperiencia: number;
  pixKey: string;
  avatarUri: string | null; // URI local da imagem
  avatarUrl: string | null; // URL da imagem no servidor
}

interface ProviderRegistrationContextType {
  personalDetails: PersonalDetails | null;
  serviceDetails: ServiceDetails | null;
  setPersonalDetails: (details: PersonalDetails) => void;
  setServiceDetails: (details: ServiceDetails) => void;
  submitRegistration: () => Promise<void>;
  resetRegistration: () => void;
  isRegistrationInProgress: boolean; // ADICIONADO: Estado para o fluxo de registro
  setIsRegistrationInProgress: (inProgress: boolean) => void; // ADICIONADO: Setter para o estado
}

const ProviderRegistrationContext = createContext<ProviderRegistrationContextType | undefined>(undefined);

export const ProviderRegistrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails | null>(null);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
  const [isRegistrationInProgress, setIsRegistrationInProgress] = useState<boolean>(false); // Inicializa como falso

  // A lógica de submissão final deve ser feita em um serviço ou na tela final,
  // e não depender diretamente do `useAuth` aqui, para manter a separação de responsabilidades.
  // A função `submitRegistration` apenas prepara os dados e sinaliza que o registro está em progresso.
  // A chamada real para o backend (ex: `authService.registerProvider`) deve ocorrer na tela final do fluxo.

  const submitRegistration = useCallback(async () => {
    // Esta função agora apenas sinaliza o início do processo e coleta os dados.
    // A chamada real para o backend (authService.registerProvider) deve ser feita
    // na tela final do fluxo de registro, onde todos os dados estão disponíveis
    // e o `setIsRegistrationInProgress(false)` será chamado após o sucesso/falha.

    if (!personalDetails || !serviceDetails) {
      console.error("[ProviderRegistrationContext] Dados de registro incompletos para submissão final.");
      throw new Error("Dados de registro incompletos.");
    }

    // Aqui você pode consolidar os dados para o DTO final, mas não fazer a chamada de API ainda.
    // A chamada de API será feita na tela que orquestra o registro completo.
    const finalRegistrationData: RegisterProviderDto = {
      email: personalDetails.email,
      password: personalDetails.password,
      fullName: personalDetails.fullName,
      cpf: personalDetails.cpf,
      dateOfBirth: personalDetails.dateOfBirth,
      phone: personalDetails.phone,
      address: personalDetails.address,
      yearsOfExperience: serviceDetails.anosExperiencia,
      avatarUrl: serviceDetails.avatarUrl,
      bio: serviceDetails.experiencia,
      offeredServices: serviceDetails.servicosOferecidos,
      pricingStructure: serviceDetails.estruturaPreco,
      serviceAreas: serviceDetails.areasAtendimento,
      pixKey: serviceDetails.pixKey,
    };

    console.log("[ProviderRegistrationContext] Dados finais do registro consolidados. Pronto para enviar na tela final.");
    // Não faz a chamada de API aqui, apenas prepara os dados.
    // A tela final do registro (ex: RegisterProviderScreenStep3 ou similar)
    // será responsável por chamar `authService.registerProvider(finalRegistrationData)`
    // e então chamar `setIsRegistrationInProgress(false)` e `resetRegistration()`.

    // Por enquanto, apenas para simular o "sucesso" da coleta de dados.
    // setIsRegistrationInProgress(true); // Isso deve ser chamado na tela que inicia o fluxo de registro
    // e setado para false após a conclusão da chamada de API.
    await new Promise(resolve => setTimeout(resolve, 500)); // Simula um pequeno atraso
    console.log("[ProviderRegistrationContext] Simulação: Dados de registro coletados com sucesso.");

  }, [personalDetails, serviceDetails]);

  const resetRegistration = useCallback(() => {
    setPersonalDetails(null);
    setServiceDetails(null);
    setIsRegistrationInProgress(false); // Reseta o estado de progresso também
  }, []);

  return (
    <ProviderRegistrationContext.Provider
      value={{
        personalDetails,
        serviceDetails,
        setPersonalDetails,
        setServiceDetails,
        submitRegistration,
        resetRegistration,
        isRegistrationInProgress,
        setIsRegistrationInProgress,
      }}
    >
      {children}
    </ProviderRegistrationContext.Provider>
  );
};

export const useProviderRegistration = () => {
  const context = useContext(ProviderRegistrationContext);
  if (context === undefined) {
    throw new Error('useProviderRegistration must be used within a ProviderRegistrationProvider');
  }
  return context;
};