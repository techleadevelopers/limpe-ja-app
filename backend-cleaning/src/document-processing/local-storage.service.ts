import { Injectable, Logger } from '@nestjs/common';
import { File } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadDirectory = path.join(__dirname, '..', '..', 'uploads');

  constructor() {
    this.ensureUploadDirectoryExists();
  }

  // Garante que o diretório de uploads existe
  private ensureUploadDirectoryExists() {
    if (!fs.existsSync(this.uploadDirectory)) {
      fs.mkdirSync(this.uploadDirectory, { recursive: true });
    }
  }

  // Simula a funcionalidade de upload do GCS, mas salva localmente
  async uploadFile(file: File, destination: string): Promise<string> {
    const filePath = path.join(this.uploadDirectory, destination);
    const directoryPath = path.dirname(filePath);

    this.logger.log(`Salvando arquivo localmente: ${filePath}`);

    // Cria o diretório de destino se não existir
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    try {
      await fs.promises.writeFile(filePath, file.buffer);
      this.logger.log(`Arquivo salvo com sucesso em: ${filePath}`);
      return `local-storage/${destination}`; // Retorna um URL "simulado"
    } catch (error) {
      this.logger.error(`Erro ao salvar arquivo local: ${error.message}`);
      throw new Error('Falha ao salvar arquivo local.');
    }
  }

  // Mantém a interface do serviço original
  async uploadImageToGCS(file: File, destination: string): Promise<string> {
    return this.uploadFile(file, destination);
  }

  // Métodos mock para as funcionalidades de OCR/Vision
  async processDocumentForOcr(fileName: string): Promise<any> {
    this.logger.warn('Mock: OCR não está ativo em modo de armazenamento local.');
    return { mockData: 'OCR data for ' + fileName };
  }

  async processSelfieForLiveness(fileName: string): Promise<any> {
    this.logger.warn('Mock: Liveness não está ativo em modo de armazenamento local.');
    return { mockData: 'Liveness data for ' + fileName };
  }

  async compareFaces(selfieFileName: string, documentFileName: string): Promise<any> {
    this.logger.warn('Mock: Comparação facial não está ativa em modo de armazenamento local.');
    return { match: true };
  }
}