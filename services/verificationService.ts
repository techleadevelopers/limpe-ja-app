// app/services/verificationService.ts

import axios from 'axios';
import { Platform } from 'react-native';
import {
    DocumentPhotoType,
    ProviderVerificationInfo,
    SubmitCpfRequest,
    VerificationResponse,
} from '../types/backend/verification';
import { api } from './api';
import { createLocalConsole } from './logging';
const console = createLocalConsole();
import UploadService from './uploadService';
import { UploadResponseDto } from '../types/backend/upload';
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
            const response = await UploadService.uploadDocument(imageUri, type);
            
            return { message: "Documento enviado com sucesso.", url: response.url } as VerificationResponse;
        } catch (error: any) {
            console.error('Erro ao fazer upload da foto do documento:', error.message);
            throw new Error(error.message || 'Erro de rede ou servidor ao fazer upload da foto do documento.');
        }
    }

    async uploadAvatar(imageUri: string): Promise<UploadResponseDto> {
        try {
            const uploadResponse = await UploadService.uploadAvatar(imageUri);
            return uploadResponse;
        } catch (error: any) {
            console.error('Erro ao fazer upload da foto de perfil:', error.message);
            throw new Error(error.message || 'Erro de rede ou servidor ao fazer upload da foto de perfil.');
        }
    }

    async uploadSelfieWithDocument(imageUri: string): Promise<UploadResponseDto> {
        try {
            const uploadResponse = await UploadService.uploadSelfie(imageUri);
            return uploadResponse;
        } catch (error: any) {
            console.error('Erro ao fazer upload da selfie para verificação:', error.message);
            throw new Error(error.message || 'Erro de rede ou servidor ao fazer upload da selfie para verificação.');
        }
    }

    // NOVO MÉTODO: Chama o endpoint para avançar o status de verificação
    async advanceVerificationStatus(): Promise<{ message: string }> {
      try {
        const response = await api.post(`${this.BASE_URL}/advance-status`);
        return response.data;
      } catch (error: any) {
        console.error('Erro ao avançar o status de verificação:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Erro ao avançar o status de verificação.');
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
