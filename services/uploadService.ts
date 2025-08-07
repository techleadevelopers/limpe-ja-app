// LimpeJaApp/app/services/uploadService.ts
import axios, { AxiosResponse, isAxiosError } from 'axios';
import api from './api';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { UploadResponseDto } from '../types/backend/upload';

// **CORREÇÃO AQUI: Adicionado 'selfieWithDocument' ao tipo**
export type FilePurpose = 'avatar' | 'documentFront' | 'documentBack' | 'selfieWithDocument';

const API_BASE_URL = 'http://192.168.32.26:3000'; // Este é o IP local que você forneceu.

if (!API_BASE_URL) {
  console.error('[uploadService] Erro crítico: backendApiUrl não está definido!');
}

export const uploadImageToCloud = async (uri: string, filePurpose: FilePurpose): Promise<UploadResponseDto> => {
  console.log(`[uploadService] Tentando fazer upload da imagem com URI: ${uri} para o propósito: ${filePurpose}`);

  const formData = new FormData();
  let uploadPath: string;

  try {
    const filename = uri.split('/').pop() || `upload-${Date.now()}.jpg`;
    
    const fileToUpload = {
        uri: uri,
        name: filename,
        type: 'image/jpeg',
    };

    formData.append('file', fileToUpload as any);

    console.log(`[uploadService] Arquivo preparado: ${filename}, Tipo: ${fileToUpload.type}`);

  } catch (error: any) {
    console.error(`[uploadService] Erro ao preparar o arquivo para upload:`, error);
    throw new Error(`Não foi possível preparar o arquivo para upload: ${error.message}`);
  }

  switch (filePurpose) {
    case 'avatar':
      uploadPath = '/verification/upload-avatar';
      break;
    case 'documentFront':
      uploadPath = '/verification/upload-document/FRONT';
      break;
    case 'documentBack':
      uploadPath = '/verification/upload-document/BACK';
      break;
    // **CORREÇÃO AQUI: Adicionado o novo case para a selfie com documento**
    case 'selfieWithDocument':
      uploadPath = '/verification/upload-selfie';
      break;
    default:
      throw new Error(`Tipo de upload desconhecido ou não mapeado: ${filePurpose}`);
  }

  try {
    const response: AxiosResponse<UploadResponseDto> = await api.post(uploadPath, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data && response.data.url) {
      console.log("[uploadService] Upload bem-sucedido. URL retornada:", response.data.url);
      return response.data;
    } else {
      console.error("[uploadService] Resposta inesperada do backend:", response.data);
      throw new Error("O backend não retornou uma URL de imagem válida após o upload.");
    }

  } catch (error: any) {
    console.error(`[uploadService] Erro durante o upload da imagem para o backend (${API_BASE_URL}${uploadPath}):`, error);
    let errorMessage = "Falha desconhecida no upload.";
    if (isAxiosError(error) && error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (isAxiosError(error) && error.message) {
      errorMessage = error.message;
    }
    throw new Error(`Falha no upload da imagem: ${errorMessage}`);
  }
};

export default {
  uploadImageToCloud,
};