// app/services/verificationService.ts
import api from './api';
import axios from 'axios';
import {
  SubmitCpfRequest,
  DocumentPhotoType,
  VerificationResponse,
  ProviderVerificationInfo,
} from '../types/backend/verification';

class VerificationService {
  private readonly BASE_URL = '/verification';

  /**
   * Envia o CPF para verificação de antecedentes.
   * @param cpf O número do CPF a ser verificado.
   * @returns Uma promessa que resolve com a resposta da API.
   */
  async submitCpf(cpf: string): Promise<VerificationResponse> {
    try {
      const data: SubmitCpfRequest = { cpf };
      const response = await api.post<VerificationResponse>(`${this.BASE_URL}/cpf`, data);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao enviar CPF para verificação:', error.response?.data || error.message);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Erro ao enviar CPF para verificação.');
      }
      throw new Error('Erro de rede ou servidor ao enviar CPF.');
    }
  }

  /**
   * Faz upload da foto do documento de identidade (frente ou verso).
   * @param file O objeto File da imagem.
   * @param type O tipo da foto (FRONT ou BACK).
   * @returns Uma promessa que resolve com a resposta da API.
   */
  async uploadDocumentPhoto(file: File, type: DocumentPhotoType): Promise<VerificationResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await api.post<VerificationResponse>(`${this.BASE_URL}/documents/identity`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao fazer upload da foto do documento:', error.response?.data || error.message);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Erro ao fazer upload da foto do documento.');
      }
      throw new Error('Erro de rede ou servidor ao fazer upload da foto do documento.');
    }
  }

  /**
   * Faz upload da selfie segurando o documento.
   * @param file O objeto File da imagem da selfie.
   * @returns Uma promessa que resolve com a resposta da API.
   */
  async uploadSelfie(file: File): Promise<VerificationResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<VerificationResponse>(`${this.BASE_URL}/documents/selfie`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao fazer upload da selfie:', error.response?.data || error.message);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Erro ao fazer upload da selfie.');
      }
      throw new Error('Erro de rede ou servidor ao fazer upload da selfie.');
    }
  }

  /**
   * Busca o status atual de verificação do provedor.
   * Pode ser um endpoint no módulo de provedores ou aqui, dependendo da sua API.
   * Assumindo que o backend tem um endpoint para buscar o perfil do provedor.
   */
  async getProviderVerificationInfo(providerId: string): Promise<ProviderVerificationInfo> {
    try {
      const response = await api.get<ProviderVerificationInfo>(`/providers/${providerId}/verification-status`);
      return response.data;
    } catch (error: any) {
      console.error(`Erro ao buscar informações de verificação do provedor ${providerId}:`, error.response?.data || error.message);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || `Erro ao buscar informações de verificação do provedor ${providerId}.`);
      }
      throw new Error('Erro de rede ou servidor ao buscar informações de verificação.');
    }
  }
}

export default new VerificationService();