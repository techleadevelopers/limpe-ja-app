// LimpeJaApp/app/services/uploadService.ts
// Importa a instância centralizada do Axios configurada em './api'
import api from './api'; 
import axios, { AxiosResponse, AxiosError } from 'axios'; // Importa axios e AxiosError para tratamento de erros
import { Platform } from 'react-native'; // Importado para possíveis ajustes específicos de plataforma

// Importa as tipagens necessárias
import {
  SubmitCpfRequest, // Embora não usado diretamente aqui, é parte do contexto de verification
  DocumentPhotoType,
  VerificationResponse,
  ProviderVerificationInfo,
} from '../types/backend/verification';

// --- CONSTANTES ---
// A URL base agora é obtida dinamicamente via Constants.expoConfig.extra
// Certifique-se de que 'backendApiUrl' esteja configurado corretamente no seu app.json ou app.config.ts
// e que seja acessível no ambiente de execução do Expo.
import Constants from 'expo-constants';
const API_BASE_URL = Constants.expoConfig?.extra?.backendApiUrl as string;

// Verifica se a URL base da API foi configurada
if (!API_BASE_URL) {
  console.error('[uploadService] Erro crítico: backendApiUrl não está definido em app.json ou Constants.expoConfig.extra! Verifique sua configuração.');
  // Em um ambiente de produção, você pode querer lançar um erro aqui para impedir a execução.
  // Para desenvolvimento, um console.error pode ser suficiente, mas o upload falhará.
  // throw new Error('API_BASE_URL is not defined'); 
}

/**
 * Upload de uma imagem para o backend, que por sua vez a envia para o Google Cloud Storage.
 * @param uri URI local do arquivo (ex: de um ImagePicker ou FileSystem)
 * @param fileType Indica o tipo de upload (e.g., 'identity', 'selfie', 'avatar') para o backend.
 * @returns Promise<string> A URL pública da imagem após o upload.
 */
export const uploadImageToCloud = async (uri: string, fileType: string = 'avatar'): Promise<string> => {
  console.log(`[uploadService] Tentando fazer upload da imagem com URI: ${uri} para o tipo: ${fileType}`);

  let formData = new FormData(); // Cria uma nova instância de FormData
  let uploadEndpoint: string = ''; // Endpoint para onde a requisição será enviada

  try {
    // **** PASSO 1: Preparar o FormData para o Backend ****
    
    // Tenta obter informações do arquivo a partir do URI local e criar um Blob.
    // O fetch é usado aqui para obter o Blob a partir de um URI local (como retornado pelo expo-image-picker).
    const response = await fetch(uri);
    if (!response.ok) {
        // Lança um erro se a busca do arquivo falhar
        throw new Error(`Falha ao buscar o arquivo do URI: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob(); // Converte a resposta em um Blob

    // Extrai o nome do arquivo do URI e o tipo MIME do Blob.
    const filename = uri.split('/').pop() || `upload-${Date.now()}`; // Pega a última parte do URI como nome do arquivo, ou um nome padrão
    const fileTypeMime = blob.type || 'image/jpeg'; // Usa o tipo do Blob ou um default

    // Adiciona o Blob ao FormData com o nome do campo 'file' (crucial para o backend)
    formData.append('file', blob, filename); 
    console.log(`[uploadService] Arquivo preparado: ${filename}, Tipo: ${fileTypeMime}`);

  } catch (error: unknown) { // Captura erros durante o processamento do URI/Blob
      console.error(`[uploadService] Erro ao processar URI ${uri} para upload:`, error);
      // Lança um erro mais descritivo para o chamador
      if (error instanceof Error) {
          throw new Error(`Não foi possível preparar o arquivo para upload: ${error.message}`);
      } else {
          throw new Error(`Não foi possível preparar o arquivo para upload: Ocorreu um erro desconhecido.`);
      }
  }

  // Adiciona metadados adicionais ao FormData, como o tipo de upload.
  formData.append('type', fileType); // Ex: 'identity', 'selfie', 'avatar'

  // **** PASSO 2: Fazer a Requisição HTTP para o Backend (Endpoint de Upload) ****
  try {
    // Define o endpoint de upload com base no tipo fornecido.
    // Este endpoint deve corresponder à rota configurada no seu backend NestJS.
    uploadEndpoint = `/verification/documents/${fileType}`; 

    // Verifica se a URL base da API foi configurada antes de fazer a requisição.
    if (!API_BASE_URL) {
        throw new Error("A URL base da API não está configurada. Impossível realizar o upload.");
    }

    // Faz a requisição POST usando a instância 'api' centralizada.
    // O Axios define automaticamente o 'Content-Type' para 'multipart/form-data' quando FormData é usado.
    const response = await api.post(uploadEndpoint, formData, {
      headers: {
        // Se precisar adicionar o token de autenticação, descomente a linha abaixo e ajuste a lógica.
        // 'Authorization': `Bearer ${suaFuncaoParaObterToken()}`,
      },
    });

    // Processa a resposta do backend. Espera-se que retorne um objeto com a URL da imagem.
    if (response.data && response.data.url) {
      console.log("[uploadService] Upload bem-sucedido. URL retornada:", response.data.url);
      return response.data.url; // Retorna a URL pública da imagem no GCS
    } else {
      // Caso a resposta do backend não contenha a URL esperada.
      console.error("[uploadService] Resposta inesperada do backend:", response.data);
      throw new Error("O backend não retornou uma URL de imagem válida após o upload.");
    }

  } catch (error: unknown) { // Captura erros durante a requisição HTTP
    console.error(`[uploadService] Erro durante o upload da imagem para o backend (${API_BASE_URL}${uploadEndpoint}):`, error);
    
    // Tenta extrair uma mensagem de erro mais específica
    let errorMessage = "Falha desconhecida no upload.";
    if (error instanceof Error) {
        errorMessage = error.message; // Usa a mensagem de erro se for do tipo Error
    }
    // Se for um erro do Axios, tenta extrair a mensagem do response.data ou do próprio erro.
    if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message; // Mensagem específica do backend
    } else if (axios.isAxiosError(error) && error.message) {
        errorMessage = error.message; // Mensagem genérica do Axios
    }
    throw new Error(`Falha no upload da imagem: ${errorMessage}`); // Lança o erro para o chamador tratar
  }
};