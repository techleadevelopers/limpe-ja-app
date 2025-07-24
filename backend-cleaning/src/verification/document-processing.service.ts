// src/verification/document-processing.service.ts
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage'; // Importa o SDK do Google Cloud Storage
import { ImageAnnotatorClient } from '@google-cloud/vision'; // Importar Vision API para OCR e Face Detection
import { File } from 'multer';

@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name);
  private storage: Storage;
  private bucketName: string;
  private visionClient: ImageAnnotatorClient;

  constructor(private configService: ConfigService) {
    const projectId = this.configService.get<string>('googleCloudStorage.projectId');
    const keyFileContentBase64 = this.configService.get<string>('googleCloudStorage.keyFile'); 

    if (!projectId) {
      this.logger.error('GCS_PROJECT_ID não configurado nas variáveis de ambiente.');
      throw new Error('Configurações de GCS ausentes: GCS_PROJECT_ID.');
    }
    if (!keyFileContentBase64) {
      this.logger.error('GCS_KEY (Base64) não configurada nas variáveis de ambiente. Verifique o --set-secrets no deploy.');
      const port = process.env.PORT || 'não definido';
      this.logger.warn(`Variável de ambiente PORT: ${port}. O container deve escutar nesta porta.`);
      throw new Error('Configurações de GCS ausentes: GCS_KEY.');
    }

    let credentialsJson: any;
    try {
      this.logger.log(`Conteúdo GCS_KEY recebido (primeiros 50 caracteres): ${keyFileContentBase64.substring(0, 50)}...`);
      
      const decodedKeyContent = Buffer.from(keyFileContentBase64, 'base64').toString('utf8');
      
      this.logger.log(`Conteúdo decodificado (primeiros 50 caracteres): ${decodedKeyContent.substring(0, 50)}...`);
      
      if (!decodedKeyContent.trim().startsWith('{') || !decodedKeyContent.trim().endsWith('}')) {
        this.logger.error('Conteúdo decodificado não parece ser JSON válido (não começa ou termina com chaves).');
        this.logger.error(`Conteúdo decodificado completo (truncado para 500 chars se não for JSON): ${decodedKeyContent.substring(0, 500)}...`);
        throw new Error('Conteúdo decodificado não é um JSON válido.');
      }

      credentialsJson = JSON.parse(decodedKeyContent);
      this.logger.log('Chave JSON decodificada e parseada com sucesso!');

    } catch (e) {
      this.logger.error(`Erro ao decodificar ou parsear a chave GCS Base64: ${e.message}`);
      if (e instanceof SyntaxError) {
        this.logger.error(`SyntaxError: Caractere inesperado encontrado. Verifique o JSON original.`);
        this.logger.error(`Conteúdo da chave Base64 (truncado, para depuração): ${keyFileContentBase64.substring(0, 200)}...`);
        try {
          const problematicDecodedContent = Buffer.from(keyFileContentBase64, 'base64').toString('utf8');
          this.logger.error(`Conteúdo decodificado ANTES do parse (truncado, para depuração): ${problematicDecodedContent.substring(0, 200)}...`);
        } catch (decodeError) {
          this.logger.error(`Erro ao tentar re-decodificar para log: ${decodeError.message}`);
        }
      }
      throw new Error('Chave GCS inválida ou corrompida.');
    }

    this.storage = new Storage({
      projectId: projectId,
      credentials: credentialsJson,
    });
    this.bucketName = this.configService.get<string>('googleCloudStorage.bucketName');

    if (!this.bucketName) {
      this.logger.error('GCS_BUCKET_NAME não configurado nas variáveis de ambiente.');
      throw new Error('Nome do bucket GCS ausente.');
    }

    this.visionClient = new ImageAnnotatorClient({
      projectId: projectId,
      credentials: credentialsJson,
    });
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
      
      // A Vision API não fornece uma "confiança" geral para o documento de texto de forma direta.
      // Poderíamos calcular uma média das confianças das palavras, mas para simplificar,
      // vamos assumir uma alta confiança se o texto for detectado.
      const confidence = extractedText ? 0.95 : 0.0;

      this.logger.log(`OCR real concluído. Texto extraído: ${extractedText.substring(0, Math.min(extractedText.length, 100))}...`);
      return { extractedText, confidence, rawResult: result };
    } catch (error) {
      this.logger.error(`Erro ao processar OCR com Google Cloud Vision API: ${error.message}`);
      throw new InternalServerErrorException(`Falha no processamento OCR: ${error.message}`);
    }
  }

  /**
   * Simula a comparação facial entre uma selfie e uma foto de documento.
   * Em um cenário real, isso envolveria uma API de comparação facial (ex: AWS Rekognition, Azure Face API).
   * O Google Vision API pode detectar faces, mas não compara diretamente a similaridade entre duas faces.
   * @param selfieFile O arquivo da selfie.
   * @param documentImageUrl A URL da imagem do documento.
   * @returns Um objeto com o resultado da comparação (match, score)
   */
  async compareFaces(selfieFile: File, documentImageUrl: string): Promise<{ match: boolean; score: number; details?: string }> {
    this.logger.log('Iniciando simulação de comparação facial...');
    try {
      // Simulação: Apenas verifica se há faces em ambas as imagens usando Vision API
      const [selfieDetection] = await this.visionClient.faceDetection(selfieFile.buffer);
      const selfieFaces = selfieDetection.faceAnnotations;

      const [documentDetection] = await this.visionClient.faceDetection(documentImageUrl);
      const documentFaces = documentDetection.faceAnnotations;

      const selfieHasFace = selfieFaces && selfieFaces.length > 0;
      const documentHasFace = documentFaces && documentFaces.length > 0;

      // Lógica de simulação: se ambas têm faces, consideramos um "match" com uma pontuação arbitrária.
      // Em uma integração real, você enviaria as imagens para uma API de comparação que retornaria um score de similaridade.
      const match = selfieHasFace && documentHasFace;
      const score = match ? 0.85 : 0.1; // Pontuação arbitrária para simulação

      if (!selfieHasFace) {
        this.logger.warn('Nenhuma face detectada na selfie para comparação.');
        return { match: false, score: 0, details: 'Nenhuma face detectada na selfie.' };
      }
      if (!documentHasFace) {
        this.logger.warn('Nenhuma face detectada na imagem do documento para comparação.');
        return { match: false, score: 0, details: 'Nenhuma face detectada no documento.' };
      }

      this.logger.log(`Simulação de comparação facial concluída. Match: ${match}, Score: ${score}`);
      return { match, score };

    } catch (error) {
      this.logger.error(`Erro durante a simulação de comparação facial: ${error.message}`);
      throw new InternalServerErrorException(`Falha na simulação de comparação facial: ${error.message}`);
    }
  }

  /**
   * Simula a verificação de prova de vida (liveness check).
   * Em um cenário real, isso envolveria uma API de liveness (ex: Onfido, Sumsub).
   * @param selfieFile O arquivo da selfie (pode ser vídeo para algumas APIs).
   * @returns Um objeto com o resultado da prova de vida (isLive, score).
   */
  async performLivenessCheck(selfieFile: File): Promise<{ isLive: boolean; score: number; details?: string }> {
    this.logger.log('Iniciando simulação de verificação de prova de vida (liveness check)...');
    try {
      // Simulação: Apenas verifica se há uma face na imagem.
      // Em uma API real, isso envolveria análise de movimento (se for vídeo) ou sinais de vida (se for imagem).
      const [selfieDetection] = await this.visionClient.faceDetection(selfieFile.buffer);
      const selfieFaces = selfieDetection.faceAnnotations;

      const isLive = selfieFaces && selfieFaces.length > 0; // Simplesmente verifica se há uma face
      const score = isLive ? 0.90 : 0.05; // Pontuação arbitrária para simulação

      if (!isLive) {
        this.logger.warn('Nenhuma face detectada para prova de vida ou falha na simulação de liveness.');
        return { isLive: false, score: 0, details: 'Nenhuma face detectada na imagem ou falha na verificação de liveness.' };
      }

      this.logger.log(`Simulação de prova de vida concluída. Live: ${isLive}, Score: ${score}`);
      return { isLive, score };

    } catch (error) {
      this.logger.error(`Erro durante a simulação de prova de vida: ${error.message}`);
      throw new InternalServerErrorException(`Falha na simulação de prova de vida: ${error.message}`);
    }
  }
}