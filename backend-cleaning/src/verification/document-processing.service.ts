// src/verification/document-processing.service.ts
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { File } from 'multer';

@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name);
  private storage: Storage;
  private bucketName: string;
  private visionClient: ImageAnnotatorClient;

  constructor(private configService: ConfigService) {
    const projectId = this.configService.get<string>('GCS_PROJECT_ID');
    const keyFilename = this.configService.get<string>('GCS_KEY_FILE'); // <-- LER O CAMINHO DO ARQUIVO AQUI
    // REMOVA: const keyFileContentBase64 = this.configService.get<string>('GCS_KEY_FILE_CONTENT');

    if (!projectId || !keyFilename) { // <-- Verificação para o caminho do arquivo
      this.logger.error('GCS_PROJECT_ID ou GCS_KEY_FILE (caminho do arquivo) não configurados nas variáveis de ambiente.');
      throw new Error('Configurações de GCS ausentes.');
    }

    // REMOVA: Toda a lógica de decodificação Base64 e parsing JSON
    // let credentialsJson: any;
    // try {
    //   const decodedKeyContent = Buffer.from(keyFileContentBase64, 'base64').toString('utf8');
    //   credentialsJson = JSON.parse(decodedKeyContent);
    // } catch (e) {
    //   this.logger.error('Erro ao decodificar ou parsear a chave GCS Base64:', e);
    //   this.logger.error(`Conteúdo da chave Base64 (truncado): ${keyFileContentBase64.substring(0, 100)}...`);
    //   throw new Error('Chave GCS inválida ou corrompida.');
    // }

    this.storage = new Storage({
      projectId: projectId,
      keyFilename: keyFilename, // <-- USAR O CAMINHO DO ARQUIVO
    });
    this.bucketName = this.configService.get<string>('GCS_BUCKET_NAME');

    if (!this.bucketName) {
      this.logger.error('GCS_BUCKET_NAME não configurado nas variáveis de ambiente.');
      throw new Error('Nome do bucket GCS ausente.');
    }

    this.visionClient = new ImageAnnotatorClient({
      projectId: projectId,
      keyFilename: keyFilename, // <-- USAR O CAMINHO DO ARQUIVO
    });
  }

  // ... (restante do serviço) ...
}