// LimpeJaApp/app/(auth)/provider-register/ProviderRegistrationContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert } from 'react-native'; // Importar Alert para feedback ao usuário
import { useAuth } from '../contexts/AuthContext'; // CORRIGIDO: Caminho para AuthContext
import { RegisterProviderDto, CreateAddressDto } from '../app/types/backend/auth'; // CORRIGIDO: Caminho para auth.ts

// Tipos para os dados do formulário do provedor
// Define a estrutura dos dados pessoais do profissional
interface PersonalDetails {
  email: string; // ADICIONADO: Necessário para RegisterProviderDto
  passwordHash: string; // ADICIONADO: Necessário para RegisterProviderDto
  fullName: string; // Renomeado de nomeCompleto para alinhar com RegisterProviderDto
  cpf: string;
  dateOfBirth: string; // Formato YYYY-MM-DD para fácil armazenamento e comparação
  phone: string; // Renomeado de telefone para alinhar com RegisterProviderDto
  address: { // Objeto aninhado para detalhes do endereço
    cep: string;
    street: string; // Renomeado de logradouro para alinhar com CreateAddressDto
    number: string;
    complement?: string; // Opcional
    neighborhood: string;
    city: string;
    state: string;
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

  const { signUpProvider } = useAuth(); // Usar o hook useAuth para acessar signUpProvider

  // Função para simular a submissão final do registro
  const submitRegistration = async () => {
    // Verifica se todos os dados necessários estão presentes antes de tentar submeter
    if (!personalDetails || !serviceDetails) {
      // Alert.alert("Erro de Cadastro", "Dados incompletos. Por favor, preencha todas as etapas do cadastro.");
      throw new Error("Dados de registro incompletos."); // Propaga o erro para ser tratado pela tela
    }

    if (!serviceDetails.avatarUrl) {
      // Alert.alert("Erro de Imagem", "A foto de perfil não foi carregada corretamente. Tente novamente.");
      throw new Error("URL do avatar ausente."); // Propaga o erro para ser tratado pela tela
    }

    console.log("[ProviderRegistrationContext] Iniciando submissão final do registro para o backend...");
    console.log("Dados Pessoais Completos:", personalDetails);
    console.log("Dados de Serviço Completos:", serviceDetails);

    try {
      // Mapear os dados do contexto para o RegisterProviderDto do backend
      const registerData: RegisterProviderDto = {
        email: personalDetails.email,
        password: personalDetails.passwordHash,
        fullName: personalDetails.fullName,
        cpf: personalDetails.cpf,
        dateOfBirth: personalDetails.dateOfBirth,
        phone: personalDetails.phone,
        address: {
          cep: personalDetails.address.cep,
          street: personalDetails.address.street,
          number: personalDetails.address.number,
          complement: personalDetails.address.complement,
          neighborhood: personalDetails.address.neighborhood,
          city: personalDetails.address.city,
          state: personalDetails.address.state,
        } as CreateAddressDto, // Cast para garantir que é um CreateAddressDto
        yearsOfExperience: serviceDetails.anosExperiencia,
        avatarUrl: serviceDetails.avatarUrl,
      };

      // Chamar a função de registro real do AuthContext
      await signUpProvider(registerData);

      console.log("[ProviderRegistrationContext] Registro de provedor concluído com sucesso via AuthContext!");
      // O AuthContext já lida com o redirecionamento e a atualização do estado global.
      // Não é necessário Alert.alert ou router.replace aqui.
    } catch (error) {
      console.error("[ProviderRegistrationContext] Erro na submissão final do registro:", error);
      throw error; // Propaga o erro para a tela que chamou
    } finally {
      // Após o sucesso ou falha, reseta o estado do formulário para garantir limpeza
      resetRegistration();
    }
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