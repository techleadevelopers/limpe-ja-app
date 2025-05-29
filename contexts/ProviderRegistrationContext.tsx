// LimpeJaApp/app/(auth)/provider-register/ProviderRegistrationContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert } from 'react-native'; // Importar Alert para feedback ao usuário

// Tipos para os dados do formulário do provedor
// Define a estrutura dos dados pessoais do profissional
interface PersonalDetails {
  nomeCompleto: string;
  cpf: string;
  dataNascimento: string; // Formato YYYY-MM-DD para fácil armazenamento e comparação
  telefone: string;
  endereco: { // Objeto aninhado para detalhes do endereço
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
}

// Define a estrutura dos detalhes de serviço do profissional
interface ServiceDetails {
  experiencia: string;
  servicosOferecidos: string;
  estruturaPreco: string;
  areasAtendimento: string;
  anosExperiencia: number;
  avatarUri: string | null; // URI local da imagem selecionada pelo usuário
  avatarUrl: string | null; // URL da imagem após o upload para o Firebase Storage (preenchido no submit)
}

// Define a interface para o valor do contexto
interface ProviderRegistrationContextType {
  personalDetails: PersonalDetails | null; // Dados pessoais do profissional
  serviceDetails: ServiceDetails | null; // Detalhes de serviço do profissional
  setPersonalDetails: (details: PersonalDetails) => void; // Função para atualizar dados pessoais
  setServiceDetails: (details: ServiceDetails) => void; // Função para atualizar detalhes de serviço
  submitRegistration: () => Promise<void>; // Função para simular o envio final dos dados para o backend
  resetRegistration: () => void; // Função para resetar o estado do formulário
}

// Cria o contexto com um valor inicial indefinido
const ProviderRegistrationContext = createContext<ProviderRegistrationContextType | undefined>(undefined);

// Componente Provider que envolve as telas do formulário
export const ProviderRegistrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Estados para armazenar os dados de cada etapa do formulário
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails | null>(null);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);

  // Função para simular a submissão final do registro
  const submitRegistration = async () => {
    // Verifica se todos os dados necessários estão presentes antes de tentar submeter
    if (!personalDetails || !serviceDetails) {
      Alert.alert("Erro de Cadastro", "Dados incompletos. Por favor, preencha todas as etapas do cadastro.");
      throw new Error("Dados de registro incompletos.");
    }

    // A URL final do avatar já deve ter sido gerada e salva em serviceDetails.avatarUrl
    // pela tela service-details.tsx antes de chamar submitRegistration.
    // Se serviceDetails.avatarUrl for null aqui, significa que o upload falhou ou não foi feito.
    if (!serviceDetails.avatarUrl) {
      Alert.alert("Erro de Imagem", "A foto de perfil não foi carregada corretamente. Tente novamente.");
      throw new Error("URL do avatar ausente.");
    }

    // TODO: Em uma implementação real, você chamaria a Cloud Function `submitProviderRegistration` aqui.
    // Esta função seria responsável por:
    // 1. Receber todos os dados do formulário (personalDetails, serviceDetails, e a finalAvatarUrl).
    // 2. Validar os dados novamente no backend.
    // 3. Criar/atualizar o perfil do profissional no Firestore.
    // 4. Atualizar o role do usuário no Firebase Authentication para 'provider'.
    // 5. Iniciar quaisquer processos de verificação de documentos, se aplicável.
    // Ex: await callFirebaseFunction('submitProviderRegistration', {
    //   ...personalDetails,
    //   ...serviceDetails,
    //   avatarUrl: serviceDetails.avatarUrl, // Envia a URL final da imagem para o backend
    // });
    console.log("[ProviderRegistrationContext] Simulating final registration submission to backend...");
    console.log("Dados Pessoais Completos:", personalDetails);
    console.log("Dados de Serviço Completos:", serviceDetails); // serviceDetails já contém avatarUrl

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simula o tempo de processamento do backend
    console.log("[ProviderRegistrationContext] Registration simulated successfully!");
    
    // Após o sucesso, reseta o estado do formulário para uma nova tentativa ou para garantir limpeza
    resetRegistration();
  };

  // Função para resetar todos os estados do formulário
  const resetRegistration = () => {
    setPersonalDetails(null);
    setServiceDetails(null);
  };

  return (
    // O Provider disponibiliza os estados e funções para seus componentes filhos
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

// Hook customizado para consumir o contexto
export const useProviderRegistration = () => {
  const context = useContext(ProviderRegistrationContext);
  // Garante que o hook seja usado dentro de um Provider
  if (context === undefined) {
    throw new Error('useProviderRegistration must be used within a ProviderRegistrationProvider');
  }
  return context;
};