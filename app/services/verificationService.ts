// app/services/verificationService.ts
import api from './api';
import axios from 'axios';
import { Platform } from 'react-native'; // Importar Platform para detecção de ambiente
import {
  SubmitCpfRequest,
  DocumentPhotoType,
  VerificationResponse,
  ProviderVerificationInfo,
} from '../types/backend/verification';

// Importe FileSystem do Expo para ler o conteúdo da URI (usado apenas em mobile)
import * as FileSystem from 'expo-file-system';

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
      // CORREÇÃO: Alterado para 'submit-cpf' para corresponder ao controller
      const response = await api.post<VerificationResponse>(`${this.BASE_URL}/submit-cpf`, data);
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
   * @param imageUri A URI local da imagem (do ImagePicker).
   * @param type O tipo da foto (FRONT ou BACK).
   * @returns Uma promessa que resolve com a resposta da API.
   */
  async uploadDocumentPhoto(imageUri: string, type: DocumentPhotoType): Promise<VerificationResponse> {
    try {
      // Lógica condicional para mobile vs. web
      if (Platform.OS !== 'web') {
        // Apenas para mobile: Verifica se a URI existe usando FileSystem
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!fileInfo.exists) {
          throw new Error("Arquivo da imagem não encontrado na URI fornecida.");
        }
      }

      // Converte a URI da imagem em um Blob (funciona para mobile e web com URIs locais)
      const blob = await new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          console.error("Erro ao converter URI para Blob:", e);
          reject(new TypeError('Network request failed'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', imageUri, true);
        xhr.send(null);
      });

      const formData = new FormData();
      // Anexa o Blob ao FormData. O nome 'file' deve corresponder ao esperado pelo backend (@UploadedFile('file'))
      // O terceiro argumento é o nome do arquivo, que pode ser inferido ou um nome padrão.
      formData.append('file', blob, `document-${type}.jpeg`);
      // O tipo do documento (FRONT/BACK) é enviado como parte da URL para o backend, conforme definido no VerificationController.
      // Não é necessário enviar 'type' separadamente no FormData se já está na URL.
      // Se o backend espera 'type' no corpo, você pode adicionar: formData.append('type', type);

      const response = await api.post<VerificationResponse>(`${this.BASE_URL}/upload-document/${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Essencial para FormData
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
   * @param imageUri A URI local da imagem da selfie.
   * @returns Uma promessa que resolve com a resposta da API.
   */
  async uploadSelfie(imageUri: string): Promise<VerificationResponse> {
    try {
      // Lógica condicional para mobile vs. web
      if (Platform.OS !== 'web') {
        // Apenas para mobile: Verifica se a URI existe usando FileSystem
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!fileInfo.exists) {
          throw new Error("Arquivo da selfie não encontrado na URI fornecida.");
        }
      }

      // Converte a URI da imagem em um Blob (funciona para mobile e web com URIs locais)
      const blob = await new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          console.error("Erro ao converter URI para Blob (selfie):", e);
          reject(new TypeError('Network request failed'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', imageUri, true);
        xhr.send(null);
      });

      const formData = new FormData();
      // Anexa o Blob ao FormData. O nome 'file' deve corresponder ao esperado pelo backend (@UploadedFile('file'))
      formData.append('file', blob, `selfie.jpeg`); // Nome padrão para o arquivo da selfie

      const response = await api.post<VerificationResponse>(`${this.BASE_URL}/upload-selfie`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Essencial para FormData
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
      // CORREÇÃO: Alterado para 'status/:providerId' para corresponder ao controller
      const response = await api.get<ProviderVerificationInfo>(`${this.BASE_URL}/status/${providerId}`);
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
