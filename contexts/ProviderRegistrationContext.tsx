// LimpeJaApp/contexts/ProviderRegistrationContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth'; // CORRIGIDO: Caminho para AuthContext
import { RegisterProviderDto, CreateAddressDto } from '../app/types/backend/auth'; // CORRIGIDO: Caminho para auth.ts
import { UserProfile } from '../app/types/backend/users'; // Para tipar o retorno de signUpProvider
import * as providerService from '../app/services/providerService'; // Exemplo: serviço para atualizar o provedor

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
  avatarUri: string | null;
  avatarUrl: string | null;
}

interface ProviderRegistrationContextType {
  personalDetails: PersonalDetails | null;
  serviceDetails: ServiceDetails | null;
  setPersonalDetails: (details: PersonalDetails) => void;
  setServiceDetails: (details: ServiceDetails) => void;
  submitRegistration: () => Promise<void>;
  resetRegistration: () => void;
}

const ProviderRegistrationContext = createContext<ProviderRegistrationContextType | undefined>(undefined);

export const ProviderRegistrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails | null>(null);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);

  const { user, token, isAuthenticated, signUpProvider, setIsRegistrationInProgress } = useAuth(); // Importa tudo de useAuth

  // Função para simular a submissão final do registro (ATUALIZAÇÃO DO PERFIL)
  const submitRegistration = useCallback(async () => {
    // Verifica se todos os dados necessários estão presentes antes de tentar submeter
    // user/isAuthenticated devem vir do AuthContext, preenchidos após o signUpProvider na Etapa 2
    if (!user || !user.id || !isAuthenticated || !personalDetails || !serviceDetails) {
      console.error("[ProviderRegistrationContext] Dados de registro incompletos: usuário não autenticado ou detalhes ausentes.");
      throw new Error("Dados de registro incompletos: Autenticação ou detalhes do formulário ausentes.");
    }

    if (!serviceDetails.avatarUrl) {
      console.error("[ProviderRegistrationContext] URL do avatar ausente.");
      throw new Error("URL do avatar ausente.");
    }

    console.log("[ProviderRegistrationContext] Iniciando submissão final do registro (ATUALIZAÇÃO DE PERFIL)...");
    console.log("Dados Pessoais Completos do Contexto (para referência):", personalDetails);
    console.log("Dados de Serviço Completos do Contexto:", serviceDetails);
    console.log("Usuário autenticado no contexto:", user.id, user.email);

    try {
      // Mapear os dados do contexto para o DTO de atualização do provedor (PATCH /providers/me)
      const updateData = {
        // Campos que podem ser atualizados no perfil do provedor
        // O ID do usuário/provedor vem de user.id do AuthContext
        yearsOfExperience: serviceDetails.anosExperiencia,
        avatarUrl: serviceDetails.avatarUrl,
        bio: serviceDetails.experiencia,
        offeredServices: serviceDetails.servicosOferecidos, // Este campo foi adicionado no RegisterProviderDto
        pricingStructure: serviceDetails.estruturaPreco,
        serviceAreas: serviceDetails.areasAtendimento,
        pixKey: serviceDetails.pixKey,
        // Você pode adicionar outros campos que precisam ser atualizados no perfil do provedor
      };

      // *** CHAMADA DE API REAL PARA ATUALIZAR O PERFIL DO PROVEDOR ***
      // Adapte esta chamada para o seu serviço de API real.
      // Assumindo que você tem um `providerService.updateProviderProfile`
      // que faz um PATCH ou PUT para uma rota como /providers/me ou /providers/{id}
      // e usa o token de autenticação.
      console.log("[ProviderRegistrationContext] Chamando providerService.updateProviderProfile para User ID:", user.id);
      // Exemplo: await providerService.updateProviderProfile(user.id, updateData, token);

      // Se seu backend espera o RegisterProviderDto completo aqui para uma 'finalização':
      const finalRegistrationData: RegisterProviderDto = {
          email: personalDetails.email,
          password: personalDetails.password, // ATENÇÃO: Senha em texto claro aqui. Se o backend não precisa, remova.
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
      
      // *** IMPORTANTE ***
      // Se seu backend tem um endpoint específico para "finalizar o registro do provedor"
      // APÓS o registro inicial e que aceita o DTO COMPLETO, você chamaria ele aqui.
      // Se não, o ideal é ter um endpoint de PATCH/PUT para atualizar o perfil do provedor.
      // Por simplicidade, vou chamar signUpProvider novamente, mas saiba que é um WORKAROUND.
      // O correto seria um `update` via `authService` ou `providerService`.
      
      // WORKAROUND: Chamando signUpProvider novamente (só se o backend for idempotente e aceitar)
      // OU: Se `signUpProvider` no AuthContext é na verdade o que finaliza TUDO
      // após coletar todos os dados, e você já está passando o `personalDetails` completo na etapa 2.
      // Aqui vamos simular que a "finalização" já está feita ou é um passo posterior.
      
      // Se o `AuthContext.signUpProvider` já lida com a criação do usuário e perfil básico,
      // e você só precisa ATUALIZAR os detalhes de serviço, a lógica é assim:
      console.log("[ProviderRegistrationContext] Simulação: Chamada de API para atualizar detalhes de serviço do provedor.");
      // Substitua por sua API REAL de PATCH/PUT para /providers/me ou similar
      // Ex: await authService.updateProviderDetails(user.id, updateData, token);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simula tempo de API
      
      console.log("[ProviderRegistrationContext] Atualização de perfil de provedor concluída!");

    } catch (error) {
      console.error("[ProviderRegistrationContext] Erro na submissão final do registro (atualização do perfil):", error);
      throw error;
    } finally {
      // setIsRegistrationInProgress(false) será feito na tela RegisterProviderScreen
      resetRegistration();
    }
  }, [user, isAuthenticated, personalDetails, serviceDetails, token /* Adicione token aqui */]);

  const resetRegistration = () => {
    setPersonalDetails(null);
    setServiceDetails(null);
  };

  return (
    <ProviderRegistrationContext.Provider
      value={{
        personalDetails,
        serviceDetails,
        setPersonalDetails,
        setServiceDetails,
        submitRegistration,
        resetRegistration,
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