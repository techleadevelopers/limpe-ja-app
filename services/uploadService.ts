// LimpeJaApp/app/services/uploadService.ts
import axios from 'axios';
import api from './api'; // Importa a instância centralizada do Axios configurada em './api'
import Constants from 'expo-constants'; // Importa Constants para acessar variáveis do app.json

// --- CONSTANTES ---
const API_BASE_URL = Constants.expoConfig?.extra?.backendApiUrl as string;

// Verifica se a URL base da API foi configurada
if (!API_BASE_URL) {
  console.error('[uploadService] Erro crítico: backendApiUrl não está definido em app.json ou Constants.expoConfig.extra! Verifique sua configuração.');
  // Em um ambiente de produção, você pode querer lançar um erro aqui para impedir a execução.
  // Para desenvolvimento, um console.error pode ser suficiente, mas o upload falhará.
  // throw new Error('API_BASE_URL is not defined');
}

/**
 * Tipo para o propósito do arquivo, que mapeia para os endpoints do backend.
 * 'avatar' será usado para o endpoint de selfie.
 */
type FilePurpose = 'avatar' | 'documentFront' | 'documentBack';

/**
 * Upload de uma imagem para o backend, que por sua vez a envia para o Google Cloud Storage.
 * @param uri URI local do arquivo (ex: de um ImagePicker ou FileSystem)
 * @param filePurpose Indica o propósito do upload (e.g., 'avatar', 'documentFront', 'documentBack').
 * @returns Promise<string> A URL pública da imagem após o upload.
 */
export const uploadImageToCloud = async (uri: string, filePurpose: FilePurpose): Promise<string> => {
  console.log(`[uploadService] Tentando fazer upload da imagem com URI: ${uri} para o propósito: ${filePurpose}`);

  let formData = new FormData(); // Cria uma nova instância de FormData
  let uploadPath: string = ''; // Caminho do endpoint sem a URL base

  try {
    // **** PASSO 1: Preparar o FormData para o Backend ****

    // Tenta obter informações do arquivo a partir do URI local e criar um Blob.
    const response = await fetch(uri);
    if (!response.ok) {
        throw new Error(`Falha ao buscar o arquivo do URI: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob(); // Converte a resposta em um Blob

    // Extrai o nome do arquivo do URI.
    const filename = uri.split('/').pop() || `upload-${Date.now()}.jpg`; // Garante uma extensão padrão
    // Adiciona o Blob ao FormData com o nome do campo 'file' (crucial para o backend @UploadedFile())
    formData.append('file', blob, filename);
    console.log(`[uploadService] Arquivo preparado: ${filename}, Tipo: ${blob.type}`);

  } catch (error: unknown) { // Captura erros durante o processamento do URI/Blob
      console.error(`[uploadService] Erro ao processar URI ${uri} para upload:`, error);
      if (error instanceof Error) {
          throw new Error(`Não foi possível preparar o arquivo para upload: ${error.message}`);
      } else {
          throw new Error(`Não foi possível preparar o arquivo para upload: Ocorreu um erro desconhecido.`);
      }
  }

  // **** PASSO 2: Determinar o Endpoint Correto ****
  // Baseado no `filePurpose`, define o endpoint correto para o seu backend.
  switch (filePurpose) {
    case 'avatar':
      uploadPath = '/verification/upload-selfie';
      break;
    case 'documentFront':
      uploadPath = '/verification/upload-document/FRONT';
      break;
    case 'documentBack':
      uploadPath = '/verification/upload-document/BACK';
      break;
    default:
      // Isso nunca deveria acontecer se o tipo FilePurpose for bem definido, mas é uma segurança.
      throw new Error(`Tipo de upload desconhecido ou não mapeado: ${filePurpose}`);
  }

  // **** PASSO 3: Fazer a Requisição HTTP para o Backend ****
  try {
    // Verifica se a URL base da API foi configurada antes de fazer a requisição.
    if (!API_BASE_URL) {
        throw new Error("A URL base da API não está configurada. Impossível realizar o upload.");
    }

    // Faz a requisição POST usando a instância 'api' centralizada (que já inclui o token de autenticação).
    // O Axios define automaticamente o 'Content-Type' para 'multipart/form-data' quando FormData é usado.
    const response = await api.post(uploadPath, formData); // Headers de autenticação já são tratados pelo interceptor 'api'

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
    console.error(`[uploadService] Erro durante o upload da imagem para o backend (${API_BASE_URL}${uploadPath}):`, error);

    // Tenta extrair uma mensagem de erro mais específica
    let errorMessage = "Falha desconhecida no upload.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message; // Mensagem específica do backend
    } else if (axios.isAxiosError(error) && error.message) {
        errorMessage = error.message; // Mensagem genérica do Axios
    }
    throw new Error(`Falha no upload da imagem: ${errorMessage}`);
  }
};

export default {
  uploadImageToCloud,
};