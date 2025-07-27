// src/verification/document-processing.service.ts
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { File } from 'multer';
// import axios from 'axios'; // <<<< REMOVIDO: Axios não é mais necessário para a API externa

@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name);
  private storage: Storage;
  private bucketName: string;
  private visionClient: ImageAnnotatorClient;
  // REMOVIDO: Campos para API externa
  // private thirdPartyFacematchApiUrl: string;
  // private thirdPartyFacematchApiKey: string;

  constructor(private configService: ConfigService) {
    const projectId = this.configService.get<string>('googleCloudStorage.projectId');

    if (!projectId) {
      this.logger.error('GCS_PROJECT_ID não configurado nas variáveis de ambiente.');
      throw new Error('Configurações de GCS ausentes: GCS_PROJECT_ID.');
    }

    this.storage = new Storage({
      projectId: projectId,
    });

    this.visionClient = new ImageAnnotatorClient({
      projectId: projectId,
    });

    this.bucketName = this.configService.get<string>('googleCloudStorage.bucketName');

    if (!this.bucketName) {
      this.logger.error('GCS_BUCKET_NAME não configurado nas variáveis de ambiente.');
      throw new Error('Nome do bucket GCS ausente.');
    }

    this.logger.log('Google Cloud Storage e Vision clients inicializados via ADC.');

    // REMOVIDO: Lógica de configuração da API externa
    // this.thirdPartyFacematchApiUrl = this.configService.get<string>('thirdParty.facematchApiUrl');
    // this.thirdPartyFacematchApiKey = this.configService.get<string>('thirdParty.facematchApiKey');
    // if (!this.thirdPartyFacematchApiUrl || !this.thirdPartyFacematchApiKey) {
    //   this.logger.error('THIRD_PARTY_FACEMATCH_API_URL ou THIRD_PARTY_FACEMATCH_API_KEY não configuradas.');
    //   throw new Error('Configurações da API de comparação facial ausentes. Verifique as variáveis de ambiente.');
    // }
  }

  /**
   * Upload de um arquivo para o Google Cloud Storage.
   * @param file O arquivo a ser enviado (Multer.File).
   * @param destinationPath O caminho dentro do bucket GCS (ex: 'provider-documents/userId/identity-front.jpg').
   * @returns Promise<string> A URL pública do arquivo no GCS.
   */
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
      let isStreamDestroyed = false; // Flag para controlar o estado do stream

      const errorHandler = (err: any) => {
        if (isStreamDestroyed) return; // Evita múltiplas chamadas após a destruição
        isStreamDestroyed = true;

        this.logger.error(`Erro durante o upload para GCS em ${destinationPath}: ${err.message}`, err.stack);
        if (!blobStream.destroyed) {
          blobStream.destroy(err);
        }
        reject(new InternalServerErrorException(`Falha ao enviar arquivo para o Google Cloud Storage: ${err.message}`));
      };

      blobStream.on('error', errorHandler);

      blobStream.on('finish', () => {
        if (isStreamDestroyed) return; // Se já foi destruído por erro, não finalize
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        this.logger.log(`Arquivo enviado com sucesso para GCS: ${publicUrl}`);
        resolve(publicUrl);
      });

      blobStream.on('close', () => {
          this.logger.debug(`Stream para ${destinationPath} foi fechado.`);
      });
      blobStream.on('end', () => {
          this.logger.debug(`Stream para ${destinationPath} terminou de escrever dados.`);
      });

      try {
        blobStream.end(file.buffer);
      } catch (writeError: any) {
        this.logger.error(`Erro síncrono ao iniciar a escrita no blobStream para ${destinationPath}: ${writeError.message}`, writeError.stack);
        errorHandler(writeError);
      }
    });
  }

  /**
   * Integração real com o Google Cloud Vision API para processamento de OCR em um documento.
   * @param file O arquivo do documento.
   * @returns Um objeto com o texto extraído e confiança.
   */
  async processDocumentOcr(file: File): Promise<{ extractedText: string; confidence: number; rawResult: any }> {
    this.logger.log('Iniciando processamento OCR real do documento com Google Cloud Vision API...');
    try {
      const [result] = await this.visionClient.documentTextDetection(file.buffer);
      const fullTextAnnotation = result.fullTextAnnotation;
      const extractedText = fullTextAnnotation ? fullTextAnnotation.text : '';
      
      const confidence = extractedText ? 0.95 : 0.0;

      this.logger.log(`OCR real concluído. Texto extraído: ${extractedText.substring(0, Math.min(extractedText.length, 100))}...`);
      return { extractedText, confidence, rawResult: result };
    } catch (error) {
      this.logger.error(`Erro ao processar OCR com Google Cloud Vision API: ${error.message}`);
      throw new InternalServerErrorException(`Falha no processamento OCR: ${error.message}`);
    }
  }

  /**
   * AGORA APENAS SIMULA a comparação facial, pois a verificação real será manual.
   * Este método não fará mais chamadas a APIs externas de face match.
   * @param selfieFile O arquivo da selfie.
   * @param documentImageUrl A URL da imagem do documento já enviada para o GCS.
   * @returns Um objeto com o resultado da comparação (match, score)
   */
  async compareFaces(selfieFile: File, documentImageUrl: string): Promise<{ match: boolean; score: number; details?: string }> {
    this.logger.log('Iniciando simulação de comparação facial (verificação manual).');
    
    // REMOVIDO: Verificação de thirdPartyFacematchApiUrl/ApiKey e a chamada Axios.

    try {
      // Simulação: Apenas verifica se há faces em ambas as imagens usando Vision API (detecção, não comparação)
      const [selfieDetection] = await this.visionClient.faceDetection(selfieFile.buffer);
      const selfieFaces = selfieDetection.faceAnnotations;

      // Para uma verificação 'manual', a presença de face é o suficiente para o backend
      // indicar que a foto foi processada para revisão.
      const selfieHasFace = selfieFaces && selfieFaces.length > 0;

      // O documentImageUrl virá do GCS, então podemos simular que o documento também existe
      // e pode ser validado visualmente ou por OCR.
      const documentExistsAndIsProcessed = true; // Assumimos que o upload do documento já ocorreu e foi OK.

      // A 'correspondência' agora significa que a selfie tem uma face e que o documento de referência existe.
      const match = selfieHasFace && documentExistsAndIsProcessed;
      const score = match ? 0.85 : 0.1; // Pontuação arbitrária para simulação.

      if (!selfieHasFace) {
        this.logger.warn('Nenhuma face detectada na selfie para simulação de comparação.');
        return { match: false, score: 0, details: 'Nenhuma face detectada na selfie para revisão manual.' };
      }
      
      this.logger.log(`Simulação de comparação facial concluída. Match: ${match}, Score: ${score}`);
      return { match, score, details: 'Comparação para revisão manual.' };

    } catch (error: any) {
      this.logger.error(`Erro durante a simulação de comparação facial: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Falha na simulação de comparação facial: ${error.message}`);
    }
  }

  /**
   * AGORA APENAS SIMULA a verificação de prova de vida (liveness check),
   * pois a verificação real será manual/visual.
   * @param selfieFile O arquivo da selfie (pode ser vídeo para algumas APIs).
   * @returns Um objeto com o resultado da prova de vida (isLive, score).
   */
  async performLivenessCheck(selfieFile: File): Promise<{ isLive: boolean; score: number; details?: string }> {
    this.logger.log('Iniciando simulação de verificação de prova de vida (liveness check).');
    try {
      // Simulação: Apenas verifica se há uma face na imagem.
      // Para fins de 'prova de vida' manual, a presença da face indica que a foto é um rosto.
      const [selfieDetection] = await this.visionClient.faceDetection(selfieFile.buffer);
      const selfieFaces = selfieDetection.faceAnnotations;

      const isLive = selfieFaces && selfieFaces.length > 0; // Simplesmente verifica se há uma face
      const score = isLive ? 0.90 : 0.05; // Pontuação arbitrária para simulação

      if (!isLive) {
        this.logger.warn('Nenhuma face detectada para prova de vida ou falha na simulação de liveness.');
        return { isLive: false, score: 0, details: 'Nenhuma face detectada na imagem para revisão manual.' };
      }

      this.logger.log(`Simulação de prova de vida concluída. Live: ${isLive}, Score: ${score}`);
      return { isLive, score, details: 'Liveness check para revisão manual.' };

    } catch (error: any) {
      this.logger.error(`Erro durante a simulação de prova de vida: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Falha na simulação de prova de vida: ${error.message}`);
    }
  }
}