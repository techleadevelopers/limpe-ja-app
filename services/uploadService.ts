// LimpeJaApp/app/services/uploadService.ts
import axios, { AxiosResponse, isAxiosError } from 'axios';
import api from './api';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { UploadResponseDto } from '../types/backend/upload';

export type FilePurpose = 'avatar' | 'documentFront' | 'documentBack' | 'selfieWithDocument';

// A API_BASE_URL deve ser carregada de Constants para consistência em produção
const API_BASE_URL = Constants.expoConfig?.extra?.backendApiUrl as string;

// Validação para garantir que API_BASE_URL está definida
if (!API_BASE_URL) {
  console.error('[uploadService] Erro crítico: backendApiUrl não está definido!');
  // Em um ambiente de produção, você pode querer lançar um erro ou ter um fallback mais robusto
}

export const uploadImageToCloud = async (uri: string, filePurpose: FilePurpose): Promise<UploadResponseDto> => {
  console.log(`[uploadService] Tentando fazer upload da imagem com URI: ${uri} para o propósito: ${filePurpose}`);
  
  console.log(`[uploadService] URI da imagem para upload: ${uri}`);

  const formData = new FormData();
  let uploadPath: string;

  try {
    const filename = uri.split('/').pop() || `upload-${Date.now()}.jpg`;
    
    const fileToUpload = {
        uri: uri,
        name: filename,
        type: 'image/jpeg',
    };
    console.log('[uploadService] Detalhes do arquivo para upload:', fileToUpload);

    formData.append('file', fileToUpload as any);

    console.log(`[uploadService] FormData preparado. Conteúdo: ${JSON.stringify(formData)}`);

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
    case 'selfieWithDocument':
      uploadPath = '/verification/upload-selfie';
      break;
    default:
      throw new Error(`Tipo de upload desconhecido ou não mapeado: ${filePurpose}`);
  }
  
  console.log(`[uploadService] Enviando requisição POST para: ${API_BASE_URL}${uploadPath}`);

  try {
    const response: AxiosResponse<any> = await api.post(uploadPath, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // AQUI ESTÁ A ÚNICA ALTERAÇÃO LÓGICA
    // Garante que a resposta seja sempre um objeto UploadResponseDto.
    // O backend pode retornar a URL diretamente no corpo da resposta
    // ou dentro de um objeto. Este trecho trata ambos os casos.
    const responseData = response.data;
    let finalUrl = '';

    // Caso 1: A resposta é a URL direta (string)
    if (typeof responseData === 'string') {
        finalUrl = responseData;
    } 
    // Caso 2: A resposta é um objeto e contém a propriedade 'url'
    else if (responseData && responseData.url) {
        finalUrl = responseData.url;
    }

    if (finalUrl) {
      console.log("[uploadService] Upload bem-sucedido. URL retornada:", finalUrl);
      return { url: finalUrl };
    } else {
      console.error("[uploadService] Resposta inesperada do backend:", response.data);
      throw new Error("O backend não retornou uma URL de imagem válida após o upload.");
    }

  } catch (error: any) {
    console.error(`[uploadService] Erro durante o upload da imagem para o backend (${API_BASE_URL}${uploadPath}):`);
    
    let errorMessage = "Falha desconhecida no upload.";
    if (isAxiosError(error)) {
      if (error.response) {
        console.error(' - Status do erro:', error.response.status);
        console.error(' - Dados da resposta:', error.response.data);
        console.error(' - Headers da resposta:', error.response.headers);
        errorMessage = error.response.data.message || `Erro do servidor com status ${error.response.status}`;
      } else if (error.request) {
        console.error(' - Nenhuma resposta recebida do servidor.');
        errorMessage = `Nenhuma resposta recebida do servidor: ${error.message}`;
      } else {
        console.error(' - Erro na configuração da requisição:', error.message);
        errorMessage = `Erro de configuração da requisição: ${error.message}`;
      }
    } else {
      console.error(' - Erro genérico:', error);
      errorMessage = error.message || "Falha desconhecida no upload.";
    }
    throw new Error(`Falha no upload da imagem: ${errorMessage}`);
  }
};

export default {
  uploadImageToCloud,
};