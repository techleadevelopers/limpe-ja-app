// LimpeJaApp/contexts/ProviderRegistrationContext.tsx
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { CreateAddressDto, RegisterProviderDto } from '../types/backend/auth';

import { updateMyProviderProfile } from '../services/providerService';
import uploadService from '../services/uploadService';

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
  // MODIFICAÇÃO AQUI: submitRegistration agora aceita serviceDetails como argumento
  submitRegistration: (currentServiceDetails: ServiceDetails) => Promise<void>;
  resetRegistration: () => void;
  isRegistrationInProgress: boolean;
  setIsRegistrationInProgress: (inProgress: boolean) => void;
}

const ProviderRegistrationContext = createContext<ProviderRegistrationContextType | undefined>(undefined);

export const ProviderRegistrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails | null>(null);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
  const [isRegistrationInProgress, setIsRegistrationInProgress] = useState<boolean>(false);

  // MODIFICAÇÃO AQUI: submitRegistration agora aceita currentServiceDetails como argumento
  const submitRegistration = useCallback(async (currentServiceDetails: ServiceDetails) => {
    if (!personalDetails) {
      console.error("[ProviderRegistrationContext] Dados pessoais incompletos para submissão final.");
      throw new Error("Dados pessoais incompletos. Por favor, complete as etapas anteriores.");
    }

    // O serviceDetails no estado do contexto pode estar desatualizado devido ao "stale closure",
    // então usamos o `currentServiceDetails` passado como argumento.
    // No entanto, para o `personalDetails`, ainda dependemos do estado do contexto,
    // pois ele é definido em uma etapa anterior e não é a fonte do "stale closure" aqui.

    // Prepara o DTO para a chamada PATCH /providers/me
    // Real: se houver avatarUri local, faz upload primeiro para obter URL
    let avatarUrl: string | null = currentServiceDetails.avatarUrl;
    if (currentServiceDetails.avatarUri && currentServiceDetails.avatarUri.startsWith('file://')) {
      try {
        const upload = await uploadService.uploadImageToCloud(currentServiceDetails.avatarUri, 'avatar');
        avatarUrl = upload.url;
      } catch (e: any) {
        console.error('[ProviderRegistrationContext] Falha ao fazer upload do avatar durante submitRegistration:', e?.message || e);
        throw new Error('Falha ao enviar foto de perfil.');
      }
    }

    const updateProviderProfilePayload = {
      fullName: personalDetails.fullName, // Assumindo que fullName pode ser atualizado aqui
      phone: personalDetails.phone,
      cpf: personalDetails.cpf,
      dateOfBirth: personalDetails.dateOfBirth,
      yearsOfExperience: currentServiceDetails.anosExperiencia,
      avatarUrl: avatarUrl, // usar URL final
      bio: currentServiceDetails.experiencia, // Mapeando experiencia para bio
      pixKey: currentServiceDetails.pixKey,
      // Se houver campos para offeredServices, pricingStructure, serviceAreas no DTO de atualização,
      // você precisaria incluí-los e mapeá-los corretamente.
      // A documentação do backend mostra que 'bio' e 'pixKey' estão no UpdateProviderProfileDto.
      // offeredServices, pricingStructure, serviceAreas podem precisar de endpoints separados ou serem parte de um DTO mais complexo.
      // Para este exemplo, vamos focar nos campos que você mencionou no `index.tsx` para `currentServiceDetails`.
    };

    setIsRegistrationInProgress(true); // Sinaliza que o processo de submissão está em andamento

    try {
      await updateMyProviderProfile(updateProviderProfilePayload as any);

      // O `setServiceDetails` do contexto ainda é útil para manter o estado global atualizado
      // para outras partes do aplicativo que possam depender dele.
      setServiceDetails(currentServiceDetails);

    } catch (error: any) {
      console.error("[ProviderRegistrationContext] Erro ao submeter perfil do provedor:", error);
      throw new Error(error.message || "Falha ao atualizar o perfil do provedor.");
    } finally {
      setIsRegistrationInProgress(false); // Finaliza o processo de submissão
    }
  }, [personalDetails]); // personalDetails ainda é uma dependência do useCallback

  const resetRegistration = useCallback(() => {
    setPersonalDetails(null);
    setServiceDetails(null);
    setIsRegistrationInProgress(false);
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
