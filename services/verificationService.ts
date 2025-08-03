// app/services/verificationService.ts

import axios from 'axios';
import { Platform } from 'react-native';
import {
    DocumentPhotoType,
    ProviderVerificationInfo,
    SubmitCpfRequest,
    VerificationResponse,
} from '../types/backend/verification';
import api from './api';

import * as FileSystem from 'expo-file-system';

class VerificationService {
  private readonly BASE_URL = '/verification';

  async submitCpf(cpf: string): Promise<VerificationResponse> {
    try {
      const data: SubmitCpfRequest = { cpf };
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

  async uploadDocumentPhoto(imageUri: string, type: DocumentPhotoType): Promise<VerificationResponse> {
    try {
      if (Platform.OS !== 'web') {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!fileInfo.exists) {
          throw new Error("Arquivo da imagem não encontrado na URI fornecida.");
        }
      }

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
      formData.append('file', blob, `document-${type}.jpeg`);

      const response = await api.post<VerificationResponse>(`${this.BASE_URL}/upload-document/${type}`, formData, {
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

  // --- CORREÇÃO AQUI: Retorna a URL do objeto de resposta ---
  async uploadSelfie(imageUri: string): Promise<{ message: string; url: string }> {
    try {
      if (Platform.OS !== 'web') {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!fileInfo.exists) {
          throw new Error("Arquivo da selfie não encontrado na URI fornecida.");
        }
      }

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
      formData.append('file', blob, `selfie.jpeg`);

      const response = await api.post<{ message: string; url: string }>(`${this.BASE_URL}/upload-selfie`, formData, {
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

  async getProviderVerificationInfo(providerId: string): Promise<ProviderVerificationInfo> {
    try {
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