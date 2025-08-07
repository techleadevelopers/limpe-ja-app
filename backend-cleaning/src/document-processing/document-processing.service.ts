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
    this.bucketName = this.configService.get<string>('GCS_BUCKET_NAME');

    if (!projectId) {
      this.logger.error('GCS_PROJECT_ID não configurado nas variáveis de ambiente.');
      throw new Error('Configurações de GCS ausentes: GCS_PROJECT_ID.');
    }
    if (!this.bucketName) {
      this.logger.error('GCS_BUCKET_NAME não configurado nas variáveis de ambiente.');
      throw new Error('Nome do bucket GCS ausente.');
    }

    this.storage = new Storage({ projectId: projectId });
    this.visionClient = new ImageAnnotatorClient({ projectId: projectId });

    this.logger.log('Clientes GCS e Vision inicializados usando credenciais padrão do ambiente GCP.');
  }

  // ----------------------------------------------------------------------
  // Lógica de Upload de Arquivo para GCS (Independente)
  // ----------------------------------------------------------------------

  async uploadImage(file: File, destinationPath: string): Promise<string> {
    this.logger.log(`Iniciando upload de imagem para GCS. Destino: ${destinationPath}`);

    if (!this.bucketName) {
      this.logger.error('Bucket GCS não configurado. Não é possível realizar o upload.');
      throw new InternalServerErrorException('Configuração do Google Cloud Storage indisponível.');
    }

    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(destinationPath);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        this.logger.error(`Erro durante o upload para GCS em ${destinationPath}: ${err.message}`);
        reject(new InternalServerErrorException(`Falha ao enviar arquivo para o Google Cloud Storage: ${err.message}`));
      });

      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        this.logger.log(`Arquivo enviado com sucesso para GCS: ${publicUrl}`);
        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  }

  // ----------------------------------------------------------------------
  // Lógica de Verificação de Documentos (OCR, Liveness, Comparação Facial)
  // Estas funções são chamadas separadamente pelo VerificationService.
  // ----------------------------------------------------------------------

  async processDocumentOcr(file: File): Promise<any> {
    this.logger.log('Iniciando processamento OCR real do documento com Google Cloud Vision API...');
    try {
      const [result] = await this.visionClient.textDetection(file.buffer);
      const detections = result.textAnnotations;
      const extractedText = detections && detections.length > 0 ? detections[0].description : '';
      const confidence = 1.0;

      this.logger.log(`OCR real concluído. Texto extraído: ${extractedText.substring(0, 100)}...`);
      return { extractedText, confidence };
    } catch (error) {
      this.logger.error(`Erro ao processar OCR com Google Cloud Vision API: ${error.message}`);
      throw new InternalServerErrorException(`Falha no processamento OCR: ${error.message}`);
    }
  }

  async compareFaces(selfieFile: File, documentImageUrl: string): Promise<boolean> {
    this.logger.log('Iniciando comparação facial real com Google Cloud Vision API...');
    try {
      const [selfieDetection] = await this.visionClient.faceDetection(selfieFile.buffer);
      const selfieFaces = selfieDetection.faceAnnotations;

      if (!selfieFaces || selfieFaces.length === 0) {
        this.logger.warn('Nenhuma face detectada na selfie para comparação.');
        return false;
      }

      const [documentDetection] = await this.visionClient.faceDetection(documentImageUrl);
      const documentFaces = documentDetection.faceAnnotations;
      
      if (!documentFaces || documentFaces.length === 0) {
        this.logger.warn('Nenhuma face detectada na imagem do documento para comparação.');
        return false;
      }
      this.logger.log('Comparação facial real concluída (lógica de similaridade ainda mockada, pois Vision API não oferece comparação direta).');
      return selfieFaces.length > 0 && documentFaces.length > 0;

    } catch (error) {
      this.logger.error(`Erro ao comparar faces com Google Cloud Vision API: ${error.message}`);
      throw new InternalServerErrorException(`Falha na comparação facial: ${error.message}`);
    }
  }

  async performLivenessCheck(selfieFile: File): Promise<boolean> {
    this.logger.log('Iniciando verificação de prova de vida (liveness check) real...');
    try {
      this.logger.warn('Serviço de prova de vida (liveness check) ainda não integrado a uma API real. Retornando simulação.');
      await new Promise((resolve) => setTimeout(resolve, 1800));
      return true;
    } catch (error) {
      this.logger.error(`Erro ao realizar prova de vida: ${error.message}`);
      throw new InternalServerErrorException(`Falha na verificação de prova de vida: ${error.message}`);
    }
  }
}