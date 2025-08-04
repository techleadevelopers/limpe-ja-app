// src/verification/document-processing.service.ts
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { File } from 'multer'; // Mantém a importação para o método uploadImage
import axios from 'axios'; // RE-ADICIONADO: Necessário para baixar arquivos de URLs

@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name);
  private storage: Storage;
  private bucketName: string;
  private visionClient: ImageAnnotatorClient;

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
  }

  /**
   * Helper para baixar um arquivo de uma URL.
   * @param url A URL do arquivo.
   * @returns Promise<{ buffer: Buffer; mimetype: string }> O buffer do arquivo e seu mimetype.
   */
  private async downloadFileFromUrl(url: string): Promise<{ buffer: Buffer; mimetype: string }> {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      const mimetype = response.headers['content-type'] || 'application/octet-stream'; // Tenta obter o mimetype dos headers
      this.logger.debug(`Arquivo baixado da URL: ${url}, tamanho: ${buffer.length} bytes, mimetype: ${mimetype}`);
      return { buffer, mimetype };
    } catch (error) {
      this.logger.error(`Erro ao baixar arquivo da URL ${url}: ${error.message}`);
      throw new InternalServerErrorException(`Falha ao baixar arquivo da URL: ${url}`);
    }
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
   * Agora aceita um buffer diretamente.
   * @param buffer O buffer do arquivo do documento.
   * @returns Um objeto com o texto extraído e confiança.
   */
  async processDocumentOcr(buffer: Buffer): Promise<{ extractedText: string; confidence: number; rawResult: any }> {
    this.logger.log('Iniciando processamento OCR real do documento com Google Cloud Vision API...');
    try {
      const [result] = await this.visionClient.documentTextDetection(buffer); // Usa o buffer diretamente
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
   * Simula a comparação facial usando buffers de imagem.
   * @param selfieBuffer O buffer da imagem da selfie.
   * @param documentBuffer O buffer da imagem do documento.
   * @returns Um objeto com o resultado da comparação (match, score).
   */
  async compareFaces(selfieBuffer: Buffer, documentBuffer: Buffer): Promise<{ match: boolean; score: number; details?: string }> {
    this.logger.log('Iniciando simulação de comparação facial (verificação manual).');
    
    try {
      // Detecta faces na selfie
      const [selfieDetection] = await this.visionClient.faceDetection(selfieBuffer);
      const selfieFaces = selfieDetection.faceAnnotations;
      const selfieHasFace = selfieFaces && selfieFaces.length > 0;

      // Detecta faces no documento
      const [documentDetection] = await this.visionClient.faceDetection(documentBuffer);
      const documentFaces = documentDetection.faceAnnotations;
      const documentHasFace = documentFaces && documentFaces.length > 0;

      // A 'correspondência' agora significa que ambas as imagens têm faces detectadas.
      const match = selfieHasFace && documentHasFace;
      const score = match ? 0.85 : 0.1; // Pontuação arbitrária para simulação.

      if (!selfieHasFace) {
        this.logger.warn('Nenhuma face detectada na selfie para simulação de comparação.');
        return { match: false, score: 0, details: 'Nenhuma face detectada na selfie para revisão manual.' };
      }
      if (!documentHasFace) {
        this.logger.warn('Nenhuma face detectada no documento para simulação de comparação.');
        return { match: false, score: 0, details: 'Nenhuma face detectada no documento para revisão manual.' };
      }
      
      this.logger.log(`Simulação de comparação facial concluída. Match: ${match}, Score: ${score}`);
      return { match, score, details: 'Comparação para revisão manual.' };

    } catch (error: any) {
      this.logger.error(`Erro durante a simulação de comparação facial: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Falha na simulação de comparação facial: ${error.message}`);
    }
  }

  /**
   * Simula a verificação de prova de vida (liveness check) usando um buffer de imagem.
   * @param selfieBuffer O buffer da imagem da selfie.
   * @returns Um objeto com o resultado da prova de vida (isLive, score).
   */
  async performLivenessCheck(selfieBuffer: Buffer): Promise<{ isLive: boolean; score: number; details?: string }> {
    this.logger.log('Iniciando simulação de verificação de prova de vida (liveness check).');
    try {
      // Simulação: Apenas verifica se há uma face na imagem.
      const [selfieDetection] = await this.visionClient.faceDetection(selfieBuffer);
      const selfieFaces = selfieDetection.faceAnnotations;

      const isLive = selfieFaces && selfieFaces.length > 0;
      const score = isLive ? 0.90 : 0.05;

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

  // --- NOVOS MÉTODOS QUE ACEITAM URLS ---

  /**
   * Processa OCR de um documento a partir de uma URL.
   * @param fileUrl URL da imagem do documento.
   * @returns Um objeto com o texto extraído e confiança.
   */
  async processDocumentOcrFromUrl(fileUrl: string): Promise<{ extractedText: string; confidence: number; rawResult: any }> {
    this.logger.log(`Processando OCR da URL: ${fileUrl}`);
    const { buffer } = await this.downloadFileFromUrl(fileUrl); // Não precisamos do mimetype aqui para o Vision API
    return this.processDocumentOcr(buffer);
  }

  /**
   * Realiza a verificação de prova de vida a partir de uma URL da selfie.
   * @param selfieUrl URL da imagem da selfie.
   * @returns Um objeto com o resultado da prova de vida.
   */
  async performLivenessCheckFromUrl(selfieUrl: string): Promise<{ isLive: boolean; score: number; details?: string }> {
    this.logger.log(`Realizando verificação de vivacidade da URL: ${selfieUrl}`);
    const { buffer } = await this.downloadFileFromUrl(selfieUrl); // Não precisamos do mimetype aqui para o Vision API
    return this.performLivenessCheck(buffer);
  }

  /**
   * Compara faces a partir de URLs da selfie e do documento.
   * @param selfieUrl URL da imagem da selfie.
   * @param documentFrontUrl URL da imagem da frente do documento.
   * @returns Um objeto com o resultado da comparação.
   */
  async compareFacesFromUrls(selfieUrl: string, documentFrontUrl: string): Promise<{ match: boolean; score: number }> {
    this.logger.log(`Comparando faces das URLs: ${selfieUrl} e ${documentFrontUrl}`);
    const { buffer: selfieBuffer } = await this.downloadFileFromUrl(selfieUrl);
    const { buffer: documentBuffer } = await this.downloadFileFromUrl(documentFrontUrl);
    return this.compareFaces(selfieBuffer, documentBuffer);
  }
}