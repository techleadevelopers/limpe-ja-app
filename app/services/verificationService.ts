// app/services/verificationService.ts
import api from './api'; // Importa sua instância configurada do Axios ou fetch
import {
  SubmitCpfRequest,
  DocumentPhotoType,
  VerificationResponse,
  ProviderVerificationInfo,
} from '../types/backend/verification';

class VerificationService {
  private readonly BASE_URL = '/verification'; // Base URL para os endpoints de verificação

  /**
   * Envia o CPF para verificação de antecedentes.
   * @param cpf O número do CPF a ser verificado.
   * @returns Uma promessa que resolve com a resposta da API.
   */
  async submitCpf(cpf: string): Promise<VerificationResponse> {
    const data: SubmitCpfRequest = { cpf };
    const response = await api.post<VerificationResponse>(`${this.BASE_URL}/cpf`, data);
    return response.data;
  }

  /**
   * Faz upload da foto do documento de identidade (frente ou verso).
   * @param file O objeto File da imagem.
   * @param type O tipo da foto (FRONT ou BACK).
   * @returns Uma promessa que resolve com a resposta da API.
   */
  async uploadDocumentPhoto(file: File, type: DocumentPhotoType): Promise<VerificationResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type); // Envia o tipo como parte do FormData

    const response = await api.post<VerificationResponse>(`${this.BASE_URL}/documents/identity`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Importante para upload de arquivos
      },
    });
    return response.data;
  }

  /**
   * Faz upload da selfie segurando o documento.
   * @param file O objeto File da imagem da selfie.
   * @returns Uma promessa que resolve com a resposta da API.
   */
  async uploadSelfie(file: File): Promise<VerificationResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<VerificationResponse>(`${this.BASE_URL}/documents/selfie`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Busca o status atual de verificação do provedor.
   * Pode ser um endpoint no módulo de provedores ou aqui, dependendo da sua API.
   * Assumindo que o backend tem um endpoint para buscar o perfil do provedor.
   */
  async getProviderVerificationInfo(providerId: string): Promise<ProviderVerificationInfo> {
    // Este endpoint pode estar no seu providerService ou em um endpoint /verification/status/me
    // Para este exemplo, assumimos que existe um endpoint no serviço de provedores
    const response = await api.get<ProviderVerificationInfo>(`/providers/${providerId}/verification-status`);
    return response.data;
  }
}

export default new VerificationService();