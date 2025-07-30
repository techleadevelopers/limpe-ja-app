// LimpeJaApp/app/types/backend/upload.ts

/**
 * @interface UploadResponseDto
 * Representa a resposta esperada do backend após um upload de arquivo bem-sucedido.
 */
export interface UploadResponseDto {
  url: string; // A URL pública do arquivo carregado (ex: URL do GCS).
  // Você pode adicionar outros campos se seu backend retornar mais informações, ex:
  // fileName?: string;
  // size?: number;
  // mimeType?: string;
}

// Se o seu endpoint de upload aceitar campos adicionais no FormData além do arquivo,
// você poderia definir uma interface para eles aqui, mas geralmente o upload é apenas o arquivo.
// Ex: export interface UploadRequestDto { description?: string; tags?: string[]; }